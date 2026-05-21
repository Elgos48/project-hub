require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const app = express();
const SECRET_KEY = process.env.JWT_SECRET;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
    console.log('Connected to MySQL database');
});

// Middleware Cek Login
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'Authorization header missing' });

    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token' });
        req.user = user;
        next();
    });
};

// Register
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err) => {
        if (err) return res.status(400).json({ error: 'Username is used' });
        res.json({ message: 'Registration successful' });
    });
});

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Server error' });
        }
        if (!results.length) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token, username: user.username, id: user.id });
    });
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint: Get all projects
app.get('/api/projects', (req, res) => {
    const sql = `SELECT projects.*, users.username
                 FROM projects
                 LEFT JOIN users ON projects.user_id = users.id
                 ORDER BY projects.id DESC`;
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send(err);
        }
        res.json(results);
    });
});

// API endpoint: Upload project
app.post('/api/projects', authenticateToken, upload.fields([
    { name: 'image', maxCount: 1 }, 
    { name: 'code', maxCount: 1 } 
]), (req, res) => {
    const { title, description, tech } = req.body;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    if (!req.files || !req.files['image']) {
        return res.status(400).json({ error: 'Image is required' });
    }

    const image = req.files['image'][0].filename;
    const code = req.files['code'] ? req.files['code'][0].filename : null;

    const sql = 'INSERT INTO projects (title, image_path, text_desc, tech_use, code_zip_path, user_id) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql, [title, image, description, tech, code, userId], (err, result) => {
        if (userId === null){
            return res.status(403).json({ error: 'You must be logged in to create a project' });
        }
        if (err) {
            console.error(err);
            return res.status(500).json(err);
        }
        res.json({ message: "Project created!", id: result.insertId });
    });
});

app.delete('/api/projects/:id', authenticateToken, (req, res) => {
    const projectId = req.params.id;
    const userId = req.user.id;

    db.query('SELECT image_path, code_zip_path, user_id FROM projects WHERE id = ?', [projectId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json(err);
        }
        if (!results.length) {
            return res.status(404).json({ error: 'Project not found' });
        }
        if (results[0].user_id !== userId) {
            return res.status(403).json({ error: 'You are not the owner of this project' });
        }

        const { image_path, code_zip_path } = results[0];
        db.query('DELETE FROM projects WHERE id = ?', [projectId], (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json(err);
            }

            if (image_path) {
                fs.unlink(path.join(__dirname, 'uploads', image_path), () => {});
            }
            if (code_zip_path) {
                fs.unlink(path.join(__dirname, 'uploads', code_zip_path), () => {});
            }

            res.json({ message: 'Project deleted successfully' });
        });
    });
});

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}/`));