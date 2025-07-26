const mongoose = require('mongoose');
const { Client } = require('@opensearch-project/opensearch');
const logger = require('./utils/logger');
const Subscriber = require('./models/Subscriber');

// Load environment variables
require('dotenv').config();

// Initialize OpenSearch client
const opensearchClient = new Client({
  node: process.env.OPENSEARCH_URL || 'https://localhost:9200',
  auth: {
    username: process.env.OPENSEARCH_USERNAME || 'admin',
    password: process.env.OPENSEARCH_PASSWORD || 'admin'
  },
  ssl: {
    rejectUnauthorized: false // For development only, set to true in production
  }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  logger.info('Connected to MongoDB successfully');
})
.catch((err) => {
  logger.error('MongoDB connection error:', err);
  process.exit(1);
});

// Watch MongoDB change stream
const watchChangeStream = async () => {
  const subscriberCollection = mongoose.connection.collection('subscribers');

  logger.info('Setting up change stream listener for subscribers collection');

  try {
    const changeStream = subscriberCollection.watch();

    changeStream.on('change', async (change) => {
      logger.info('Change detected:', change);

      switch (change.operationType) {
        case 'insert':
          await handleInsert(change.fullDocument);
          break;

        case 'update':
          const updatedSubscriber = await subscriberCollection.findOne({ _id: change.documentKey._id });
          await handleInsert(updatedSubscriber);
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
      process.exit(1);
    });

    changeStream.on('close', () => {
      logger.warn('Change stream closed');
    });

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

// Start watching change stream
watchChangeStream().catch(err => {
  logger.error('Error watching change stream:', err);
  process.exit(1);
});
