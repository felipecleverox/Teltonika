import React from 'react';

function DataTable({ data }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Timestamp</th>
          <th>Longitude</th>
          <th>Latitude</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, index) => (
          <tr key={index}>
            <td>{item.timestamp}</td>
            <td>{item.longitude}</td>
            <td>{item.latitude}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default DataTable;
