import { Pool } from 'pg';

let pool: Pool | null = null;

function getPool(): Pool | null {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('mongodb')) {
    return null;
  }
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 10,
    });
  }
  return pool;
}

export const pgPersistence = {
  enabled: false,

  async init(): Promise<void> {
    const db = getPool();
    if (!db) {
      console.log('⚠️ PostgreSQL not configured — using in-memory only (data will not persist across restarts)');
      return;
    }
    try {
      const client = await db.connect();
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS kz_users (
            id TEXT PRIMARY KEY,
            email TEXT,
            referral_code TEXT,
            member_id TEXT,
            phone TEXT,
            data JSONB NOT NULL,
            updated_at TIMESTAMP DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS kz_users_email_idx ON kz_users(email);
          CREATE INDEX IF NOT EXISTS kz_users_referral_idx ON kz_users(referral_code);
          CREATE INDEX IF NOT EXISTS kz_users_memberid_idx ON kz_users(member_id);

          CREATE TABLE IF NOT EXISTS kz_wallet_transactions (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            data JSONB NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS kz_wallet_tx_user_idx ON kz_wallet_transactions(user_id);

          CREATE TABLE IF NOT EXISTS kz_payment_requests (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            data JSONB NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS kz_products (
            id TEXT PRIMARY KEY,
            data JSONB NOT NULL,
            updated_at TIMESTAMP DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS kz_misc (
            key TEXT PRIMARY KEY,
            data JSONB NOT NULL,
            updated_at TIMESTAMP DEFAULT NOW()
          );
        `);
        this.enabled = true;
        console.log('✅ PostgreSQL persistence layer initialized — data will survive restarts');
      } finally {
        client.release();
      }
    } catch (err) {
      console.error('❌ PostgreSQL init failed — falling back to in-memory only:', err instanceof Error ? err.message : err);
    }
  },

  async saveUser(user: any): Promise<void> {
    if (!this.enabled || !user?.id) return;
    try {
      const db = getPool()!;
      await db.query(
        `INSERT INTO kz_users (id, email, referral_code, member_id, phone, data, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())
         ON CONFLICT (id) DO UPDATE SET
           email = EXCLUDED.email,
           referral_code = EXCLUDED.referral_code,
           member_id = EXCLUDED.member_id,
           phone = EXCLUDED.phone,
           data = EXCLUDED.data,
           updated_at = NOW()`,
        [user.id, user.email || null, user.referralCode || null, user.memberId || null, user.phone || null, JSON.stringify(user)]
      );
    } catch (err) {
      console.error('pgPersistence.saveUser error:', err instanceof Error ? err.message : err);
    }
  },

  async loadAllUsers(): Promise<any[]> {
    if (!this.enabled) return [];
    try {
      const db = getPool()!;
      const result = await db.query('SELECT data FROM kz_users ORDER BY (data->>\'globalRank\')::int ASC NULLS LAST');
      return result.rows.map(r => r.data);
    } catch (err) {
      console.error('pgPersistence.loadAllUsers error:', err instanceof Error ? err.message : err);
      return [];
    }
  },

  async saveWalletTransaction(tx: any): Promise<void> {
    if (!this.enabled) return;
    const id = tx?.id || tx?.reference || tx?._id?.toString();
    if (!id) return;
    try {
      const db = getPool()!;
      await db.query(
        `INSERT INTO kz_wallet_transactions (id, user_id, data, created_at)
         VALUES ($1, $2, $3::jsonb, COALESCE($4, NOW()))
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`,
        [id, tx.userId || null, JSON.stringify(tx), tx.createdAt || null]
      );
    } catch (err) {
      console.error('pgPersistence.saveWalletTransaction error:', err instanceof Error ? err.message : err);
    }
  },

  async loadAllWalletTransactions(): Promise<any[]> {
    if (!this.enabled) return [];
    try {
      const db = getPool()!;
      const result = await db.query('SELECT data FROM kz_wallet_transactions ORDER BY created_at DESC LIMIT 10000');
      return result.rows.map(r => r.data);
    } catch (err) {
      console.error('pgPersistence.loadAllWalletTransactions error:', err instanceof Error ? err.message : err);
      return [];
    }
  },

  async savePaymentRequest(req: any): Promise<void> {
    if (!this.enabled || !req?.id) return;
    try {
      const db = getPool()!;
      await db.query(
        `INSERT INTO kz_payment_requests (id, user_id, data, updated_at)
         VALUES ($1, $2, $3::jsonb, NOW())
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
        [req.id, req.userId || null, JSON.stringify(req)]
      );
    } catch (err) {
      console.error('pgPersistence.savePaymentRequest error:', err instanceof Error ? err.message : err);
    }
  },

  async loadAllPaymentRequests(): Promise<any[]> {
    if (!this.enabled) return [];
    try {
      const db = getPool()!;
      const result = await db.query('SELECT data FROM kz_payment_requests ORDER BY created_at DESC');
      return result.rows.map(r => r.data);
    } catch (err) {
      return [];
    }
  },

  async saveProduct(product: any): Promise<void> {
    if (!this.enabled || !product?.id) return;
    try {
      const db = getPool()!;
      await db.query(
        `INSERT INTO kz_products (id, data, updated_at)
         VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
        [product.id, JSON.stringify(product)]
      );
    } catch (err) {
      console.error('pgPersistence.saveProduct error:', err instanceof Error ? err.message : err);
    }
  },

  async loadAllProducts(): Promise<any[]> {
    if (!this.enabled) return [];
    try {
      const db = getPool()!;
      const result = await db.query('SELECT data FROM kz_products');
      return result.rows.map(r => r.data);
    } catch (err) {
      return [];
    }
  },

  async deleteProduct(id: string): Promise<void> {
    if (!this.enabled || !id) return;
    try {
      const db = getPool()!;
      await db.query('DELETE FROM kz_products WHERE id = $1', [id]);
    } catch (err) {
      console.error('pgPersistence.deleteProduct error:', err instanceof Error ? err.message : err);
    }
  },

  async saveMisc(key: string, data: any): Promise<void> {
    if (!this.enabled) return;
    try {
      const db = getPool()!;
      await db.query(
        `INSERT INTO kz_misc (key, data, updated_at)
         VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
        [key, JSON.stringify(data)]
      );
    } catch (err) {
      console.error('pgPersistence.saveMisc error:', err instanceof Error ? err.message : err);
    }
  },

  async loadMisc(key: string): Promise<any> {
    if (!this.enabled) return null;
    try {
      const db = getPool()!;
      const result = await db.query('SELECT data FROM kz_misc WHERE key = $1', [key]);
      return result.rows[0]?.data || null;
    } catch (err) {
      return null;
    }
  },
};

export default pgPersistence;
