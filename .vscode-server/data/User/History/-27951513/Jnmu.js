import React from 'react';
import SevenSegmentDisplay from 'react-7-segment-display';
import './DashboardTemperatura.css';

const TemperatureDisplay = ({ temperature, channelName, timestamp }) => {
  const formatTemperature = (temp) => {
    if (temp === null || isNaN(temp)) return '--';
    return temp.toFixed(1).padStart(4, ' ');
  };

  const formattedTemp = formatTemperature(temperature);

  return (
    <div className="temperature-display">
      <SevenSegmentDisplay 
        value={formattedTemp}
        color="#FF0000"
        backgroundColor="#000000"
        height={100}
        count={4}
        digitCount={4}
      />
      <div className="temperature-channel">{channelName}</div>
      <div className="temperature-timestamp">{new Date(timestamp).toLocaleString()}</div>
    </div>
  );
};

export default TemperatureDisplay;