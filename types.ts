export enum TradeSide {
  LONG = 'LONG',
  SHORT = 'SHORT'
}

export enum StrategyType {
  TREND_FOLLOWING = '趋势跟踪 (均线/MA)',
  MEAN_REVERSION = '均值回归 (RSI/布林带)',
  BREAKOUT = '突破策略 (Breakout)',
  VEGAS_TUNNEL = 'Vegas 隧道交易法',
  MACD_RSI_COMPOSITE = 'MACD-RSI 双指标复合策略'
}

export enum AppStep {
  HOME = 'HOME',
  PSYCHOLOGY_CHECK = 'PSYCHOLOGY_CHECK',
  TRADE_SETUP = 'TRADE_SETUP',
  AI_ANALYSIS = 'AI_ANALYSIS',
  HISTORY_DETAIL = 'HISTORY_DETAIL'
}

export interface MarketState {
  symbol: string;
  currentPrice: number;
  rsi: number;
  ma50: number;
  ma200: number;
  ema12: number;
  ema200: number;
  macd: {
    line: number;
    signal: number;
    histogram: number;
    crossStatus: 'UP' | 'DOWN' | 'NONE';
  };
  volatility: number;
}

export interface TradeConfig {
  symbol: string;
  side: TradeSide;
  timeframe: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  accountBalance: number;
  riskPercentage: number;
  leverage: number;
  strategy: StrategyType;
}

export interface AnalysisResult {
  recommendation: 'EXECUTE' | 'WAIT' | 'CANCEL';
  confidenceScore: number;
  reasoning: string;
  riskAssessment: string;
  suggestedAdjustments?: string;
}

export interface AnalysisRecord {
  id: string;
  timestamp: number;
  config: TradeConfig;
  market: MarketState;
  analysis: AnalysisResult;
}