const express = require("express");
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require('path');

dotenv.config({ path: './.env' });

const app = express();
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DB_DATABASE,
  port: 3306,
  ssl: {
    ca: fs.readFileSync(path.resolve(__dirname, "DigiCertGlobalRootCA.crt.pem"))
  }
});

const queryAsync = async (sql, values) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query(sql, values);
    return rows;
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    throw error;  // Re-throw the error after logging it
  } finally {
    if (connection) connection.release();
  }
};


// Function to handle result retrieval
const getResultBySemester = async (req, res, semester) => {
  const { reg_no ,eiin} = req.query;

  // Validate reg_no format if needed

  if (!reg_no) {
    res.status(400).json({ error: 'Bad Request: Registration number is required' });
    return;
  }

  try {
    const results = await queryAsync('SELECT * FROM result WHERE reg_no = ? AND semester = ? AND eiin = ?', [reg_no, semester,eiin]);
    if (results.length === 0) {
      res.status(404).json({ error: 'Record not found' });
    } else {
      res.json(results);
    }
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
app.get('/EIINInfo', async (req, res) => {
  const {eiin } = req.query;

  // Validate inputs
  if (!eiin) {
    res.status(400).json({ error: 'Bad Request: Registration number and date of birth are required' });
    return;
  }

  try {
    const results = await queryAsync('SELECT * FROM Institution WHERE eiin = ?', [eiin]);

    if (results.length === 0) {
      res.status(404).json({ error: 'EIIN Number not found' });
    } else {
      res.json(results);
    }
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Define routes
app.get('/StudentInfo', async (req, res) => {
  const { reg_no, dateofbirth,eiin } = req.query;

  // Validate inputs
  if (!reg_no || !dateofbirth||!eiin) {
    res.status(400).json({ error: 'Bad Request: Registration number and date of birth are required' });
    return;
  }

  try {
    const results = await queryAsync('SELECT * FROM studentinfo WHERE reg_no = ? AND date_of_birth = ? AND eiin = ?', [reg_no, dateofbirth,eiin]);

    if (results.length === 0) {
      res.status(404).json({ error: 'Record not found' });
    } else {
      res.json(results);
    }
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Define routes
app.get('/StudentInfoschool', async (req, res) => {
  const { reg_no, dateofbirth,cls,eiin } = req.query;

  // Validate inputs
  if (!reg_no || !dateofbirth||!cls||!eiin) {
    res.status(400).json({ error: 'Bad Request: Registration number and date of birth are required' });
    return;
  }

  try {
    const results = await queryAsync('SELECT * FROM studentinfoschool WHERE reg_no = ? AND date_of_birth = ? AND cls=? AND eiin = ?', [reg_no, dateofbirth,cls,eiin]);

    if (results.length === 0) {
      res.status(404).json({ error: 'Record not found' });
    } else {
      res.json(results);
    }
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Define routes
app.get('/StudentFullResults', async (req, res) => {
  const { reg_no,eiin} = req.query;

  // Validate inputs
  if (!reg_no||!eiin) {
    res.status(400).json({ error: 'Bad Request: Registration number.' });
    return;
  }

  try {
    const results = await queryAsync('SELECT * FROM result WHERE reg_no = ? AND eiin = ?', [reg_no,eiin]);

    if (results.length === 0) {
      res.status(404).json({ error: 'Record not found' });
    } else {
      res.json(results);
    }
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Define routes
app.get('/StudentFullResultsschool', async (req, res) => {
  const { reg_no,cls,eiin} = req.query;

  // Validate inputs
  if (!reg_no||!cls) {
    res.status(400).json({ error: 'Bad Request: Registration number.' });
    return;
  }

  try {
    const results = await queryAsync('SELECT * FROM resultschool WHERE reg_no = ? AND cls = ? AND eiin =?', [reg_no,cls,eiin]);

    if (results.length === 0) {
      res.status(404).json({ error: 'Record not found' });
    } else {
      res.json(results);
    }
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/getResults/:semester', async (req, res) => {
  const semester = req.params.semester;
  // Validate semester if needed
  switch (semester) {
    case '1st':
    case '2nd':
    case '3rd':
    case '4th':
    case '5th':
    case '6th':
    case '7th':
    case '8th':
      getResultBySemester(req, res, semester);
      break;
    default:
      res.status(400).json({ error: 'Bad Request: Invalid semester' });
  }
});

app.post("/VDSCreator", async (req, res) => {
  try {
    // Extract data from the request body
    const { name, mobile, email, password } = req.body;
    
    // Perform necessary validations on the data if needed

    // Example SQL query to insert data into a database table
    const sql = "INSERT INTO VDSCreatorInfo (name, mobile, email, password) VALUES (?, ?, ?, ?)";
    const values = [name, mobile, email, password];

    // Execute the SQL query - you'll need to implement your own queryAsync function
    // For instance, using a MySQL library such as mysql2
    await queryAsync(sql, values);

    // Send a success response
    res.status(200).json({ message: "Data inserted successfully" });
  } catch (error) {
    // Send an error response if something goes wrong
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/VDSdata", async (req, res) => {
  try {
    // Extract data from the request body
    const { name, email, publickey, privateKey } = req.body;
    
    // Perform necessary validations on the data if needed

    // Example SQL query to insert data into a database table
    const sql = "INSERT INTO vds_data (name, publickey, email, privateKey) VALUES (?, ?, ?, ?)";
    const values = [name, publickey, email, privateKey];

    // Execute the SQL query - you'll need to implement your own queryAsync function
    // For instance, using a MySQL library such as mysql2
    await queryAsync(sql, values);

    // Send a success response
    res.status(200).json({ message: "Data inserted successfully" });
  } catch (error) {
    // Send an error response if something goes wrong
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get('/VDSCreatorInfo', async (req, res) => {
  const { email, password } = req.query;
  // Validate inputs
  if (!email || !password) {
    res.status(400).json({ error: 'Bad Request: Registration number and date of birth are required' });
    return;
  }
  try {
    const results = await queryAsync('SELECT * FROM VDSCreatorInfo WHERE email = ? AND password = ?', [email, password]);

    if (results.length === 0) {
      res.status(404).json({ error: 'Record not found' });
    } else {
      res.json(results);
    }
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/PKIInfo', async (req, res) => {
  const {name,email} = req.query;

  // Validate inputs
  if (!name) {
    res.status(400).json({ error: 'Bad Request: Registration number and date of birth are required' });
    return;
  }

  try {
    const results = await queryAsync('SELECT * FROM vds_data WHERE name = ? and email=?', [name,email]);

    if (results.length === 0) {
      res.status(404).json({ error: 'Record not found' });
    } else {
      res.json(results);
    }
  } catch (error) {
    console.error('Error executing MySQL query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

process.on('SIGINT', () => {
  pool.end((err) => {
    if (err) {
      console.error('Error closing MySQL connection:', err);
    } else {
      console.log('MySQL connection closed.');
    }
    process.exit();
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`API is started on port ${PORT}`);
});
