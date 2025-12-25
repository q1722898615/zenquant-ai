
import { request } from './api';
import { Strategy } from '../types';

interface StrategyListResponse {
  total: number;
  strategies: Strategy[];
}

export const fetchStrategies = async (): Promise<Strategy[]> => {
  const data = await request<StrategyListResponse>('/strategy/list?active_only=true');
  return data.strategies;
};
