import React, { useState } from 'react';

interface StockFormProps {
  onFetchData: (primaryTicker: string, secondaryTicker: string, startDate: string, endDate: string, predictionDays: string) => void;
  isLoading: boolean;
}

const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getInitialToday = (): string => getLocalDateString(new Date());

const getInitialOneMonthAgo = (): string => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return getLocalDateString(d);
};

const StockForm: React.FC<StockFormProps> = ({ onFetchData, isLoading }) => {
  const [primaryTicker, setPrimaryTicker] = useState('GOOG');
  const [secondaryTicker, setSecondaryTicker] = useState('');
  const [predictionDays, setPredictionDays] = useState('7');
  
  const [dateRange, setDateRange] = useState({
    start: getInitialOneMonthAgo(),
    end: getInitialToday(),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (primaryTicker && dateRange.start && dateRange.end) {
      onFetchData(primaryTicker.toUpperCase(), secondaryTicker.toUpperCase(), dateRange.start, dateRange.end, predictionDays);
    }
  };

  const todayStr = getInitialToday();

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setDateRange(prevRange => {
      const today = getInitialToday();
      
      let validatedStart = newStartDate;
      if (validatedStart > today) {
        validatedStart = today;
      }

      let validatedEnd = prevRange.end;
      if (validatedStart > validatedEnd) {
        validatedEnd = validatedStart;
      }

      return { start: validatedStart, end: validatedEnd };
    });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    setDateRange(prevRange => {
      const today = getInitialToday();

      let validatedEnd = newEndDate;
      if (validatedEnd > today) {
        validatedEnd = today;
      }

      let validatedStart = prevRange.start;
      if (validatedEnd < validatedStart) {
        validatedStart = validatedEnd;
      }
      
      return { start: validatedStart, end: validatedEnd };
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-gray-800/50 rounded-lg shadow-xl backdrop-blur-sm border border-gray-700 w-full max-w-5xl">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
        <div className="md:col-span-1">
          <label htmlFor="primary-ticker" className="block text-sm font-medium text-gray-300 mb-1">Primary Ticker</label>
          <input
            id="primary-ticker"
            type="text"
            value={primaryTicker}
            onChange={(e) => setPrimaryTicker(e.target.value)}
            placeholder="e.g., GOOG"
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
            placeholder="Optional..."
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
          />
        </div>
        <div className="md:col-span-1">
          <label htmlFor="start-date" className="block text-sm font-medium text-gray-300 mb-1">Start Date</label>
          <input
            id="start-date"
            type="date"
            value={dateRange.start}
            onChange={handleStartDateChange}
            max={todayStr}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
            required
          />
        </div>
        <div className="md:col-span-1">
          <label htmlFor="end-date" className="block text-sm font-medium text-gray-300 mb-1">End Date</label>
          <input
            id="end-date"
            type="date"
            value={dateRange.end}
            onChange={handleEndDateChange}
            min={dateRange.start}
            max={todayStr}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
            required
          />
        </div>
         <div className="md:col-span-1">
          <label htmlFor="prediction-days" className="block text-sm font-medium text-gray-300 mb-1">Prediction Days</label>
          <input
            id="prediction-days"
            type="number"
            value={predictionDays}
            min="0"
            max="30"
            onChange={(e) => setPredictionDays(e.target.value)}
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