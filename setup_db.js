import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true
};

async function setupDatabase() {
    let connection;
    try {
        console.log('Connecting to MySQL...');
        connection = await mysql.createConnection(dbConfig);

        console.log('Using database tienda_manager...');
        await connection.query('CREATE DATABASE IF NOT EXISTS tienda_manager');
        await connection.query('USE tienda_manager');

        console.log('Reading SQL file...');
        const sqlPath = path.join(process.cwd(), 'database', 'tienda_manager.sql');
        let sqlContent = fs.readFileSync(sqlPath, 'utf8');

        // Remove DELIMITER blocks completely (Procedures/Triggers)
        // Match DELIMITER $$ ... END$$ or DELIMITER ;
        // This is a rough regex to strip out the complex blocks that node mysql driver hates
        sqlContent = sqlContent.replace(/DELIMITER \$\$[\s\S]*?DELIMITER ;/g, '');
        sqlContent = sqlContent.replace(/DELIMITER ;/g, '');

        // Also simpler: Just remove lines starting with DELIMITER
        // But the blocks content needs to go too.

        console.log('Parsing SQL (Tables and Data only)...');

        // Remove comments
        const lines = sqlContent.split('\n');
        const cleanContent = lines.filter(line => !line.trim().startsWith('--') && !line.trim().startsWith('/*')).join('\n');

        const queries = cleanContent.split(';')
            .map(q => q.trim())
            .filter(q => q.length > 0);

        console.log(`Found ${queries.length} queries to execute.`);

        for (const query of queries) {
            try {
                await connection.query(query);
            } catch (err) {
                // Ignore "Table already exists" or minor errors
                if (err.code === 'ER_TABLE_EXISTS_ERROR') {
                    console.log('Table exists, skipping.');
                } else {
                    console.warn(`Query failed: ${err.message.slice(0, 100)}`);
                }

            }
        }

        console.log('Database setup complete.');

    } catch (error) {
        console.error('Setup failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

setupDatabase();
