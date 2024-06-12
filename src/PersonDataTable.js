// PersonDataTable.js
import React from 'react';
import './PersonDataTable.css';
import './DataViewer.css'; // Importamos los estilos de DataViewer.css
import Header from './Header';

const PersonDataTable = ({ data }) => {
    return (
        <div className="data-table-container">
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Última Fecha de Detección</th>
                        <th>Última Hora de Detección</th>
                        <th>Fecha de Salida</th>
                        <th>Hora de Salida</th>
                        <th>Sector</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((item, index) => {
                        const lastDetectionDate = new Date(item.lastDetection * 1000);
                        const lastDetectionDateString = isNaN(lastDetectionDate) ? 'Invalid Date' : lastDetectionDate.toLocaleDateString();
                        const lastDetectionTimeString = isNaN(lastDetectionDate) ? 'Invalid Date' : lastDetectionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                        let exitDateString = 'N/A';
                        let exitTimeString = 'N/A';

                        if (item.exit) {
                            const exitDate = new Date(item.exit * 1000);
                            exitDateString = isNaN(exitDate) ? 'Invalid Date' : exitDate.toLocaleDateString();
                            exitTimeString = isNaN(exitDate) ? 'Invalid Date' : exitDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        }

                        console.log('Last Detection Date:', lastDetectionDateString, 'Last Detection Time:', lastDetectionTimeString); // Verificar los datos
                        console.log('Exit Date:', exitDateString, 'Exit Time:', exitTimeString); // Verificar los datos

                        return (
                            <tr key={index} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                                <td>{lastDetectionDateString}</td>
                                <td>{lastDetectionTimeString}</td>
                                <td>{exitDateString}</td>
                                <td>{exitTimeString}</td>
                                <td>Oficina Seguridad (NOC)</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default PersonDataTable;
