import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { StockDataPoint } from '../types';

interface StockChartProps {
  data: StockDataPoint[];
  primaryTicker: string;
  secondaryTicker: string;
}

const renderCustomizedLabel = (props: any) => {
  const { x, y, stroke, value, index, dataLength } = props;
  
  // To avoid clutter, only render a label for the first point, the last point,
  // and approximately 8 other points spread out across the chart.
  const numPoints = dataLength || 0;
  if (numPoints < 2) return null;

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
    const primaryData = payload.find(p => p.dataKey === 'price_primary');
    const secondaryData = payload.find(p => p.dataKey === 'price_secondary');
    
    return (
      <div className="p-2 bg-gray-800 border border-gray-600 rounded-md shadow-lg">
        <p className="label text-gray-200">{`${label}`}</p>
        {primaryData && <p className="intro" style={{color: primaryData.color}}>{`${primaryTicker} : $${primaryData.value.toFixed(2)}`}</p>}
        {secondaryData && <p className="intro" style={{color: secondaryData.color}}>{`${secondaryTicker} : $${secondaryData.value.toFixed(2)}`}</p>}
      </div>
    );
  }
  return null;
};

const StockChart: React.FC<StockChartProps> = ({ data, primaryTicker, secondaryTicker }) => {
  const formatYAxis = (tickItem: number) => `$${tickItem.toFixed(0)}`;
  const hasSecondaryData = secondaryTicker && data.some(d => d.price_secondary !== undefined && d.price_secondary !== null);

  return (
    <div className="p-6 mt-8 bg-gray-800/50 rounded-lg shadow-xl backdrop-blur-sm border border-gray-700 w-full max-w-4xl h-[500px]">
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
          <Legend />
          <Line type="monotone" dataKey="price_primary" name={primaryTicker} stroke="#2dd4bf" strokeWidth={2} dot={false} activeDot={{ r: 6, fill: '#2dd4bf', stroke: '#fff' }}>
             <LabelList dataKey="price_primary" content={(props: object) => renderCustomizedLabel({ ...props, dataLength: data.length })} />
          </Line>
          {hasSecondaryData && (
             <Line type="monotone" dataKey="price_secondary" name={secondaryTicker} stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 6, fill: '#f59e0b', stroke: '#fff' }}>
                <LabelList dataKey="price_secondary" content={(props: object) => renderCustomizedLabel({ ...props, dataLength: data.length })} />
             </Line>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StockChart;
