import amqp, { Connection, ChannelModel, Channel, Options } from 'amqplib'

class RabbitMQ {
  connection: ChannelModel | null
  channel: Channel | null
  constructor() {
    this.connection = null;
    this.channel = null
  }
  async connect(): Promise<{ connection: ChannelModel; channel: Channel }> {
    // Return cached if already connected
    if (this.connection && this.channel) {
      return { connection: this.connection!, channel: this.channel! };
    }

    try {
      this.connection = await amqp.connect('amqp://localhost');
      this.channel = await this.connection.createChannel();

      // Event listeners
      this.channel.on('error', (error: Error) => {
        console.error('Channel Error:', error);
      });

      this.channel.on('close', () => {
        console.log('Channel closed');
      });

      // Connection-level events (forwarded through ChannelModel)
      this.connection.on('error', (err: Error) => {
        console.error('Connection Error:', err);
      });

      this.connection.on('close', () => {
        console.log('Connection closed');
      });

      // Safe to return – both are now non-null
      return { connection: this.connection, channel: this.channel };
    } catch (err) {
      console.error('Failed to connect to RabbitMQ:', err);
      throw err; // Ensures the function always returns or throws
    }
  }
  async assertExchange(exchangeName: string, exchangeType: string = 'direct', options: Options.AssertExchange = {}) {
    return await this.channel!.assertExchange(exchangeName, exchangeType, options)
  }
  async assertQueue(queueName: string, options: Options.AssertQueue) {
    if (queueName) {
      const q = await this.channel!.assertQueue(queueName, options)
      return q.queue
    }
  }
  async bindQueue(exchangeName: string, queueName: string, routingKey: string = '') {
    return await this.channel!.bindQueue(queueName, exchangeName, routingKey)
  }
  async closeConnection() {
    try {
      setTimeout(async () => {
        if (this.channel) await this.channel.close()
        if (this.connection) await this.connection.close()

        console.log(`Close channel and connection successfully`);
      }, 3000);
    } catch (err) {
      console.error('Error:', err);

    }
  }
}
const rabbitMQ = new RabbitMQ()
export default rabbitMQ;