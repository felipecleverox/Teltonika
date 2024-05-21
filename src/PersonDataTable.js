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
                        <th>Fecha de Entrada</th>
                        <th>Hora de Entrada</th>
                        <th>Fecha de Salida</th>
                        <th>Hora de Salida</th>
                        <th>Sector</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((item, index) => {
                        const entryDate = new Date(item.entry * 1000);
                        const entryDateString = isNaN(entryDate) ? 'Invalid Date' : entryDate.toLocaleDateString();
                        const entryTimeString = isNaN(entryDate) ? 'Invalid Date' : entryDate.toLocaleTimeString();

                        let exitDateString = 'N/A';
                        let exitTimeString = 'N/A';

                        if (item.exit) {
                            const exitDate = new Date(item.exit * 1000);
                            exitDateString = isNaN(exitDate) ? 'Invalid Date' : exitDate.toLocaleDateString();
                            exitTimeString = isNaN(exitDate) ? 'Invalid Date' : exitDate.toLocaleTimeString();
                        }

                        console.log('Entry Date:', entryDateString, 'Entry Time:', entryTimeString); // Verificar los datos
                        console.log('Exit Date:', exitDateString, 'Exit Time:', exitTimeString); // Verificar los datos

                        return (
                            <tr key={index} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                                <td>{entryDateString}</td>
                                <td>{entryTimeString}</td>
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
