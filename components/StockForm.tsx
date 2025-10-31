import React, { useState } from 'react';

interface StockFormProps {
  onFetchData: (primaryTicker: string, secondaryTicker: string, startDate: string, endDate: string) => void;
  isLoading: boolean;
}

const StockForm: React.FC<StockFormProps> = ({ onFetchData, isLoading }) => {
  const [primaryTicker, setPrimaryTicker] = useState('GOOG');
  const [secondaryTicker, setSecondaryTicker] = useState('MSFT');
  
  const today = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(today.getMonth() - 1);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(formatDate(oneMonthAgo));
  const [endDate, setEndDate] = useState(formatDate(today));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (primaryTicker && startDate && endDate) {
      onFetchData(primaryTicker.toUpperCase(), secondaryTicker.toUpperCase(), startDate, endDate);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-gray-800/50 rounded-lg shadow-xl backdrop-blur-sm border border-gray-700 w-full max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        <div className="md:col-span-1">
          <label htmlFor="primary-ticker" className="block text-sm font-medium text-gray-300 mb-1">Primary Ticker</label>
          <input
            id="primary-ticker"
            type="text"
            value={primaryTicker}
            onChange={(e) => setPrimaryTicker(e.target.value)}
            placeholder="e.g., AAPL"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
            required
          />
        </div>
        <div className="md:col-span-1">
          <label htmlFor="secondary-ticker" className="block text-sm font-medium text-gray-300 mb-1">Compare With</label>
          <input
            id="secondary-ticker"
            type="text"
            value={secondaryTicker}
            onChange={(e) => setSecondaryTicker(e.target.value)}
            placeholder="e.g., MSFT (Optional)"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
          />
        </div>
        <div className="md:col-span-1">
          <label htmlFor="start-date" className="block text-sm font-medium text-gray-300 mb-1">Start Date</label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
            required
          />
        </div>
        <div className="md:col-span-1">
          <label htmlFor="end-date" className="block text-sm font-medium text-gray-300 mb-1">End Date</label>
          <input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="md:col-span-1 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition duration-150 ease-in-out"
        >
          {isLoading ? 'Fetching...' : 'Get Prices'}
        </button>
      </div>
    </form>
  );
};

export default StockForm;
