const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../../chargemate.db');
const db = new Database(dbPath);

module.exports = {
  query: (text, params) => {
    // Basic wrapper to convert pg-style queries to better-sqlite3 if needed
    // We will use standard better-sqlite3 prepare/run/all methods directly
    // but keep query for compatibility if possible.
    // Replace $1, $2 with ? in the text query for sqlite
    const sqliteQuery = text.replace(/\$\d+/g, '?');
    const stmt = db.prepare(sqliteQuery);
    
    // Determine if it's a select or insert/update/delete
    if (sqliteQuery.trim().toUpperCase().startsWith('SELECT')) {
      return { rows: stmt.all(params || []) };
    } else {
      const info = stmt.run(params || []);
      return { rowCount: info.changes, lastInsertRowid: info.lastInsertRowid };
    }
  },
  db,
};
