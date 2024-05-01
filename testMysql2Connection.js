const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'admin',
      database: 'teltonika'
    });

    console.log('Connected to the database.');

    const [rows] = await connection.execute('SELECT 1 + 1 AS solution');
    console.log('The solution is: ', rows[0].solution);

    await connection.end();
  } catch (err) {
    console.error('Error connecting: ', err);
  }
}

testConnection();
