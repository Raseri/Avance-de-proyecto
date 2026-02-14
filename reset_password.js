import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
};

async function resetPassword() {
    let connection;
    try {
        console.log('Connecting to MySQL...');
        connection = await mysql.createConnection({
            ...dbConfig,
            database: 'tienda_manager'
        });

        const newPassword = 'password123';
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);

        console.log(`Updating password for admin@tienda.com to '${newPassword}'...`);

        const [result] = await connection.execute(
            'UPDATE usuarios SET password_hash = ? WHERE email = ?',
            [hash, 'admin@tienda.com']
        );

        console.log(`Updated ${result.changedRows} rows.`);

    } catch (error) {
        console.error('Update failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

resetPassword();
