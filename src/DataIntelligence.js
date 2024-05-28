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
  const [isSearching, setIsSearching] = useState(false);

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    setStartDate('');
    setEndDate('');
    setSearchResults([]);
    setError(null);
  };

  const handleSearch = async () => {
    setIsSearching(true);
    setError(null);
    try {
      const startTimestamp = new Date(startDate).getTime();
      const endTimestamp = new Date(endDate).getTime();

      const url = selectedOption === 'interior'
        ? 'http://thenext.ddns.net:1337/api/beacon-entries-exits'
        : 'http://thenext.ddns.net:1337/api/get-gps-data';

      const params = selectedOption === 'interior'
        ? { startDate, endDate, person: '352592573522828 (autocreated)' }
        : { startDate: startTimestamp / 1000, endDate: endTimestamp / 1000 };

      const response = await axios.get(url, { params });

      let results = [];
      if (selectedOption === 'interior') {
        results = response.data.map(record => ({
          beaconId: record.beaconId,
          sector: record.sector,
          entrada: record.entrada * 1000, // Convertir a milisegundos
          salida: record.salida ? record.salida * 1000 : null, // Convertir a milisegundos
          tiempoPermanencia: record.tiempoPermanencia,
        }));
      } else {
        results = response.data.map(item => ({
          latitude: parseFloat(item.latitude),
          longitude: parseFloat(item.longitude),
          timestamp: item.unixTimestamp * 1000, // Convertir a milisegundos
        }));
      }

      console.log("Search Results:", results); // Verificar los resultados recibidos

      setSearchResults(results);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSearching(false);
    }
  };

  const formatDate = (timestamp, format = 'full') => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    if (format === 'time') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDuration = (durationInMillis) => {
    if (durationInMillis === 'En progreso') return 'En progreso';
    const totalMinutes = Math.floor(durationInMillis / 1000 / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const getSector = (beaconId) => {
    switch (beaconId) {
      case '0C403019-61C7-55AA-B7EA-DAC30C720055':
        return 'E/S Bodega';
      case 'E9EB8F18-61C7-55AA-9496-3AC30C720055':
        return 'Farmacia';
      case 'F7826DA6-BC5B-71E0-893E-4B484D67696F':
        return 'Entrada';
      case 'F7826DA6-BC5B-71E0-893E-6D424369696F':
        return 'Pasillo Central';
      case 'F7826DA6-BC5B-71E0-893E-54654370696F':
        return 'Electro';
      default:
        return 'Unknown';
    }
  };

  const downloadCSV = () => {
    const headers = selectedOption === 'interior'
      ? ['Sector', 'Fecha y Hora de Entrada', 'Fecha y Hora de Salida', 'Tiempo de Permanencia']
      : ['Fecha y Hora GPS', 'Latitud', 'Longitud'];

    const rows = searchResults.map(item => (
      selectedOption === 'interior'
        ? [
            item.sector,
            formatDate(item.entrada),
            item.salida ? formatDate(item.salida, 'time') : 'N/A',
            formatDuration(item.tiempoPermanencia),
          ]
        : [
            formatDate(item.timestamp),
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
              onClick={() => handleOptionSelect('interior')}
            />
            <button
              onClick={() => handleOptionSelect('interior')}
              className="routine-button"
              disabled={isSearching && selectedOption !== 'interior'}
            >
              Seleccionar
            </button>
          </div>
          <div className="routine-sector">
            <div className="routine-title">Búsqueda de Datos de Exteriores</div>
            <img
              src={exteriorSearchImage}
              alt="Búsqueda de Datos de Exteriores"
              className="routine-image"
              onClick={() => handleOptionSelect('exterior')}
            />
            <button
              onClick={() => handleOptionSelect('exterior')}
              className="routine-button"
              disabled={isSearching && selectedOption !== 'exterior'}
            >
              Seleccionar
            </button>
          </div>
        </div>
      </div>
      {selectedOption && (
        <>
          <div className="selected-option-message">
            Ha seleccionado {selectedOption === 'interior' ? 'Búsqueda de Datos de Interiores' : 'Búsqueda de Datos de Exteriores'}
          </div>
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
            <button onClick={handleSearch} disabled={isSearching}>Buscar</button>
            <button onClick={downloadCSV} disabled={isSearching || searchResults.length === 0} style={{ backgroundColor: isSearching || searchResults.length === 0 ? '#d3d3d3' : '#28a745' }}>
              Descargar Resultados
            </button>
            {error && <div className="error-message">Error: {error}</div>}
          </div>
        </>
      )}
      {searchResults.length > 0 && (
        <div className="data-table-container">
          <h2>Resultados de la Búsqueda</h2>
          <table className="data-table">
            <thead>
              <tr>
                {selectedOption === 'interior' ? <th>Sector</th> : <th>Fecha y Hora GPS</th>}
                {selectedOption === 'interior' ? <th>Fecha y Hora de Entrada</th> : null}
                {selectedOption === 'interior' ? <th>Fecha y Hora de Salida</th> : null}
                {selectedOption === 'interior' ? <th>Tiempo de Permanencia</th> : <th>Latitud</th>}
                {selectedOption === 'exterior' ? <th>Longitud</th> : null}
              </tr>
            </thead>
            <tbody>
              {searchResults.map((result, index) => (
                <tr key={index}>
                  {selectedOption === 'interior' ? <td>{result.sector}</td> : <td>{formatDate(result.timestamp)}</td>}
                  {selectedOption === 'interior' ? <td>{formatDate(result.entrada)}</td> : null}
                  {selectedOption === 'interior' ? <td>{result.salida ? formatDate(result.salida, 'time') : 'N/A'}</td> : null}
                  {selectedOption === 'interior' ? <td>{formatDuration(result.tiempoPermanencia)}</td> : <td>{result.latitude}</td>}
                  {selectedOption === 'exterior' ? <td>{result.longitude}</td> : null}
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
