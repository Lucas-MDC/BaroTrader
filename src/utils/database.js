import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Calcula bins relativo a este arquivo (projetoRoot/bins)
const dbDir = path.resolve(__dirname, '..', '..', 'bins');
mkdirSync(dbDir, { recursive: true });

async function createDB(dbFileName) {
    const fullPath = path.join(dbDir, dbFileName);

    const db = await open({
        filename: fullPath,
        driver: sqlite3.Database
    });

    // Cria tabela se não existir
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            ID INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            password TEXT NOT NULL
        );
    `);

    return db;
}

async function insertDummy(db) {
    const user = { email: "teste@teste.com", password: "1234" };
    const result = await db.run(
        `INSERT INTO users (email, password) VALUES (?, ?)`,
        [user.email, user.password]
    );
    console.log("Inserido ID:", result.lastID);
}

// Top-level await = “join”
const dbFile = 'app_database.db';

if (existsSync(path.join(dbDir, dbFile))) {
    console.log("Arquivo já existe, reutilizando.");
}

const db = await createDB(dbFile);
await insertDummy(db);
await db.close();
console.log("Fim.");