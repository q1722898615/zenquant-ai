import { GoogleGenAI, Type } from "@google/genai";
import { TradeConfig, MarketState, AnalysisResult, StrategyType } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeTrade = async (
  trade: TradeConfig,
  market: MarketState
): Promise<AnalysisResult> => {
  
  // 根据策略类型动态生成特定的验证逻辑
  let strategyLogicInstructions = "";

  if (trade.strategy === StrategyType.MACD_RSI_COMPOSITE) {
    strategyLogicInstructions = `
    **STRATEGY RULES (MACD-RSI Composite):**
    
    FOR LONG (Must satisfy at least 2 of 3):
    1. MACD Line crosses UP Signal Line (Bullish Cross). Current MACD: ${market.macd.line}, Signal: ${market.macd.signal}.
    2. RSI (14) < 30 (Oversold). Current RSI: ${market.rsi}.
    3. Close Price > EMA 200 (Long-term Uptrend). Current Price: ${market.currentPrice}, EMA200: ${market.ema200}.

    FOR SHORT (Must satisfy at least 2 of 4):
    1. MACD Line crosses DOWN Signal Line (Bearish Cross).
    2. RSI (14) > 70 (Overbought).
    3. EMA 12 > Close Price (Short-term weakness). Current EMA12: ${market.ema12}.
    4. EMA 200 < Close Price (Reversal in Uptrend context).

    Task: Explicitly count how many conditions are met for the user's requested side (${trade.side}). If < 2 conditions met, recommend WAIT.
    `;
  } else {
    // Default logic for other strategies
    strategyLogicInstructions = `
    General Validation for ${trade.strategy}:
    - Check trend alignment using MAs.
    - Check momentum using RSI.
    - Ensure logical entry point relative to volatility.
    `;
  }

  const prompt = `
    You are a Senior Quantitative Risk Manager and Crypto Trader. Your goal is to enforce strict discipline and protect capital.
    
    Current Market Data for ${trade.symbol}:
    - Price: ${market.currentPrice}
    - RSI (14): ${market.rsi}
    - MA50: ${market.ma50}
    - MA200: ${market.ma200}
    - EMA12: ${market.ema12}
    - EMA200: ${market.ema200}
    - MACD Line: ${market.macd.line}
    - MACD Signal: ${market.macd.signal}
    - Volatility (ATR): ${market.volatility}

    User Proposed Trade:
    - Side: ${trade.side}
    - Strategy: ${trade.strategy}
    - Entry: ${trade.entryPrice}
    - Stop Loss: ${trade.stopLoss}
    - Take Profit: ${trade.takeProfit}
    - Leverage: ${trade.leverage}x
    - Account Balance: ${trade.accountBalance}
    - Risked Capital: ${trade.riskPercentage}%

    ${strategyLogicInstructions}

    Tasks:
    1. Calculate Risk:Reward Ratio.
    2. Validate the trade strictly based on the STRATEGY RULES provided above.
    3. Validate Position Sizing (Is the leverage too high for the stop distance?).
    4. Provide a strictly disciplined recommendation.
    5. **IMPORTANT**: Output all text fields (reasoning, riskAssessment, suggestedAdjustments) in Simplified Chinese (简体中文).

    Return JSON format only.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendation: { type: Type.STRING, enum: ['EXECUTE', 'WAIT', 'CANCEL'] },
            confidenceScore: { type: Type.NUMBER, description: "0 to 100" },
            reasoning: { type: Type.STRING, description: "Detailed reasoning in Chinese" },
            riskAssessment: { type: Type.STRING, description: "Risk analysis in Chinese" },
            suggestedAdjustments: { type: Type.STRING, description: "Adjustments in Chinese (optional)" }
          },
          required: ['recommendation', 'confidenceScore', 'reasoning', 'riskAssessment']
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("AI Analysis Failed:", error);
    return {
      recommendation: 'WAIT',
      confidenceScore: 0,
      reasoning: "AI 服务暂时不可用。出于风控考虑，建议暂停交易。",
      riskAssessment: "系统错误导致无法计算风险参数。"
    };
  }
};