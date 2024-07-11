import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from 'recharts';
import Header from './Header';
import dayjs from 'dayjs';
import './Dashboard.css';

const Dashboard = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [presenceData, setPresenceData] = useState(null);
  const [doorStatusData, setDoorStatusData] = useState(null);
  const [doorChangeData, setDoorChangeData] = useState(null);
  const [currentDoorStatus, setCurrentDoorStatus] = useState(null);

  useEffect(() => {
    fetchPresenceData(selectedDate);
    fetchDoorStatusData(selectedDate);
    fetchDoorChangeData(selectedDate);
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

  const fetchDoorChangeData = async (date) => {
    const currentDate = dayjs(date);
    const previousDate = currentDate.subtract(1, 'day');

    const startDateCurrent = currentDate.set('hour', 8).set('minute', 0).set('second', 0).format('YYYY-MM-DD HH:mm:ss');
    const endDateCurrent = currentDate.set('hour', 23).set('minute', 30).set('second', 0).format('YYYY-MM-DD HH:mm:ss');

    const startDatePrevious = previousDate.set('hour', 8).set('minute', 0).set('second', 0).format('YYYY-MM-DD HH:mm:ss');
    const endDatePrevious = previousDate.set('hour', 23).set('minute', 30).set('second', 0).format('YYYY-MM-DD HH:mm:ss');

    try {
      const [responseCurrent, responsePrevious] = await Promise.all([
        axios.get('/api/door-status', { params: { startDate: startDateCurrent, endDate: endDateCurrent } }),
        axios.get('/api/door-status', { params: { startDate: startDatePrevious, endDate: endDatePrevious } })
      ]);

      console.log('Door Change Data Response (Current):', responseCurrent.data);
      console.log('Door Change Data Response (Previous):', responsePrevious.data);

      processDoorChangeData(responseCurrent.data, responsePrevious.data, currentDate, previousDate);
    } catch (error) {
      console.error('Error fetching door change data:', error);
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

  const processDoorChangeData = (dataCurrent, dataPrevious, currentDate, previousDate) => {
    const processData = (data) => {
      let changeCount = 0;
      let lastStatus = null;
      let currentStatus = null;

      data.forEach((entry, index) => {
        if (index === 0) {
          lastStatus = entry.magnet_status;
        } else {
          if (entry.magnet_status !== lastStatus) {
            changeCount++;
            lastStatus = entry.magnet_status;
          }
        }
        currentStatus = entry.magnet_status;
      });

      return { changeCount, currentStatus };
    };

    const currentResult = processData(dataCurrent);
    const previousResult = processData(dataPrevious);

    const statusLabelCurrent = currentResult.currentStatus === 0 ? "Status: Abierta" : "Status: Cerrada";
    const statusColorCurrent = currentResult.currentStatus === 0 ? "#4CAF50" : "#F44336";

    setCurrentDoorStatus(currentResult.currentStatus);

    setDoorChangeData([
      {
        name: previousDate.format('YYYY-MM-DD'),
        count: previousResult.changeCount,
        color: '#20B2AA', // Light Sea Green
      },
      { 
        name: currentDate.format('YYYY-MM-DD'),
        count: currentResult.changeCount, 
        color: '#6A5ACD', // Slate Blue
        statusLabel: statusLabelCurrent,
        statusColor: statusColorCurrent
      }
    ]);
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

  const CustomizedLabel = (props) => {
    const { x, y, width, value, statusLabel, statusColor } = props;
    return (
      <g>
        <text x={x + width / 2} y={y - 5} fill="#000000" textAnchor="middle" dominantBaseline="middle">
          {value}
        </text>
        {statusLabel && (
          <>
            <rect x={x} y={y - 35} width={width} height={20} fill="#000000" />
            <text x={x + width / 2} y={y - 25} fill={statusColor} textAnchor="middle" dominantBaseline="middle" fontSize="12">
              {statusLabel}
            </text>
          </>
        )}
      </g>
    );
  };

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
        <div className="chart-section">
          <h2>Frecuencia de Cambios de Estado de Puertas</h2>
          {currentDoorStatus !== null && (
            <div className="current-status-label" style={{
              backgroundColor: 'black',
              color: currentDoorStatus === 0 ? '#4CAF50' : '#F44336',
              padding: '5px 10px',
              borderRadius: '5px',
              marginBottom: '10px',
              display: 'inline-block'
            }}>
              Status Actual: {currentDoorStatus === 0 ? 'Abierta' : 'Cerrada'}
            </div>
          )}
          {doorChangeData ? (
            <BarChart width={400} height={300} data={doorChangeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count">
                {doorChangeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
                <LabelList dataKey="count" content={<CustomizedLabel />} />
              </Bar>
            </BarChart>
          ) : (
            <p>Cargando datos de cambios de estado de puertas...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;