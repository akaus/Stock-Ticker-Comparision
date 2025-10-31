import React from 'react';

interface PredictionAnalysisProps {
  analysis: string;
  ticker: string;
}

const PredictionAnalysis: React.FC<PredictionAnalysisProps> = ({ analysis, ticker }) => (
  <div className="mt-8 p-6 bg-gray-800/50 rounded-lg shadow-xl backdrop-blur-sm border border-cyan-500/30 w-full max-w-5xl">
    <h3 className="text-lg font-semibold text-cyan-400 mb-2">
      AI-Powered Analysis for {ticker}
    </h3>
    <p className="text-gray-300 text-sm leading-relaxed">
        {analysis}
    </p>
  </div>
);

export default PredictionAnalysis;
