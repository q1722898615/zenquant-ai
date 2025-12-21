import { TradeConfig, MarketState, AnalysisResult, StrategyType } from '../types';

// OpenRouter Configuration
const OPENROUTER_API_KEY = "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";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL_ID = "google/gemini-3-flash-preview"; // As requested

export const analyzeTrade = async (
  trade: TradeConfig,
  market: MarketState
): Promise<AnalysisResult> => {
  
  // 1. 构建策略特定的验证逻辑说明
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
    strategyLogicInstructions = `
    General Validation for ${trade.strategy}:
    - Check trend alignment using MAs.
    - Check momentum using RSI.
    - Ensure logical entry point relative to volatility.
    `;
  }

  // 2. 构建完整的系统提示词
  const systemPrompt = `
    You are a Senior Quantitative Risk Manager and Crypto Trader. Your goal is to enforce strict discipline and protect capital.
    You MUST output valid JSON only. No markdown formatting, no code blocks.
  `;

  // 3. 构建用户输入提示词
  const userPrompt = `
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

    REQUIRED JSON OUTPUT STRUCTURE:
    {
      "recommendation": "EXECUTE" | "WAIT" | "CANCEL",
      "confidenceScore": number (0-100),
      "reasoning": "string",
      "riskAssessment": "string",
      "suggestedAdjustments": "string"
    }
  `;

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://zenquant.app", // Optional: identifies the app to OpenRouter
        "X-Title": "ZenQuant",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": MODEL_ID,
        "messages": [
          {
            "role": "system",
            "content": systemPrompt
          },
          {
            "role": "user",
            "content": userPrompt
          }
        ],
        "response_format": { "type": "json_object" } // Enforce JSON mode
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) throw new Error("No content received from AI");

    // Clean up potential markdown code blocks if the model ignores the instruction
    const cleanJson = content.replace(/```json\n?|\n?```/g, "").trim();
    
    return JSON.parse(cleanJson) as AnalysisResult;

  } catch (error) {
    console.error("AI Analysis Failed:", error);
    return {
      recommendation: 'WAIT',
      confidenceScore: 0,
      reasoning: "AI 服务暂时不可用（OpenRouter 连接失败）。出于风控考虑，建议暂停交易。",
      riskAssessment: `系统错误: ${(error as Error).message}`
    };
  }
};