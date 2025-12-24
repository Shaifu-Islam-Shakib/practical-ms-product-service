/*import { Message } from 'amqplib'
import rabbitMQ from './rabbitMQ.ts'
//import * as  rabbitMQ from './rabbitMQ.ts'
const consumeMessage = async (exchangeName: string, queueName: string, routingKey: string, queueOptions: any = {}, cb: (msg: any) => boolean): Promise<any> => {
  let waitingTime: number = 10000
  let currentConsumerTag: string;
  return new Promise((resolve, reject) => {
    let timeoutId: NodeJS.Timeout;
    let resolved = false

    const setupConsumer = async () => {
      console.log('Starting setupConsumer...'); // Debug log

      try {
        console.log('Connecting to RabbitMQ...'); // Debug log
        const { connection, channel } = await rabbitMQ.connect()
        //console.log('Connected successfully, channel:', channel); // Debug log

        timeoutId = setTimeout(async () => {
          if (!resolved) {
            console.log(`Timeout triggered after ${waitingTime}ms`); // Debug log
            resolved = true
            if (currentConsumerTag) {
              await channel.cancel(currentConsumerTag)
            }

            channel.close().catch(err => console.log('Channel close error:', err))
            connection.close().catch(err => console.log('Connection close error:', err))
            reject(new Error(`timeout after ${waitingTime}ms`))
          }
        }, waitingTime);

        console.log('Asserting queue:', queueName); // Debug log
        const queue = await rabbitMQ.assertQueue(queueName, queueOptions)
        if (queue === undefined) {
          console.log(queue);
          return
        }
        console.log('Queue asserted:', queue); // Debug log
        //  const realQueue = typeof queue === 'string' ? queue : queue.queue
        console.log('Binding queue to exchange:', { exchangeName, queue: queue, routingKey }); // Debug log
        //bind queue 
        await rabbitMQ.bindQueue(exchangeName, queue, routingKey)
        console.log('Queue bound successfully'); // Debug log

        console.log('Starting to consume from queue:', queue); // Debug log
        const { consumerTag } = await channel.consume(queue, (msg: Message | null) => { // Note: queue might be an object with queue property
          console.log('Message received:', msg ? 'Yes' : 'No'); // Debug log

          if (msg == null) {
            console.log('Received null message'); // Debug log
            return
          }

          try {
            const parsed = JSON.parse(msg.content.toString());
            console.log('Message parsed successfully'); // Debug log

            const enrichedMsg = {
              data: parsed,
              correlationId: msg.properties.correlationId,
              replyTo: msg.properties.replyTo,
            }

            if (cb(enrichedMsg) && !resolved) {
              console.log('Callback returned true, resolving promise'); // Debug log
              clearTimeout(timeoutId);
              resolved = true
              channel.cancel(currentConsumerTag).catch(e => console.log(e))
              resolve(enrichedMsg.data)
            } else {
              console.log('Callback returned false, not resolving'); // Debug log
            }
          } catch (err) {
            console.log('Error processing message:', err); // Debug log
            if (!resolved) {
              clearTimeout(timeoutId)
              resolved = true
              reject(err)
              channel.close().catch(e => console.log('Error closing channel:', e))
              connection.close().catch(e => console.log('Error closing connection:', e))
            }
          }
        }, { noAck: true })
        currentConsumerTag = consumerTag
        console.log('Consumer registered successfully'); // Debug log

      } catch (err) {
        console.log('Error in setupConsumer:', err); // Debug log
        if (!resolved) {
          resolved = true
          clearTimeout(timeoutId);
          reject(err)
        }
      }
    }
    setupConsumer()
  })
}
export default consumeMessage


// establish connection

*/



/* import { Message } from 'amqplib'
import rabbitMQ from './rabbitMQ.ts'
const consumeMessage = async (exchangeName: string, queueName: string, routingKey: string, queueOptions: any = {}, cb: (msg: any) => Promise<boolean> | boolean) => {
  let correntConsumerTag: string;
  try {
    const { channel } = await rabbitMQ.connect()
    //assert Queue     
    const queue = await rabbitMQ.assertQueue(queueName, queueOptions)
    if (queue === undefined) {
      console.log("queue is undefined");
      return
    }
    await rabbitMQ.bindQueue(exchangeName, queue, routingKey);


    //bind queue 
    //await rabbitMQ.bindQueue(exchangeName, queue, routingKey)

    const { consumerTag } = await channel.consume(queue, async (msg: Message | null) => {
      if (msg == null) {
        console.log('Message is empty');
        return
      }
      const content = msg.content.toString()
      const parsed = JSON.parse(content);

      const enrichedMsg = {
        data: parsed,
        correlationId: msg.properties.correlationId,
        replyTo: msg.properties.replyTo,
      }
      const shouldStop = await cb(enrichedMsg)
      channel.ack(msg)
      if (shouldStop) {
        await channel.cancel(correntConsumerTag);
        console.log('One-time consumer stopped after receiving reply');
      }
    }, { noAck: false })
    correntConsumerTag = consumerTag
  } catch (err) {
    console.log('Error:', err);

  }
}

export default consumeMessage
 */
 
 
 
 import { Message, Channel } from 'amqplib';
import rabbitMQ from './rabbitMQ.ts';

interface EnrichedMessage {
  data: any;
  correlationId?: string;
  replyTo?: string;
}

/**
 * Consumes messages from a queue (typically a temporary reply queue for RPC).
 * Calls the callback for each message.
 * If callback returns true, stops consuming (ideal for one-time RPC replies).
 *
 * @param queueName - Name of the queue to consume from
 * @param cb - Callback that processes the message. Return true to stop consuming.
 * @param queueOptions - Options for assertQueue (e.g., { exclusive: true, autoDelete: true })
 * @returns Promise that resolves when consumer is stopped (either by cb or cancel)
 */
const consumeMessage = async (
  queueName: string,
  cb: (msg: EnrichedMessage) => Promise<boolean> | boolean,
  queueOptions: any = { exclusive: true, autoDelete: true, durable: false }
): Promise<void> => {
  let channel: Channel | null = null;
  let consumerTag: string | null = null;

  try {
    const connection = await rabbitMQ.connect();
    channel = connection.channel;

    // 1. Assert the reply queue (no exchange binding needed!)
    await channel.assertQueue(queueName, queueOptions);

    // 2. Start consuming
    const { consumerTag: tag } = await channel.consume(
      queueName,
      async (msg: Message | null) => {
        if (!msg) {
          console.log('Received null message (consumer cancelled?)');
          return;
        }

        try {
          const content = msg.content.toString();
          const data = JSON.parse(content);

          const enrichedMsg: EnrichedMessage = {
            data,
            correlationId: msg.properties.correlationId,
            replyTo: msg.properties.replyTo,
          };

          // Let caller process the message
          const shouldStop = await cb(enrichedMsg);

          // Always ack the message
          channel!.ack(msg);

          // If callback says stop (e.g., we got our reply), cancel consumer
          if (shouldStop && consumerTag) {
            await channel!.cancel(consumerTag);
            console.log('One-time consumer stopped after receiving expected reply');
          }
        } catch (parseErr) {
          console.error('Failed to parse message content:', parseErr);
          channel!.ack(msg); // Still ack to avoid requeue loop
        }
      },
      { noAck: false }
    );

    consumerTag = tag;

    // Optional: Keep the promise open until consumer is cancelled
    // We can return a promise that resolves when cancelled
    return new Promise<void>((resolve, reject) => {
      // You could store reject/resolve on channel if needed for timeout
      // But usually, the caller handles timeout externally
      channel!.once('close', () => resolve());
      channel!.once('error', (err) => reject(err));
    });
  } catch (err) {
    console.error('Error in consumeMessage:', err);

    // Cleanup if possible
    if (consumerTag && channel) {
      try {
        await channel.cancel(consumerTag);
      } catch {} // ignore
    }
    if (channel) {
      try {
        await channel.close();
      } catch {} // ignore
    }

    throw err; // Re-throw so caller can handle
  }
};

export default consumeMessage;