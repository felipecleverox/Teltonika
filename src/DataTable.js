import React from 'react';

function DataTable({ data }) {
    console.log("Data received in DataTable:", data);  // Verifica los datos recibidos

    return (
        <table className="data-table">
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Longitud</th>
                    <th>Latitud</th>
                </tr>
            </thead>
            <tbody>
                {data.map((item, index) => (
                    <tr key={index}>
                        <td>{item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'No valid date'}</td>
                        <td>{item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : 'No valid time'}</td>
                        <td>{item.longitude}</td>
                        <td>{item.latitude}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}


export default DataTable;
