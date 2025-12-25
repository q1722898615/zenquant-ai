
export enum TradeSide {
  LONG = 'LONG',
  SHORT = 'SHORT'
}

// 对应后端 Strategy 模型
export interface Strategy {
  id: number;
  name: string;
  description: string;
  strategy_type: "BUILTIN" | "CUSTOM";
  config: any;
}

export interface SymbolData {
  id: string;
  symbol: string;
  base_currency: string;
  quote_currency: string;
}

export enum AppStep {
  HOME = 'HOME',
  PSYCHOLOGY_CHECK = 'PSYCHOLOGY_CHECK',
  TRADE_SETUP = 'TRADE_SETUP',
  AI_ANALYSIS = 'AI_ANALYSIS',
  HISTORY_DETAIL = 'HISTORY_DETAIL'
}

export interface MACDState {
  line: number;
  signal: number;
  histogram: number;
  crossStatus: 'UP' | 'DOWN' | 'NONE';
}

export interface MarketState {
  symbol: string;
  currentPrice: number;
  rsi: number;
  ma50: number;
  ma200: number;
  ema12: number;
  ema200: number;
  macd: MACDState;
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
  strategy: string; // 后端只接收策略名称或ID字符串
}

export interface AnalysisResult {
  recommendation: 'EXECUTE' | 'WAIT' | 'CANCEL';
  confidenceScore: number;
  reasoning: string;
  riskAssessment: string;
  suggestedAdjustments?: string;
  strategyScore?: number;
  rulePassed?: boolean;
}

export interface AnalysisRecord {
  id: string;
  timestamp: number; // 前端统一使用毫秒时间戳，Service层需将后端 ISO 转换
  config: TradeConfig;
  market: MarketState;
  analysis: AnalysisResult;
}

// API 通用响应接口
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface ListResponse<T> {
  total: number;
  items: T[]; 
}
