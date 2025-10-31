import React, { useState, useCallback } from 'react';
import { StockDataPoint } from './types';
import { getStockPriceData, getPredictionData } from './services/geminiService';
import StockForm from './components/StockForm';
import StockChart from './components/StockChart';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import PredictionAnalysis from './components/PredictionAnalysis';

const App: React.FC = () => {
  const [chartData, setChartData] = useState<StockDataPoint[]>([]);
  const [primaryTicker, setPrimaryTicker] = useState<string>('');
  const [secondaryTicker, setSecondaryTicker] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [predictionAnalysis, setPredictionAnalysis] = useState<string | null>(null);

  const handleFetchData = useCallback(async (pTicker: string, sTicker: string, startDate: string, endDate: string, predictionDaysStr: string) => {
    setIsLoading(true);
    setError(null);
    setChartData([]);
    setPredictionAnalysis(null);
    setPrimaryTicker(pTicker);
    setSecondaryTicker(sTicker);

    try {
      setLoadingMessage('Analyzing Market Data...');
      const historicalData = await getStockPriceData(pTicker, sTicker || null, startDate, endDate);
      
      const predictionDays = parseInt(predictionDaysStr, 10);

      if (predictionDays > 0 && historicalData.length > 0) {
        setLoadingMessage('Forecasting Future Prices...');
        const { analysis, predictions } = await getPredictionData(pTicker, sTicker || null, historicalData, predictionDays);
        
        const lastHistoricalPoint = historicalData[historicalData.length - 1];
        
        const junctionPoint: StockDataPoint = {
            ...lastHistoricalPoint,
            prediction_primary: lastHistoricalPoint.price_primary,
            prediction_secondary: lastHistoricalPoint.price_secondary
        };

        const predictionPoints: StockDataPoint[] = predictions.map(p => ({
            date: p.date,
            prediction_primary: p.price_primary,
            prediction_secondary: p.price_secondary,
        }));
        
        setChartData([...historicalData.slice(0, -1), junctionPoint, ...predictionPoints]);
        setPredictionAnalysis(analysis);

      } else {
        setChartData(historicalData);
      }

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const WelcomeMessage: React.FC = () => (
    <div className="text-center p-8 mt-8 bg-gray-800/30 rounded-lg max-w-5xl">
        <h2 className="text-2xl font-bold text-gray-200 mb-2">Welcome to the Stock Visualizer</h2>
        <p className="text-gray-400">
            Enter tickers and a date range to chart historical prices, or add prediction days to forecast the future with AI analysis.
        </p>
    </div>
  );

  return (
    <div className="min-h-screen w-full flex flex-col items-center p-4 sm:p-6 lg:p-8 bg-dots-pattern">
      <header className="w-full max-w-5xl text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
          Gemini Stock Price Visualizer
        </h1>
        <p className="mt-2 text-lg text-gray-400">
          Leveraging AI to chart historical performance and forecast future prices
        </p>
      </header>

      <main className="w-full flex flex-col items-center">
        <StockForm onFetchData={handleFetchData} isLoading={isLoading} />

        {isLoading && <LoadingSpinner message={loadingMessage} />}
        {error && <ErrorMessage message={error} />}
        
        {!isLoading && !error && predictionAnalysis && (
          <PredictionAnalysis analysis={predictionAnalysis} ticker={primaryTicker} />
        )}
        
        {!isLoading && !error && chartData.length > 0 && (
          <StockChart 
            data={chartData} 
            primaryTicker={primaryTicker} 
            secondaryTicker={secondaryTicker} 
          />
        )}

        {!isLoading && !error && chartData.length === 0 && (
            <WelcomeMessage />
        )}
      </main>
      
      <footer className="text-center text-gray-500 mt-auto pt-8">
        <p>Data provided for informational purposes only. Not financial advice.</p>
      </footer>

      <style>{`
        .bg-dots-pattern {
          background-color: #111827;
          background-image: radial-gradient(#374151 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
    </div>
  );
};

export default App;
