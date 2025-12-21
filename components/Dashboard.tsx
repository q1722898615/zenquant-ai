import React, { useEffect, useState } from 'react';
import { TradeConfig, MarketState, AnalysisResult, AnalysisRecord } from '../types';
import { fetchMarketAnalysis } from '../services/marketService';
import { analyzeTrade } from '../services/geminiService';
import { AnalysisView } from './AnalysisView';

interface Props {
  config: TradeConfig;
  onComplete: (record: AnalysisRecord) => void;
}

export const Dashboard: React.FC<Props> = ({ config, onComplete }) => {
  const [marketState, setMarketState] = useState<MarketState | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loadingStep, setLoadingStep] = useState<string>('');

  useEffect(() => {
    const runAnalysis = async () => {
      try {
        setLoadingStep('正在从交易所获取 K线数据...');
        const market = await fetchMarketAnalysis(config.symbol);
        setMarketState(market);

        setLoadingStep('正在计算 MACD, RSI, EMA, MA...');
        await new Promise(resolve => setTimeout(resolve, 600));

        setLoadingStep('AI 正在基于双指标复合策略进行验算...');
        const aiResult = await analyzeTrade(config, market);
        
        setAnalysis(aiResult);
        setLoadingStep('');
      } catch (e) {
        console.error(e);
        setLoadingStep('错误');
      }
    };

    runAnalysis();
  }, [config]);

  const handleFinish = () => {
    if (marketState && analysis) {
      const record: AnalysisRecord = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        config,
        market: marketState,
        analysis
      };
      onComplete(record);
    }
  };

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
             <span className={loadingStep.includes('获取') ? "text-blue-600 dark:text-blue-400 font-bold" : ""}>1. DATA</span>
             <span>→</span>
             <span className={loadingStep.includes('计算') ? "text-blue-600 dark:text-blue-400 font-bold" : ""}>2. CALC</span>
             <span>→</span>
             <span className={loadingStep.includes('AI') ? "text-blue-600 dark:text-blue-400 font-bold" : ""}>3. DECISION</span>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis || !marketState) return <div className="text-red-500 text-center p-10">系统错误，请刷新重试。</div>;

  return (
    <AnalysisView 
      config={config} 
      marketState={marketState} 
      analysis={analysis} 
      onAction={handleFinish}
      actionLabel="🏁 结束并返回主页"
    />
  );
};