const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.query(`
  SELECT o.hotel_id, h.hotel_name, o.table_number, o.status, o.order_id
  FROM orders o
  JOIN hotels h ON o.hotel_id = h.id
  ORDER BY h.hotel_name, o.table_number
`).then(r => {
  console.log('\n📋 Orders by Hotel:\n');
  r.rows.forEach(o => {
    const icon = o.status === 'OPEN' ? '🔴' : '🟢';
    console.log(`${icon} ${o.hotel_name} - Table ${o.table_number} (${o.status})`);
    console.log(`   Hotel ID: ${o.hotel_id}`);
    console.log(`   Order ID: ${o.order_id}\n`);
  });
  pool.end();
}).catch(err => {
  console.error('Error:', err.message);
  pool.end();
});
