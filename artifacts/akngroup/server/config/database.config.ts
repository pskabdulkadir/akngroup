import mongoose from 'mongoose';

/**
 * Database Configuration untuk 1,000,000+ Users
 * 
 * Fitur:
 * - Connection Pooling (optimal untuk high concurrent users)
 * - Read Replicas (untuk distributed queries)
 * - Sharding ready (horizontal scaling)
 */

export const databaseConfig = {
  // Connection Pool Settings (untuk 1M users)
  pool: {
    min: 10,        // Minimum connection pool size
    max: 100,       // Maximum connection pool size (dapat disesuaikan)
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    max_retries: 3,
    retry_delay: 500
  },

  // MongoDB Connection Options
  mongooseOptions: {
    maxPoolSize: 100,
    minPoolSize: 10,

    family: 4, // Use IPv4
    retryWrites: true,
    w: 'majority', // Write acknowledgment
    journal: true,
    serverSelectionTimeoutMS: 30000, // Increased for Atlas/Cloud connections
    socketTimeoutMS: 60000,          // Increased for slower queries
    connectTimeoutMS: 30000,         // Initial connection timeout
  },

  // Read Preferences (untuk scaling)
  readPreference: {
    mode: 'secondaryPreferred', // Baca dari secondary replica jika tersedia
    maxStalenessSeconds: 120
  },

  // Index Configuration
  indexes: {
    users: [
      { fields: { email: 1 }, unique: true },
      { fields: { memberId: 1 }, unique: true },
      { fields: { sponsorId: 1 } },
      { fields: { isActive: 1 } },
      { fields: { membershipType: 1 } },
      { fields: { createdAt: -1 } },
      { fields: { email: 1, sponsorId: 1 } }, // Compound index for queries
      { fields: { isActive: 1, membershipType: 1 } } // Compound for filtering
    ],

    walletTransactions: [
      { fields: { userId: 1, createdAt: -1 } },
      { fields: { status: 1, createdAt: -1 } },
      { fields: { type: 1, createdAt: -1 } },
      { fields: { reference: 1 }, unique: true }
    ],

    commissions: [
      { fields: { recipientId: 1, createdAt: -1 } },
      { fields: { sourceUserId: 1, createdAt: -1 } },
      { fields: { status: 1 } },
      { fields: { createdAt: -1 } } // Time-series index
    ],

    paymentRequests: [
      { fields: { userId: 1, status: 1 } },
      { fields: { status: 1, createdAt: -1 } },
      { fields: { createdAt: -1 } }
    ]
  },

  // Sharding Configuration (for extreme scale)
  sharding: {
    enabled: false, // Enable when > 10M records
    shardKey: '_id', // Change to 'userId' for user-based sharding
    chunkSize: 64 // MB
  },

  // Caching Configuration
  cache: {
    ttl: 3600, // 1 hour
    ttlShort: 300, // 5 minutes for frequently changing data
    ttlLong: 86400 // 24 hours for static data
  },

  // Query Optimization
  queryOptimization: {
    batchSize: 1000,
    maxDocumentSize: 16777216, // 16MB (MongoDB limit)
    allowDiskUse: true // For large aggregations
  }
};

/**
 * Initialize database with optimal configuration
 */
export async function initializeDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mlm';

    console.log('🔗 MongoDB bağlantısı kuruluyor (Connection Pooling etkin)...');

    // Cast options to any to avoid strict driver type mismatches across environments
    await mongoose.connect(mongoUri, databaseConfig.mongooseOptions as any);

    console.log('✅ MongoDB bağlantısı başarılı');
    console.log(`📊 Connection Pool: ${databaseConfig.pool.min}-${databaseConfig.pool.max} connections`);

    // Create indexes
    await createDatabaseIndexes();

    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB bağlantı hatası:', error);
    process.exit(1);
  }
}

/**
 * Create all necessary indexes for performance
 */
async function createDatabaseIndexes() {
  try {
    const db = mongoose.connection;

    console.log('🔍 Database indexes oluşturuluyor...');

    // User Collection Indexes
    const usersCollection = db.collection('users');
    for (const index of databaseConfig.indexes.users) {
      await usersCollection.createIndex(index.fields as any, { unique: (index as any).unique || false });
    }

    // WalletTransaction Collection Indexes
    const walletCollection = db.collection('wallettransactions');
    for (const index of databaseConfig.indexes.walletTransactions) {
      await walletCollection.createIndex(index.fields as any, { unique: (index as any).unique || false });
    }

    // Commission Collection Indexes
    const commissionCollection = db.collection('monolinecommissiontransactions');
    for (const index of databaseConfig.indexes.commissions) {
      await commissionCollection.createIndex(index.fields as any, { unique: (index as any).unique || false });
    }

    // PaymentRequest Collection Indexes
    const paymentCollection = db.collection('paymentrequests');
    for (const index of databaseConfig.indexes.paymentRequests) {
      await paymentCollection.createIndex(index.fields as any, { unique: (index as any).unique || false });
    }

    console.log('✅ Tüm indexes başarıyla oluşturuldu');
  } catch (error) {
    console.warn('⚠️ Index oluşturma uyarısı:', error);
  }
}

/**
 * Connection pool monitoring
 */
export function monitorConnectionPool() {
  if (mongoose.connection.readyState === 1) {
    const client: any = mongoose.connection.getClient();
    console.log('📈 Connection Pool Stats:', {
      status: 'healthy',
      pools: (client as any).topology?.pools?.size || 'N/A'
    });
  }
}

export default databaseConfig;
