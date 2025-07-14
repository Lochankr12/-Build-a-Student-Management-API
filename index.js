// index.js

const express = require('express');
const mysql = require('mysql2/promise'); // Using the promise-based version of mysql2

const app = express();
const port = 3000;

// --- DATABASE CONNECTION POOL ---
// A connection pool is more efficient than creating a new connection for every query.
// --- DATABASE CONNECTION POOL ---
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'loch7760', // <<< THIS LINE IS THE PROBLEM
  database: 'studentdb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Middleware to parse incoming JSON requests
app.use(express.json());

// --- A friendly welcome message for the root URL ---
app.get('/', (req, res) => {
  res.status(200).send('<h1>Welcome to the Student Management API!</h1><p>Use the /students endpoint to interact with the data.</p>');
});

// --- API ENDPOINTS ---

// 1. GET /students -> Retrieve all students
app.get('/students', async (req, res) => {
  try {
    // Get a connection from the pool and execute the query
    const [rows] = await db.query('SELECT * FROM students');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching students:', error); // Log the detailed error to the server console
    res.status(500).json({ error: 'Database query failed' }); // Send a generic error to the client
  }
});

// 2. GET /students/:id -> Retrieve a single student by ID
app.get('/students/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM students WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error(`Error fetching student ${id}:`, error);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// 3. POST /students -> Insert a new student
app.post('/students', async (req, res) => {
  const { name, email, age } = req.body;
  
  // Basic validation
  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required fields' });
  }

  const sql = 'INSERT INTO students (name, email, age) VALUES (?, ?, ?)';
  try {
    const [result] = await db.query(sql, [name, email, age]);
    console.log(`INSERT Operation: New student created with ID: ${result.insertId}`);
    res.status(201).json({ 
        message: 'Student created successfully', 
        studentId: result.insertId 
    });
  } catch (error) {
    console.error('Error creating student:', error);
    // Handle specific errors, like a duplicate email
    if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'This email address is already in use.' });
    }
    res.status(500).json({ error: 'Database query failed' });
  }
});

// 4. PUT /students/:id -> Update student details
app.put('/students/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, age } = req.body;

  // You can build the query dynamically, but for this project, we'll update all fields
  if (!name || !email || !age) {
    return res.status(400).json({ message: 'Please provide name, email, and age to update.' });
  }

  const sql = 'UPDATE students SET name = ?, email = ?, age = ? WHERE id = ?';
  try {
    const [result] = await db.query(sql, [name, email, age, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Student not found or no new data to update' });
    }
    console.log(`UPDATE Operation: Student with ID ${id} was updated.`);
    res.status(200).json({ message: 'Student updated successfully' });
  } catch (error) {
    console.error(`Error updating student ${id}:`, error);
     if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'This email address is already in use by another student.' });
    }
    res.status(500).json({ error: 'Database query failed' });
  }
});

// 5. DELETE /students/:id -> Delete a student by ID
app.delete('/students/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM students WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    console.log(`DELETE Operation: Student with ID ${id} was deleted.`);
    res.status(200).json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error(`Error deleting student ${id}:`, error);
    res.status(500).json({ error: 'Database query failed' });
  }
});


// Start the Express server
app.listen(port, () => {
  console.log(`MySQL Connection Pool Created.`);
  console.log(`Server is running and listening on http://localhost:${port}`);
});