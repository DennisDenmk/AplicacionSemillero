const { pool } = require('../infrastructure/database/postgres');
const { mapUser } = require('../domain/models');

class AuthRepository {
  async findByEmailAndPassword(email, password) {
    const result = await pool.query(
      'SELECT * FROM docentes WHERE LOWER(email) = LOWER($1) AND password = $2',
      [email, password]
    );
    return result.rows.length > 0 ? mapUser(result.rows[0]) : null;
  }

  async existsByEmail(email) {
    const result = await pool.query(
      'SELECT 1 FROM docentes WHERE LOWER(email) = LOWER($1)',
      [email]
    );
    return result.rows.length > 0;
  }

  async create(nombre, email, password) {
    const result = await pool.query(
      'INSERT INTO docentes (nombre, email, password) VALUES ($1, LOWER($2), $3) RETURNING *',
      [nombre, email, password]
    );
    return mapUser(result.rows[0]);
  }
}

module.exports = new AuthRepository();
