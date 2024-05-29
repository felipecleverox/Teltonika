import React, { useState } from 'react';
import axios from 'axios';
import './PersonSearch.css';
import personal3Icon from 'C:/Users/cleve/source/repos/Teltonika/Teltonika/src/assets/images/Personal 3.png';
import planoSectores from './assets/images/plano_sectores.jpg'; // Ensure this path is correct
import Header from './Header'; // Import the new header component

function PersonSearch() {
    // State to store the start date and time
    const [startDate, setStartDate] = useState('');
    // State to store the end date and time
    const [endDate, setEndDate] = useState('');
    // State to store the search results
    const [searchResults, setSearchResults] = useState([]);

    // Function to fetch the search results from the server
    const fetchSearchResults = async () => {
        try {
            // Make a GET request to the API endpoint with the search parameters
            const response = await axios.get('http://thenext.ddns.net:1337/api/beacon-entries-exits', {
                params: {
                    startDate,
                    endDate,
                    person: '352592573522828 (autocreated)' // Name of the device
                }
            });
            console.log('Data received:', response.data);
            setSearchResults(response.data);
        } catch (error) {
            console.error('Error fetching search results:', error);
        }
    };

    // Function to format a timestamp into a human-readable date and time string
    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp);
        return date.toLocaleString();
    };

    // Function to get the sector name based on the beacon ID
    const getSector = (beaconId) => {
        switch (beaconId) {
            case '0C403019-61C7-55AA-B7EA-DAC30C720055':
                return <span style={{ color: '#c1ff72' }}>E/S Bodega</span>;
            case 'E9EB8F18-61C7-55AA-9496-3AC30C720055':
                return <span style={{ color: '#8c52ff' }}>Farmacia</span>;
            case 'F7826DA6-BC5B-71E0-893E-4B484D67696F':
                return <span style={{ color: '#ffbd59' }}>Entrada</span>;
            case 'F7826DA6-BC5B-71E0-893E-6D424369696F':
                return <span style={{ color: '#5ce16e' }}>Pasillo Central</span>;
            case 'F7826DA6-BC5B-71E0-893E-54654370696F':
                return <span style={{ color: '#ffde59' }}>Electro</span>;
            default:
                return 'Unknown';
        }
    };

    // Function to download the search results as a CSV file
    const downloadCSV = () => {
        const headers = ['Personal', 'Sector', 'Entrada'];
        const rows = searchResults.map(result => [
            'Personal 3', // Assuming the icon represents "Personal 3"
            getSector(result.beaconId).props.children, // Extract the sector text
            formatDate(result.entrada)
        ]);

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
        <div className="person-search">
            {/* Display the Header component */}
            <Header title="Busqueda Histórica Ubicación Interiores" />

            {/* Display the image container with the floor plan image */}
            <div className="image-container">
                <img src={planoSectores} alt="Plano Sectores" className="plano-sectores" />
            </div>

            {/* Display the search parameters section */}
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
                <button onClick={fetchSearchResults}>Buscar</button>
                <button onClick={downloadCSV}>Descargar Resultados</button>
            </div>

            {/* Display the table with the search results */}
            <table className="search-results-table">
                <thead>
                    <tr>
                        <th>Personal</th>
                        <th>Sector</th>
                        <th>Entrada</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Iterate over the search results and render each entry */}
                    {searchResults.map((result, index) => (
                        <tr key={index}>
                            <td><img src={personal3Icon} alt="Personal 3" style={{ width: '10px' }} /></td>
                            <td>{getSector(result.beaconId)}</td>
                            <td>{formatDate(result.entrada)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default PersonSearch;
/*
Explanation of Comments:
State variables:
startDate: Holds the start date and time for the search.
endDate: Holds the end date and time for the search.
searchResults: Holds an array of the search results (beacon entries).
Functions:
fetchSearchResults:
Makes a GET request to the API endpoint /api/beacon-entries-exits with the search parameters.
Fetches the beacon entries within the specified date range and for the selected person.
Updates the searchResults state with the fetched data.
formatDate:
Formats a timestamp into a user-friendly date and time string.
getSector:
Maps a beacon ID to a corresponding sector name using a switch statement.
downloadCSV:
Downloads the search results as a CSV file for the user.
JSX rendering:
Displays the Header component.
Displays an image container with the floor plan.
Displays a section for search parameters (start/end date) with buttons for searching and downloading results.
Displays a table to present the search results (beacon entries), including the sector and entry time.
Summary:
This component allows the user to search for historical beacon entries for a specific person within the building. It fetches data from the server, presents it in a table, and allows the user to download the results in CSV format.
*/
