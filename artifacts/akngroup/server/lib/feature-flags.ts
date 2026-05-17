/**
 * Feature Flags - Kademeli Geçiş İçin
 * 
 * Bu flag'ler file-based ve Mongoose arasında geçişi kontrol eder.
 * Her flag true olduğunda ilgili entity için Mongoose kullanılır.
 */

export interface FeatureFlagConfig {
  USE_MONGOOSE_FOR_USERS: boolean;
  USE_MONGOOSE_FOR_TRANSACTIONS: boolean;
  USE_MONGOOSE_FOR_PRODUCTS: boolean;
  USE_MONGOOSE_FOR_CLONE_PAGES: boolean;
  USE_MONGOOSE_FOR_SETTINGS: boolean;
  USE_MONGOOSE_FOR_POOLS: boolean;
  USE_MONGOOSE_FOR_COMMISSIONS: boolean;
}

export const FeatureFlags: FeatureFlagConfig = {
  // Users için Mongoose kullan (default: false)
  USE_MONGOOSE_FOR_USERS: process.env.USE_MONGOOSE_FOR_USERS === 'true',
  
  // Transactions için Mongoose kullan (default: false)
  USE_MONGOOSE_FOR_TRANSACTIONS: process.env.USE_MONGOOSE_FOR_TRANSACTIONS === 'true',
  
  // Products için Mongoose kullan (default: false)
  USE_MONGOOSE_FOR_PRODUCTS: process.env.USE_MONGOOSE_FOR_PRODUCTS === 'true',
  
  // ClonePages için Mongoose kullan (default: false)
  USE_MONGOOSE_FOR_CLONE_PAGES: process.env.USE_MONGOOSE_FOR_CLONE_PAGES === 'true',
  
  // SystemSettings için Mongoose kullan (default: false)
  USE_MONGOOSE_FOR_SETTINGS: process.env.USE_MONGOOSE_FOR_SETTINGS === 'true',
  
  // PassiveIncomePool ve CompanyFund için Mongoose kullan (default: false)
  USE_MONGOOSE_FOR_POOLS: process.env.USE_MONGOOSE_FOR_POOLS === 'true',
  
  // Commission işlemleri için Mongoose kullan (default: false)
  USE_MONGOOSE_FOR_COMMISSIONS: process.env.USE_MONGOOSE_FOR_COMMISSIONS === 'true',
};

/**
 * Belirli bir entity için Mongoose kullanılıp kullanılmayacağını kontrol et
 * @param entity Entity adı (users, transactions, products, etc.)
 * @returns Mongoose kullanılıyorsa true
 */
export function shouldUseMongoose(entity: string): boolean {
  const flagKey = `USE_MONGOOSE_FOR_${entity.toUpperCase()}` as keyof FeatureFlagConfig;
  return FeatureFlags[flagKey] || false;
}

/**
 * Tüm flag'lerin durumunu logla
 */
export function logFeatureFlags(): void {
  console.log('🚩 Feature Flags Durumu:');
  Object.entries(FeatureFlags).forEach(([key, value]) => {
    console.log(`  ${key}: ${value ? '✅ AÇIK' : '❌ KAPALI'}`);
  });
}

/**
 * Feature flag'leri güncelle (sadece development için)
 */
export function updateFeatureFlag(key: keyof FeatureFlagConfig, value: boolean): void {
  if (process.env.NODE_ENV === 'development') {
    FeatureFlags[key] = value;
    console.log(`🚩 Feature flag güncellendi: ${key} = ${value}`);
  } else {
    console.warn('⚠️ Production ortamında feature flag değiştirilemez!');
  }
}

/**
 * Migration durumu için özet bilgi ver
 */
export function getMigrationStatus(): {
  totalEntities: number;
  migratedEntities: number;
  pendingEntities: number;
  migrationPercentage: number;
} {
  const entities = Object.keys(FeatureFlags).filter(key => key.startsWith('USE_MONGOOSE_FOR_'));
  const total = entities.length;
  const migrated = entities.filter(key => FeatureFlags[key as keyof FeatureFlagConfig]).length;
  
  return {
    totalEntities: total,
    migratedEntities: migrated,
    pendingEntities: total - migrated,
    migrationPercentage: Math.round((migrated / total) * 100)
  };
}

// Başlangıçta feature flag durumunu logla
if (process.env.NODE_ENV !== 'test') {
  logFeatureFlags();
  const status = getMigrationStatus();
  console.log(`📊 Migration Durumu: %${status.migrationPercentage} tamamlandı (${status.migratedEntities}/${status.totalEntities})`);
}