import React, { useState } from 'react';
import axios from 'axios';
import './DataIntelligence.css';
import interiorSearchImage from './assets/images/interior_search.png';
import exteriorSearchImage from './assets/images/exterior_search.png';
import Header from './Header'; // Importar el componente Header

const DataIntelligence = () => {
  const [selectedOption, setSelectedOption] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    setError(null);
    try {
      const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);

      const url = selectedOption === 'interior'
        ? 'http://thenext.ddns.net:1337/api/beacon-entries-exits'
        : 'http://thenext.ddns.net:1337/api/get-gps-data';

      const params = selectedOption === 'interior'
        ? { startDate, endDate, person: '352592573522828 (autocreated)' }
        : { startDate: startTimestamp, endDate: endTimestamp };

      const response = await axios.get(url, { params });

      const results = selectedOption === 'interior'
        ? response.data.map(item => ({
            ...item,
            timestamp: item.entrada / 1000,
          }))
        : response.data.map(item => ({
            latitude: parseFloat(item.latitude),
            longitude: parseFloat(item.longitude),
            timestamp: item.unixTimestamp,
          }));

      setSearchResults(results);
    } catch (error) {
      setError(error.message);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const downloadCSV = () => {
    const headers = selectedOption === 'interior'
      ? ['Fecha', 'Hora', 'Sector', 'Entrada']
      : ['Fecha', 'Hora', 'Latitud', 'Longitud'];

    const rows = searchResults.map(item => (
      selectedOption === 'interior'
        ? [
            formatDate(item.timestamp).split(' ')[0],
            formatDate(item.timestamp).split(' ')[1],
            item.sector,
            formatDate(item.entrada / 1000),
          ]
        : [
            formatDate(item.timestamp).split(' ')[0],
            formatDate(item.timestamp).split(' ')[1],
            item.latitude,
            item.longitude,
          ]
    ));

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `historical_movements_${startDate}_${endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="data-intelligence">
      <Header title="Inteligencia de Datos" />
      <div className="routine-sectors">
        <div className="routine-row">
          <div className="routine-sector">
            <div className="routine-title">Búsqueda de Datos de Interiores</div>
            <img
              src={interiorSearchImage}
              alt="Búsqueda de Datos de Interiores"
              className="routine-image"
              onClick={() => setSelectedOption('interior')}
            />
            <button onClick={() => setSelectedOption('interior')} className="routine-button">Seleccionar</button>
          </div>
          <div className="routine-sector">
            <div className="routine-title">Búsqueda de Datos de Exteriores</div>
            <img
              src={exteriorSearchImage}
              alt="Búsqueda de Datos de Exteriores"
              className="routine-image"
              onClick={() => setSelectedOption('exterior')}
            />
            <button onClick={() => setSelectedOption('exterior')} className="routine-button">Seleccionar</button>
          </div>
        </div>
      </div>
      {selectedOption && (
        <div className="search-parameters">
          <input
            type="datetime-local"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            placeholder="Fecha y hora de inicio"
          />
          <input
            type="datetime-local"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            placeholder="Fecha y hora de fin"
          />
          <button onClick={handleSearch}>Buscar</button>
          <button onClick={downloadCSV}>Descargar Resultados</button>
          {error && <div className="error-message">Error: {error}</div>}
        </div>
      )}
      {searchResults.length > 0 && (
        <div className="data-table-container">
          <h2>Resultados de la Búsqueda</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                {selectedOption === 'interior' ? <th>Sector</th> : null}
                {selectedOption === 'exterior' ? <th>Latitud</th> : null}
                {selectedOption === 'exterior' ? <th>Longitud</th> : null}
                <th>Entrada</th>
              </tr>
            </thead>
            <tbody>
              {searchResults.map((result, index) => (
                <tr key={index}>
                  <td>{formatDate(result.timestamp).split(' ')[0]}</td>
                  <td>{formatDate(result.timestamp).split(' ')[1]}</td>
                  {selectedOption === 'interior' ? <td>{result.sector}</td> : null}
                  {selectedOption === 'exterior' ? <td>{result.latitude}</td> : null}
                  {selectedOption === 'exterior' ? <td>{result.longitude}</td> : null}
                  <td>{selectedOption === 'interior' ? formatDate(result.entrada / 1000) : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DataIntelligence;
