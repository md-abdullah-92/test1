const express = require("express");
const mysql2 = require("mysql2");
const dotenv = require("dotenv");

dotenv.config({ path: './.env' });

const app = express();
app.use(express.json());

const db = mysql2.createConnection({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DB_DATABASE,
});
let p;
db.connect((error) => {
  if (error) {
    console.error('Error connecting to MySQL:', error);
  } else {
    console.log("MySQL is connected...");
  }
});

// API endpoint for receiving registration number and date of birth
app.post('/getdata', (req, res) => {
  const { reg_no, dateofbirth } = req.body;
  if (!reg_no || !dateofbirth) {
    res.status(400).json({ error: 'Bad Request: Registration number and date of birth are required' });
    return;
  }
  p=reg_no;
  // Assuming you want to send JSON response with reg_no
  res.json({ reg_no });
});

// API endpoint for retrieving results based on registration number
app.get('/getResults', (req, res) => {
  const reg_no = p;

  if (!reg_no) {
    res.status(400).json({ error: 'Bad Request: Registration number is required' });
    return;
  }

  db.query('SELECT * FROM result WHERE reg_no = ?', [reg_no], (err, results) => {
    if (err) {
      console.error('Error executing MySQL query:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else if (results.length === 0) {
      res.status(404).json({ error: 'Record not found' });
    } else {
      res.json(results);
    }
  });
});

// Close the database connection when the application shuts down
process.on('SIGINT', () => {
  db.end((err) => {
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
