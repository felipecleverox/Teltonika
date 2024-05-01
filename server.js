'use strict';

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const MySQLEvents = require('@rodrigogs/mysql-events');

const app = express();
const port = process.env.PORT || 1337;

// Create a MySQL connection pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'admin',
    database: 'teltonika',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Middleware to allow CORS and parse the request body as JSON
app.use(cors());
app.use(express.json());

// Initialize MySQL events listener
const program = async () => {
    const instance = new MySQLEvents(pool, {
        startAtEnd: true, // you only want to receive events starting from now
        excludedSchemas: {
            mysql: true,
        },
    });

    await instance.start();

    instance.addTrigger({
        name: 'Monitor GPS Data for New Entries',
        expression: 'teltonika.gps_data', // specify the database and table
        statement: MySQLEvents.STATEMENTS.INSERT,
        onEvent: (event) => { // Your logic when a new row is inserted
            console.log('New GPS data inserted:', event.affectedRows);
            // Implement logic to notify clients, possibly via WebSocket or SSE
        },
    });

    instance.on(MySQLEvents.EVENTS.CONNECTION_ERROR, console.error);
    instance.on(MySQLEvents.EVENTS.ZONGJI_ERROR, console.error);
};

program().catch(console.error);

// Existing server endpoints and logic remain here

// Endpoint to receive GPS data
app.post('/gps-data', async (req, res) => {
    // your existing logic
});

// Endpoint for querying GPS data with filters
app.get('/api/get-gps-data', async (req, res) => {
    // your existing logic
});

// Endpoint to get the last known position
app.get('/api/last-known-position', async (req, res) => {
    // your existing logic
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
