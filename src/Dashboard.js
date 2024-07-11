import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import Header from './Header';
import dayjs from 'dayjs';
import './Dashboard.css';

const Dashboard = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [presenceData, setPresenceData] = useState(null);
  const [doorStatusData, setDoorStatusData] = useState(null);

  useEffect(() => {
    fetchPresenceData(selectedDate);
    fetchDoorStatusData(selectedDate);
  }, [selectedDate]);

  const fetchPresenceData = async (date) => {
    const startDate = dayjs(date).set('hour', 8).set('minute', 0).set('second', 0).format('YYYY-MM-DD HH:mm:ss');
    const endDate = dayjs(date).set('hour', 23).set('minute', 30).set('second', 0).format('YYYY-MM-DD HH:mm:ss');

    try {
      const response = await axios.get('/api/beacons-detection-status', {
        params: { startDate, endDate }
      });
      console.log('Presence Data Response:', response.data);
      generatePresencePieChartData(response.data);
    } catch (error) {
      console.error('Error fetching presence data:', error);
    }
  };

  const fetchDoorStatusData = async (date) => {
    const startDate = dayjs(date).set('hour', 8).set('minute', 0).set('second', 0).format('YYYY-MM-DD HH:mm:ss');
    const endDate = dayjs(date).set('hour', 23).set('minute', 0).set('second', 0).format('YYYY-MM-DD HH:mm:ss');

    try {
      const response = await axios.get('/api/door-status', {
        params: { startDate, endDate }
      });
      console.log('Door Status Data Response:', response.data);
      generateDoorStatusPieChartData(response.data);
    } catch (error) {
      console.error('Error fetching door status data:', error);
    }
  };

  const generatePresencePieChartData = (data) => {
    const statusCounts = {
      'Verde': 0,
      'Rojo': 0,
      'Amarillo': 0,
      'Negro': 0
    };

    data.forEach(entry => {
      Object.values(entry).forEach(status => {
        if (statusCounts.hasOwnProperty(status)) {
          statusCounts[status]++;
        }
      });
    });

    const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
    const chartData = Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count,
      percentage: ((count / total) * 100).toFixed(2)
    }));

    console.log('Generated Presence Chart Data:', chartData);
    setPresenceData(chartData);
  };

  const generateDoorStatusPieChartData = (data) => {
    const openCount = data.filter(d => d.magnet_status === 0).length;
    const closedCount = data.filter(d => d.magnet_status === 1).length;
    const total = openCount + closedCount;

    const chartData = [
      { name: 'Abierto', value: openCount, percentage: ((openCount / total) * 100).toFixed(2) },
      { name: 'Cerrado', value: closedCount, percentage: ((closedCount / total) * 100).toFixed(2) }
    ];

    console.log('Generated Door Status Chart Data:', chartData);
    setDoorStatusData(chartData);
  };

  const COLORS = ['#4CAF50', '#F44336', '#FFEB3B', '#212121'];
  const DOOR_COLORS = ['#26b43bcf', '#af4c4f'];

  const renderCustomizedLabel = (entry) => {
    return `${entry.percentage}%`;
  };

  const presenceStatusLegend = {
    'Verde': 'Presencia OK',
    'Rojo': 'Presencia menor al esperado',
    'Amarillo': 'Presencia baja',
    'Negro': 'No hubo presencia'
  };

  console.log('Rendering Dashboard. Presence Data:', presenceData, 'Door Status Data:', doorStatusData);

  return (
    <div className="dashboard">
      <Header title="Dashboard" />
      <div className="dashboard-header">
        <h1 className="dashboard-title">Resumen del Día</h1>
        <DatePicker 
          selected={selectedDate} 
          onChange={setSelectedDate} 
          dateFormat="yyyy-MM-dd"
          className="date-picker"
        />
      </div>
      <div className="charts-container">
        <div className="chart-section">
          <h2>Status de Presencia</h2>
          {presenceData ? (
            <PieChart width={400} height={400}>
              <Pie
                data={presenceData}
                cx={200}
                cy={200}
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {presenceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend
                formatter={(value) => presenceStatusLegend[value] || value}
              />
            </PieChart>
          ) : (
            <p>Cargando datos de presencia...</p>
          )}
        </div>
        <div className="chart-divider"></div>
        <div className="chart-section">
          <h2>Estado de Puertas por Sector</h2>
          {doorStatusData ? (
            <PieChart width={400} height={400}>
              <Pie
                data={doorStatusData}
                cx={200}
                cy={200}
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {doorStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={DOOR_COLORS[index % DOOR_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          ) : (
            <p>Cargando datos de estado de puertas...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;