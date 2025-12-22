const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const runMigrations = async () => {
  const sequelize = new Sequelize(
    process.env.DATABASE_MARIA || 'wfpdb',
    process.env.USERNAME_MARIA || 'root',
    process.env.PASSWORD_MARIA || 'rootpassword',
    {
      host: process.env.HOST_MARIA || 'db',
      port: process.env.PORT_MARIA || 3306,
      dialect: process.env.DIALECT_MARIA || 'mariadb',
      logging: false,
      retry: {
        max: 5,
        match: [
          /ETIMEDOUT/,
          /EHOSTUNREACH/,
          /ECONNREFUSED/,
          /ECONNRESET/,
        ],
      },
    }
  );

  try {
    // Retry connection with delay
    let retries = 5;
    while (retries > 0) {
      try {
        await sequelize.authenticate();
        console.log('✅ Database connection established.');
        break;
      } catch (err) {
        retries--;
        if (retries === 0) throw err;
        console.log(`⏳ Waiting for database... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    const dbName = process.env.DATABASE_MARIA || 'wfpdb';

    // Check if columns exist
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${dbName}' 
      AND TABLE_NAME = 'reimbursements_general' 
      AND COLUMN_NAME IN ('file_receipt', 'file_medical_certificate')
    `);

    const existingColumns = results.map(r => r.COLUMN_NAME);

    if (existingColumns.includes('file_receipt') && existingColumns.includes('file_medical_certificate')) {
      console.log('✅ Migration already applied: file_receipt and file_medical_certificate columns exist.');
      return;
    }

    // Read migration file
    const migrationPath = path.join(__dirname, '../migrations/add_file_columns_to_reimbursements_general.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute migration
    await sequelize.query(migrationSQL);
    console.log('✅ Migration applied successfully: Added file_receipt and file_medical_certificate columns.');

  } catch (error) {
    if (error.message.includes('Duplicate column name')) {
      console.log('✅ Migration already applied (columns exist).');
    } else {
      console.error('❌ Migration error:', error.message);
    }
  } finally {
    await sequelize.close();
  }
};

// Run migrations
runMigrations();

