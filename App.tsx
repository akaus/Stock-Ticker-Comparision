import React, { useState, useCallback } from 'react';
import { StockDataPoint } from './types';
import { getStockPriceData } from './services/geminiService';
import StockForm from './components/StockForm';
import StockChart from './components/StockChart';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';

const App: React.FC = () => {
  const [stockData, setStockData] = useState<StockDataPoint[]>([]);
  const [primaryTicker, setPrimaryTicker] = useState<string>('');
  const [secondaryTicker, setSecondaryTicker] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchData = useCallback(async (pTicker: string, sTicker: string, startDate: string, endDate: string) => {
    setIsLoading(true);
    setError(null);
    setStockData([]);
    setPrimaryTicker(pTicker);
    setSecondaryTicker(sTicker);

    try {
      const data = await getStockPriceData(pTicker, sTicker || null, startDate, endDate);
      setStockData(data);
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
    <div className="text-center p-8 mt-8 bg-gray-800/30 rounded-lg max-w-4xl">
        <h2 className="text-2xl font-bold text-gray-200 mb-2">Welcome to the Stock Visualizer</h2>
        <p className="text-gray-400">
            Enter one or two stock tickers and a date range to see historical price data, powered by Gemini.
        </p>
    </div>
  );

  return (
    <div className="min-h-screen w-full flex flex-col items-center p-4 sm:p-6 lg:p-8 bg-dots-pattern">
      <header className="w-full max-w-4xl text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
          Gemini Stock Price Visualizer
        </h1>
        <p className="mt-2 text-lg text-gray-400">
          Leveraging AI to chart and compare historical stock performance
        </p>
      </header>

      <main className="w-full flex flex-col items-center">
        <StockForm onFetchData={handleFetchData} isLoading={isLoading} />

        {isLoading && <LoadingSpinner />}
        {error && <ErrorMessage message={error} />}
        
        {!isLoading && !error && stockData.length > 0 && (
          <StockChart 
            data={stockData} 
            primaryTicker={primaryTicker} 
            secondaryTicker={secondaryTicker} 
          />
        )}

        {!isLoading && !error && stockData.length === 0 && (
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
