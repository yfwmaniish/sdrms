const { Client } = require('@opensearch-project/opensearch');
const mongoose = require('mongoose');
const winston = require('winston');
const UnifiedDataset = require('./models/UnifiedDataset');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'sync-service' },
  transports: [
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

async function createIndex(client, indexName) {
  const { body } = await client.indices.create({
    index: indexName,
    body: {
      mappings: {
        properties: {
          subscriber_id: { type: 'text' },
          full_name: { type: 'text' },
          primary_phone: { type: 'text' },
          email: { type: 'keyword' },
          address: {
            properties: {
              city: { type: 'text' },
              state: { type: 'keyword' },
            }
          },
          service_type: { type: 'keyword' },
          plan_name: { type: 'text' },
          ingestion_date: { type: 'date' },
          status: { type: 'keyword' }
        }
      }
    }
  }, { ignore: [400] });
  logger.info(`Index ${indexName} created or already exists.`);
}

async function syncWithOpenSearch() {
  const client = new Client({ node: process.env.OPENSEARCH_URL });
  await createIndex(client, 'unified_datasets');

  const changeStream = UnifiedDataset.watch();

  changeStream.on('change', async (change) => {
    try {
      if (change.operationType === 'insert' || change.operationType === 'update') {
        const doc = change.fullDocument || await UnifiedDataset.findById(change.documentKey._id);
        await client.index({
          index: 'unified_datasets',
          id: doc._id.toString(),
          body: {
            subscriber_id: doc.subscriber_id,
            full_name: doc.full_name,
            primary_phone: doc.primary_phone,
            email: doc.email,
            address: {
              city: doc.address.city,
              state: doc.address.state
            },
            service_type: doc.service_type,
            plan_name: doc.plan_name,
            ingestion_date: doc.ingestion_date,
            status: doc.status
          }
        });
        logger.info(`Document ${doc._id} indexed to OpenSearch.`);
      } else if (change.operationType === 'delete') {
        await client.delete({
          index: 'unified_datasets',
          id: change.documentKey._id.toString()
        });
        logger.info(`Document ${change.documentKey._id} deleted from OpenSearch.`);
      }
    } catch (err) {
      logger.error('Error during OpenSearch sync:', err);
    }
  });

  changeStream.on('error', (error) => {
    logger.error('ChangeStream error:', error);
  });

  logger.info('ChangeStream to OpenSearch initiated.');
}

module.exports = { syncWithOpenSearch };
