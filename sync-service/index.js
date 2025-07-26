const mongoose = require('mongoose');
const { Client } = require('@opensearch-project/opensearch');
const logger = require('./utils/logger');
const Subscriber = require('./models/Subscriber');

// Load environment variables
require('dotenv').config();

// Initialize OpenSearch client
const opensearchClient = new Client({
  node: process.env.OPENSEARCH_URL || 'http://localhost:9200'
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
  logger.info('Connected to MongoDB successfully');
  // Start watching change stream after successful connection
  watchChangeStream();
})
.catch((err) => {
  logger.error('MongoDB connection error:', err);
  process.exit(1);
});

// Watch MongoDB change stream
const watchChangeStream = async () => {
  // Wait for MongoDB connection to be ready
  if (mongoose.connection.readyState !== 1) {
    logger.info('Waiting for MongoDB connection...');
    setTimeout(watchChangeStream, 1000);
    return;
  }

  const subscriberCollection = mongoose.connection.collection('subscribers');
  logger.info('Setting up change stream listener for subscribers collection');

  try {
    const changeStream = subscriberCollection.watch([], {
      fullDocument: 'updateLookup'
    });

    changeStream.on('change', async (change) => {
      logger.info(`Change detected: ${change.operationType} on document ${change.documentKey._id}`);

      switch (change.operationType) {
        case 'insert':
          await handleInsert(change.fullDocument);
          break;

        case 'update':
        case 'replace':
          await handleInsert(change.fullDocument);
          break;

        case 'delete':
          await handleDelete(change.documentKey._id);
          break;

        default:
          logger.warn(`Unhandled operation type: ${change.operationType}`);
      }
    });

    changeStream.on('error', (err) => {
      logger.error('Change stream error:', err);
      // Attempt to restart change stream after error
      setTimeout(() => {
        logger.info('Attempting to restart change stream...');
        watchChangeStream();
      }, 5000);
    });

    changeStream.on('close', () => {
      logger.warn('Change stream closed');
    });

    logger.info('Change stream monitoring started successfully');

  } catch (err) {
    logger.error('Error setting up change stream:', err);
    process.exit(1);
  }
};

// Handle insert operation
const handleInsert = async (subscriber) => {
  try {
    const { _id, ...subscriberDoc } = subscriber;
    const response = await opensearchClient.index({
      index: 'subscribers',
      id: _id.toString(),
      body: subscriberDoc
    });
    logger.info('Subscriber indexed successfully:', response);
  } catch (err) {
    logger.error('Error indexing subscriber:', err);
  }
};

// Handle delete operation
const handleDelete = async (subscriberId) => {
  try {
    const response = await opensearchClient.delete({
      index: 'subscribers',
      id: subscriberId.toString()
    });
    logger.info('Subscriber deleted from index:', response);
  } catch (err) {
    logger.error('Error deleting subscriber from index:', err);
  }
};

// Change stream will be started after MongoDB connection is established
