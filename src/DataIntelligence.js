import React, { useState } from 'react';
import axios from 'axios';
import './DataIntelligence.css';
import interiorSearchImage from './assets/images/interior_search.png';
import exteriorSearchImage from './assets/images/exterior_search.png';
import Header from './Header'; // Import the Header component

const DataIntelligence = () => {
  // State to store the selected search option (interior or exterior)
  const [selectedOption, setSelectedOption] = useState('');
  // State to store the start date and time for the search
  const [startDate, setStartDate] = useState('');
  // State to store the end date and time for the search
  const [endDate, setEndDate] = useState('');
  // State to store the search results
  const [searchResults, setSearchResults] = useState([]);
  // State to store any error messages during data fetching
  const [error, setError] = useState(null);
  // State to track whether a search is in progress
  const [isSearching, setIsSearching] = useState(false);

  // Function to handle the selection of a search option
  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    // Clear previous search parameters and results when a new option is selected
    setStartDate('');
    setEndDate('');
    setSearchResults([]);
    setError(null);
  };

  // Function to handle the search request
  const handleSearch = async () => {
    // Set the isSearching state to true to indicate that a search is in progress
    setIsSearching(true);
    // Clear any previous error messages
    setError(null);
    try {
      // Convert the start and end dates to timestamps
      const startTimestamp = new Date(startDate).getTime();
      const endTimestamp = new Date(endDate).getTime();

      // Determine the API endpoint and parameters based on the selected option
      const url = selectedOption === 'interior'
        ? 'http://thenext.ddns.net:1337/api/beacon-entries-exits'
        : 'http://thenext.ddns.net:1337/api/get-gps-data';

      const params = selectedOption === 'interior'
        ? { startDate, endDate, person: '352592573522828 (autocreated)' }
        : { startDate: startTimestamp / 1000, endDate: endTimestamp / 1000 };

      // Make a GET request to the API endpoint with the parameters
      const response = await axios.get(url, { params });

      // Process the results based on the selected option
      let results = [];
      if (selectedOption === 'interior') {
        // Process interior data (beacon entries and exits)
        results = response.data.map(record => ({
          beaconId: record.beaconId,
          sector: record.sector,
          entrada: record.entrada ,//* 1000, // Convert to milliseconds
          salida: record.salida ? record.salida : null, //* 1000 : null, // Convert to milliseconds
          tiempoPermanencia: record.tiempoPermanencia,
        }));
      } else {
        // Process exterior data (GPS locations)
        results = response.data.map(item => ({
          latitude: parseFloat(item.latitude),
          longitude: parseFloat(item.longitude),
          timestamp: item.unixTimestamp * 1000, // Convert to milliseconds
        }));
      }

      console.log("Search Results:", results); // Log the search results

      // Update the searchResults state with the processed results
      setSearchResults(results);
    } catch (error) {
      // Handle any errors during data fetching and update the error state
      setError(error.message);
    } finally {
      // Set the isSearching state to false to indicate the search is complete
      setIsSearching(false);
    }
  };

  // Function to format a timestamp into a human-readable date and time string
  const formatDate = (timestamp, format = 'full') => {
   // if (!timestamp) return 'N/A';
    //const date = new Date(timestamp);
    //if (format === 'time') {
      //return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    //}
    //return date.toLocaleDateString([], { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    //return date.toGMTString();
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
     return date.toLocaleDateString([], { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Function to format a duration in milliseconds into a human-readable string (hours and minutes)
  const formatDuration = (durationInMillis) => {
    if (durationInMillis === 'En progreso') return 'En progreso';
    const totalMinutes = Math.floor(durationInMillis / 1000 / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  // Function to get the sector name based on the beacon ID
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

  // Function to download the search results as a CSV file
  const downloadCSV = () => {
    // Define the CSV headers based on the selected option
    const headers = selectedOption === 'interior'
      ? ['Sector', 'Fecha y Hora de Entrada', 'Fecha y Hora de Salida', 'Tiempo de Permanencia']
      : ['Fecha y Hora GPS', 'Latitud', 'Longitud'];

    // Extract the data from the searchResults state and format it for CSV
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

    // Create a CSV string with the headers and rows
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");

    // Create a Blob object from the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    // Create a link element to trigger the download
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
      {/* Display the Header component */}
      <Header title="Inteligencia de Datos" />

      {/* Display the section to select the search option (interior or exterior) */}
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
            {/* Button to select the interior search option */}
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
            {/* Button to select the exterior search option */}
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

      {/* Display the search parameters and results if an option has been selected */}
      {selectedOption && (
        <>
          {/* Display a message indicating the selected search option */}
          <div className="selected-option-message">
            Ha seleccionado {selectedOption === 'interior' ? 'Búsqueda de Datos de Interiores' : 'Búsqueda de Datos de Exteriores'}
          </div>
          {/* Section for search parameters (start/end date) */}
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
            {/* Button to trigger the search */}
            <button onClick={handleSearch} disabled={isSearching}>Buscar</button>
            {/* Button to download the search results */}
            <button onClick={downloadCSV} disabled={isSearching || searchResults.length === 0} style={{ backgroundColor: isSearching || searchResults.length === 0 ? '#d3d3d3' : '#28a745' }}>
              Descargar Resultados
            </button>
            {/* Display any error message if data fetching failed */}
            {error && <div className="error-message">Error: {error}</div>}
          </div>
        </>
      )}

      {/* Display the table with search results if available */}
      {searchResults.length > 0 && (
        <div className="data-table-container">
          <h2>Resultados de la Búsqueda</h2>
          <table className="data-table">
            <thead>
              <tr>
                {/* Table headers depend on the selected option */}
                {selectedOption === 'interior' ? <th>Sector</th> : <th>Fecha y Hora GPS</th>}
                {selectedOption === 'interior' ? <th>Fecha y Hora de Entrada</th> : null}
                {selectedOption === 'interior' ? <th>Fecha y Hora de Salida</th> : null}
                {selectedOption === 'interior' ? <th>Tiempo de Permanencia</th> : <th>Latitud</th>}
                {selectedOption === 'exterior' ? <th>Longitud</th> : null}
              </tr>
            </thead>
            <tbody>
              {/* Iterate over the search results and display each entry */}
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
/*
Explanation of Comments:
State variables:
selectedOption: Stores the currently selected search option (interior or exterior).
startDate, endDate: Store the start and end date and time for the search.
searchResults: Stores an array of search results.
error: Stores any error message during data fetching.
isSearching: Tracks whether a search is currently in progress.
Functions:
handleOptionSelect:
Handles the selection of a search option (interior or exterior).
Clears previous search parameters and results.
handleSearch:
Fetches data from the API based on the selected search option and parameters.
Processes the results differently for interior and exterior data.
Updates the searchResults state with the fetched data.
Handles potential errors during data fetching.
formatDate:
Formats a timestamp into a user-friendly date and time string.
formatDuration:
Formats a duration in milliseconds into a human-readable string (hours and minutes).
getSector:
Maps a beacon ID to a corresponding sector name.
downloadCSV:
Downloads the search results as a CSV file for the user.
JSX rendering:
Displays the Header component.
Displays a section to select the search option (interior or exterior) with images and buttons.
Displays a section for search parameters (start/end date and time) with buttons to trigger the search and download results.
Displays a table to present the search results based on the selected option.
Summary:
This component provides a search interface for both interior and exterior data. Users can choose between searching for beacon entries and exits (interior) or GPS data (exterior). The component allows filtering data by date range and downloads the results as a CSV file. This component offers a flexible and powerful tool for analyzing location data from different sources.
*/