
import { request } from './api';
import { TradeConfig, MarketState, AnalysisResult, AnalysisRecord, TradeSide } from '../types';
import { normalizeMarketState } from './marketService';

// 后端 AnalysisRecord 的结构 (snake_case)
interface BackendAnalysisRecord {
  id: string;
  symbol: string;
  timeframe: string;
  strategy: string;
  side: string;
  final_score: number;
  recommendation: string;
  confidence: number;
  trade_config: TradeConfig;
  market_state: any; // Raw backend data usually in snake_case
  analysis_result: AnalysisResult;
  created_at: string;
}

// Mock Data for Fallback
const MOCK_HISTORY: AnalysisRecord[] = [
  {
    id: 'mock-1',
    timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    config: {
      symbol: 'BTC',
      side: TradeSide.LONG,
      timeframe: '4h',
      entryPrice: 94500,
      stopLoss: 92500,
      takeProfit: 98500,
      accountBalance: 10000,
      riskPercentage: 2,
      leverage: 5,
      strategy: 'Trend Following'
    },
    market: {
      symbol: 'BTC/USDT',
      currentPrice: 95200,
      rsi: 62,
      ma50: 93000,
      ma200: 89000,
      ema12: 94800,
      ema200: 90000,
      macd: { line: 150, signal: 120, histogram: 30, crossStatus: 'UP' },
      volatility: 1200
    },
    analysis: {
      recommendation: 'EXECUTE',
      confidenceScore: 88,
      reasoning: 'Strong bullish trend confirmed by MA alignment (50 > 200) and MACD crossover. RSI is healthy (62) with room to grow.',
      riskAssessment: 'Volatility is high but stop loss is placed below key support level.',
      suggestedAdjustments: 'Consider trailing stop loss.'
    }
  },
  {
    id: 'mock-2',
    timestamp: Date.now() - 1000 * 60 * 60 * 5, // 5 hours ago
    config: {
      symbol: 'ETH',
      side: TradeSide.SHORT,
      timeframe: '15m',
      entryPrice: 3200,
      stopLoss: 3250,
      takeProfit: 3100,
      accountBalance: 10000,
      riskPercentage: 1,
      leverage: 10,
      strategy: 'Mean Reversion'
    },
    market: {
      symbol: 'ETH/USDT',
      currentPrice: 3210,
      rsi: 75,
      ma50: 3180,
      ma200: 3150,
      ema12: 3205,
      ema200: 3160,
      macd: { line: 10, signal: 15, histogram: -5, crossStatus: 'DOWN' },
      volatility: 40
    },
    analysis: {
      recommendation: 'WAIT',
      confidenceScore: 65,
      reasoning: 'RSI is overbought (75) suggesting potential reversal, but momentum is still strong. Wait for bearish confirmation candle.',
      riskAssessment: 'Counter-trend trade. High risk of squeeze.',
      suggestedAdjustments: 'Wait for RSI to cross below 70.'
    }
  }
];

// 将后端记录转换为前端使用的格式
const mapBackendRecordToFrontend = (record: BackendAnalysisRecord): AnalysisRecord => {
  return {
    id: record.id,
    timestamp: new Date(record.created_at).getTime(),
    config: record.trade_config,
    market: normalizeMarketState(record.market_state),
    analysis: record.analysis_result
  };
};

export const analyzeTrade = async (
  trade: TradeConfig,
  market: MarketState
): Promise<AnalysisResult> => {
  console.log("[AnalysisService] Requesting AI evaluation...");
  
  try {
    return await request<AnalysisResult>('/analysis/evaluate', {
      method: 'POST',
      body: JSON.stringify({
        config: trade,
        market_state: market
      })
    });
  } catch (error) {
    console.warn("AI Analysis Failed (Backend Unreachable): Using Mock Result");
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      recommendation: 'WAIT',
      confidenceScore: 50,
      reasoning: 'Backend connection failed. This is a fallback response. Please check your API server connection.',
      riskAssessment: 'Unknown risk due to connection failure.',
      suggestedAdjustments: 'Ensure the backend server is running at https://ai.sndkf.top'
    };
  }
};

export const fetchAnalysisHistory = async (limit: number = 20): Promise<AnalysisRecord[]> => {
  try {
    const data = await request<BackendAnalysisRecord[]>(`/analysis/records/latest?limit=${limit}`);
    return data.map(mapBackendRecordToFrontend);
  } catch (error) {
    console.warn("Failed to fetch history (Backend Unreachable): Using Mock Data");
    return MOCK_HISTORY;
  }
};
