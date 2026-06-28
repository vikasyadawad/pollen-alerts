import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'symptoms.sqlite'));

db.exec(`
  CREATE TABLE IF NOT EXISTS symptoms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT UNIQUE,
    score INTEGER
  )
`);

export function getSymptoms() {
  const query = db.prepare('SELECT date, score FROM symptoms ORDER BY date DESC LIMIT 30');
  return query.all();
}

export function logSymptom(date, score) {
  const query = db.prepare(`
    INSERT INTO symptoms (date, score)
    VALUES (@date, @score)
    ON CONFLICT(date) DO UPDATE SET score = @score
  `);
  query.run({ date, score });
}

export default db;
