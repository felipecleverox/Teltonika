import React from 'react';
import './HistoricalDataTable.css';

const HistoricalDataTable = ({ data }) => {
  return (
    <div className="historical-data-table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Hora</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => {
            const timestamp = item.unixTimestamp;
            const date = new Date(timestamp * 1000);
            const dateString = date.toLocaleDateString();
            const timeString = date.toLocaleTimeString();
            return (
              <tr key={index}>
                <td>{dateString}</td>
                <td>{timeString}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default HistoricalDataTable;
