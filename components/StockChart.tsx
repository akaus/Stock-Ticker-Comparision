import React, { useRef, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { StockDataPoint } from '../types';

interface StockChartProps {
  data: StockDataPoint[];
  primaryTicker: string;
  secondaryTicker: string;
}

const renderCustomizedLabel = (props: any) => {
  const { x, y, stroke, value, index, dataLength } = props;
  
  const numPoints = dataLength || 0;
  if (numPoints < 2 || value === undefined) return null;

  const interval = numPoints > 10 ? Math.floor(numPoints / 10) : 1;
  
  if (index !== 0 && index !== numPoints - 1 && index % interval !== 0) {
    return null;
  }

  return (
    <text x={x} y={y} dy={-6} fill={stroke} fontSize={10} textAnchor="middle">
      {`$${value.toFixed(2)}`}
    </text>
  );
};


const CustomTooltip: React.FC<any> = ({ active, payload, label, primaryTicker, secondaryTicker }) => {
  if (active && payload && payload.length) {
    const primaryData = payload.find(p => p.dataKey === 'price_primary' || p.dataKey === 'prediction_primary');
    const secondaryData = payload.find(p => p.dataKey === 'price_secondary' || p.dataKey === 'prediction_secondary');
    
    return (
      <div className="p-2 bg-gray-800 border border-gray-600 rounded-md shadow-lg">
        <p className="label text-gray-200">{`${label}`}</p>
        {primaryData && primaryData.value && <p className="intro" style={{color: primaryData.color}}>{`${primaryTicker} : $${primaryData.value.toFixed(2)}`}</p>}
        {secondaryData && secondaryData.value && <p className="intro" style={{color: secondaryData.color}}>{`${secondaryTicker} : $${secondaryData.value.toFixed(2)}`}</p>}
      </div>
    );
  }
  return null;
};

const StockChart: React.FC<StockChartProps> = ({ data, primaryTicker, secondaryTicker }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const handleSaveChart = useCallback(() => {
    if (!chartContainerRef.current) {
      console.error("Chart container ref not found.");
      return;
    }

    const svgElement = chartContainerRef.current.querySelector('svg');
    if (!svgElement) {
      console.error("Could not find SVG element to save.");
      return;
    }
    
    // 1. Clone the SVG to avoid modifying the original chart
    const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
    const svgSize = svgElement.getBoundingClientRect();

    // 2. Set necessary attributes for standalone rendering
    svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svgClone.setAttribute('width', `${svgSize.width}`);
    svgClone.setAttribute('height', `${svgSize.height}`);

    // 3. Prepend a background rectangle so it's part of the image
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('x', '0');
    bgRect.setAttribute('y', '0');
    bgRect.setAttribute('width', '100%');
    bgRect.setAttribute('height', '100%');
    bgRect.setAttribute('fill', '#111827'); // Match page background (bg-gray-900)
    svgClone.insertBefore(bgRect, svgClone.firstChild);

    // 4. Serialize the modified SVG to a string
    const svgString = new XMLSerializer().serializeToString(svgClone);

    // 5. Create a robust data URL using Base64 encoding to handle special characters
    const base64Svg = btoa(unescape(encodeURIComponent(svgString)));
    const imgUrl = `data:image/svg+xml;base64,${base64Svg}`;
    
    const img = new Image();

    img.onload = () => {
      // 6. Draw the SVG image onto a canvas for conversion to PNG
      const canvas = document.createElement('canvas');
      const scaleFactor = 2; // Render at 2x for higher resolution
      canvas.width = svgSize.width * scaleFactor;
      canvas.height = svgSize.height * scaleFactor;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error("Could not get canvas context.");
        return;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // 7. Trigger download
      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const primaryName = primaryTicker || 'chart';
      const secondaryName = secondaryTicker ? `_vs_${secondaryTicker}` : '';
      const date = new Date().toISOString().split('T')[0];
      
      link.download = `${primaryName}${secondaryName}_${date}.png`;
      link.href = pngUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    img.onerror = (e) => {
        console.error("Failed to load SVG image for saving. This can happen due to browser security restrictions or SVG formatting issues.", e);
        alert("Sorry, the chart could not be saved as an image. There was an error processing the chart data.");
    };

    img.src = imgUrl;
  }, [primaryTicker, secondaryTicker]);

  const formatYAxis = (tickItem: number) => `$${tickItem.toFixed(0)}`;
  const hasSecondaryData = secondaryTicker && data.some(d => d.price_secondary !== undefined || d.prediction_secondary !== undefined);

  // Filter out data points that don't have historical data to avoid showing labels on prediction-only points
  const primaryHistoricalData = data.filter(d => d.price_primary !== undefined);

  return (
    <div ref={chartContainerRef} className="relative p-6 mt-8 bg-gray-800/50 rounded-lg shadow-xl backdrop-blur-sm border border-gray-700 w-full max-w-5xl h-[500px]">
      <button
        onClick={handleSaveChart}
        className="absolute top-4 right-4 z-10 px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500"
        aria-label="Save chart as image"
      >
        Save Chart
      </button>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
          <XAxis dataKey="date" stroke="#A0AEC0" tick={{ fontSize: 12 }} />
          <YAxis stroke="#A0AEC0" tickFormatter={formatYAxis} tick={{ fontSize: 12 }} domain={['auto', 'auto']} />
          <Tooltip content={<CustomTooltip primaryTicker={primaryTicker} secondaryTicker={secondaryTicker} />} />
          <Legend wrapperStyle={{top: 0}} />
          
          {/* Historical Data Lines */}
          <Line type="monotone" dataKey="price_primary" name={primaryTicker} stroke="#2dd4bf" strokeWidth={2} dot={false} activeDot={{ r: 6, fill: '#2dd4bf', stroke: '#fff' }}>
             <LabelList dataKey="price_primary" content={(props: object) => renderCustomizedLabel({ ...props, dataLength: primaryHistoricalData.length })} />
          </Line>
          
          {/* Prediction Data Lines */}
          <Line type="monotone" dataKey="prediction_primary" name={`${primaryTicker} (Pred.)`} stroke="#2dd4bf" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{ r: 6, fill: '#2dd4bf', stroke: '#fff' }} legendType="none" connectNulls />

          {hasSecondaryData && (
            <>
              {/* Historical Secondary Line */}
              <Line type="monotone" dataKey="price_secondary" name={secondaryTicker} stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 6, fill: '#f59e0b', stroke: '#fff' }} connectNulls>
                 <LabelList dataKey="price_secondary" content={(props: object) => renderCustomizedLabel({ ...props, dataLength: data.length })} />
              </Line>
              {/* Prediction Secondary Line */}
              <Line type="monotone" dataKey="prediction_secondary" name={`${secondaryTicker} (Pred.)`} stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{ r: 6, fill: '#f59e0b', stroke: '#fff' }} legendType="none" connectNulls />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StockChart;