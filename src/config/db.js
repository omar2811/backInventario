const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME,     // inventario
    process.env.DB_USER,     // root
    process.env.DB_PASSWORD, // Correa.2025
    {
        host: process.env.DB_HOST, // 18.191.238.226
        //port: process.env.DB_PORT, // 3307 <--- ¡Muy importante!
        dialect: 'mysql',
        logging: false,
    }
);

module.exports = sequelize;