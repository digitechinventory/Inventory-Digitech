import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: '100.100.98.113',
  port: 5432,
  user: 'ims_user',
  password: 'ims_password_2026',
  database: 'digitech_ims'
});

async function main() {
  await client.connect();
  console.log('=== CONNECTED TO LOCAL POSTGRESQL (digitech_ims) ===');

  const tablesRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  
  console.log('\n[TABLES & RECORD COUNTS]');
  for (const row of tablesRes.rows) {
    const t = row.table_name;
    const cnt = await client.query(`SELECT count(*) FROM "${t}"`);
    console.log(` - ${t.padEnd(25)}: ${cnt.rows[0].count} rows`);
  }

  const fksRes = await client.query(`
    SELECT
      tc.table_name, 
      kcu.column_name, 
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name 
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
    ORDER BY tc.table_name, kcu.column_name;
  `);

  console.log('\n[FOREIGN KEY RELATIONSHIPS]');
  for (const fk of fksRes.rows) {
    console.log(` - ${fk.table_name}.${fk.column_name} ---> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
  }

  await client.end();
}

main().catch(console.error);
