const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Pool } = require("pg");

const app = express();
const PORT = 4000;

app.use(cors());
app.use(bodyParser.json());

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "chat_app",
  password: "root",
  port: 5432,
});

// SSE setup
app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const messageId = Date.now();

  const sendMessage = async () => {
    const { rows } = await pool.query("SELECT * FROM messages ORDER BY id ASC");
    rows.forEach((msg) => {
      res.write(`data: ${JSON.stringify(msg)}\n\n`);
    });
  };

  sendMessage();

  req.on("close", () => {
    res.end();
  });
});

app.post("/message", async (req, res) => {
  const { user, text } = req.body;

  const newMessage = await pool.query(
    "INSERT INTO messages (username, text) VALUES ($1, $2) RETURNING *",
    [user, text]
  );

  res.write(`data: ${JSON.stringify(newMessage.rows[0])}\n\n`);
  res.end();
});

app.get("/messages", async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM messages ORDER BY id ASC");
  res.json(rows);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
