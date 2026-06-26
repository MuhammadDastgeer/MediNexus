import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

let dbPath = path.join(process.cwd(), 'hospital.db');

if (process.env.VERCEL) {
  const tmpPath = path.join('/tmp', 'hospital.db');
  if (!fs.existsSync(tmpPath)) {
    try {
      const srcPath = path.join(process.cwd(), 'hospital.db');
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, tmpPath);
        console.log('Database successfully copied to /tmp/hospital.db');
      }
    } catch (err) {
      console.error('Failed to copy database to /tmp:', err);
    }
  }
  dbPath = tmpPath;
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

export default db;
