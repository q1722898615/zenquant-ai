
import { request } from './api';
import { MarketState, SymbolData } from '../types';

// Helper to handle Python backend snake_case response and calculate missing metrics
// Kept for robustness to ensure frontend camelCase compatibility
export const normalizeMarketState = (data: any): MarketState => {
  if (!data) {
    throw new Error("Market data is empty");
  }

  // 1. Price Normalization
  const currentPrice = data.close ?? data.currentPrice ?? data.current_price ?? 0;

  // 2. Indicators Normalization
  const ema12 = data.ema_12 ?? data.ema12 ?? 0;
  const ema200 = data.ema_200 ?? data.ema200 ?? 0;
  const ma50 = data.ma_50 ?? data.ma50 ?? currentPrice; 
  const ma200 = data.ma_200 ?? data.ma200 ?? ema200;

  // 3. MACD Calculation / Normalization
  let macdLine = data.macd?.line ?? data.macd_line ?? 0;
  if (macdLine === 0 && ema12 !== 0 && data.ema_26) {
    macdLine = ema12 - data.ema_26;
  }
  
  const macdSignal = data.macd?.signal ?? data.macd_signal ?? 0;
  const macdHist = data.macd?.histogram ?? data.macd_hist ?? (macdLine - macdSignal);
  
  let crossStatus = data.macd?.crossStatus ?? data.macd?.cross_status ?? data.ema_12_26_cross ?? 'NONE';

  return {
    symbol: data.symbol || 'UNKNOWN',
    currentPrice: currentPrice,
    rsi: data.rsi ?? 50,
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
  // Format Symbol
  let formattedSymbol = symbol.trim().toUpperCase();
  if (!formattedSymbol.includes('/') && !formattedSymbol.includes('-')) {
    formattedSymbol += '/USDT';
  }

  console.log(`[MarketService] Fetching state for ${formattedSymbol} ${timeframe}...`);

  try {
    const rawData = await request<any>(`/market/state?symbol=${formattedSymbol}&timeframe=${timeframe}`);
    return normalizeMarketState(rawData);
  } catch (error) {
    console.error(`[MarketService] API Error for ${symbol}`, error);
    throw error; // Let UI handle the error state
  }
};

export const fetchPopularSymbols = async (): Promise<SymbolData[]> => {
  return await request<SymbolData[]>('/symbol/popular?limit=10&exchange=binance');
};

export const searchSymbols = async (query: string): Promise<SymbolData[]> => {
  if (!query) return [];
  return await request<SymbolData[]>(`/symbol/search?q=${query}&limit=10`);
};
