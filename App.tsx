
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
  
  // Data States
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [popularSymbols, setPopularSymbols] = useState<SymbolData[]>([]);
  
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<AnalysisRecord | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // --- Gesture & Animation Refs (Performance Optimization) ---
  // We use refs instead of state for gestures to avoid re-renders during 60fps animations
  const detailViewRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const currentSwipeX = useRef(0);
  const isDragging = useRef(false);
  const touchStartTime = useRef<number>(0);

  // Still need state for the "closing" phase to manage component lifecycle
  const [isClosing, setIsClosing] = useState(false);

  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 375;
  const isDetailViewOpen = step === AppStep.HISTORY_DETAIL || step === AppStep.AI_ANALYSIS;

  // Load All Initial Data
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

  // Theme & Status Bar
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

  // --- Navigation Handlers ---
  const handleStartNewTrade = () => {
    setStep(AppStep.PSYCHOLOGY_CHECK);
    setTradeConfig(null);
  };

  const handlePsychCheckComplete = () => {
    setStep(AppStep.TRADE_SETUP);
  };

  const handleTradeConfigSubmit = (config: TradeConfig) => {
    setTradeConfig(config);
    setStep(AppStep.AI_ANALYSIS); 
    resetGestureState();
  };

  const handleAnalysisComplete = async (newRecord: AnalysisRecord) => {
    try {
      const records = await fetchAnalysisHistory(20);
      setHistory(records);
    } catch (error) {
      console.error("Failed to refresh history", error);
    }
  };

  const handleViewHistory = (record: AnalysisRecord) => {
    setSelectedRecord(record);
    setStep(AppStep.HISTORY_DETAIL);
    resetGestureState();
  };

  const handleCloseDrawer = () => {
    setStep(AppStep.HOME);
  };

  const resetGestureState = () => {
    setIsClosing(false);
    currentSwipeX.current = 0;
    isDragging.current = false;
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // --- Gesture Logic (Direct DOM Manipulation) ---

  const onTouchStart = (e: React.TouchEvent) => {
    // Only enable swipe if we are in a detail view and not currently animating out
    if (!isDetailViewOpen || isClosing) return;

    const clientX = e.touches[0].clientX;
    const clientY = e.touches[0].clientY;

    // Edge swipe detection: Only start if within 70px of left edge
    if (clientX < 70) {
      touchStartX.current = clientX;
      touchStartY.current = clientY;
      touchStartTime.current = Date.now();
      isDragging.current = true;
      
      // Disable transitions for instant follow
      if (detailViewRef.current) {
        detailViewRef.current.style.transition = 'none';
      }
      if (backdropRef.current) {
        backdropRef.current.style.transition = 'none';
      }
    } else {
      touchStartX.current = null;
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || touchStartX.current === null || !detailViewRef.current) return;
    
    const clientX = e.touches[0].clientX;
    const clientY = e.touches[0].clientY;
    const deltaX = clientX - touchStartX.current;
    
    // Scroll Conflict Resolution:
    // If vertical movement is greater than horizontal on the first significant move,
    // assume user wants to scroll the content, not swipe the page.
    if (touchStartY.current !== null) {
      const deltaY = Math.abs(clientY - touchStartY.current);
      // Threshold of 5px to determine intent
      if (deltaY > 5 && deltaY > Math.abs(deltaX)) {
        isDragging.current = false;
        touchStartX.current = null;
        touchStartY.current = null;
        // Restore transition just in case
        detailViewRef.current.style.transition = 'transform 0.3s ease-out';
        return;
      }
    }

    // Prevent dragging to the left (negative values)
    if (deltaX > 0) {
      currentSwipeX.current = deltaX;
      
      // Direct DOM update (No React Render)
      detailViewRef.current.style.transform = `translateX(${deltaX}px)`;
      
      // Update backdrop opacity directly
      if (backdropRef.current) {
        // Map 0 -> ScreenWidth to 0.3 -> 0 opacity
        const opacity = Math.max(0, 0.3 * (1 - deltaX / screenWidth));
        backdropRef.current.style.opacity = opacity.toString();
      }
    }
  };

  const onTouchEnd = () => {
    if (!isDragging.current || !detailViewRef.current) return;

    isDragging.current = false;
    touchStartX.current = null;
    touchStartY.current = null;

    // Calculate velocity
    const touchEndTime = Date.now();
    const timeDiff = touchEndTime - touchStartTime.current;
    const velocity = currentSwipeX.current / Math.max(timeDiff, 1); // px/ms

    // Restore smooth transitions for the snap/close animation
    detailViewRef.current.style.transition = 'transform 0.2s cubic-bezier(0.15, 0.85, 0.15, 1)';
    if (backdropRef.current) {
      backdropRef.current.style.transition = 'opacity 0.2s ease';
    }

    // Logic: Close if dragged > 40% OR Fast Flick
    const isDistanceMet = currentSwipeX.current > screenWidth * 0.4;
    const isFlick = velocity > 0.5 && currentSwipeX.current > 50;

    if (isDistanceMet || isFlick) {
      // Animate Out
      setIsClosing(true);
      detailViewRef.current.style.transform = `translateX(100%)`;
      if (backdropRef.current) backdropRef.current.style.opacity = '0';
      
      // Wait for animation to finish, then unmount
      setTimeout(() => {
        setStep(AppStep.HOME);
        setIsClosing(false);
        currentSwipeX.current = 0;
      }, 200);
    } else {
      // Snap Back
      detailViewRef.current.style.transform = `translateX(0px)`;
      if (backdropRef.current) backdropRef.current.style.opacity = '0.3';
      currentSwipeX.current = 0;
    }
  };

  // Helpers
  const isSetupPhase = step === AppStep.PSYCHOLOGY_CHECK || step === AppStep.TRADE_SETUP;
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

  // Logic: Show floating bar if we are at HOME OR if we are currently closing the detail view.
  const showFloatingBar = !isDetailViewOpen || isClosing;
  
  // Logic: Allow interaction with Home if HOME OR if Closing.
  const isHomeInteractive = !isDetailViewOpen || isClosing;

  return (
    // FIX: Root container with overscroll-none to prevent bounce effects
    <div className="fixed inset-0 font-sans overflow-hidden bg-black overscroll-none select-none">
      
      {/* --- LAYER 1: HOME VIEW (Fixed Background) --- */}
      <div 
        className="flex flex-col w-full h-full absolute inset-0 z-0"
        style={{ backgroundColor: isDarkMode ? '#101624' : '#FEFEFE' }}
      >
        
        {/* === Header === */}
        <div className="flex-none z-10 w-full">
           {/* Mobile Header */}
          <nav className="md:hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 py-3">
            <div className="flex items-center gap-3">
              <button className="text-gray-600 dark:text-gray-300">
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

          {/* Desktop Header */}
          <nav className="hidden md:block border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/50 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div 
                  className="flex items-center gap-2 cursor-pointer" 
                  onClick={() => setStep(AppStep.HOME)}
                >
                  <div className="w-3 h-3 bg-trade-accent rounded-full animate-pulse"></div>
                  <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">ZenQuant <span className="text-gray-500 font-light">AI</span></span>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                    {isDarkMode ? '🌞' : '🌙'}
                  </button>
                </div>
              </div>
            </div>
          </nav>
        </div>

        {/* === Scrollable Content (Flex 1) === */}
        <div 
          className="flex-1 overflow-y-auto w-full relative touch-pan-y" 
          style={{ 
            WebkitOverflowScrolling: 'touch', 
            pointerEvents: isHomeInteractive ? 'auto' : 'none'
          }}
        >
          {/* Added min-h-[101%] to force scrollability for bounce effect */}
          <main className="py-6 px-4 sm:px-6 lg:px-8 pb-32 min-h-[101%]">
            <div className="max-w-7xl mx-auto animate-fade-in h-full">
              {isLoadingHistory ? (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-trade-accent mb-4"></div>
                  <p className="text-sm">正在加载历史记录...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-8">
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
                      </div>
                      <div className="absolute bottom-4 left-5 flex items-center gap-1.5">
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

        {/* --- Dimming Overlay --- */}
        <div 
          ref={backdropRef}
          className="absolute inset-0 bg-black pointer-events-none"
          style={{ 
            opacity: (isDetailViewOpen && !isClosing) ? 0.3 : 0, 
            transition: 'opacity 0.2s ease', 
            zIndex: 20,
            visibility: (isDetailViewOpen || isClosing) ? 'visible' : 'hidden'
          }}
        />

        {/* === Floating Action Bar === */}
        <div className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 z-40 transition-opacity duration-200 ${showFloatingBar ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full px-2 py-2 flex items-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-gray-100 dark:border-gray-700">
            <button className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <button 
              onClick={handleStartNewTrade}
              className="mx-2 w-28 h-12 bg-gray-900 dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center gap-2 font-bold shadow-lg hover:scale-105 transition-transform"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
              </svg>
              <span>新交易</span>
            </button>
            <button className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* --- LAYER 2: DETAIL VIEW (SLIDES OVER) --- */}
      {isDetailViewOpen && (
        <div 
          ref={detailViewRef}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          // FIX: Add touch-action: pan-y to allow vertical scrolling natively while observing horizontal touches
          className="fixed inset-0 z-50 bg-white dark:bg-gray-900 shadow-2xl will-change-transform touch-pan-y"
          style={{
            transform: 'translateX(0)', // Start at 0
            transition: 'transform 0.2s cubic-bezier(0.15, 0.85, 0.15, 1)', // Default enter/idle state
            boxShadow: '-16px 0 40px -10px rgba(0,0,0,0.5)',
            pointerEvents: isClosing ? 'none' : 'auto'
          }}
        >
          {/* Back Button */}
          <button 
            onClick={() => {
              setIsClosing(true);
              // Trigger the exit animation via ref manually since we are outside the touch handler
              if (detailViewRef.current) detailViewRef.current.style.transform = 'translateX(100%)';
              if (backdropRef.current) backdropRef.current.style.opacity = '0';
              setTimeout(() => {
                setStep(AppStep.HOME);
                setIsClosing(false);
              }, 200);
            }}
            // Prevent touch start from triggering drag on the back button itself
            onTouchStart={(e) => e.stopPropagation()}
            className="absolute top-4 left-4 z-[60] p-2.5 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md rounded-full shadow-lg border border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:scale-105 active:scale-95 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          {/* Inner Scroll Container */}
          <div 
             className="w-full h-full overflow-y-auto custom-scrollbar"
          >
            <main className="px-4 sm:px-6 lg:px-8 pb-12 pt-20">
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
        </div>
      )}

      {/* --- LAYER 3: MODAL DRAWER (Setup Steps) --- */}
      <ModalDrawer 
        isOpen={isSetupPhase} 
        onClose={handleCloseDrawer}
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
