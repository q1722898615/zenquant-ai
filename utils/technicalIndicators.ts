// 计算简单移动平均线 (SMA)
export const calculateSMA = (data: number[], period: number): number => {
  if (data.length < period) return 0;
  const slice = data.slice(-period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return parseFloat((sum / period).toFixed(2));
};

// 计算指数移动平均线 (EMA)
export const calculateEMA = (data: number[], period: number): number => {
  if (data.length < period) return 0;
  
  const k = 2 / (period + 1);
  let ema = data[0];
  
  // 简单的 EMA 递归计算
  // 实际生产中应使用上一日的 EMA 值，这里为了 MVP 重新跑一遍序列
  for (let i = 1; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
  }
  
  return parseFloat(ema.toFixed(2));
};

// 计算 MACD (12, 26, 9)
export const calculateMACD = (data: number[]): { line: number, signal: number, histogram: number } => {
  if (data.length < 26) return { line: 0, signal: 0, histogram: 0 };

  // 计算 MACD Line (Fast EMA - Slow EMA)
  // 注意：为了得到准确的 Signal Line，我们需要计算出一系列的 MACD Line 值
  const macdValues: number[] = [];
  
  // 我们需要从第26个点开始计算 MACD 值
  // 这种计算在前端做大量循环可能较慢，生产环境应在后端或使用 WebAssembly/TA-Lib
  // 这里做简化处理：计算最近 20 个点的 MACD 序列用于计算 Signal
  
  const lookback = 50; 
  const startIndex = Math.max(0, data.length - lookback);

  // 辅助函数：计算特定截止点的 EMA
  const getEMAAt = (index: number, period: number): number => {
     if (index < period) return data[index];
     // 简化：取切片计算
     const subset = data.slice(0, index + 1);
     return calculateEMA(subset, period);
  };

  for (let i = startIndex; i < data.length; i++) {
    const ema12 = getEMAAt(i, 12);
    const ema26 = getEMAAt(i, 26);
    macdValues.push(ema12 - ema26);
  }

  const macdLine = macdValues[macdValues.length - 1];

  // 计算 Signal Line (MACD Line 的 9日 EMA)
  const signalLine = calculateEMA(macdValues, 9);
  
  const histogram = macdLine - signalLine;

  return {
    line: parseFloat(macdLine.toFixed(4)),
    signal: parseFloat(signalLine.toFixed(4)),
    histogram: parseFloat(histogram.toFixed(4))
  };
};

// 计算相对强弱指标 (RSI)
export const calculateRSI = (data: number[], period: number = 14): number => {
  if (data.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = data.length - period; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  
  return parseFloat(rsi.toFixed(2));
};

export const calculateVolatility = (data: number[], period: number = 14): number => {
    if (data.length < period) return 0;
    const slice = data.slice(-period);
    const mean = slice.reduce((a,b) => a+b, 0) / period;
    const squaredDiffs = slice.map(x => Math.pow(x - mean, 2));
    const variance = squaredDiffs.reduce((a,b) => a+b, 0) / period;
    return parseFloat(Math.sqrt(variance).toFixed(2));
}