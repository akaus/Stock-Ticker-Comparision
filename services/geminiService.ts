import { GoogleGenAI } from "@google/genai";
import { StockDataPoint } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getStockPriceData = async (primaryTicker: string, secondaryTicker: string | null, startDate: string, endDate: string): Promise<StockDataPoint[]> => {
  const secondaryTickerPrompt = secondaryTicker
    ? `and the secondary stock ticker "${secondaryTicker}"`
    : '';
  
  const secondaryTickerSchemaDescription = secondaryTicker
    ? `and a "price_secondary" (a number representing the closing price for ${secondaryTicker})`
    : '';

  const prompt = `
    Your primary task is to act as a financial data API. You must use search to get accurate, real-world historical stock data.

    For the primary stock ticker "${primaryTicker}" (e.g., search for "NASDAQ:${primaryTicker}" or "NYSE:${primaryTicker}") ${secondaryTickerPrompt}, provide a continuous daily closing price series from ${startDate} to ${endDate}.

    Follow these rules precisely:
    1.  **Accuracy is paramount.** The prices must match a reliable financial source like Google Finance or Yahoo Finance.
    2.  **Complete Date Range:** You must return a data point for *every single calendar day* between ${startDate} and ${endDate}, inclusive.
    3.  **Handling Non-Trading Days:** For any day that is not a trading day (e.g., a weekend or a public holiday), the price for that day must be the closing price from the most recent previous trading day. For example, the price for a Saturday and Sunday should be the same as the closing price from the preceding Friday.
    4.  **No Hallucinations:** If you cannot find reliable, continuous daily data for the *entire* requested period for any ticker, you MUST return an error message. Do not invent or estimate data points.

    Your entire response must be a single, clean JSON object with no other text or markdown.

    -   If data is found, the JSON object will have a single key "prices", containing an array of objects. Each object must have a "date" (YYYY-MM-DD) and a "price_primary" (number) ${secondaryTickerSchemaDescription}.
    -   If data for a ticker cannot be found for the given dates (e.g., pre-IPO or data not available via search), the JSON object will have a single key "error", with a string explaining the issue. Example: {"error": "Historical data for ticker 'XYZ' could not be reliably found for the requested date range."}

    Example for a single ticker (GOOG) from 2023-10-06 to 2023-10-09:
    Assuming Friday Oct 6 closing price was 138.68 and Monday Oct 9 closing price was 139.50.
    Your response for "prices" would include:
    [
      { "date": "2023-10-06", "price_primary": 138.68 },
      { "date": "2023-10-07", "price_primary": 138.68 },
      { "date": "2023-10-08", "price_primary": 138.68 },
      { "date": "2023-10-09", "price_primary": 139.50 }
    ]

    Do not deviate from this format. Your response must start with "{" and end with "}".
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}],
      },
    });

    let rawText = response.text;
    
    const startIndex = rawText.indexOf('{');
    const endIndex = rawText.lastIndexOf('}');
    
    if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
        throw new Error(`Could not find a valid JSON object in the model's response. Received: ${rawText}`);
    }
    
    const jsonText = rawText.substring(startIndex, endIndex + 1);
    
    const parsedJson = JSON.parse(jsonText);

    if (parsedJson.error) {
        throw new Error(parsedJson.error);
    }

    if (parsedJson && Array.isArray(parsedJson.prices)) {
      return parsedJson.prices.sort((a: StockDataPoint, b: StockDataPoint) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else {
      throw new Error("Invalid data structure received from API. Expected a 'prices' array or an 'error' message.");
    }
  } catch (error) {
    console.error("Error fetching stock data from Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to fetch or parse stock data: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching stock data.");
  }
};


export const getPredictionData = async (primaryTicker: string, secondaryTicker: string | null, historicalData: StockDataPoint[], predictionDays: number): Promise<{ analysis: string; predictions: { date: string, price_primary: number, price_secondary?: number }[] }> => {
  
  const secondaryTickerPrompt = secondaryTicker ? `and for the secondary ticker ${secondaryTicker}` : '';
  const secondaryTickerAnalysis = secondaryTicker ? `, ${secondaryTicker},` : '';
  const secondaryTickerPrediction = secondaryTicker ? `and a "price_secondary"` : '';

  const prompt = `
    You are a sophisticated financial analyst AI. Your task is to predict future stock prices based on historical data and recent news.

    You are given the most recent 10 days of historical closing prices for ${primaryTicker}${secondaryTickerPrompt}:
    ${JSON.stringify(historicalData.slice(-10), null, 2)}

    Follow these steps precisely:
    1.  **News Analysis:** Use your search tool to find the most significant news about the company associated with ticker ${primaryTicker}${secondaryTickerAnalysis} (e.g., if the ticker is 'SYM', search for news about 'Symbotic Inc.') from the last 7 days.
    2.  **Summarize Impact:** Write a concise, one-paragraph analysis summarizing the news and its likely impact (e.g., bullish, bearish, neutral) on the stock(s). This analysis should be insightful and easy to understand for a non-expert.
    3.  **Predict Prices:** Based on the historical trend and your news analysis, provide a JSON array of predicted daily closing prices for the next ${predictionDays} days. The prediction must start from the day after the last historical data point.
    4.  **No Hallucinations:** If you cannot find any relevant news, state that in your analysis and base your prediction solely on the historical trend.

    Your entire response MUST be a single, clean JSON object with no other text or markdown. The object must have two keys:
    - "analysis": A string containing your summary from Step 2.
    - "predictions": An array of objects. Each object must contain a "date" (YYYY-MM-DD), a "price_primary" (the predicted price for ${primaryTicker}) ${secondaryTickerPrediction}.
    - If you cannot perform the analysis or prediction, the JSON object will have a single key "error", with a string explaining the issue.

    Example response format:
    {
      "analysis": "Recent news about a new product launch and positive earnings guidance suggests a bullish outlook for the coming week, though some market volatility is expected.",
      "predictions": [
        { "date": "YYYY-MM-DD", "price_primary": 152.34 },
        { "date": "YYYY-MM-DD", "price_primary": 153.10 }
      ]
    }

    Do not deviate from this format. Your response must start with "{" and end with "}".
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}],
      },
    });
    
    let rawText = response.text;
    const startIndex = rawText.indexOf('{');
    const endIndex = rawText.lastIndexOf('}');
    
    if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
        throw new Error(`Could not find a valid JSON object in the model's prediction response. Received: ${rawText}`);
    }
    
    const jsonText = rawText.substring(startIndex, endIndex + 1);
    const parsedJson = JSON.parse(jsonText);

    if (parsedJson.error) {
        throw new Error(parsedJson.error);
    }

    if (parsedJson && parsedJson.analysis && Array.isArray(parsedJson.predictions)) {
      return parsedJson;
    } else {
      throw new Error("Invalid data structure received from prediction API.");
    }
  } catch (error) {
    console.error("Error fetching prediction data from Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to fetch or parse prediction data: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching prediction data.");
  }
};