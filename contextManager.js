const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'mcp_contexts.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS contexts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    system_prompt TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

function createContext(name, system_prompt) {
  const stmt = db.prepare(`
    INSERT INTO contexts (name, system_prompt) VALUES (?, ?)
  `);
  const info = stmt.run(name, system_prompt);
  return info.lastInsertRowid;
}

function getAllContexts() {
  const stmt = db.prepare(`SELECT * FROM contexts`);
  return stmt.all();
}

function getContextById(id) {
  const stmt = db.prepare(`SELECT * FROM contexts WHERE id = ?`);
  return stmt.get(id);
}

module.exports = {
  createContext,
  getAllContexts,
  getContextById
};