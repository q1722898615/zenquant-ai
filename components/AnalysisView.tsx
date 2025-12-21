import React from 'react';
import { TradeConfig, MarketState, AnalysisResult } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface Props {
  config: TradeConfig;
  marketState: MarketState;
  analysis: AnalysisResult;
  onAction: () => void;
  actionLabel: string;
}

export const AnalysisView: React.FC<Props> = ({ config, marketState, analysis, onAction, actionLabel }) => {
  const chartData = [
    { name: 'EMA200', price: marketState.ema200 },
    { name: 'EMA12', price: marketState.ema12 },
    { name: 'MA50', price: marketState.ma50 },
    { name: '现价', price: marketState.currentPrice },
    { name: '入场', price: config.entryPrice },
    { name: '止损', price: config.stopLoss },
    { name: '止盈', price: config.takeProfit },
  ];

  const getRecColor = (rec: string) => {
    switch(rec) {
      case 'EXECUTE': return 'text-green-600 dark:text-green-400 border-green-300 dark:border-green-500 bg-green-50 dark:bg-green-900/10';
      case 'WAIT': return 'text-yellow-600 dark:text-yellow-400 border-yellow-300 dark:border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10';
      case 'CANCEL': return 'text-red-600 dark:text-red-400 border-red-300 dark:border-red-500 bg-red-50 dark:bg-red-900/10';
      default: return 'text-gray-400 border-gray-500';
    }
  };

  const getRecText = (rec: string) => {
    switch(rec) {
      case 'EXECUTE': return '执行 / 开仓';
      case 'WAIT': return '观望 / 等待';
      case 'CANCEL': return '取消 / 放弃';
      default: return rec;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 animate-fade-in pb-20">
      {/* Header Result */}
      <div className={`text-center p-8 border-2 rounded-xl mb-8 shadow-2xl transition-all duration-500 ${getRecColor(analysis.recommendation)}`}>
        <p className="text-gray-500 dark:text-gray-400 text-sm uppercase tracking-widest mb-3 font-semibold">AI 最终决策建议</p>
        <h1 className="text-6xl font-black tracking-tight drop-shadow-md">{getRecText(analysis.recommendation)}</h1>
        <div className="mt-6 flex justify-center gap-4">
           <div className="bg-white/50 dark:bg-gray-800/80 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
             <span className="text-xs text-gray-500 dark:text-gray-400 block">AI 置信度</span>
             <span className="text-lg font-mono text-gray-900 dark:text-white">{analysis.confidenceScore}%</span>
           </div>
           <div className="bg-white/50 dark:bg-gray-800/80 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
             <span className="text-xs text-gray-500 dark:text-gray-400 block">盈亏比 (R:R)</span>
             <span className="text-lg font-mono text-gray-900 dark:text-white">{(Math.abs(config.takeProfit - config.entryPrice) / Math.abs(config.entryPrice - config.stopLoss)).toFixed(2)}</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Analysis Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-850 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
             <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                🤖 量化分析逻辑
             </h3>
             <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line text-sm md:text-base">
               {analysis.reasoning}
             </p>
          </div>

           <div className="bg-white dark:bg-gray-850 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
             <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                ⚠️ 风险评估
             </h3>
             <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg border-l-4 border-red-500">
               <p className="text-red-700 dark:text-red-200/90 leading-relaxed text-sm md:text-base">
                 {analysis.riskAssessment}
               </p>
             </div>
          </div>

          {analysis.suggestedAdjustments && (
             <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-xl border border-blue-200 dark:border-blue-900/30 shadow-lg">
              <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-2 uppercase flex items-center gap-2">
                 💡 建议调整
              </h3>
              <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">{analysis.suggestedAdjustments}</p>
            </div>
          )}
        </div>

        {/* Right: Technical Snapshot */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-850 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider">市场环境 ({config.symbol})</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-2">
                <span className="text-gray-500 dark:text-gray-400 text-sm">当前价格</span>
                <span className="font-mono text-xl text-gray-900 dark:text-white font-bold">${marketState.currentPrice.toLocaleString()}</span>
              </div>
              
               <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-2">
                <span className="text-gray-500 dark:text-gray-400 text-sm">MACD (12,26,9)</span>
                <div className="text-right">
                   <span className={`font-mono text-sm block ${marketState.macd.histogram > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                     Hist: {marketState.macd.histogram.toFixed(2)}
                   </span>
                   <span className="text-xs text-gray-400 dark:text-gray-500">L: {marketState.macd.line.toFixed(2)} | S: {marketState.macd.signal.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-2">
                <span className="text-gray-500 dark:text-gray-400 text-sm">RSI (14)</span>
                <span className={`font-mono font-bold ${marketState.rsi > 70 ? 'text-red-600 dark:text-red-400' : marketState.rsi < 30 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                  {marketState.rsi}
                </span>
              </div>
              
               <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-2">
                <span className="text-gray-500 dark:text-gray-400 text-sm">EMA 200</span>
                <span className="font-mono text-gray-600 dark:text-gray-300">{marketState.ema200}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-850 p-6 rounded-xl border border-gray-200 dark:border-gray-700 h-80 shadow-lg flex flex-col">
             <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider">价格位置分布</h3>
             <div className="flex-1 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 20 }}>
                    <XAxis type="number" domain={['auto', 'auto']} hide />
                    <YAxis dataKey="name" type="category" width={50} tick={{fontSize: 10, fill: '#9ca3af'}} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#f3f4f6' }}
                      itemStyle={{ color: '#fff' }}
                      cursor={{fill: 'rgba(156, 163, 175, 0.2)'}}
                    />
                    <Bar dataKey="price" fill="#6b7280" barSize={16} radius={[0, 4, 4, 0]} />
                    <ReferenceLine x={config.entryPrice} stroke="#3b82f6" strokeDasharray="3 3" />
                  </BarChart>
               </ResponsiveContainer>
             </div>
          </div>

          <button 
            onClick={onAction}
            className="w-full py-4 bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-bold rounded-xl shadow-lg border border-transparent dark:border-gray-600 transition-all duration-200"
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
};