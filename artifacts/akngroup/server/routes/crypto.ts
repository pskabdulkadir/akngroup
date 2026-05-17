import { Router } from "express";
import { mlmDb } from "../lib/mlm-database";

const router = Router();

// CoinGecko API configuration
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';
const SUPPORTED_CURRENCIES = ['try', 'usd', 'eur'];

// Cache for rates to avoid excessive API calls
let ratesCache: any = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Fetch rates from CoinGecko
async function fetchCryptoRatesFromAPI(): Promise<any> {
  try {
    const response = await fetch(
      `${COINGECKO_API_URL}/simple/price?ids=bitcoin&vs_currencies=${SUPPORTED_CURRENCIES.join(',')}&include_24hr_change=true`
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.bitcoin) {
      throw new Error('Bitcoin data not found in API response');
    }
    
    return {
      btc_try: data.bitcoin.try || 0,
      btc_usd: data.bitcoin.usd || 0,
      btc_eur: data.bitcoin.eur || 0,
      usd_try: 67, // Mock exchange rate (in real app, get from another API)
      eur_try: 73, // Mock exchange rate (in real app, get from another API)
      lastUpdated: new Date(),
      source: 'coingecko',
      btc_24h_change: data.bitcoin.usd_24h_change || 0
    };
  } catch (error) {
    console.error('CoinGecko API error:', error);
    
    // Fallback rates
    return {
      btc_try: 2850000,
      btc_usd: 42000,
      btc_eur: 38500,
      usd_try: 67,
      eur_try: 73,
      lastUpdated: new Date(),
      source: 'fallback',
      btc_24h_change: 0
    };
  }
}

// Get crypto rates with caching
async function getCryptoRates() {
  const now = Date.now();
  
  // Check cache first
  if (ratesCache && (now - lastFetchTime) < CACHE_DURATION) {
    return ratesCache;
  }
  
  try {
    // Try to get from database first
    let dbRates = await mlmDb.getCryptoRates();
    
    // If no database rates or they're older than cache duration, fetch from API
    if (!dbRates || (now - new Date(dbRates.lastUpdated).getTime()) > CACHE_DURATION) {
      console.log('🔄 Fetching fresh crypto rates from CoinGecko...');
      const freshRates = await fetchCryptoRatesFromAPI();
      
      // Save to database
      await mlmDb.updateCryptoRates(freshRates);
      
      // Update cache
      ratesCache = freshRates;
      lastFetchTime = now;
      
      console.log('✅ Crypto rates updated from CoinGecko');
      return freshRates;
    }
    
    // Return database rates and update cache
    ratesCache = dbRates;
    lastFetchTime = now;
    return dbRates;
    
  } catch (error) {
    console.error('Error getting crypto rates:', error);
    
    // Return cache if available, otherwise fallback
    if (ratesCache) {
      return ratesCache;
    }
    
    return {
      btc_try: 2850000,
      btc_usd: 42000,
      btc_eur: 38500,
      usd_try: 67,
      eur_try: 73,
      lastUpdated: new Date(),
      source: 'emergency_fallback',
      btc_24h_change: 0
    };
  }
}

// Public route to get crypto rates
router.get('/rates', async (req, res) => {
  try {
    const rates = await getCryptoRates();
    
    res.json({
      success: true,
      ...rates
    });
  } catch (error) {
    console.error('Crypto rates endpoint error:', error);
    
    // Emergency fallback
    res.json({
      success: false,
      btc_try: 2850000,
      btc_usd: 42000,
      btc_eur: 38500,
      usd_try: 67,
      eur_try: 73,
      lastUpdated: new Date(),
      source: 'emergency_fallback',
      error: 'Failed to fetch rates'
    });
  }
});

// Get detailed market data (for admin dashboard)
router.get('/market-data', async (req, res) => {
  try {
    const response = await fetch(
      `${COINGECKO_API_URL}/coins/bitcoin?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    const marketData = {
      id: data.id,
      name: data.name,
      symbol: data.symbol,
      current_price: {
        try: data.market_data?.current_price?.try || 0,
        usd: data.market_data?.current_price?.usd || 0,
        eur: data.market_data?.current_price?.eur || 0
      },
      market_cap: {
        try: data.market_data?.market_cap?.try || 0,
        usd: data.market_data?.market_cap?.usd || 0,
        eur: data.market_data?.market_cap?.eur || 0
      },
      price_change_24h: {
        try: data.market_data?.price_change_24h_in_currency?.try || 0,
        usd: data.market_data?.price_change_24h_in_currency?.usd || 0,
        eur: data.market_data?.price_change_24h_in_currency?.eur || 0
      },
      price_change_percentage_24h: data.market_data?.price_change_percentage_24h || 0,
      high_24h: {
        try: data.market_data?.high_24h?.try || 0,
        usd: data.market_data?.high_24h?.usd || 0,
        eur: data.market_data?.high_24h?.eur || 0
      },
      low_24h: {
        try: data.market_data?.low_24h?.try || 0,
        usd: data.market_data?.low_24h?.usd || 0,
        eur: data.market_data?.low_24h?.eur || 0
      },
      total_volume: {
        try: data.market_data?.total_volume?.try || 0,
        usd: data.market_data?.total_volume?.usd || 0,
        eur: data.market_data?.total_volume?.eur || 0
      },
      last_updated: data.market_data?.last_updated || new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: marketData
    });
  } catch (error) {
    console.error('Market data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch market data'
    });
  }
});

// Force refresh rates (admin only)
router.post('/refresh', async (req, res) => {
  try {
    // Clear cache
    ratesCache = null;
    lastFetchTime = 0;
    
    // Fetch fresh rates
    const freshRates = await fetchCryptoRatesFromAPI();
    
    // Save to database
    await mlmDb.updateCryptoRates(freshRates);
    
    console.log('🔄 Crypto rates manually refreshed');
    
    res.json({
      success: true,
      message: 'Rates refreshed successfully',
      data: freshRates
    });
  } catch (error) {
    console.error('Refresh rates error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh rates'
    });
  }
});

// Convert between currencies
router.post('/convert', async (req, res) => {
  try {
    const { from, to, amount } = req.body;
    
    if (!from || !to || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid from, to currencies and amount required'
      });
    }
    
    const rates = await getCryptoRates();
    let convertedAmount = 0;
    
    // Convert from source currency to USD first, then to target currency
    let amountInUSD = amount;
    
    // Convert from source to USD
    switch (from.toLowerCase()) {
      case 'try':
        amountInUSD = amount / rates.usd_try;
        break;
      case 'eur':
        amountInUSD = amount / rates.eur_try * rates.usd_try;
        break;
      case 'btc':
        amountInUSD = amount * rates.btc_usd;
        break;
      case 'usd':
        amountInUSD = amount;
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Unsupported source currency'
        });
    }
    
    // Convert from USD to target currency
    switch (to.toLowerCase()) {
      case 'try':
        convertedAmount = amountInUSD * rates.usd_try;
        break;
      case 'eur':
        convertedAmount = amountInUSD / rates.eur_try * rates.usd_try;
        break;
      case 'btc':
        convertedAmount = amountInUSD / rates.btc_usd;
        break;
      case 'usd':
        convertedAmount = amountInUSD;
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Unsupported target currency'
        });
    }
    
    res.json({
      success: true,
      conversion: {
        from: from.toUpperCase(),
        to: to.toUpperCase(),
        amount,
        convertedAmount: Math.round(convertedAmount * 100000000) / 100000000, // 8 decimal places for crypto
        rate: convertedAmount / amount,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Currency conversion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to convert currency'
    });
  }
});

// Auto-refresh rates every 5 minutes
setInterval(async () => {
  try {
    console.log('🔄 Auto-refreshing crypto rates...');
    const freshRates = await fetchCryptoRatesFromAPI();
    await mlmDb.updateCryptoRates(freshRates);
    
    // Update cache
    ratesCache = freshRates;
    lastFetchTime = Date.now();
    
    console.log('✅ Auto-refresh completed');
  } catch (error) {
    console.error('Auto-refresh error:', error);
  }
}, 5 * 60 * 1000); // 5 minutes

export default router;
