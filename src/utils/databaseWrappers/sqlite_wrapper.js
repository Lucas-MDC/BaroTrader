import { promises as fs } from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function makePathDB(dbPath) {
  const fullPath = path.resolve(dbPath);
  const dir = path.dirname(fullPath);

  await fs.mkdir(dir, { recursive: true });
  
  const fh = await fs.open(fullPath, 'a');
  await fh.close();
  
  return fullPath;
}

export async function SQLite(dbPath) {

  const fullPath = await makePathDB(dbPath);

  const db = await open({ 
    filename: fullPath, 
    driver: sqlite3.Database 
  });

  await db.exec('PRAGMA foreign_keys = ON;');

  async function execute(sql, params = {}) {
    try {
      const stmt = await db.prepare(sql);
      await stmt.bind(params);

      await stmt.run();
      await stmt.finalize();
      return true // resp.changes > 0;
      
    } catch (error) {
      console.error('Error executing SQL:', error);
      throw error;
    }
  }

  async function query(sql, params = {}) {
    try {
      const stmt = await db.prepare(sql);
      await stmt.bind(params);
      
      const rows = await stmt.all();
      await stmt.finalize();
      return rows;

    } catch (error) {
      console.error('Error querying SQL:', error);
      throw error;
    }
  }

  async function close() {
    await db.close();
  }

  return {
    execute,
    query,
    close
  };
}
 
export default SQLite;