const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Articulo = sequelize.define('Producto', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(150), allowNull: false },
    // Agregamos la descripción que faltaba
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // Forzamos el nombre de la columna exacto de MySQL
    categoria_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'categoria_id' // <--- ESTO ES VITAL
    },
    cantidad_total: {
        type: DataTypes.INTEGER,
        field: 'cantidad_total'
    },
    precio_renta: {
        type: DataTypes.DECIMAL(10, 2),
        field: 'precio_renta'
    },
    estado: { type: DataTypes.ENUM('disponible', 'mantenimiento') },
    foto_url: { type: DataTypes.STRING(500) },
    cloudinary_id: { type: DataTypes.STRING(255) }
}, {
    tableName: 'productos',
    underscored: true,
    timestamps: true
});

module.exports = Articulo;