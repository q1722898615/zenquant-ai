
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TradeConfig, TradeSide, Strategy, SymbolData } from '../types';
import { calculateTradeDetails } from '../utils/calculations';
import { searchSymbols } from '../services/marketService';

interface Props {
  onNext: (config: TradeConfig) => void;
  onBack: () => void;
  strategies: Strategy[]; // Received from parent
  popularSymbols: SymbolData[]; // Received from parent
}

export const TradeForm: React.FC<Props> = ({ onNext, onBack, strategies, popularSymbols }) => {
  // UI States
  const [displaySymbols, setDisplaySymbols] = useState<SymbolData[]>([]);
  
  // Dropdown States
  const [isSymbolDropdownOpen, setIsSymbolDropdownOpen] = useState(false);
  const [isStrategyDropdownOpen, setIsStrategyDropdownOpen] = useState(false);
  
  const symbolDropdownRef = useRef<HTMLDivElement>(null);
  const strategyDropdownRef = useRef<HTMLDivElement>(null);

  // Form State (User Inputs)
  const [config, setConfig] = useState<TradeConfig>({
    symbol: 'BTC/USDT', 
    side: TradeSide.LONG,
    timeframe: '15m',
    entryPrice: 0,
    stopLoss: 0,
    takeProfit: 0,
    accountBalance: 10000,
    riskPercentage: 1,
    leverage: 1,
    strategy: ''
  });

  // Derived State (Calculated fields)
  // Calculate details on every render (or useMemo) to ensure UI is always in sync with inputs
  const fullConfig = useMemo(() => calculateTradeDetails(config), [config]);

  // Initialize display symbols & default strategy
  useEffect(() => {
    // Set initial display symbols
    if (popularSymbols.length > 0) {
      setDisplaySymbols(popularSymbols);
    }
    
    // Set default strategy if none selected and strategies exist
    if (!config.strategy && strategies.length > 0) {
      handleChange('strategy', strategies[0].name);
    }
  }, [strategies, popularSymbols]);

  // Handle Click Outside for both dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (symbolDropdownRef.current && !symbolDropdownRef.current.contains(event.target as Node)) {
        setIsSymbolDropdownOpen(false);
      }
      if (strategyDropdownRef.current && !strategyDropdownRef.current.contains(event.target as Node)) {
        setIsStrategyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Symbol Search Logic
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!config.symbol) {
        setDisplaySymbols(popularSymbols);
        return;
      }
      const exactMatch = popularSymbols.find(s => s.symbol === config.symbol);
      if (exactMatch) return;

      const localMatches = popularSymbols.filter(s => 
        s.symbol.toLowerCase().includes(config.symbol.toLowerCase()) || 
        s.base_currency.toLowerCase().includes(config.symbol.toLowerCase())
      );

      if (localMatches.length > 0) {
        setDisplaySymbols(localMatches);
      } else {
        const apiResults = await searchSymbols(config.symbol);
        setDisplaySymbols(apiResults.length > 0 ? apiResults : []);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [config.symbol, popularSymbols]);

  const handleChange = (field: keyof TradeConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSymbolInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    handleChange('symbol', val);
    setIsSymbolDropdownOpen(true);
  };

  const selectSymbol = (symbolStr: string) => {
    handleChange('symbol', symbolStr);
    setIsSymbolDropdownOpen(false);
  };

  const selectStrategy = (strategyName: string) => {
    handleChange('strategy', strategyName);
    setIsStrategyDropdownOpen(false);
  };

  // Validation Logic
  const marginUsage = fullConfig.marginUsagePercent || 0;
  const isMarginSafe = marginUsage <= 100;
  const isMarginWarning = marginUsage > 30 && marginUsage <= 100;
  
  const isFormValid = 
    config.entryPrice > 0 && 
    config.stopLoss > 0 && 
    config.takeProfit > 0 && 
    config.symbol.length > 0 && 
    config.strategy.length > 0 &&
    isMarginSafe; // Block if margin usage > 100%

  const currentStrategyDesc = strategies.find(s => s.name === config.strategy)?.description;

  // Define unified styles
  const LABEL_STYLE = "block text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium tracking-wide";
  const INPUT_BASE_STYLE = "w-full h-12 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-gray-900 dark:text-white font-bold outline-none transition-all flex items-center";
  const INPUT_FOCUS_STYLE = "focus:border-trade-accent focus:ring-2 focus:ring-trade-accent/10";
  const DROPDOWN_MENU_STYLE = "absolute top-[calc(100%+8px)] left-0 w-full bg-white dark:bg-gray-800 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-none border border-gray-100 dark:border-gray-700 max-h-60 overflow-y-auto custom-scrollbar animate-fade-in z-50";

  return (
    <div className="animate-fade-in-up pb-8">
      {/* Direction Toggle */}
      <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-8">
        <button 
          onClick={() => handleChange('side', TradeSide.LONG)}
          className={`flex-1 h-10 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${config.side === TradeSide.LONG ? 'bg-white dark:bg-gray-700 text-trade-long shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          <span>🚀</span> 做多 (LONG)
        </button>
        <button 
          onClick={() => handleChange('side', TradeSide.SHORT)}
          className={`flex-1 h-10 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${config.side === TradeSide.SHORT ? 'bg-white dark:bg-gray-700 text-trade-short shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          <span>📉</span> 做空 (SHORT)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
        {/* Left Column: Asset & Strategy */}
        <div className="space-y-6">
          
          {/* Symbol Input */}
          <div ref={symbolDropdownRef} className="relative z-30">
            <label className={LABEL_STYLE}>交易标的 (Symbol)</label>
            <div className="relative">
              <input
                type="text"
                className={`${INPUT_BASE_STYLE} ${INPUT_FOCUS_STYLE} uppercase`}
                value={config.symbol}
                onChange={handleSymbolInputChange}
                onFocus={() => setIsSymbolDropdownOpen(true)}
                placeholder="BTC/USDT"
              />
            </div>

            {isSymbolDropdownOpen && (
              <div className={DROPDOWN_MENU_STYLE}>
                {displaySymbols.length > 0 ? (
                  <ul>
                    {displaySymbols.map((sym) => (
                      <li 
                        key={sym.id}
                        onClick={() => selectSymbol(sym.symbol)}
                        className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center transition-colors border-b border-gray-50 dark:border-gray-700/50 last:border-0 group"
                      >
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold border border-blue-100 dark:border-blue-900/50">
                              {sym.base_currency.substring(0, 1)}
                           </div>
                           <div>
                              <p className="font-bold text-gray-900 dark:text-white text-sm">{sym.base_currency}</p>
                           </div>
                        </div>
                        <span className="text-xs text-gray-400 font-mono">{sym.symbol}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 text-center text-gray-400 text-sm">
                    未找到相关币种
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Strategy Dropdown */}
          <div ref={strategyDropdownRef} className="relative z-20">
            <label className={LABEL_STYLE}>策略逻辑</label>
            <div 
              onClick={() => setIsStrategyDropdownOpen(!isStrategyDropdownOpen)}
              className={`${INPUT_BASE_STYLE} cursor-pointer justify-between hover:border-gray-300 dark:hover:border-gray-600`}
            >
               <span className={`text-sm truncate ${!config.strategy ? 'text-gray-400 font-normal' : ''}`}>
                 {config.strategy || "选择策略..."}
               </span>
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isStrategyDropdownOpen ? 'rotate-180' : ''}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
            
            <p className="text-[10px] text-gray-400 mt-1.5 pl-1 truncate h-4">
              {currentStrategyDesc}
            </p>

            {isStrategyDropdownOpen && (
              <div className={DROPDOWN_MENU_STYLE}>
                <ul>
                  {strategies.map(s => (
                    <li 
                      key={s.id}
                      onClick={() => selectStrategy(s.name)}
                      className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-50 dark:border-gray-700/50 last:border-0 group ${config.strategy === s.name ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                    >
                        <div className="flex justify-between items-start">
                           <p className={`font-bold text-sm mb-0.5 ${config.strategy === s.name ? 'text-trade-accent' : 'text-gray-900 dark:text-white'}`}>
                             {s.name}
                           </p>
                           {config.strategy === s.name && <span className="text-trade-accent text-xs">✓</span>}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug">{s.description}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

           <div className="relative z-10">
            <label className={LABEL_STYLE}>时间级别</label>
             <div className="flex bg-gray-50 dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-700 h-12 items-center">
               {['5m', '15m', '1h', '4h', '1d'].map(tf => (
                 <button
                   key={tf}
                   onClick={() => handleChange('timeframe', tf)}
                   className={`flex-1 h-9 rounded-lg text-xs font-bold transition-all ${config.timeframe === tf ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm border border-gray-100 dark:border-gray-600' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                 >
                   {tf}
                 </button>
               ))}
             </div>
          </div>
        </div>

        {/* Right Column: Price Levels */}
        <div className="space-y-6">
          <div>
             <label className={LABEL_STYLE}>入场价格 ($)</label>
             <input 
               type="number" 
               className={`${INPUT_BASE_STYLE} ${INPUT_FOCUS_STYLE} font-mono`}
               value={config.entryPrice || ''}
               onChange={(e) => handleChange('entryPrice', parseFloat(e.target.value))}
               placeholder="0.00"
             />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
               <label className={LABEL_STYLE}>止损价格 ($)</label>
               <input 
                 type="number" 
                 className={`${INPUT_BASE_STYLE} font-mono ${
                   config.side === TradeSide.LONG && config.stopLoss >= config.entryPrice && config.entryPrice > 0 ? 'border-red-500 ring-1 ring-red-500/20 bg-red-50/50 dark:bg-red-900/10' : 
                   config.side === TradeSide.SHORT && config.stopLoss <= config.entryPrice && config.entryPrice > 0 ? 'border-red-500 ring-1 ring-red-500/20 bg-red-50/50 dark:bg-red-900/10' : INPUT_FOCUS_STYLE
                 }`}
                 value={config.stopLoss || ''}
                 onChange={(e) => handleChange('stopLoss', parseFloat(e.target.value))}
                 placeholder="Risk Level"
               />
            </div>
             <div className="flex-1">
               <label className={LABEL_STYLE}>止盈价格 ($)</label>
               <input 
                 type="number" 
                 className={`${INPUT_BASE_STYLE} ${INPUT_FOCUS_STYLE} font-mono`}
                 value={config.takeProfit || ''}
                 onChange={(e) => handleChange('takeProfit', parseFloat(e.target.value))}
                 placeholder="Target"
               />
            </div>
          </div>
        </div>
      </div>

      {/* Risk Management Section */}
      <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800">
        <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-6 uppercase tracking-wider flex items-center gap-2">
          <span>🛡️</span> 风险管理 & 仓位
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className={LABEL_STYLE}>账户总资金 ($)</label>
            <input 
              type="number" 
              className={`${INPUT_BASE_STYLE} ${INPUT_FOCUS_STYLE} font-mono`}
              value={config.accountBalance}
              onChange={(e) => handleChange('accountBalance', parseFloat(e.target.value))}
            />
          </div>
          
          <div>
            <label className={LABEL_STYLE}>单笔风险 (%)</label>
            <input 
              type="number" 
              step="0.1"
              max="10"
              className={`${INPUT_BASE_STYLE} ${INPUT_FOCUS_STYLE} font-mono`}
              value={config.riskPercentage}
              onChange={(e) => handleChange('riskPercentage', parseFloat(e.target.value))}
            />
          </div>

          <div>
             <label className={LABEL_STYLE}>杠杆倍数 (x)</label>
            <input 
              type="number" 
              step="1"
              max="125"
              className={`${INPUT_BASE_STYLE} ${INPUT_FOCUS_STYLE} font-mono`}
              value={config.leverage}
              onChange={(e) => handleChange('leverage', parseFloat(e.target.value))}
            />
          </div>
        </div>

        {/* Dynamic Position Calculator Display */}
        <div className="mt-8 bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-y-4 gap-x-8">
            <div className="text-left">
               <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">预计亏损 (Risk)</p>
               <p className="text-xl font-mono text-red-500 dark:text-red-400 font-bold tracking-tight">
                 ${fullConfig.estimatedRiskAmount?.toFixed(2) ?? '---'}
               </p>
            </div>
            <div className="text-left">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">开仓数量 (Coins)</p>
              <p className="text-xl font-mono text-blue-600 dark:text-blue-400 font-bold tracking-tight">
                {fullConfig.quantity?.toFixed(4) ?? '---'}
              </p>
            </div>
            <div className="text-left">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">名义价值 (Value)</p>
              <p className="text-xl font-mono text-gray-700 dark:text-gray-300 tracking-tight">
                 ${fullConfig.notional?.toFixed(0) ?? '---'}
              </p>
            </div>
            <div className="text-left relative">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">保证金 (Margin)</p>
              <p className="text-xl font-mono text-yellow-600 dark:text-yellow-400 font-bold tracking-tight">
                 ${fullConfig.margin?.toFixed(2) ?? '---'}
              </p>
            </div>
        </div>

        {/* Margin Usage Warning/Error Panel */}
        {(marginUsage > 0) && (
          <div className={`mt-4 rounded-lg p-3 flex items-start gap-3 text-sm transition-all ${
            !isMarginSafe 
              ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' 
              : isMarginWarning 
                ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                : 'opacity-0 h-0 p-0 m-0 overflow-hidden' // Hide if safe
          }`}>
             <div className="flex-shrink-0 mt-0.5 text-lg">
               {!isMarginSafe ? '🛑' : '⚠️'}
             </div>
             <div>
               <p className={`font-bold ${!isMarginSafe ? 'text-red-700 dark:text-red-400' : 'text-yellow-700 dark:text-yellow-400'}`}>
                 {!isMarginSafe ? '拒绝赌博式交易：止损过窄 / 仓位过大' : `保证金高占用警告: ${marginUsage.toFixed(1)}%`}
               </p>
               <div className={`text-xs mt-1 leading-relaxed ${!isMarginSafe ? 'text-red-600 dark:text-red-300' : 'text-yellow-600 dark:text-yellow-300'}`}>
                 {!isMarginSafe ? (
                   <>
                     <p className="mb-1">
                       当前<strong>止损距离太近</strong>，导致系统为了满足您的风险金额配置，计算出了超过本金的超大仓位。
                     </p>
                     <ul className="list-disc list-inside opacity-90 mt-1 space-y-0.5">
                       <li>后果：极易被市场微小波动扫损（送钱行为）。</li>
                       <li>建议：<strong>拉大止损距离</strong> 或 降低风险百分比。</li>
                     </ul>
                   </>
                 ) : (
                   "当前持仓占用超过 30% 本金。重仓是亏损的源头，建议保留更多资金以应对极端行情。"
                 )}
               </div>
             </div>
          </div>
        )}
      </div>

      <div className="mt-8">
        <button 
          onClick={() => onNext(fullConfig)}
          disabled={!isFormValid}
          className={`w-full h-14 rounded-2xl font-bold text-lg tracking-wide transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 ${isFormValid ? 'bg-trade-accent text-white hover:bg-blue-600' : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'}`}
        >
          {!isMarginSafe ? "止损过窄 · 风险过高" : "开始 AI 智能分析"}
        </button>
      </div>
    </div>
  );
};
