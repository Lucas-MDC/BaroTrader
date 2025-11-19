import { SQLite } from "./databaseWrappers/sqlite_wrapper.js";

const db = await SQLite('./bins/db.sqlite');

// DDL
const ddl_status = await db.execute(`
  CREATE TABLE IF NOT EXISTS users (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  )
`);
console.log(ddl_status); // true/false

// INSERT (use parâmetros nomeados!)
const insert_status = await db.execute(
  `INSERT INTO users (name) VALUES ($name)`,
  { $name: 'Teste' }
);
console.log(insert_status); // true/false

// SELECT com bind de parâmetros
const query_params = {$id: 1};
const rows = await db.query(
  `SELECT id, name
     FROM users
    WHERE id = $id
  `,
  query_params
);
console.log(rows);

// Encerrar
await db.close();
