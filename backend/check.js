const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:9491688900@localhost:5432/campusconnect' });

pool.query("SELECT * FROM users WHERE username='admin' OR email='admin@gmail.com'")
  .then(res => {
    console.log(JSON.stringify(res.rows, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
