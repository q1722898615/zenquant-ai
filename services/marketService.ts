import { MarketState } from '../types';
import { calculateSMA, calculateEMA, calculateRSI, calculateMACD, calculateVolatility } from '../utils/technicalIndicators';

const generateMockPriceHistory = (symbol: string, length: number = 250): number[] => {
  const basePrice = symbol === 'BTC' ? 90000 : symbol === 'ETH' ? 3000 : 125;
  let currentPrice = basePrice;
  const history: number[] = [];

  for (let i = 0; i < length; i++) {
    const volatility = basePrice * 0.02;
    const change = (Math.random() - 0.5) * volatility;
    currentPrice += change;
    currentPrice = Math.max(0.1, currentPrice);
    history.push(currentPrice);
  }
  return history;
};

export const fetchMarketAnalysis = async (symbol: string): Promise<MarketState> => {
  console.log(`[Step 1] Fetching raw market data for ${symbol}...`);
  
  await new Promise(resolve => setTimeout(resolve, 800)); 
  
  const history = generateMockPriceHistory(symbol);
  const currentPrice = parseFloat(history[history.length - 1].toFixed(2));

  console.log(`[Step 2] Calculating indicators based on ${history.length} candles...`);

  // Basic Indicators
  const rsi = calculateRSI(history, 14);
  const ma50 = calculateSMA(history, 50);
  const ma200 = calculateSMA(history, 200);
  const volatility = calculateVolatility(history, 14);

  // Advanced Indicators for MACD-RSI Strategy
  const ema12 = calculateEMA(history, 12);
  const ema200 = calculateEMA(history, 200);
  const macdData = calculateMACD(history);

  // Determine MACD Cross Status roughly
  // In a real app, we check if (prevMACD < prevSignal && currMACD > currSignal)
  // Here we just use the histogram sign for simplicity in the prompt context
  let crossStatus: 'UP' | 'DOWN' | 'NONE' = 'NONE';
  if (macdData.histogram > 0 && macdData.histogram < 0.5) crossStatus = 'UP'; // Just turned positive (simulated)
  else if (macdData.histogram < 0 && macdData.histogram > -0.5) crossStatus = 'DOWN'; // Just turned negative

  const marketState: MarketState = {
    symbol,
    currentPrice,
    rsi,
    ma50,
    ma200,
    ema12,
    ema200,
    macd: {
      ...macdData,
      crossStatus
    },
    volatility
  };

  console.log("[Step 3] Market State Ready:", marketState);
  return marketState;
};