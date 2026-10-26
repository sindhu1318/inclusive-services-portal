require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("./db");
const authenticateToken = require("./auth");

const app = express();
const PORT = Number(process.env.PORT || 3001);

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error("Set JWT_SECRET in backend/.env to a random string of at least 32 characters.");
  process.exit(1);
}

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173"
}));
app.use(express.json({ limit: "20kb" }));

async function initializeDatabase() {
  // Add the account table without deleting or replacing existing request data.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS portal_users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      full_name VARCHAR(190) NOT NULL,
      email VARCHAR(190) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

function makeToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "2h", issuer: "inclusive-services-portal" }
  );
}

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, message: "API and database are connected." });
  } catch (error) {
    res.status(500).json({ ok: false, message: "Database connection failed." });
  }
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const fullName = String(req.body.fullName || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (fullName.length < 2 || fullName.length > 190) {
      return res.status(400).json({ message: "Enter a name between 2 and 190 characters." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 190) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }
    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({ message: "Password must contain 8–72 characters." });
    }

    const [existing] = await pool.execute(
      "SELECT id FROM portal_users WHERE email = ? LIMIT 1", [email]
    );
    if (existing.length) {
      return res.status(409).json({ message: "An account with this email already exists. Please log in." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await pool.execute(
      "INSERT INTO portal_users (full_name, email, password_hash) VALUES (?, ?, ?)",
      [fullName, email, passwordHash]
    );

    const user = { id: result.insertId, fullName, email };
    return res.status(201).json({
      message: "Account created. You can now log in.",
      user: { fullName: user.fullName, email: user.email }
    });
  } catch (error) {
    console.error("Registration error:", error.message);
    return res.status(500).json({ message: "Unable to create account right now." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    const [rows] = await pool.execute(
      "SELECT id, full_name, email, password_hash FROM portal_users WHERE email = ? LIMIT 1",
      [email]
    );

    if (!rows.length || !(await bcrypt.compare(password, rows[0].password_hash))) {
      return res.status(401).json({ message: "Email or password is incorrect." });
    }

    const user = rows[0];
    const token = makeToken({ id: user.id, email: user.email });

    res.set("Cache-Control", "no-store");
    return res.json({
      token,
      user: { id: user.id, fullName: user.full_name, email: user.email }
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ message: "Unable to log in right now." });
  }
});

app.get("/api/requests", authenticateToken, async (req, res) => {
  try {
    // Use the verified account email from the signed token, never an email query parameter.
    const [rows] = await pool.execute(
      `SELECT id, service, details, status, created_at
       FROM service_requests
       WHERE LOWER(email) = LOWER(?)
       ORDER BY created_at DESC, id DESC`,
      [req.user.email]
    );
    res.set("Cache-Control", "no-store");
    return res.json({ success: true, count: rows.length, requests: rows });
  } catch (error) {
    console.error("Request fetch error:", error.message);
    return res.status(500).json({ message: "Unable to retrieve saved requests." });
  }
});

app.post("/api/requests", authenticateToken, async (req, res) => {
  try {
    const service = String(req.body.service || "").trim();
    const details = String(req.body.details || "").trim();

    const allowedServices = [
      "Government schemes",
      "Education support",
      "Financial assistance",
      "Accessibility support",
      "Other"
    ];

    if (!allowedServices.includes(service)) {
      return res.status(400).json({ message: "Choose a valid service category." });
    }
    if (details.length > 2000) {
      return res.status(400).json({ message: "Details must be 2000 characters or fewer." });
    }

    const [users] = await pool.execute(
      "SELECT full_name, email FROM portal_users WHERE id = ? LIMIT 1",
      [req.user.id]
    );
    if (!users.length) {
      return res.status(401).json({ message: "Account not found. Please log in again." });
    }

    const user = users[0];
    const [result] = await pool.execute(
      `INSERT INTO service_requests (full_name, email, service, details, status)
       VALUES (?, ?, ?, ?, 'Submitted')`,
      [user.full_name, user.email, service, details || null]
    );

    return res.status(201).json({
      message: "Request submitted successfully.",
      id: result.insertId
    });
  } catch (error) {
    console.error("Request submission error:", error.message);
    return res.status(500).json({ message: "Unable to submit the request." });
  }
});

async function start() {
  try {
    await pool.query("SELECT 1");
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Inclusive Services API running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Could not start API. Check MySQL and backend/.env.");
    console.error(error.message);
    process.exit(1);
  }
}

start();
