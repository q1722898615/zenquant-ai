
import React, { useEffect, useState } from 'react';
import { TradeConfig, MarketState, AnalysisResult, AnalysisRecord } from '../types';
import { fetchMarketAnalysis } from '../services/marketService';
import { analyzeTrade } from '../services/analysisService';
import { AnalysisView } from './AnalysisView';

interface Props {
  config: TradeConfig;
  onComplete: (record: AnalysisRecord) => void;
}

export const Dashboard: React.FC<Props> = ({ config, onComplete }) => {
  const [marketState, setMarketState] = useState<MarketState | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    const runAnalysis = async () => {
      try {
        setErrorMsg('');
        setLoadingStep(`正在从交易所获取 ${config.symbol} 实时数据...`);
        const market = await fetchMarketAnalysis(config.symbol, config.timeframe);
        setMarketState(market);

        setLoadingStep('后端正在计算技术指标 (MACD, RSI, EMA)...');
        // 人为延迟一点点，让用户感知到步骤，否则太快了
        await new Promise(resolve => setTimeout(resolve, 300));

        setLoadingStep(`AI 正在基于 [${config.strategy}] 策略进行验算...`);
        const aiResult = await analyzeTrade(config, market);
        
        setAnalysis(aiResult);
        setLoadingStep('');
        
        // Save record silently when analysis is done
        if (market && aiResult) {
           const record: AnalysisRecord = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            config,
            market: market,
            analysis: aiResult
          };
          onComplete(record);
        }

      } catch (e: any) {
        console.error(e);
        setErrorMsg(e.message || '连接服务器失败');
        setLoadingStep('');
      }
    };

    runAnalysis();
  }, [config]);

  if (loadingStep) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-trade-accent"></div>
          <div className="absolute top-0 left-0 h-20 w-20 flex items-center justify-center">
             <span className="text-2xl animate-pulse">🧠</span>
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-xl font-bold text-gray-900 dark:text-white animate-pulse">{loadingStep}</p>
          <div className="flex gap-2 justify-center text-xs text-gray-500 font-mono mt-4">
             <span className={loadingStep.includes('交易所') ? "text-blue-600 dark:text-blue-400 font-bold" : ""}>1. DATA</span>
             <span>→</span>
             <span className={loadingStep.includes('AI') ? "text-blue-600 dark:text-blue-400 font-bold" : ""}>2. AI AGENT</span>
          </div>
        </div>
      </div>
    );
  }

  if (errorMsg) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-red-500 p-10 space-y-4">
      <div className="text-4xl">⚠️</div>
      <div className="text-center">
        <p className="font-bold">分析失败</p>
        <p className="text-sm mt-2">{errorMsg}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-300"
        >
          刷新重试
        </button>
      </div>
    </div>
  );

  if (!analysis || !marketState) return null;

  return (
    <div className="relative pt-12">
        <AnalysisView 
          config={config} 
          marketState={marketState} 
          analysis={analysis} 
        />
    </div>
  );
};
