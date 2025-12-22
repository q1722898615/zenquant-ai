import { TradeConfig, MarketState, AnalysisResult, StrategyType } from '../types';

// Xiaomi MiMo Configuration
const MIMO_API_KEY = "sk-csig6oqi6gvqt62i7u0zsmijsgurkm7bmyz0jy870n0tv3hu";
const MIMO_API_URL = "https://api.xiaomimimo.com/v1/chat/completions";
const MODEL_ID = "mimo-v2-flash";

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
  // Incorporate the specific identity from the curl example to ensure compatibility
  const systemPrompt = `
    You are MiMo, an AI assistant developed by Xiaomi. Today is date: ${new Date().toLocaleDateString()}.
    You are acting as a Senior Quantitative Risk Manager and Crypto Trader. Your goal is to enforce strict discipline and protect capital.
    You MUST output valid JSON only. Do not use markdown code blocks (like \`\`\`json). Just return the raw JSON string.
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
    const response = await fetch(MIMO_API_URL, {
      method: "POST",
      headers: {
        "api-key": MIMO_API_KEY,
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
        "max_completion_tokens": 1024,
        "temperature": 0.3,
        "top_p": 0.95,
        "stream": false,
        "stop": null,
        "frequency_penalty": 0,
        "presence_penalty": 0,
        "thinking": {
            "type": "disabled"
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MIMO API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) throw new Error("No content received from AI");

    // Clean up potential markdown code blocks if the model ignores the instruction
    const cleanJson = content.replace(/```json\n?|```/g, "").trim();
    
    // Attempt to extract JSON if there's extra text
    const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : cleanJson;

    return JSON.parse(jsonString) as AnalysisResult;

  } catch (error) {
    console.error("AI Analysis Failed:", error);
    // Return a structured error result to the UI so the user knows what happened
    return {
      recommendation: 'WAIT',
      confidenceScore: 0,
      reasoning: "AI 服务连接失败。这可能是由于网络限制或 API 服务暂时不可用。",
      riskAssessment: `技术错误: ${(error as Error).message}. 请检查控制台日志。`
    };
  }
};