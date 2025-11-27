import pgPromise from "pg-promise";

export async function PostgreSQL(dbConfig) {

  if (dbConfig == null) {
    throw new Error('Database configuration is required');
  }

  // Validação simples das propriedades esperadas
  const required = ['host', 'port', 'database', 'user', 'password'];
  for (const k of required) {
    if (!Object.prototype.hasOwnProperty.call(dbConfig, k) || dbConfig[k] === undefined || dbConfig[k] === null) {
      throw new Error(`${k} is required in the configuration`);
    }
  }

  const pgp = pgPromise();
  const db = pgp(dbConfig);

  // execute: retorna o objeto result (use para DDL/DML quando precisar do comando tag/rowCount)
  async function execute(sql, params = {}) {
    try {
      const result = await db.result(sql, params);
      return result;
    } catch (error) {
      // propaga o erro para o chamador tratar
      throw new Error('Error executing SQL: ' + (error && error.message ? error.message : String(error)));
    }
  }

  // query: retorna um array de linhas (use db.any para consultas que podem retornar 0..N linhas)
  async function query(sql, params = {}) {
    try {
      const rows = await db.any(sql, params);
      return rows;
    } catch (error) {
      throw new Error('Error querying SQL: ' + (error && error.message ? error.message : String(error)));
    }
  }

  // close: encerra o pool desta instância; chama pgp.end() se quiser finalizar globalmente
  async function close() {
    try {
      // encerra o pool associado a este db
      if (db && db.$pool) {
        db.$pool.end();
      }
      // opcional: terminar o pg-promise (se você não for reutilizar o pgp)
      // pgp.end && pgp.end();
    } catch {
      // não mascarar erro ao fechar, mas logue se necessário
      // console.warn('Error closing DB pool');
    }
  }

  return {
    execute,
    query,
    close
  };
}

export default PostgreSQL;