const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Tu archivo de conexión a la base de datos

const Categoria = sequelize.define('Categoria', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true // Evita categorías duplicadas
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'categorias', // Nombre real de la tabla en tu MySQL
    timestamps: false // Cambia a true si tienes created_at y updated_at
});

module.exports = Categoria;