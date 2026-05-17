import mongoose from 'mongoose';
import { Product, ClonePage, SystemSettings } from '../models';
import { mlmDb } from '../mlm-database';
import { FeatureFlags } from '../feature-flags';

/**
 * Product Migration Service
 * 
 * File-based ürün, clone page ve sistem ayarlarını Mongoose'a taşır.
 */
export class ProductMigrationService {
  
  /**
   * Tüm ürünleri file-based'dan Mongoose'a taşı
   */
  static async migrateAllProducts(): Promise<{
    total: number;
    migrated: number;
    failed: number;
    errors: string[];
  }> {
    const result = {
      total: 0,
      migrated: 0,
      failed: 0,
      errors: [] as string[]
    };

    console.log('🚀 Product migration başlatılıyor...');

    try {
      const fileProducts = mlmDb.db.data.products || [];
      result.total = fileProducts.length;
      console.log(`📊 Toplam ${result.total} ürün bulundu`);

      for (const product of fileProducts) {
        try {
          await this.migrateProduct(product);
          result.migrated++;
          console.log(`✅ Ürün taşındı: ${product.name} (${product.id})`);
        } catch (error) {
          result.failed++;
          const errorMsg = `❌ Ürün taşınamadı: ${product.id} - ${(error as Error).message}`;
          result.errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      console.log(`✅ Product migration tamamlandı: ${result.migrated}/${result.total}`);
      
      if (result.failed > 0) {
        console.warn(`⚠️ ${result.failed} ürün taşınamadı`);
      }

      return result;
    } catch (error) {
      console.error('❌ Product migration sırasında kritik hata:', error);
      throw error;
    }
  }

  /**
   * Tek bir ürünü Mongoose'a taşı
   */
  static async migrateProduct(productData: any): Promise<void> {
    if (!productData || !productData.id) {
      throw new Error('Geçersiz ürün verisi');
    }

    const mongoProductData = {
      id: productData.id,
      name: productData.name,
      description: productData.description,
      price: productData.price,
      originalPrice: productData.originalPrice,
      image: productData.image,
      category: productData.category,
      features: productData.features || [],
      inStock: productData.inStock ?? true,
      rating: productData.rating || 0,
      reviews: productData.reviews || 0,
      isActive: productData.isActive ?? true,
    };

    await Product.findOneAndUpdate(
      { id: productData.id },
      { $set: mongoProductData },
      { upsert: true, new: true }
    );
  }

  /**
   * Tüm clone page'leri file-based'dan Mongoose'a taşı
   */
  static async migrateAllClonePages(): Promise<{
    total: number;
    migrated: number;
    failed: number;
    errors: string[];
  }> {
    const result = {
      total: 0,
      migrated: 0,
      failed: 0,
      errors: [] as string[]
    };

    console.log('🚀 Clone Page migration başlatılıyor...');

    try {
      const fileClonePages = mlmDb.db.data.clonePages || [];
      result.total = fileClonePages.length;
      console.log(`📊 Toplam ${result.total} clone page bulundu`);

      for (const page of fileClonePages) {
        try {
          await this.migrateClonePage(page);
          result.migrated++;
          console.log(`✅ Clone page taşındı: ${page.name} (${page.slug})`);
        } catch (error) {
          result.failed++;
          const errorMsg = `❌ Clone page taşınamadı: ${page.slug} - ${(error as Error).message}`;
          result.errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      console.log(`✅ Clone Page migration tamamlandı: ${result.migrated}/${result.total}`);
      
      if (result.failed > 0) {
        console.warn(`⚠️ ${result.failed} clone page taşınamadı`);
      }

      return result;
    } catch (error) {
      console.error('❌ Clone Page migration sırasında kritik hata:', error);
      throw error;
    }
  }

  /**
   * Tek bir clone page'i Mongoose'a taşı
   */
  static async migrateClonePage(pageData: any): Promise<void> {
    if (!pageData || !pageData.userId || !pageData.slug) {
      throw new Error('Geçersiz clone page verisi');
    }

    const mongoPageData = {
      id: pageData.id || `clone-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: pageData.userId,
      name: pageData.name,
      slug: pageData.slug.toLowerCase().trim(),
      isActive: pageData.isActive ?? true,
      visitCount: pageData.visitCount || 0,
      conversionCount: pageData.conversionCount || 0,
      customizations: pageData.customizations || {},
    };

    await ClonePage.findOneAndUpdate(
      { slug: mongoPageData.slug },
      { $set: mongoPageData },
      { upsert: true, new: true }
    );
  }

  /**
   * Sistem ayarlarını file-based'dan Mongoose'a taşı
   */
  static async migrateSystemSettings(): Promise<{
    total: number;
    migrated: number;
    failed: number;
    errors: string[];
  }> {
    const result = {
      total: 0,
      migrated: 0,
      failed: 0,
      errors: [] as string[]
    };

    console.log('🚀 System Settings migration başlatılıyor...');

    try {
      const fileSettings = mlmDb.db.data.settings || {};
      
      // Ana ayarları taşı
      const settingsToMigrate = [
        { key: 'systemSettings', value: fileSettings.systemSettings, category: 'system' as const },
        { key: 'commissionSettings', value: fileSettings.commissionSettings, category: 'commission' as const },
      ];

      result.total = settingsToMigrate.length;

      for (const setting of settingsToMigrate) {
        try {
          await SystemSettings.findOneAndUpdate(
            { key: setting.key },
            { 
              $set: { 
                key: setting.key, 
                value: setting.value, 
                category: setting.category,
                description: `${setting.key} system settings`,
                isActive: true 
              } 
            },
            { upsert: true, new: true }
          );
          result.migrated++;
          console.log(`✅ Ayar taşındı: ${setting.key}`);
        } catch (error) {
          result.failed++;
          const errorMsg = `❌ Ayar taşınamadı: ${setting.key} - ${(error as Error).message}`;
          result.errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      // Monoline settings varsa taşı
      if (mlmDb.db.data.monolineSettings) {
        try {
          await SystemSettings.findOneAndUpdate(
            { key: 'monolineSettings' },
            { 
              $set: { 
                key: 'monolineSettings', 
                value: mlmDb.db.data.monolineSettings, 
                category: 'monoline',
                description: 'Monoline MLM system settings',
                isActive: true 
              } 
            },
            { upsert: true, new: true }
          );
          result.migrated++;
          console.log('✅ Monoline settings taşındı');
        } catch (error) {
          result.failed++;
          console.error('❌ Monoline settings taşınamadı:', error);
        }
      }

      console.log(`✅ System Settings migration tamamlandı: ${result.migrated}/${result.total}`);
      
      return result;
    } catch (error) {
      console.error('❌ System Settings migration sırasında kritik hata:', error);
      throw error;
    }
  }

  /**
   * Tüm migration'ları tek seferde çalıştır
   */
  static async migrateAll(): Promise<{
    products: any;
    clonePages: any;
    settings: any;
    totalMigrated: number;
  }> {
    console.log('🚀 Toplu migration başlatılıyor...');
    
    const products = await this.migrateAllProducts();
    const clonePages = await this.migrateAllClonePages();
    const settings = await this.migrateSystemSettings();

    const totalMigrated = products.migrated + clonePages.migrated + settings.migrated;
    const totalItems = products.total + clonePages.total + settings.total;

    console.log(`✅ Toplu migration tamamlandı: ${totalMigrated}/${totalItems} öğe taşındı`);

    return {
      products,
      clonePages,
      settings,
      totalMigrated
    };
  }

  /**
   * Migrasyon doğrulama
   */
  static async validateMigration(): Promise<{
    isValid: boolean;
    discrepancies: string[];
  }> {
    const result = {
      isValid: true,
      discrepancies: [] as string[]
    };

    console.log('🔍 Product migration doğrulanıyor...');

    // Products doğrula
    const fileProducts = mlmDb.db.data.products || [];
    for (const fileProduct of fileProducts) {
      const mongoProduct = await Product.findOne({ id: fileProduct.id });
      if (!mongoProduct) {
        result.discrepancies.push(`Ürün Mongoose'da bulunamadı: ${fileProduct.id}`);
        result.isValid = false;
      }
    }

    // Clone pages doğrula
    const fileClonePages = mlmDb.db.data.clonePages || [];
    for (const filePage of fileClonePages) {
      const mongoPage = await ClonePage.findOne({ slug: filePage.slug });
      if (!mongoPage) {
        result.discrepancies.push(`Clone page Mongoose'da bulunamadı: ${filePage.slug}`);
        result.isValid = false;
      }
    }

    if (result.isValid) {
      console.log('✅ Product migration doğrulaması başarılı!');
    } else {
      console.warn(`⚠️ ${result.discrepancies.length} uyumsuzluk bulundu`);
    }

    return result;
  }

  /**
   * Rollback
   */
  static async rollback(): Promise<void> {
    console.log('🔄 Product rollback başlatılıyor...');
    
    if (FeatureFlags.USE_MONGOOSE_FOR_PRODUCTS || FeatureFlags.USE_MONGOOSE_FOR_CLONE_PAGES || FeatureFlags.USE_MONGOOSE_FOR_SETTINGS) {
      throw new Error("Migration flag'leri açıkken rollback yapılamaz!");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const productResult = await Product.deleteMany({}, { session });
      const clonePageResult = await ClonePage.deleteMany({}, { session });
      const settingsResult = await SystemSettings.deleteMany({}, { session });
      
      await session.commitTransaction();
      console.log(`✅ Rollback tamamlandı: ${productResult.deletedCount} ürün, ${clonePageResult.deletedCount} clone page, ${settingsResult.deletedCount} ayar silindi`);
    } catch (error) {
      await session.abortTransaction();
      console.error('❌ Rollback başarısız:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }
}