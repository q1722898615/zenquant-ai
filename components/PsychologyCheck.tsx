import React, { useState, useEffect } from 'react';

interface Props {
  onComplete: () => void;
}

const CHECKLIST_ITEMS = [
  "我现在情绪平稳，没有由于错失机会(FOMO)或报复心理进行交易。",
  "我完全接受这笔特定交易可能带来的亏损风险。",
  "这个交易计划严格遵循我的交易系统。",
  "我目前注意力集中，能够全程管理这笔持仓。",
  "我睡眠充足，身体状态良好。"
];

export const PsychologyCheck: React.FC<Props> = ({ onComplete }) => {
  const [checkedItems, setCheckedItems] = useState<boolean[]>(new Array(CHECKLIST_ITEMS.length).fill(false));
  const [canProceed, setCanProceed] = useState(false);

  const handleCheck = (index: number) => {
    const newChecked = [...checkedItems];
    newChecked[index] = !newChecked[index];
    setCheckedItems(newChecked);
  };

  useEffect(() => {
    setCanProceed(checkedItems.every(item => item));
  }, [checkedItems]);

  return (
    <div className="animate-fade-in">
      <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900/50">
        <p className="text-blue-800 dark:text-blue-200 text-sm flex items-start gap-2">
          <span className="text-lg">🧘</span>
          交易是10%的技术加上90%的心态。进场前请务必确认你的状态。
        </p>
      </div>

      <div className="space-y-3">
        {CHECKLIST_ITEMS.map((item, index) => (
          <label 
            key={index} 
            className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors border ${checkedItems[index] ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700'}`}
          >
            <input 
              type="checkbox" 
              checked={checkedItems[index]} 
              onChange={() => handleCheck(index)}
              className="mt-1 w-5 h-5 accent-trade-accent rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-offset-white dark:focus:ring-offset-gray-900"
            />
            <span className={`text-sm ${checkedItems[index] ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
              {item}
            </span>
          </label>
        ))}
      </div>

      <button
        onClick={onComplete}
        disabled={!canProceed}
        className={`mt-8 w-full py-3.5 rounded-xl font-bold tracking-wide transition-all duration-300 ${
          canProceed 
            ? 'bg-gradient-to-r from-trade-accent to-blue-600 text-white shadow-lg hover:shadow-blue-500/20 transform hover:-translate-y-0.5' 
            : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
        }`}
      >
        {canProceed ? "确认状态良好 · 下一步" : "请勾选所有检查项"}
      </button>
    </div>
  );
};