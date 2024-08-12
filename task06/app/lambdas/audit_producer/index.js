import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const docClient = new AWS.DynamoDB.DocumentClient();
const auditTable = process.env.target_table || 'Audit';

export const handler = async (event) => {

  for (const record of event.Records) {

    const id = uuidv4();
    const modificationTime = new Date().toISOString();

    const newItem = record.dynamodb.NewImage ? AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage) : null;
    const oldItem = record.dynamodb.OldImage ? AWS.DynamoDB.Converter.unmarshall(record.dynamodb.OldImage) : null;


    let auditEntry = {
      id,
      itemKey: newItem ? newItem.key : oldItem.key,
      modificationTime,
      newValue:newItem
    };

    if (record.eventName === 'INSERT') {
      auditEntry.newValue = newItem;
    } else if (record.eventName === 'MODIFY') {
      auditEntry.updatedAttribute = 'value';
      auditEntry.oldValue = oldItem.value;
      auditEntry.newValue = newItem.value;
    }

    try {
      await docClient.put({
        TableName: auditTable,
        Item: auditEntry
      }).promise();
      console.log('Audit entry stored:', id);
    } catch (error) {
      console.error('Error storing audit entry:', error);
    }
  }
};
