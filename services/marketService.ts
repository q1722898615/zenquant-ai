
import { request } from './api';
import { MarketState, SymbolData } from '../types';

// Helper to handle Python backend snake_case response and calculate missing metrics
export const normalizeMarketState = (data: any): MarketState => {
  if (!data) {
    throw new Error("Market data is empty");
  }

  // 1. Price Normalization
  // Backend uses 'close' for current price usually
  const currentPrice = data.close ?? data.currentPrice ?? data.current_price ?? 0;

  // 2. Indicators Normalization
  const ema12 = data.ema_12 ?? data.ema12 ?? 0;
  const ema200 = data.ema_200 ?? data.ema200 ?? 0;
  // Fallback for MA if not present (using EMAs or price)
  const ma50 = data.ma_50 ?? data.ma50 ?? currentPrice; 
  const ma200 = data.ma_200 ?? data.ma200 ?? ema200;

  // 3. MACD Calculation / Normalization
  // If backend doesn't provide explicit MACD histogram, we try to calculate line manually
  let macdLine = data.macd?.line ?? data.macd_line ?? 0;
  if (macdLine === 0 && ema12 !== 0 && data.ema_26) {
    macdLine = ema12 - data.ema_26;
  }
  
  const macdSignal = data.macd?.signal ?? data.macd_signal ?? 0;
  const macdHist = data.macd?.histogram ?? data.macd_hist ?? (macdLine - macdSignal);
  
  // Cross status from backend or manual calculation
  let crossStatus = data.macd?.crossStatus ?? data.macd?.cross_status ?? data.ema_12_26_cross ?? 'NONE';

  return {
    symbol: data.symbol || 'UNKNOWN',
    currentPrice: currentPrice,
    rsi: data.rsi ?? 50, // Default to neutral if missing (e.g. backend sent ADX instead)
    ma50: ma50,
    ma200: ma200,
    ema12: ema12,
    ema200: ema200,
    macd: {
      line: macdLine,
      signal: macdSignal,
      histogram: macdHist,
      crossStatus: crossStatus
    },
    volatility: data.volatility ?? 0
  };
};

export const fetchMarketAnalysis = async (symbol: string, timeframe: string = '15m'): Promise<MarketState> => {
  // 格式化 Symbol: 移除空格，转大写，确保包含 /USDT (如果用户只输入了 BTC)
  let formattedSymbol = symbol.trim().toUpperCase();
  if (!formattedSymbol.includes('/') && !formattedSymbol.includes('-')) {
    formattedSymbol += '/USDT';
  }

  console.log(`[MarketService] Fetching state for ${formattedSymbol} ${timeframe}...`);

  try {
    const rawData = await request<any>(`/market/state?symbol=${formattedSymbol}&timeframe=${timeframe}`);
    return normalizeMarketState(rawData);
  } catch (error) {
    console.warn(`[MarketService] API Error for ${symbol}, falling back to local simulation.`, error);
    
    // Fallback Mock Data generator
    const basePrice = symbol.includes('ETH') ? 3200 : symbol.includes('SOL') ? 140 : 95000;
    const randomVar = (Math.random() - 0.5) * (basePrice * 0.02);
    const currentPrice = basePrice + randomVar;
    
    return {
      symbol: formattedSymbol,
      currentPrice: currentPrice,
      rsi: 40 + Math.random() * 30, // 40-70
      ma50: currentPrice * 0.98,
      ma200: currentPrice * 0.95,
      ema12: currentPrice * 0.99,
      ema200: currentPrice * 0.96,
      macd: {
        line: 100 + Math.random() * 50,
        signal: 80 + Math.random() * 50,
        histogram: 20 + Math.random() * 10,
        crossStatus: Math.random() > 0.5 ? 'UP' : 'DOWN'
      },
      volatility: basePrice * 0.05
    };
  }
};

export const fetchPopularSymbols = async (): Promise<SymbolData[]> => {
  try {
    return await request<SymbolData[]>('/symbol/popular?limit=10&exchange=binance');
  } catch (e) {
    console.warn("Failed to fetch popular symbols, using fallback.");
    return [
      { id: '1', symbol: 'BTC/USDT', base_currency: 'BTC', quote_currency: 'USDT' },
      { id: '2', symbol: 'ETH/USDT', base_currency: 'ETH', quote_currency: 'USDT' },
      { id: '3', symbol: 'SOL/USDT', base_currency: 'SOL', quote_currency: 'USDT' },
      { id: '4', symbol: 'BNB/USDT', base_currency: 'BNB', quote_currency: 'USDT' },
      { id: '5', symbol: 'DOGE/USDT', base_currency: 'DOGE', quote_currency: 'USDT' },
    ];
  }
};

export const searchSymbols = async (query: string): Promise<SymbolData[]> => {
  if (!query) return [];
  try {
    return await request<SymbolData[]>(`/symbol/search?q=${query}&limit=10`);
  } catch (e) {
    return [];
  }
};
