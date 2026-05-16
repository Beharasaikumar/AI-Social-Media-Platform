const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:9491688900@localhost:5432/campusconnect' });

async function test() {
  try {
    const adminEmail = 'admin@gmail.com';
    let adminResult = await pool.query("SELECT id FROM users WHERE email = $1", [adminEmail]);
    if (adminResult.rows.length === 0) {
      console.log("No admin found, inserting...");
      adminResult = await pool.query(
        `INSERT INTO users (username, display_name, email, password_hash, is_verified) 
         VALUES ('admin', 'Admin', $1, 'hash', TRUE) RETURNING id`,
        [adminEmail]
      );
      console.log("Inserted! ID:", adminResult.rows[0].id);
    } else {
      console.log("Admin exists. ID:", adminResult.rows[0].id);
    }
  } catch (err) {
    console.error("ERROR:", err);
  } finally {
    process.exit(0);
  }
}
test();
