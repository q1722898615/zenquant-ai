export const calculatePositionSize = (
  balance: number,
  riskPercentage: number,
  entry: number,
  stopLoss: number,
  leverage: number = 1
): { quantity: number; notional: number; margin: number } | null => {
  if (entry <= 0 || stopLoss <= 0 || entry === stopLoss) return null;

  const riskAmount = balance * (riskPercentage / 100);
  const priceDistance = Math.abs(entry - stopLoss);
  
  // Position Quantity = Risk Amount / Distance per unit
  const quantity = riskAmount / priceDistance;
  const notional = quantity * entry;
  const margin = notional / leverage;

  return {
    quantity,
    notional,
    margin
  };
};