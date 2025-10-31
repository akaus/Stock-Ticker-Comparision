import { GoogleGenAI, Type } from "@google/genai";
import { StockDataPoint } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const stockDataSchema = {
  type: Type.OBJECT,
  properties: {
    prices: {
      type: Type.ARRAY,
      description: "An array of stock price data points for each day in the requested range.",
      items: {
        type: Type.OBJECT,
        properties: {
          date: {
            type: Type.STRING,
            description: "The date in YYYY-MM-DD format.",
          },
          price_primary: {
            type: Type.NUMBER,
            description: "The closing stock price for the primary ticker for that date. For non-trading days, this should be the price from the most recent previous trading day.",
          },
          price_secondary: {
            type: Type.NUMBER,
            description: "The closing stock price for the secondary ticker for that date. This should follow the same non-trading day logic. This field should be omitted entirely if no secondary ticker was requested.",
          },
        },
        required: ['date', 'price_primary'],
      },
    },
  },
  required: ['prices'],
};

export const getStockPriceData = async (primaryTicker: string, secondaryTicker: string | null, startDate: string, endDate: string): Promise<StockDataPoint[]> => {
  const secondaryTickerPrompt = secondaryTicker
    ? `and the secondary stock ticker "${secondaryTicker}"`
    : '';
  
  const secondaryTickerDescription = secondaryTicker
    ? `For the secondary ticker, use the key "price_secondary".`
    : 'Do not include a "price_secondary" field.';

  const prompt = `
    For the primary stock ticker "${primaryTicker}" ${secondaryTickerPrompt}, provide the daily closing price for each day from ${startDate} to ${endDate}.
    It is crucial that you return a data point for *every single day* in the range, including weekends and holidays.
    For any non-trading day (like a weekend or holiday), please use the closing price from the most recent previous trading day.
    Format the output as a JSON object that strictly follows the provided schema.
    For the primary ticker, use the key "price_primary".
    ${secondaryTickerDescription}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: stockDataSchema,
      },
    });

    const jsonText = response.text.trim();
    const parsedJson = JSON.parse(jsonText);

    if (parsedJson && Array.isArray(parsedJson.prices)) {
      // Sort data by date just in case the model doesn't return it in order
      return parsedJson.prices.sort((a: StockDataPoint, b: StockDataPoint) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else {
      throw new Error("Invalid data structure received from API.");
    }
  } catch (error) {
    console.error("Error fetching stock data from Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to fetch or parse stock data: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching stock data.");
  }
};
