
import React, { useState, useEffect, useRef } from 'react';
import { PsychologyCheck } from './components/PsychologyCheck';
import { TradeForm } from './components/TradeForm';
import { Dashboard } from './components/Dashboard';
import { AnalysisView } from './components/AnalysisView';
import { ModalDrawer } from './components/ModalDrawer';
import { AppStep, TradeConfig, AnalysisRecord, TradeSide, Strategy, SymbolData } from './types';
import { fetchAnalysisHistory } from './services/analysisService';
import { fetchStrategies } from './services/strategyService';
import { fetchPopularSymbols } from './services/marketService';

export const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.HOME);
  const [tradeConfig, setTradeConfig] = useState<TradeConfig | null>(null);
  
  // Data States (Lifted Up)
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [popularSymbols, setPopularSymbols] = useState<SymbolData[]>([]);
  
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<AnalysisRecord | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Swipe gesture state
  const touchStartRef = useRef<number | null>(null);
  const touchEndRef = useRef<number | null>(null);

  // Load All Initial Data (History + Form Dependencies)
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoadingHistory(true);
      try {
        // Fetch in parallel for speed
        const [records, stratData, symbolData] = await Promise.all([
          fetchAnalysisHistory(20),
          fetchStrategies(),
          fetchPopularSymbols()
        ]);
        
        setHistory(records);
        setStrategies(stratData);
        setPopularSymbols(symbolData);
      } catch (error) {
        console.error("Failed to load initial data", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    loadInitialData();
  }, []);

  // Apply theme class to body/html AND update iOS status bar color
  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');

    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      // Set status bar to user defined dark BG (#101624)
      if (metaThemeColor) metaThemeColor.setAttribute('content', '#101624');
    } else {
      document.documentElement.classList.remove('dark');
      // Set status bar to user defined light BG (#FEFEFE)
      if (metaThemeColor) metaThemeColor.setAttribute('content', '#FEFEFE');
    }
  }, [isDarkMode]);

  const handleStartNewTrade = () => {
    setStep(AppStep.PSYCHOLOGY_CHECK);
    setTradeConfig(null);
  };

  const handlePsychCheckComplete = () => {
    setStep(AppStep.TRADE_SETUP);
  };

  const handleTradeConfigSubmit = (config: TradeConfig) => {
    setTradeConfig(config);
    setStep(AppStep.AI_ANALYSIS); // Transition to full screen analysis
  };

  const handleAnalysisComplete = async () => {
    // Transition to Home immediately
    setStep(AppStep.HOME);
    setTradeConfig(null);

    // REFETCH Source of Truth from Backend
    setIsLoadingHistory(true);
    try {
      const records = await fetchAnalysisHistory(20);
      setHistory(records);
    } catch (error) {
      console.error("Failed to refresh history", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleViewHistory = (record: AnalysisRecord) => {
    setSelectedRecord(record);
    setStep(AppStep.HISTORY_DETAIL);
  };

  // Close drawer logic
  const handleCloseDrawer = () => {
    setStep(AppStep.HOME);
  };

  // Swipe Handlers
  const onTouchStart = (e: React.TouchEvent) => {
    touchEndRef.current = null;
    touchStartRef.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndRef.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartRef.current || !touchEndRef.current) return;
    
    const distance = touchEndRef.current - touchStartRef.current;
    const isLeftEdge = touchStartRef.current < 50; // Started from left edge (within 50px)
    const isSwipeRight = distance > 70; // Swiped right enough

    if (isLeftEdge && isSwipeRight) {
      if (step === AppStep.HISTORY_DETAIL) {
        setStep(AppStep.HOME);
      }
    }
  };

  const getRecBadgeColor = (rec: string) => {
    switch(rec) {
      case 'EXECUTE': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'WAIT': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'CANCEL': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const filteredHistory = history.filter(r => 
    r.config.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.config.strategy.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper to determine if we are in the "setup" phase (Drawer mode)
  const isSetupPhase = step === AppStep.PSYCHOLOGY_CHECK || step === AppStep.TRADE_SETUP;
  // Helper to determine if we should hide mobile nav (Dashboard/Analysis views)
  const isAnalysisView = step === AppStep.AI_ANALYSIS || step === AppStep.HISTORY_DETAIL;

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-950 text-gray-200' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* Mobile Header - Hidden on Analysis/Dashboard pages */}
      {!isAnalysisView && (
        <nav className="md:hidden sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 py-3">
          <div className="flex items-center gap-3">
            <button className="text-gray-600 dark:text-gray-300">
               {/* Hamburger Icon */}
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            
            <div className="flex-1 relative">
              <input 
                type="text"
                placeholder="搜索分析记录..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-full py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-trade-accent/50"
              />
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>

            <button 
               onClick={() => setIsDarkMode(!isDarkMode)}
               className="text-gray-500 dark:text-gray-400"
            >
               {isDarkMode ? '🌞' : '🌙'}
            </button>
          </div>
        </nav>
      )}

      {/* Desktop Header */}
      <nav className="hidden md:block border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div 
              className="flex items-center gap-2 cursor-pointer" 
              onClick={() => setStep(AppStep.HOME)}
            >
              <div className="w-3 h-3 bg-trade-accent rounded-full animate-pulse"></div>
              <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">ZenQuant <span className="text-gray-500 font-light">AI</span></span>
            </div>

             {/* Desktop Search */}
             <div className="flex-1 max-w-md mx-8 relative">
                <input 
                  type="text"
                  placeholder="搜索分析 / 策略..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg py-1.5 pl-9 pr-4 text-sm outline-none border border-transparent focus:border-trade-accent"
                />
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
             </div>

            <div className="flex items-center gap-4">
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                 {isDarkMode ? '🌞' : '🌙'}
              </button>
              <div className="text-xs text-gray-500 font-mono">
                {step === AppStep.HOME && "控制面板"}
                {isSetupPhase && "新交易设置"}
                {step === AppStep.AI_ANALYSIS && "阶段 3: 策略验证"}
                {step === AppStep.HISTORY_DETAIL && "交易复盘"}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="py-6 px-4 sm:px-6 lg:px-8 pb-32">
        
        {/* Render Home Content if we are in Home OR in Setup Phase (Background) */}
        {(step === AppStep.HOME || isSetupPhase) && (
          <div className="max-w-7xl mx-auto animate-fade-in">
            {isLoadingHistory ? (
              <div className="flex flex-col items-center justify-center min-h-[300px] text-gray-400">
                 <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-trade-accent mb-4"></div>
                 <p className="text-sm">正在加载历史记录...</p>
              </div>
            ) : history.length === 0 ? (
               <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
                  <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <span className="text-3xl">📝</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">欢迎来到 ZenQuant</h2>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md">
                    你的 AI 量化灵感之旅。点击下方的 "+" 按钮开始你的第一次专业风控交易分析。
                  </p>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredHistory.map(record => (
                  <div 
                    key={record.id} 
                    onClick={() => handleViewHistory(record)}
                    className="bg-white dark:bg-gray-850 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm hover:shadow-md cursor-pointer transition-all duration-300 relative min-h-[160px]"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{record.config.symbol}</h3>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${record.config.side === TradeSide.LONG ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                            {record.config.side}
                          </span>
                      </div>
                      <div className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getRecBadgeColor(record.analysis.recommendation)}`}>
                        {record.analysis.recommendation}
                      </div>
                    </div>

                    <div className="space-y-1 mb-8">
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                        {record.analysis.reasoning.substring(0, 60)}...
                      </p>
                      <div className="flex items-center gap-3 mt-3">
                         <div className="bg-gray-50 dark:bg-gray-900/50 px-2 py-1 rounded text-xs text-gray-600 dark:text-gray-300">
                            Entry: <span className="font-mono">${record.config.entryPrice}</span>
                         </div>
                         <div className="bg-gray-50 dark:bg-gray-900/50 px-2 py-1 rounded text-xs text-gray-600 dark:text-gray-300">
                            Lev: {record.config.leverage}x
                         </div>
                      </div>
                    </div>

                    {/* Timestamp at Bottom Left */}
                    <div className="absolute bottom-4 left-5 flex items-center gap-1.5">
                       <div className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <span className="text-[8px]">🤖</span>
                       </div>
                       <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                        {new Date(record.timestamp).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute:'2-digit' }).replace(/\//g, '月').replace(' ', '日 ')}
                       </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal Drawer for Setup Steps */}
        <ModalDrawer 
          isOpen={isSetupPhase} 
          onClose={handleCloseDrawer}
          title={step === AppStep.PSYCHOLOGY_CHECK ? "🧠 纪律检查" : "📡 交易参数"}
        >
          {step === AppStep.PSYCHOLOGY_CHECK && (
            <PsychologyCheck onComplete={handlePsychCheckComplete} />
          )}

          {/* FIX: Include AI_ANALYSIS step here so TradeForm stays rendered while drawer animates out */}
          {(step === AppStep.TRADE_SETUP || step === AppStep.AI_ANALYSIS) && (
            <TradeForm 
              onNext={handleTradeConfigSubmit} 
              onBack={() => setStep(AppStep.PSYCHOLOGY_CHECK)}
              strategies={strategies}
              popularSymbols={popularSymbols}
            />
          )}
        </ModalDrawer>

        {/* Full Page Views for Analysis & History */}
        {step === AppStep.AI_ANALYSIS && tradeConfig && (
          <Dashboard config={tradeConfig} onComplete={handleAnalysisComplete} />
        )}

        {step === AppStep.HISTORY_DETAIL && selectedRecord && (
          <div 
            className="animate-fade-in min-h-screen"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
             {/* Fixed Floating Back Button */}
             <button 
                onClick={() => setStep(AppStep.HOME)}
                className="fixed top-6 left-4 z-50 p-2.5 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md rounded-full shadow-lg border border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:scale-105 active:scale-95 transition-all"
             >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
             </button>

             <div className="pt-12">
               <AnalysisView 
                 config={selectedRecord.config}
                 marketState={selectedRecord.market}
                 analysis={selectedRecord.analysis}
               />
             </div>
          </div>
        )}
      </main>

      {/* Floating Action Bar (Bottom Capsule) - Only Show in Home or Setup Phase */}
      {(step === AppStep.HOME || isSetupPhase) && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40">
          <div className="bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full px-2 py-2 flex items-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-gray-100 dark:border-gray-700">
            
            {/* More Button */}
            <button className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>

            {/* Main Action Button (New Trade) */}
            <button 
              onClick={handleStartNewTrade}
              className="mx-2 w-28 h-12 bg-gray-900 dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center gap-2 font-bold shadow-lg hover:scale-105 transition-transform"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
              </svg>
              <span>新交易</span>
            </button>

            {/* Text Button */}
            <button className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </button>

          </div>
        </div>
      )}
    </div>
  );
};
