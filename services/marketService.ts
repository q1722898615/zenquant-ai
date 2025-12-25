
import { request } from './api';
import { MarketState, SymbolData } from '../types';

export const fetchMarketAnalysis = async (symbol: string, timeframe: string = '15m'): Promise<MarketState> => {
  console.log(`[MarketService] Fetching state for ${symbol} ${timeframe}...`);
  
  let formattedSymbol = symbol.toUpperCase();
  if (!formattedSymbol.includes('/')) {
    formattedSymbol += '/USDT';
  }

  try {
    return await request<MarketState>(`/market/state?symbol=${formattedSymbol}&timeframe=${timeframe}`);
  } catch (error) {
    console.warn(`[MarketService] Failed to fetch state for ${symbol}. Using Mock Data.`);
    
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
    console.warn("Search failed", e);
    return [];
  }
};
