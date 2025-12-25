
import React, { useState, useEffect, useRef } from 'react';
import { TradeConfig, TradeSide, Strategy, SymbolData } from '../types';
import { calculatePositionSize } from '../utils/calculations';
import { fetchStrategies } from '../services/strategyService';
import { fetchPopularSymbols, searchSymbols } from '../services/marketService';

interface Props {
  onNext: (config: TradeConfig) => void;
  onBack: () => void;
}

export const TradeForm: React.FC<Props> = ({ onNext, onBack }) => {
  // Data State
  const [availableStrategies, setAvailableStrategies] = useState<Strategy[]>([]);
  const [popularSymbols, setPopularSymbols] = useState<SymbolData[]>([]);
  const [displaySymbols, setDisplaySymbols] = useState<SymbolData[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // Dropdown States
  const [isSymbolDropdownOpen, setIsSymbolDropdownOpen] = useState(false);
  const [isStrategyDropdownOpen, setIsStrategyDropdownOpen] = useState(false);
  
  const symbolDropdownRef = useRef<HTMLDivElement>(null);
  const strategyDropdownRef = useRef<HTMLDivElement>(null);

  // Form State
  const [config, setConfig] = useState<TradeConfig>({
    symbol: 'BTC/USDT', // Default to full pair format
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

  const [positionSize, setPositionSize] = useState<{ quantity: number, notional: number, margin: number } | null>(null);

  // Load backend data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [strategies, symbols] = await Promise.all([
          fetchStrategies(),
          fetchPopularSymbols()
        ]);
        setAvailableStrategies(strategies);
        setPopularSymbols(symbols);
        setDisplaySymbols(symbols);
        
        if (strategies.length > 0) {
          handleChange('strategy', strategies[0].name);
        }
      } catch (error) {
        console.error("Failed to load initial data", error);
      } finally {
        setIsLoadingData(false);
      }
    };
    loadData();
  }, []);

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
      // If exact match, don't filter out everything else immediately or just keep it
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

  useEffect(() => {
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

  const isFormValid = config.entryPrice > 0 && config.stopLoss > 0 && config.takeProfit > 0 && config.symbol.length > 0 && config.strategy.length > 0;

  if (isLoadingData) {
    return <div className="p-10 text-center text-gray-500 animate-pulse">正在连接量化引擎...</div>;
  }

  const currentStrategyDesc = availableStrategies.find(s => s.name === config.strategy)?.description;

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
          
          {/* Custom Symbol Search Dropdown */}
          <div ref={symbolDropdownRef} className="relative z-20">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium">交易标的 (Symbol)</label>
            <div className="relative">
              <input
                type="text"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-gray-900 dark:text-white font-bold focus:border-trade-accent focus:ring-2 focus:ring-trade-accent/20 outline-none transition-all uppercase"
                value={config.symbol}
                onChange={handleSymbolInputChange}
                onFocus={() => setIsSymbolDropdownOpen(true)}
                placeholder="BTC/USDT"
              />
              {/* Removed fixed suffix to allow full pair editing */}
            </div>

            {isSymbolDropdownOpen && (
              <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 max-h-60 overflow-y-auto custom-scrollbar animate-fade-in">
                {displaySymbols.length > 0 ? (
                  <ul>
                    {displaySymbols.map((sym) => (
                      <li 
                        key={sym.id}
                        onClick={() => selectSymbol(sym.symbol)} // Use full symbol (e.g. BTC/USDT)
                        className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center transition-colors border-b border-gray-50 dark:border-gray-700/50 last:border-0 group"
                      >
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">
                              {sym.base_currency.substring(0, 1)}
                           </div>
                           <div>
                              <p className="font-bold text-gray-900 dark:text-white text-sm">{sym.base_currency}</p>
                              <p className="text-[10px] text-gray-400 group-hover:text-gray-500">{sym.symbol}</p>
                           </div>
                        </div>
                        <span className="text-xs text-gray-400 font-mono">{sym.quote_currency}</span>
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
          
          {/* Custom Strategy Logic Dropdown (Combobox) */}
          <div ref={strategyDropdownRef} className="relative z-10">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium">策略逻辑</label>
            
            <div 
              onClick={() => setIsStrategyDropdownOpen(!isStrategyDropdownOpen)}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-gray-900 dark:text-white cursor-pointer flex justify-between items-center focus:border-trade-accent hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
            >
               <span className="font-medium text-sm truncate">
                 {config.strategy || "选择策略..."}
               </span>
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 text-gray-400 transition-transform ${isStrategyDropdownOpen ? 'rotate-180' : ''}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
            
            <p className="text-[10px] text-gray-400 mt-1 pl-1 truncate h-4">
              {currentStrategyDesc}
            </p>

            {isStrategyDropdownOpen && (
              <div className="absolute top-12 left-0 w-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 max-h-60 overflow-y-auto custom-scrollbar animate-fade-in">
                <ul>
                  {availableStrategies.map(s => (
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

           <div className="relative z-0">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium">时间级别</label>
             <div className="flex bg-gray-50 dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
               {['5m', '15m', '1h', '4h', '1d'].map(tf => (
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
