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
    ? `- "price_secondary" (the closing price for ${secondaryTicker})`
    : 'Do not include a "price_secondary" field.';

  const prompt = `
    Provide the daily closing price for the primary stock ticker "${primaryTicker}" ${secondaryTickerPrompt} for each day from ${startDate} to ${endDate}.
    It is crucial that you return a data point for *every single day* in the range, including weekends and holidays.
    For any non-trading day (like a weekend or holiday), please use the closing price from the most recent previous trading day.
    
    Return ONLY a single JSON object with a key "prices". The value of "prices" should be an array of objects.
    Each object in the array must contain:
    - "date" (in YYYY-MM-DD format)
    - "price_primary" (the closing price for ${primaryTicker})
    ${secondaryTickerSchemaDescription}
    
    Do not include any other text, explanations, or markdown formatting outside of the single JSON object. Your entire response should be only the raw JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}],
      },
    });

    // The model might wrap the JSON in ```json ... ```, so we need to clean it.
    let jsonText = response.text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.substring(7, jsonText.length - 3).trim();
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.substring(3, jsonText.length - 3).trim();
    }
    
    const parsedJson = JSON.parse(jsonText);

    if (parsedJson && Array.isArray(parsedJson.prices)) {
      // Sort data by date just in case the model doesn't return it in order
      return parsedJson.prices.sort((a: StockDataPoint, b: StockDataPoint) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else {
      throw new Error("Invalid data structure received from API. Expected a 'prices' array.");
    }
  } catch (error) {
    console.error("Error fetching stock data from Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to fetch or parse stock data: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching stock data.");
  }
};