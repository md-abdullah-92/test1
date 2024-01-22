const express = require("express");
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

dotenv.config({ path: './.env' });

const app = express();
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const queryAsync = async (sql, values) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(sql, values);
    return rows;
  } finally {
    connection.release();
  }
};

app.get('/StudentInfo', async (req, res) => {
  const { reg_no, dateofbirth } = req.query

  // Validate inputs
  if (!reg_no || !dateofbirth) {
    res.status(400).json({ error: 'Bad Request: Registration number and date of birth are required' });
    return;
  }

  try {
    const results = await queryAsync('SELECT * FROM studentinfo WHERE reg_no = ? AND date_of_birth = ?', [reg_no, dateofbirth]);

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

app.get('/getResultsfirst', async (req, res) => {
  const {reg_no} = req.query;

  // Validate reg_no format if needed

  if (!reg_no) {
    res.status(400).json({ error: 'Bad Request: Registration number is required' });
    return;
  }

  try {
    const results = await queryAsync('SELECT * FROM result WHERE reg_no = ?', [reg_no]);
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

app.get('/getResultssceond', async (req, res) => {
  const reg_no = req.query.reg_no;
  
  if (!reg_no) {
    res.status(400).json({ error: 'Bad Request: Registration number is required' });
    return;
  }

  const sem = '2nd';
  try {
    const results = await queryAsync('SELECT * FROM result WHERE reg_no = ? and semester = ?', [reg_no, sem]);
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
