import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const docClient = new AWS.DynamoDB.DocumentClient();

const auditTable = process.env.target_table || 'Audit';

export const handler = async (event) => {
  console.log('~~~EVENT~~~', EventSource);

  for (const record of event.Records) {
    console.log('~~~EVENT Record', record);

    const id = uuidv4();
    const modificationTime = new Date().toISOString();

    const newItem = record.dynamodb.NewImage ? AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage) : null;
    console.log('~~~newItem~~~',newItem);
    const oldItem = record.dynamodb.OldImage ? AWS.DynamoDB.Converter.unmarshall(record.dynamodb.OldImage) : null;
    console.log('~~~oldItem~~~',oldItem);


    let auditEntry = {
      id,
      itemKey: newItem ? newItem.key : oldItem.key,
      modificationTime,
    };

    console.log('~~~auditEntry~~~',auditEntry);


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
