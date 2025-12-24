import publishMessage from '../rabbitMQ/publishMessage.ts'
import rabbitMQ from '../rabbitMQ/rabbitMQ.ts'

import consumeMessage from '../rabbitMQ/consumeMessage.ts'
import { v4 as uuidV4 } from 'uuid'

const getInventoryDetails = async (inventoryId: string) => {

  //publish mesaage 
  try {
    const correlationId = uuidV4()
    const { channel } = await rabbitMQ.connect()
    const queueName = `replyQueue-${correlationId}`
    const queue = await rabbitMQ.assertQueue(queueName, { exclusive: true, autoDelete: true, durable: false })
if(queue==undefined){
  console.log('Queeu is undefined');
  return 
}
    await publishMessage('inventory', 'product.details', { id: inventoryId }, { correlationId, replyTo: queue })
    //consume message
    console.log(`waiting for consuming message from ${queueName}`);
    let inventory: any = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout: No response from inventory service (10s)'));
      }, 10000);

      consumeMessage(queue, async (msg) => {
        if (msg.correlationId && msg.correlationId === correlationId) {
          clearTimeout(timeout);
          resolve(msg.data);
          return true; // Stop consumer – we're done!
        }
        // If somehow wrong message (shouldn't happen with exclusive queue)
        return false;
      }).catch((err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
    return inventory
  } catch (err) {
    console.error('Error:', err);
  }

}
export default getInventoryDetails

/*  /*let inventory: any = await consumeMessage('product', queueName, queueName, {exclusive:true, durable: false, autoDelete: false }, (msg) => {
      console.log(msg);
      return correlationId === msg.correlationId
    })*/