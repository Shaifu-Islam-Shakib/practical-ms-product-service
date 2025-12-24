import rabbitMQ from './rabbitMQ.ts'
interface PublishOptions {
  correlationId?: string,
  persistent?: boolean,
  replyTo?: string,
  contentType?: string
}
const publishMessage = async (exchange: string, routingKey: string, msg: any, options: PublishOptions): Promise<boolean> => {
  try {
    const { connection, channel } = await rabbitMQ.connect()

    await rabbitMQ.assertExchange(exchange)

    const content = typeof msg === 'string' ? msg : JSON.stringify(msg);
    const bufferMessage = Buffer.from(content)
    const publishedOption: any = {
      persistent: options.persistent ?? true,
      contentType: options.contentType ?? 'application/json'
    }
    if (options.correlationId) publishedOption.correlationId = options.correlationId
    if (options.replyTo) publishedOption.replyTo = options.replyTo
    const success = channel.publish(exchange, routingKey, bufferMessage, publishedOption)
    if (success) {
      console.log(
        ` ${msg} sent to [${exchange}] through ${routingKey}`);
      return true
    } else {
      return new Promise((resolve, reject) => {
        channel.once('drain', () => {
          console.log(`Message sent (after drain) → routingKey: '${routingKey}'`);
          resolve(true)
        });
        channel.once('error', (err) => {
          console.error('Channel error during publish:', err);
          reject(err)
        });

      })
    }
    // await rabbitMQ.closeConnection(connection, channel)
  } catch (err) {
    console.error('Error:', err);
    return false
  }
}
/*publishMessage('hello world', 'test-routing-key').catch((error) => {
  console.error('Promise Catch:', error);

})*/
export default publishMessage