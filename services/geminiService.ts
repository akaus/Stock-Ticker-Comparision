
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
    ? `- "price_secondary" (a number representing the closing price for ${secondaryTicker})`
    : '';

  const prompt = `
    Your primary task is to act as a financial data API. You must use search to get accurate, real-world historical stock data.

    For the primary stock ticker "${primaryTicker}" ${secondaryTickerPrompt}, provide a continuous daily closing price series from ${startDate} to ${endDate}.

    Follow these rules precisely:
    1.  **Accuracy is paramount.** The prices must match a reliable financial source like Google Finance or Yahoo Finance.
    2.  **Complete Date Range:** You must return a data point for *every single calendar day* between ${startDate} and ${endDate}, inclusive.
    3.  **Handling Non-Trading Days:** For any day that is not a trading day (e.g., a weekend or a public holiday), the price for that day must be the closing price from the most recent previous trading day. For example, the price for a Saturday and Sunday should be the same as the closing price from the preceding Friday.

    Your entire response must be a single, clean JSON object with no other text or markdown.

    -   If data is found, the JSON object will have a single key "prices", containing an array of objects. Each object must have a "date" (YYYY-MM-DD) and a "price_primary" (number). ${secondaryTickerSchemaDescription}
    -   If data for a ticker cannot be found for the given dates (e.g., pre-IPO), the JSON object will have a single key "error", with a string explaining the issue. Example: {"error": "Data for ticker HOOD is not available prior to its IPO in July 2021."}

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
    
    // Find the start and end of the JSON object within the raw text response
    const startIndex = rawText.indexOf('{');
    // FIX: The original code used 'raw' which is not defined. Changed to 'rawText'.
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
      // Sort data by date just in case the model doesn't return it in order
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
