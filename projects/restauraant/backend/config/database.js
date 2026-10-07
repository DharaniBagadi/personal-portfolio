const mongoose = require('mongoose');

let mongoMemoryServer = null;

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/royal_flame';
  const useFallback = process.env.USE_MEMORY_DB_FALLBACK !== 'false';

  try {
    // Attempt standard connection with 3-second timeout for quick fallback if local server isn't up
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[MongoDB] Connected successfully to: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.warn(`[MongoDB Warning] Could not connect to primary URI (${uri}): ${err.message}`);

    if (useFallback) {
      try {
        console.log('[MongoDB] Initializing embedded MongoDB engine fallback for seamless local execution...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongoMemoryServer = await MongoMemoryServer.create({
          instance: {
            dbName: 'royal_flame'
          }
        });
        const memoryUri = mongoMemoryServer.getUri();
        const conn = await mongoose.connect(memoryUri);
        console.log(`[MongoDB] Connected successfully to embedded database at: ${memoryUri}`);
        return conn;
      } catch (fallbackErr) {
        console.error('[MongoDB Error] Embedded DB fallback failed:', fallbackErr.message);
        throw fallbackErr;
      }
    } else {
      throw err;
    }
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
};

module.exports = { connectDB, disconnectDB };
