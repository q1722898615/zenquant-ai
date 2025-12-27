
import { TradeConfig } from '../types';

/**
 * 计算交易配置的所有衍生字段
 * 输入: 基础 TradeConfig
 * 输出: 包含 quantity, margin, notional, marginUsagePercent 等字段的完整 TradeConfig
 */
export const calculateTradeDetails = (config: TradeConfig): TradeConfig => {
  const { 
    entryPrice, 
    stopLoss, 
    accountBalance, 
    riskPercentage, 
    leverage 
  } = config;

  // 基础校验
  if (entryPrice <= 0 || stopLoss <= 0 || entryPrice === stopLoss) {
    return {
      ...config,
      quantity: 0,
      notional: 0,
      margin: 0,
      estimatedRiskAmount: 0,
      estimatedFee: 0,
      marginUsagePercent: 0
    };
  }
  
  // 1. 预计风险金额 (Risk Amount)
  const estimatedRiskAmount = accountBalance * (riskPercentage / 100);
  
  // 2. 开仓数量 (Quantity) - 基于止损距离计算
  const priceDistance = Math.abs(entryPrice - stopLoss);
  const quantity = priceDistance > 0 
    ? estimatedRiskAmount / priceDistance 
    : 0;
  
  // 3. 名义价值 (Notional Value)
  const notional = quantity * entryPrice;
  
  // 4. 所需保证金 (Margin)
  const margin = leverage > 0 
    ? notional / leverage 
    : 0;
  
  // 5. 保证金使用率 (Margin Usage %)
  const marginUsagePercent = accountBalance > 0
    ? (margin / accountBalance) * 100
    : 0;
  
  // 6. 预计手续费 (Estimated Fee) - 默认 maker 0.02% + taker 0.05% = 0.07%
  // 注意：这只是预估，不影响 UI 显示，但会传给后端
  const estimatedFee = notional * 0.0007;
  
  return {
    ...config,
    quantity,
    notional,
    margin,
    estimatedRiskAmount,
    estimatedFee,
    marginUsagePercent
  };
};
