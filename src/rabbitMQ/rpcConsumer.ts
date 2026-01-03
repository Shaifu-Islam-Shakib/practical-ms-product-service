// src/rabbitMQ/rpcConsumer.ts

import rabbitMQ from './rabbitMQ.ts';
import { Channel, ConsumeMessage } from 'amqplib';

interface EnrichedMessage {
  data: any;
  correlationId?: string;
  replyTo?: string;
}

interface QueueOptions {
  autoDelete?: boolean;
  durable?: boolean;
  exclusive?: boolean;
}

/**
 * RPC-style consumer that processes one message at a time and can be gracefully stopped.
 * Returns a Promise that resolves when the consumer is fully shut down.
 */
const rpcConsumer = async (
  queueName: string,
  cb: (msg: EnrichedMessage) => Promise<boolean> | boolean,
  queueOptions: QueueOptions = { autoDelete: true, durable: false, exclusive: true }
): Promise<void> => {
  let channel: Channel | null = null;
  let consumerTag: string | null = null;
  let isCleaningUp = false;

  const cleanUp = async (reason = 'unknown') => {
    if (isCleaningUp) return;
    isCleaningUp = true;

    if (consumerTag && channel) {
      try {
        await channel.cancel(consumerTag);
      } catch (err) {
        console.error('Error cancelling consumer:', err);
      } finally {
        consumerTag = null;
      }
    }

    if (channel) {
      try {
        await channel.close();
      } catch (err) {
        console.error('Error closing channel:', err);
      } finally {
        channel = null;
      }
    }

    console.log(`RPC consumer cleaned up (${reason})`);
  };

  try {
    const { channel: ch } = await rabbitMQ.connect();
    channel = ch;

    // Optional: limit to 1 unacked message at a time (good for RPC)
    channel.prefetch(1);

    await channel.assertQueue(queueName, queueOptions);

    const { consumerTag: tag } = await channel.consume(
      queueName,
      async (msg: ConsumeMessage | null) => {
        if (!msg) {
          console.warn('Received null message (consumer likely cancelled)');
          return;
        }

        // Channel might have been closed externally
        if (!channel) {
          console.warn('Channel is null during message processing');
          return;
        }

        let shouldStop = false;

        try {
          const content = msg.content.toString();
          const data = JSON.parse(content);

          const enriched: EnrichedMessage = {
            data,
            correlationId: msg.properties.correlationId,
            replyTo: msg.properties.replyTo,
          };

          shouldStop = await cb(enriched)
          //!!((await cb(enriched)) ?? false);
        } catch (err) {
          console.error('Error in RPC callback:', err);
          // Optionally: nack and requeue on error
          // channel.nack(msg, false, true);
        }

        // Ack the message (even on callback error, unless you want to requeue)
        try {
          channel.ack(msg);
        } catch (ackErr) {
          console.error('Failed to ack message:', ackErr);
        }

        if (shouldStop) {
          console.log('Callback requested stop → shutting down consumer');
           cleanUp('stop requested').catch(e=>console.log(e));
        }
      },
      { noAck: false }
    );

    consumerTag = tag;

    // Resolve when channel closes or errors
    return new Promise((resolve, reject) => {
      let resolved = false;

      const safeResolve = async () => {
        if (resolved) return;
        resolved = true;
        await cleanUp('channel closed');
        resolve();
      };

      const safeReject = async (err: Error) => {
        if (resolved) return;
        resolved = true;
        console.error('Channel error:', err);
        await cleanUp('channel error');
        reject(err);
      };

      // We know channel is not null here
      channel!.once('close', safeResolve);
      channel!.once('error', safeReject);
    });
  } catch (err) {
    console.error('Failed to start RPC consumer:', err);
    await cleanUp('setup failure');
    throw err; // Let caller handle startup failures
  }
};

export default rpcConsumer;