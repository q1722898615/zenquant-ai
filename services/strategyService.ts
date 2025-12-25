
import { request } from './api';
import { Strategy } from '../types';

interface StrategyListResponse {
  total: number;
  strategies: Strategy[];
}

export const fetchStrategies = async (): Promise<Strategy[]> => {
  try {
    const data = await request<StrategyListResponse>('/strategy/list?active_only=true');
    return data.strategies;
  } catch (error) {
    console.error("Failed to fetch strategies, using fallback.");
    // Fallback if API fails
    return [
      { id: 1, name: 'Trend Following (MA)', description: 'Classic trend following', strategy_type: 'BUILTIN', config: {} },
      { id: 2, name: 'Mean Reversion (RSI)', description: 'RSI based reversion', strategy_type: 'BUILTIN', config: {} }
    ];
  }
};
