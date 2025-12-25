# ZenQuant 后端开发规范与对接指南

本文档定义了 ZenQuant 后端服务的功能架构、API 接口设计以及与现有前端的对接方案。

## 1. 技术栈选型

*   **语言**: Python 3.10+
*   **Web 框架**: FastAPI (高性能、异步、自动生成文档)
*   **数据源工具**: CCXT (用于标准化获取各大交易所行情数据)
*   **金融计算库**: `pandas` + `pandas-ta` (或 `talib`) —— **核心变更：指标计算移至后端**
*   **AI 客户端**: OpenAI SDK (兼容 OpenRouter/DeepSeek/Gemini)
*   **数据库**: PostgreSQL (生产环境) / SQLite (开发环境)
*   **ORM**: SQLAlchemy + Pydantic (数据验证)

## 2. 核心功能模块

后端需要实现以下四大核心模块：

### A. 市场状态引擎 (Market Engine)
*   **现状**: 前端获取 K 线并使用简单的 JS 函数计算 RSI/MACD，精度较低，且浪费前端算力。
*   **目标**: 
    1. 后端通过 CCXT 获取 K 线。
    2. 使用 `pandas-ta` 计算所有技术指标 (RSI, MACD, EMA, BOLL, ATR 等)。
    3. 向前端返回完整的 `MarketState` 对象，前端只负责展示。

### B. 配置中心 (Config Center)
*   **现状**: 策略列表和币种列表硬编码在前端。
*   **目标**: 
    1. 提供支持的币种列表接口（支持模糊搜索）。
    2. 提供策略列表接口（后端定义策略逻辑 Prompt 模板）。

### C. AI 推理代理 (AI Agent Proxy)
*   **目标**: 前端发送交易意图 + 后端计算好的市场数据 -> 后端组装 Prompt -> 调用 LLM -> 返回结构化建议。

### D. 数据持久化
*   保存用户日记。

---

## 3. API 接口设计 (RESTful)

### 3.1 基础配置模块 (`/config`)
*   `GET /config/symbols`: 获取支持的交易对列表
    *   **Response**: `["BTC/USDT", "ETH/USDT", "SOL/USDT", ...]`
    *   *用途*: 用于前端输入框的自动补全或下拉选择。
*   `GET /config/strategies`: 获取支持的策略列表
    *   **Response**: `[{ "id": "MACD_RSI", "name": "MACD-RSI 复合策略", "description": "..." }, ...]`
    *   *用途*: 渲染前端策略选择器。

### 3.2 市场分析模块 (`/market`)
*   `GET /market/state`: **[核心]** 获取计算好的市场状态
    *   **Params**: `symbol` (e.g., BTC/USDT), `timeframe` (e.g., 15m)
    *   **Response**: 直接返回前端 `MarketState` 接口所需的数据结构
        ```json
        {
          "symbol": "BTC/USDT",
          "currentPrice": 92000.5,
          "rsi": 45.2,
          "ma50": 91000.0,
          "ma200": 89000.0,
          "ema12": 91800.0,
          "ema200": 89500.0,
          "macd": {
            "line": 150.2,
            "signal": 120.5,
            "histogram": 29.7,
            "crossStatus": "UP" 
          },
          "volatility": 1200.5
        }
        ```
    *   *后端逻辑*: `ccxt.fetch_ohlcv` -> `DataFrame` -> `df.ta.rsi()`, `df.ta.macd()` -> `JSON`。

### 3.3 智能分析模块 (`/analysis`)
*   `POST /analysis/evaluate`: 提交交易计划进行 AI 评估
    *   **Input**:
        ```json
        {
          "config": { ... }, // 用户的 TradeConfig
          "market_state": { ... } // 可选。如果前端刚刚获取了 state，可以传回来；或者后端根据 config 重新获取最新 state
        }
        ```
    *   **Logic**:
        1. 提取对应的策略 Prompt 模板（存储在后端代码或数据库中）。
        2. 将 `MarketState` 数据填入 Prompt。
        3. 调用 LLM。
        4. 解析并返回 JSON。

---

## 4. 数据库模型设计 (SQLAlchemy)

*(保持原有设计，增加 Strategy 表可选)*

```python
class AnalysisRecord(Base):
    # ... 字段同前
    # 确保存储的是后端计算后的快照
    pass
```

---

## 5. 前端对接指南 (更新后)

### 第一步：改造 `marketService.ts`
前端将**彻底删除** `utils/technicalIndicators.ts` 中的计算逻辑。

```typescript
// services/marketService.ts
export const fetchMarketAnalysis = async (symbol: string, timeframe: string): Promise<MarketState> => {
  // 直接请求后端计算好的数据
  const res = await fetch(`${API_URL}/market/state?symbol=${symbol}&timeframe=${timeframe}`);
  return await res.json();
};
```

### 第二步：改造 `TradeForm.tsx`
1.  **加载配置**: 组件挂载时调用 `GET /config/symbols` 和 `GET /config/strategies`。
2.  **输入框**: 将 Symbol 选择改为可输入的 `Combobox` 或带搜索的输入框。

---

## 6. 后端开发步骤

1.  **Setup**: `pip install fastapi uvicorn ccxt pandas pandas-ta openai`
2.  **Market Engine**: 编写一个 Helper 类，输入 symbol/timeframe，输出包含所有技术指标的字典。
3.  **API**: 暴露 `/market/state` 接口。
4.  **AI**: 迁移 Prompt 逻辑到 Python。



补：types.ts
export enum TradeSide {
  LONG = 'LONG',
  SHORT = 'SHORT'
}

export enum StrategyType {
  TREND_FOLLOWING = '趋势跟踪 (均线/MA)',
  MEAN_REVERSION = '均值回归 (RSI/布林带)',
  BREAKOUT = '突破策略 (Breakout)',
  VEGAS_TUNNEL = 'Vegas 隧道交易法',
  MACD_RSI_COMPOSITE = 'MACD-RSI 双指标复合策略'
}

export enum AppStep {
  HOME = 'HOME',
  PSYCHOLOGY_CHECK = 'PSYCHOLOGY_CHECK',
  TRADE_SETUP = 'TRADE_SETUP',
  AI_ANALYSIS = 'AI_ANALYSIS',
  HISTORY_DETAIL = 'HISTORY_DETAIL'
}

export interface MarketState {
  symbol: string;
  currentPrice: number;
  rsi: number;
  ma50: number;
  ma200: number;
  ema12: number;
  ema200: number;
  macd: {
    line: number;
    signal: number;
    histogram: number;
    crossStatus: 'UP' | 'DOWN' | 'NONE';
  };
  volatility: number;
}

export interface TradeConfig {
  symbol: string;
  side: TradeSide;
  timeframe: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  accountBalance: number;
  riskPercentage: number;
  leverage: number;
  strategy: StrategyType;
}

export interface AnalysisResult {
  recommendation: 'EXECUTE' | 'WAIT' | 'CANCEL';
  confidenceScore: number;
  reasoning: string;
  riskAssessment: string;
  suggestedAdjustments?: string;
}

export interface AnalysisRecord {
  id: string;
  timestamp: number;
  config: TradeConfig;
  market: MarketState;
  analysis: AnalysisResult;
}
