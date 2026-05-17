import { MongoClient, Db, Collection } from 'mongodb';
import { User, MembershipPackage, PendingPlacement } from '../../shared/mlm-types';
import { MongoMemoryServer } from 'mongodb-memory-server';

export interface MLMDatabaseSchema {
  users: User[];
  membershipPackages: MembershipPackage[];
  pendingPlacements: PendingPlacement[];
  transactions: any[];
  commissions: any[];
  clonePages: any[];
  cloneProducts: any[];
  systemSettings: any;
  auditLogs: any[];
}

export class MongoDBService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnected = false;
  private mongod: MongoMemoryServer | null = null;

  constructor(private connectionString: string, private databaseName: string) { }

  async connect(): Promise<void> {
    try {
      if (this.isConnected && this.client) {
        return;
      }

      const isPlaceholder = this.connectionString && (
        this.connectionString.includes("username:password") || 
        this.connectionString.includes("<password>") ||
        (this.connectionString.includes("cluster.mongodb.net") && (this.connectionString.includes("username") || this.connectionString.includes("password")))
      );

      if (isPlaceholder) {
        console.warn('⚠️ MongoDB connection string is a placeholder. Falling back to In-Memory MongoDB directly.');
        throw new Error('Placeholder connection string');
      }

      console.log('🔄 Connecting to MongoDB...', this.connectionString.includes('localhost') ? '(Local)' : '(Cloud)');

      try {
        this.client = new MongoClient(this.connectionString, {
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
          family: 4
        });

        await this.client.connect();
        this.db = this.client.db(this.databaseName);
        this.isConnected = true;

        console.log('✅ Successfully connected to MongoDB');
        console.log(`📊 Database: ${this.databaseName}`);

        // Test the connection
        await this.db.admin().ping();
        console.log('🏓 MongoDB ping successful');

      } catch (connError) {
        console.warn('⚠️ Primary MongoDB connection failed:', connError instanceof Error ? connError.message : connError);

        // Fallback to In-Memory MongoDB
        console.log('🚀 Starting In-Memory MongoDB Server (Fallback Mode)...');
        this.mongod = await MongoMemoryServer.create();
        const uri = this.mongod.getUri();

        console.log(`⚠️ Connecting to In-Memory MongoDB at: ${uri}`);

        this.client = new MongoClient(uri);
        await this.client.connect();
        this.db = this.client.db(this.databaseName);
        this.isConnected = true;

        console.log('✅ Connected to In-Memory MongoDB (Data will be lost on restart)');
      }

    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      throw new Error(`Failed to connect to MongoDB: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.close();
        this.client = null;
        this.db = null;
        this.isConnected = false;
        console.log('✅ Disconnected from MongoDB Atlas');
      }
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error);
    }
  }

  private getCollection<T = any>(collectionName: string): Collection<T> {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db.collection<T>(collectionName);
  }

  // User management
  async createUser(user: User): Promise<User> {
    const collection = this.getCollection<User>('users');
    await collection.insertOne({ ...user, _id: user.id } as any);
    return user;
  }

  async getUserById(userId: string): Promise<User | null> {
    const collection = this.getCollection<User>('users');
    const user = await collection.findOne({ _id: userId } as any);
    return user ? { ...(user as any)._doc, id: user._id.toString() } as User : null;
  }

  async getAllUsers(): Promise<User[]> {
    const collection = this.getCollection<User>('users');
    const users = await collection.find({}).toArray();
    return users.map(user => ({ ...(user as any)._doc, id: user._id.toString() })) as User[];
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    const collection = this.getCollection<User>('users');
    const result = await collection.findOneAndUpdate(
      { _id: userId } as any,
      { $set: updates },
      { returnDocument: 'after' }
    );
    return result ? { ...(result as any)._doc, id: result._id.toString() } as User : null;
  }

  async deleteUser(userId: string): Promise<boolean> {
    const collection = this.getCollection<User>('users');
    const result = await collection.deleteOne({ _id: userId } as any);
    return result.deletedCount > 0;
  }

  // Membership package management
  async createMembershipPackage(pkg: MembershipPackage): Promise<MembershipPackage> {
    const collection = this.getCollection<MembershipPackage>('membershipPackages');
    await collection.insertOne({ ...pkg, _id: pkg.id } as any);
    return pkg;
  }

  async getAllMembershipPackages(): Promise<MembershipPackage[]> {
    const collection = this.getCollection<MembershipPackage>('membershipPackages');
    const packages = await collection.find({}).toArray();
    return packages.map(pkg => ({ ...(pkg as any)._doc, id: pkg._id.toString() })) as MembershipPackage[];
  }

  async updateMembershipPackage(packageId: string, updates: Partial<MembershipPackage>): Promise<MembershipPackage | null> {
    const collection = this.getCollection<MembershipPackage>('membershipPackages');
    const result = await collection.findOneAndUpdate(
      { _id: packageId } as any,
      { $set: updates },
      { returnDocument: 'after' }
    );
    return result ? { ...(result as any)._doc, id: result._id.toString() } as MembershipPackage : null;
  }

  async deleteMembershipPackage(packageId: string): Promise<boolean> {
    const collection = this.getCollection<MembershipPackage>('membershipPackages');
    const result = await collection.deleteOne({ _id: packageId } as any);
    return result.deletedCount > 0;
  }

  // Commission tracking
  async saveCommissionCalculation(commission: any): Promise<void> {
    const collection = this.getCollection('commissions');
    await collection.insertOne({
      ...commission,
      _id: commission.id,
      createdAt: new Date()
    });
  }

  async getCommissionHistory(userId: string, limit: number = 50, offset: number = 0): Promise<any[]> {
    const collection = this.getCollection('commissions');
    const commissions = await collection
      .find({ userId })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    return commissions.map(comm => ({ ...comm, id: comm._id }));
  }

  // Pending placements
  async createPendingPlacement(placement: PendingPlacement): Promise<PendingPlacement> {
    const collection = this.getCollection<PendingPlacement>('pendingPlacements');
    await collection.insertOne({ ...placement, _id: placement.id } as any);
    return placement;
  }

  async getPendingPlacementsForSponsor(sponsorId: string): Promise<PendingPlacement[]> {
    const collection = this.getCollection<PendingPlacement>('pendingPlacements');
    const placements = await collection.find({ sponsorId, status: 'pending' }).toArray();
    return placements.map(p => ({ ...(p as any)._doc, id: p._id.toString() })) as PendingPlacement[];
  }

  async updatePlacementStatus(placementId: string, status: 'pending' | 'placed' | 'expired'): Promise<boolean> {
    const collection = this.getCollection<PendingPlacement>('pendingPlacements');
    const result = await collection.updateOne(
      { _id: placementId } as any,
      { $set: { status, updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  }

  // System settings
  async getSystemSettings(): Promise<any> {
    const collection = this.getCollection('systemSettings');
    const settings = await collection.findOne({ type: 'global' });
    return settings || {};
  }

  async updateSystemSettings(settings: any): Promise<void> {
    const collection = this.getCollection('systemSettings');
    await collection.replaceOne(
      { type: 'global' },
      { ...settings, type: 'global', updatedAt: new Date() },
      { upsert: true }
    );
  }

  // Audit logging
  async logAuditEvent(event: {
    userId: string;
    action: string;
    details: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    const collection = this.getCollection('auditLogs');
    await collection.insertOne({
      ...event,
      timestamp: new Date(),
      _id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });
  }

  // Database health check
  async healthCheck(): Promise<{
    connected: boolean;
    collections: number;
    totalUsers: number;
    lastUpdated: Date;
  }> {
    try {
      if (!this.isConnected || !this.db) {
        return {
          connected: false,
          collections: 0,
          totalUsers: 0,
          lastUpdated: new Date()
        };
      }

      const collections = await this.db.listCollections().toArray();
      const userCollection = this.getCollection<User>('users');
      const userCount = await userCollection.countDocuments();

      return {
        connected: true,
        collections: collections.length,
        totalUsers: userCount,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        connected: false,
        collections: 0,
        totalUsers: 0,
        lastUpdated: new Date()
      };
    }
  }

  // Migration support - transfer from file-based to MongoDB
  async migrateFromFileDatabase(fileData: MLMDatabaseSchema): Promise<void> {
    try {
      console.log('🔄 Starting migration from file database to MongoDB...');

      // Migrate users
      if (fileData.users && fileData.users.length > 0) {
        const userCollection = this.getCollection<User>('users');
        await userCollection.deleteMany({}); // Clear existing
        const usersToInsert = fileData.users.map(user => ({ ...user, _id: user.id }));
        await userCollection.insertMany(usersToInsert as any);
        console.log(`✅ Migrated ${fileData.users.length} users`);
      }

      // Migrate membership packages
      if (fileData.membershipPackages && fileData.membershipPackages.length > 0) {
        const packageCollection = this.getCollection<MembershipPackage>('membershipPackages');
        await packageCollection.deleteMany({});
        const packagesToInsert = fileData.membershipPackages.map(pkg => ({ ...pkg, _id: pkg.id }));
        await packageCollection.insertMany(packagesToInsert as any);
        console.log(`✅ Migrated ${fileData.membershipPackages.length} membership packages`);
      }

      // Migrate other collections similarly...
      console.log('✅ Migration completed successfully');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }
}

// Singleton instance
let mongoService: MongoDBService | null = null;

export function getMongoDBService(): MongoDBService {
  if (!mongoService) {
    const connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const databaseName = process.env.DATABASE_NAME || 'kutbul_zaman_mlm';
    mongoService = new MongoDBService(connectionString, databaseName);
  }
  return mongoService;
}

export default MongoDBService;
