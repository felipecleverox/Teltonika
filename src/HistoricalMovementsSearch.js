import React, { useState } from 'react';
import axios from 'axios';
import MapView from './MapView';
import LastKnownPosition from './LastKnownPosition'; // Import the LastKnownPosition component
import DataTable from './DataTable';
import Header from './Header'; // Import the Header component
import './HistoricalMovementsSearch.css'; // Import the CSS styles

const HistoricalMovementsSearch = () => {
  // State to store the start date and time for the search
  const [startDate, setStartDate] = useState('');
  // State to store the end date and time for the search
  const [endDate, setEndDate] = useState('');
  // State to store the coordinates of the historical path
  const [pathCoordinates, setPathCoordinates] = useState([]);
  // State to store any error messages during data fetching
  const [historicalDataError, setHistoricalDataError] = useState(null);

  // Function to handle the search request
  const handleSearch = async () => {
    // Clear any previous error messages
    setHistoricalDataError(null);
    try {
      // Convert the start and end dates to timestamps
      const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);

      // Make a GET request to the API endpoint to fetch the historical GPS data
      const response = await axios.get('http://thenext.ddns.net:1337/api/get-gps-data', {
        params: {
          startDate: startTimestamp,
          endDate: endTimestamp
        }
      });

      // Transform the fetched data into an array of coordinates
      const newCoordinates = response.data.map(item => {
        const latitude = parseFloat(item.latitude);
        const longitude = parseFloat(item.longitude);
        return { latitude, longitude, timestamp: item.unixTimestamp };
      });

      // Update the pathCoordinates state with the new coordinates
      setPathCoordinates(newCoordinates);
    } catch (error) {
      // Handle any errors during data fetching and update the error state
      setHistoricalDataError(error.message);
    }
  };

  // Function to format a timestamp into a user-friendly date and time string
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Function to download the historical data as a CSV file
  const downloadCSV = () => {
    // Define the CSV headers
    const headers = ['Fecha', 'Hora', 'Latitud', 'Longitud'];
    // Extract the data from the pathCoordinates state and format it for CSV
    const rows = pathCoordinates.map(item => [
      formatDate(item.timestamp).split(' ')[0],
      formatDate(item.timestamp).split(' ')[1],
      item.latitude,
      item.longitude
    ]);

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
    <div>
      {/* Display the Header component */}
      <Header title="Consulta Histórica de Movimientos en Exterior" />

      {/* Display the LastKnownPosition component without the header */}
      <LastKnownPosition showHeader={false} /> 

      {/* Display the section for search parameters */}
      <div className="search-parameters">
        <input
          type="datetime-local"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          placeholder="Start Date and Time"
        />
        <input
          type="datetime-local"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
          placeholder="End Date and Time"
        />
        <button onClick={handleSearch}>Buscar</button>
        <button onClick={downloadCSV}>Descargar Resultados</button>
        {/* Display any error message if data fetching failed */}
        {historicalDataError && <div className="error-message">Error: {historicalDataError}</div>}
      </div>

      {/* Display the map container for visualizing the historical path */}
      <div className="map-container">
        <h2>Map View</h2>
        {/* Display a message if no data is available for the selected range */}
        {pathCoordinates.length === 0 ? (
          <p>No data available for the selected range</p>
        ) : (
          // Display the MapView component with the historical path coordinates
          <MapView pathCoordinates={pathCoordinates.map(({ latitude, longitude }) => [latitude, longitude])} />
        )}
      </div>

      {/* Display the table with historical location data if available */}
      {pathCoordinates.length > 0 && (
        <div className="data-table-container">
          <h2>Tabla de Datos de Ubicaciones</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Latitud</th>
                <th>Longitud</th>
              </tr>
            </thead>
            <tbody>
              {/* Iterate over the pathCoordinates and display each location record */}
              {pathCoordinates.map(({ latitude, longitude, timestamp }, index) => (
                <tr key={index}>
                  <td>{formatDate(timestamp).split(' ')[0]}</td>
                  <td>{formatDate(timestamp).split(' ')[1]}</td>
                  <td>{latitude}</td>
                  <td>{longitude}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HistoricalMovementsSearch;
/*
Explanation of Comments:
State variables:
startDate: Stores the start date and time for the search.
endDate: Stores the end date and time for the search.
pathCoordinates: Stores an array of coordinates representing the historical path.
historicalDataError: Stores any error message that occurred during data fetching.
Functions:
handleSearch:
Fetches historical GPS data from the server based on the selected date range.
Parses the response and converts it into an array of coordinate objects.
Updates the pathCoordinates state with the fetched data.
Handles potential errors during data fetching.
formatDate:
Formats a timestamp into a human-readable date and time string.
downloadCSV:
Downloads the historical location data as a CSV file for the user.
JSX rendering:
Displays the Header component with the title "Consulta Histórica de Movimientos en Exterior."
Displays the LastKnownPosition component without the header.
Displays a section for search parameters (start/end date and time) with buttons to trigger the search and download results.
Displays the MapView component to show the historical path on a map.
Displays a table with the historical location data if available.
Summary:
This component allows the user to search for historical GPS data within a specific date range, displaying the results on a map and in a table. It also allows downloading the historical data as a CSV file. This component is used to analyze the movement history of a Teltonika device in the exterior environment.
*/
