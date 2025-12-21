import React, { useState, useEffect } from 'react';
import { TradeConfig, TradeSide, StrategyType } from '../types';
import { calculatePositionSize } from '../utils/calculations';

interface Props {
  onNext: (config: TradeConfig) => void;
  onBack: () => void;
}

export const TradeForm: React.FC<Props> = ({ onNext, onBack }) => {
  const [config, setConfig] = useState<TradeConfig>({
    symbol: 'BTC',
    side: TradeSide.LONG,
    timeframe: '15m',
    entryPrice: 0,
    stopLoss: 0,
    takeProfit: 0,
    accountBalance: 10000,
    riskPercentage: 1,
    leverage: 1,
    strategy: StrategyType.TREND_FOLLOWING
  });

  const [positionSize, setPositionSize] = useState<{ quantity: number, notional: number, margin: number } | null>(null);

  useEffect(() => {
    // Auto-calculate position size based on risk
    const size = calculatePositionSize(
      config.accountBalance,
      config.riskPercentage,
      config.entryPrice,
      config.stopLoss,
      config.leverage
    );
    setPositionSize(size);
  }, [config.accountBalance, config.riskPercentage, config.entryPrice, config.stopLoss, config.leverage]);

  const handleChange = (field: keyof TradeConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = config.entryPrice > 0 && config.stopLoss > 0 && config.takeProfit > 0;

  return (
    <div className="animate-fade-in-up">
      {/* Direction Toggle */}
      <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-6">
        <button 
          onClick={() => handleChange('side', TradeSide.LONG)}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${config.side === TradeSide.LONG ? 'bg-white dark:bg-gray-700 text-trade-long shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          做多 (LONG)
        </button>
        <button 
          onClick={() => handleChange('side', TradeSide.SHORT)}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${config.side === TradeSide.SHORT ? 'bg-white dark:bg-gray-700 text-trade-short shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          做空 (SHORT)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Asset & Strategy */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium">交易标的</label>
            <select 
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-gray-900 dark:text-white focus:border-trade-accent outline-none transition-colors"
              value={config.symbol}
              onChange={(e) => handleChange('symbol', e.target.value)}
            >
              <option value="BTC">BTC / USDT</option>
              <option value="ETH">ETH / USDT</option>
              <option value="SOL">SOL / USDT</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium">策略逻辑</label>
            <select 
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-gray-900 dark:text-white focus:border-trade-accent outline-none transition-colors"
              value={config.strategy}
              onChange={(e) => handleChange('strategy', e.target.value)}
            >
              {Object.values(StrategyType).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

           <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium">时间级别</label>
             <div className="flex bg-gray-50 dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
               {['5m', '15m', '1h', '4h', 'D'].map(tf => (
                 <button
                   key={tf}
                   onClick={() => handleChange('timeframe', tf)}
                   className={`flex-1 text-xs py-1.5 rounded-md transition-all ${config.timeframe === tf ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm font-bold' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                 >
                   {tf}
                 </button>
               ))}
             </div>
          </div>
        </div>

        {/* Right Column: Price Levels */}
        <div className="space-y-4">
          <div>
             <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium">入场价格 ($)</label>
             <input 
               type="number" 
               className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-gray-900 dark:text-white font-mono focus:border-trade-accent outline-none"
               value={config.entryPrice || ''}
               onChange={(e) => handleChange('entryPrice', parseFloat(e.target.value))}
               placeholder="0.00"
             />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
               <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium">止损价格 ($)</label>
               <input 
                 type="number" 
                 className={`w-full bg-gray-50 dark:bg-gray-800 border rounded-lg p-2.5 text-gray-900 dark:text-white font-mono outline-none ${
                   config.side === TradeSide.LONG && config.stopLoss >= config.entryPrice && config.entryPrice > 0 ? 'border-red-500 ring-1 ring-red-500' : 
                   config.side === TradeSide.SHORT && config.stopLoss <= config.entryPrice && config.entryPrice > 0 ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 dark:border-gray-700 focus:border-trade-accent'
                 }`}
                 value={config.stopLoss || ''}
                 onChange={(e) => handleChange('stopLoss', parseFloat(e.target.value))}
                 placeholder="Risk Level"
               />
            </div>
             <div className="flex-1">
               <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium">止盈价格 ($)</label>
               <input 
                 type="number" 
                 className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-gray-900 dark:text-white font-mono focus:border-trade-accent outline-none"
                 value={config.takeProfit || ''}
                 onChange={(e) => handleChange('takeProfit', parseFloat(e.target.value))}
                 placeholder="Target"
               />
            </div>
          </div>
        </div>
      </div>

      {/* Risk Management Section */}
      <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
        <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-4 uppercase tracking-wider flex items-center gap-2">
          <span>🛡️</span> 风险管理 & 仓位
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium">账户总资金 ($)</label>
            <input 
              type="number" 
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-gray-900 dark:text-white font-mono focus:border-trade-accent outline-none"
              value={config.accountBalance}
              onChange={(e) => handleChange('accountBalance', parseFloat(e.target.value))}
            />
          </div>
          
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium">单笔风险 (%)</label>
            <input 
              type="number" 
              step="0.1"
              max="10"
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-gray-900 dark:text-white font-mono focus:border-trade-accent outline-none"
              value={config.riskPercentage}
              onChange={(e) => handleChange('riskPercentage', parseFloat(e.target.value))}
            />
          </div>

          <div>
             <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium">杠杆倍数 (x)</label>
            <input 
              type="number" 
              step="1"
              max="125"
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-gray-900 dark:text-white font-mono focus:border-trade-accent outline-none"
              value={config.leverage}
              onChange={(e) => handleChange('leverage', parseFloat(e.target.value))}
            />
          </div>
        </div>

        {/* Dynamic Position Calculator Display */}
        <div className="mt-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-4">
            <div className="text-left">
               <p className="text-[10px] text-gray-500 uppercase">预计亏损 (Risk)</p>
               <p className="text-lg font-mono text-red-500 dark:text-red-400 font-bold">
                 ${((config.accountBalance * config.riskPercentage) / 100).toFixed(2)}
               </p>
            </div>
            <div className="text-left">
              <p className="text-[10px] text-gray-500 uppercase">开仓数量 (Coins)</p>
              <p className="text-lg font-mono text-blue-600 dark:text-blue-400 font-bold">
                {positionSize ? positionSize.quantity.toFixed(4) : '---'}
              </p>
            </div>
            <div className="text-left">
              <p className="text-[10px] text-gray-500 uppercase">名义价值 (Value)</p>
              <p className="text-lg font-mono text-gray-700 dark:text-gray-300">
                 ${positionSize ? positionSize.notional.toFixed(0) : '---'}
              </p>
            </div>
            <div className="text-left">
              <p className="text-[10px] text-gray-500 uppercase">保证金 (Margin)</p>
              <p className="text-lg font-mono text-yellow-600 dark:text-yellow-400 font-bold">
                 ${positionSize ? positionSize.margin.toFixed(2) : '---'}
              </p>
            </div>
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        {/* Only show Back button if logic dictates (handled by parent mostly) but kept here for fallback */}
        {/* <button 
          onClick={onBack}
          className="px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          返回
        </button> */}
        <button 
          onClick={() => onNext(config)}
          disabled={!isFormValid}
          className={`w-full py-4 rounded-xl font-bold tracking-wide transition shadow-lg ${isFormValid ? 'bg-trade-accent text-white hover:bg-blue-600' : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'}`}
        >
          开始 AI 智能分析
        </button>
      </div>
    </div>
  );
};