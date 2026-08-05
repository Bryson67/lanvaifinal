const pool = require('./db');

async function testConnection() {
    try {
        console.log('Testing database connection...');

        // Test connection
        const [result] = await pool.query('SELECT 1 + 1 AS test');
        console.log('✅ Database connected!');
        console.log('Test result:', result[0].test);

        // Check if tables exist
        const [tables] = await pool.query('SHOW TABLES');
        console.log('📊 Tables in database:', tables.length);

        if (tables.length === 0) {
            console.log('⚠️ No tables found. Run your server to create them.');
        } else {
            console.log('Tables:');
            tables.forEach(table => console.log(`  - ${Object.values(table)[0]}`));
        }

    } catch (error) {
        console.error('❌ Database error:', error.message);
    }
}

testConnection();