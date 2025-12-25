
import { request } from './api';
import { TradeConfig, MarketState, AnalysisResult, AnalysisRecord } from '../types';
import { normalizeMarketState } from './marketService';

// Backend AnalysisRecord structure (snake_case)
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
  market_state: any; 
  analysis_result: any; // Use any to safely handle mixed casing from backend
  created_at: string;
}

// Helper to format adjustments if they come as an object
const formatAdjustments = (adj: string | Record<string, string> | undefined): string | undefined => {
  if (!adj) return undefined;
  if (typeof adj === 'string') return adj;
  
  return Object.entries(adj)
    .map(([key, value]) => `• ${key.toUpperCase()}: ${value}`)
    .join('\n');
};

// Map backend record to frontend structure with robust casing checks
const mapBackendRecordToFrontend = (record: BackendAnalysisRecord): AnalysisRecord => {
  const ar = record.analysis_result || {};
  
  // Prioritize values in this order: 
  // 1. Explicit camelCase (frontend standard)
  // 2. Explicit snake_case (backend standard)
  // 3. Fallback/Default
  
  // Special handling for recommendation: Check root level first if missing in nested object
  const recommendation = ar.recommendation || record.recommendation || 'WAIT';
  
  const confidenceScore = ar.confidenceScore ?? ar.confidence_score ?? record.final_score ?? 0;
  const reasoning = ar.reasoning ?? ar.reasoning_text ?? 'No reasoning provided.';
  const riskAssessment = ar.riskAssessment ?? ar.risk_assessment ?? 'No risk assessment provided.';
  const suggestedAdjustmentsRaw = ar.suggestedAdjustments ?? ar.suggested_adjustments;

  return {
    id: record.id,
    timestamp: new Date(record.created_at).getTime(),
    config: record.trade_config,
    market: normalizeMarketState(record.market_state),
    analysis: {
      recommendation: recommendation as 'EXECUTE' | 'WAIT' | 'CANCEL',
      confidenceScore: confidenceScore,
      reasoning: reasoning,
      riskAssessment: riskAssessment,
      suggestedAdjustments: formatAdjustments(suggestedAdjustmentsRaw)
    }
  };
};

export const analyzeTrade = async (
  trade: TradeConfig,
  market: MarketState
): Promise<AnalysisResult> => {
  console.log("[AnalysisService] Requesting AI evaluation...");
  
  const response = await request<AnalysisResult>('/analysis/evaluate', {
    method: 'POST',
    body: JSON.stringify({
      config: trade,
      market_state: market
    })
  });

  if (response.suggestedAdjustments && typeof response.suggestedAdjustments === 'object') {
      response.suggestedAdjustments = formatAdjustments(response.suggestedAdjustments as any);
  }
  return response;
};

export const fetchAnalysisHistory = async (limit: number = 20): Promise<AnalysisRecord[]> => {
  const data = await request<BackendAnalysisRecord[]>(`/analysis/records/latest?limit=${limit}`);
  return data.map(mapBackendRecordToFrontend);
};
