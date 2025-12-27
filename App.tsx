
import React, { useState, useEffect } from 'react';
import { PsychologyCheck } from './components/PsychologyCheck';
import { TradeForm } from './components/TradeForm';
import { Dashboard } from './components/Dashboard';
import { AnalysisView } from './components/AnalysisView';
import { ModalDrawer } from './components/ModalDrawer';
import { SlideOver } from './components/SlideOver';
import { AppStep, TradeConfig, AnalysisRecord, TradeSide, Strategy, SymbolData } from './types';
import { fetchAnalysisHistory } from './services/analysisService';
import { fetchStrategies } from './services/strategyService';
import { fetchPopularSymbols } from './services/marketService';

export const App: React.FC = () => {
  // Navigation State
  const [step, setStep] = useState<AppStep>(AppStep.HOME);
  
  // Data State
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [popularSymbols, setPopularSymbols] = useState<SymbolData[]>([]);
  const [tradeConfig, setTradeConfig] = useState<TradeConfig | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<AnalysisRecord | null>(null);
  
  // UI State
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Derived State
  const isDetailViewOpen = step === AppStep.HISTORY_DETAIL || step === AppStep.AI_ANALYSIS;
  const isSetupPhase = step === AppStep.PSYCHOLOGY_CHECK || step === AppStep.TRADE_SETUP;

  // --- Initialization ---
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoadingHistory(true);
      try {
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

  // Theme Sync
  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      if (metaThemeColor) metaThemeColor.setAttribute('content', '#101624');
    } else {
      document.documentElement.classList.remove('dark');
      if (metaThemeColor) metaThemeColor.setAttribute('content', '#FEFEFE');
    }
  }, [isDarkMode]);

  // --- Handlers ---
  
  const handleStartNewTrade = () => {
    setTradeConfig(null);
    setStep(AppStep.PSYCHOLOGY_CHECK);
  };

  const handlePsychCheckComplete = () => {
    setStep(AppStep.TRADE_SETUP);
  };

  const handleTradeConfigSubmit = (config: TradeConfig) => {
    setTradeConfig(config);
    setStep(AppStep.AI_ANALYSIS);
  };

  const handleAnalysisComplete = async (newRecord: AnalysisRecord) => {
    // Refresh history silently
    try {
      const records = await fetchAnalysisHistory(20);
      setHistory(records);
    } catch (e) { console.error(e); }
  };

  const handleViewHistory = (record: AnalysisRecord) => {
    setSelectedRecord(record);
    setStep(AppStep.HISTORY_DETAIL);
  };

  const closeDetailView = () => {
    setStep(AppStep.HOME);
    // Optional: Clear selection after animation, but keeping it ensures no flicker during exit
    setTimeout(() => {
      if (step === AppStep.HOME) {
        setSelectedRecord(null);
        setTradeConfig(null);
      }
    }, 300);
  };

  // Helper for History List filtering
  const filteredHistory = history.filter(r => 
    r.config.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.config.strategy.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRecBadgeColor = (rec: string) => {
    switch(rec) {
      case 'EXECUTE': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'WAIT': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'CANCEL': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <div className="fixed inset-0 font-sans overflow-hidden bg-gray-50 dark:bg-gray-950 select-none">
      
      {/* --- LAYER 1: HOME VIEW --- */}
      <div className="flex flex-col w-full h-full absolute inset-0 z-0">
        
        {/* Header */}
        <div className="flex-none z-10 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
           {/* Mobile Header */}
          <nav className="md:hidden px-4 py-3">
            <div className="flex items-center gap-3">
              <button className="text-gray-600 dark:text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
              
              <div className="flex-1 relative">
                <input 
                  type="text"
                  placeholder="搜索记录..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-full py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-trade-accent/50 transition-shadow"
                />
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>

              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="text-gray-500 dark:text-gray-400 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {isDarkMode ? '🌞' : '🌙'}
              </button>
            </div>
          </nav>

          {/* Desktop Header */}
          <nav className="hidden md:block">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div 
                  className="flex items-center gap-2 cursor-pointer" 
                  onClick={() => setStep(AppStep.HOME)}
                >
                  <div className="w-3 h-3 bg-trade-accent rounded-full animate-pulse"></div>
                  <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">ZenQuant <span className="text-gray-500 font-light">AI</span></span>
                </div>
                <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                  {isDarkMode ? '🌞' : '🌙'}
                </button>
              </div>
            </div>
          </nav>
        </div>

        {/* Content List */}
        <div 
          className="flex-1 overflow-y-auto w-full relative touch-pan-y" 
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <main className="py-6 px-4 sm:px-6 lg:px-8 pb-32 min-h-full">
            <div className="max-w-7xl mx-auto animate-fade-in h-full">
              {isLoadingHistory ? (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-trade-accent mb-4"></div>
                  <p className="text-sm">加载中...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                      <span className="text-3xl">📝</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">暂无分析记录</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mx-auto">
                      点击底部 "+" 按钮，让 AI 辅助你进行第一次专业交易决策。
                    </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredHistory.map(record => (
                    <div 
                      key={record.id} 
                      onClick={() => handleViewHistory(record)}
                      className="bg-white dark:bg-gray-850 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm active:scale-[0.98] transition-transform duration-150 cursor-pointer relative min-h-[160px]"
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
                      </div>
                      <div className="absolute bottom-4 left-5">
                        <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                          {new Date(record.timestamp).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute:'2-digit' }).replace(/\//g, '月').replace(' ', '日 ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>

        {/* Floating Action Button (Only visible on Home) */}
        <div className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 z-40 transition-all duration-300 ${isDetailViewOpen ? 'translate-y-24 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
          <div className="bg-white dark:bg-gray-800 rounded-full px-2 py-2 flex items-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-gray-100 dark:border-gray-700">
            <button className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
              </svg>
            </button>
            <button 
              onClick={handleStartNewTrade}
              className="mx-2 w-32 h-12 bg-gray-900 dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center gap-2 font-bold shadow-lg active:scale-95 transition-transform"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
              </svg>
              <span>新交易</span>
            </button>
            <button className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* --- LAYER 2: SLIDE OVER DETAIL VIEW --- */}
      <SlideOver isOpen={isDetailViewOpen} onClose={closeDetailView}>
        {/* Back Button (Fixed Position relative to Panel) */}
        <div className="absolute top-4 left-4 z-[60]">
           <button 
            onClick={closeDetailView}
            className="p-2.5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-full shadow-lg border border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-200 active:scale-90 transition-transform"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="w-full h-full overflow-y-auto custom-scrollbar pt-16">
          <main className="px-4 sm:px-6 lg:px-8 pb-12">
            {step === AppStep.AI_ANALYSIS && tradeConfig && (
              <Dashboard config={tradeConfig} onComplete={handleAnalysisComplete} />
            )}
            {step === AppStep.HISTORY_DETAIL && selectedRecord && (
              <div className="animate-fade-in-up">
                <AnalysisView 
                  config={selectedRecord.config}
                  marketState={selectedRecord.market}
                  analysis={selectedRecord.analysis}
                />
              </div>
            )}
          </main>
        </div>
      </SlideOver>

      {/* --- LAYER 3: SETUP MODAL --- */}
      <ModalDrawer 
        isOpen={isSetupPhase} 
        onClose={() => setStep(AppStep.HOME)}
        title={step === AppStep.PSYCHOLOGY_CHECK ? "🧠 纪律检查" : "📡 交易参数"}
      >
        {step === AppStep.PSYCHOLOGY_CHECK && (
          <PsychologyCheck onComplete={handlePsychCheckComplete} />
        )}
        {(step === AppStep.TRADE_SETUP || step === AppStep.AI_ANALYSIS) && (
          <TradeForm 
            onNext={handleTradeConfigSubmit} 
            onBack={() => setStep(AppStep.PSYCHOLOGY_CHECK)}
            strategies={strategies}
            popularSymbols={popularSymbols}
          />
        )}
      </ModalDrawer>

    </div>
  );
};
