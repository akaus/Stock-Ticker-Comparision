export interface StockDataPoint {
  date: string;
  price_primary?: number;
  price_secondary?: number;
  prediction_primary?: number;
  prediction_secondary?: number;
}
