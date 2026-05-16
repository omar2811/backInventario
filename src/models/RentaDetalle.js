const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const RentaDetalle = sequelize.define('RentaDetalle', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    renta_id: { type: DataTypes.INTEGER, allowNull: false },
    producto_id: { type: DataTypes.INTEGER, allowNull: false },
    cantidad: { type: DataTypes.INTEGER, allowNull: false },
    precio_unitario: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false }
}, {
    tableName: 'detalles_rentas',
    timestamps: false
});

module.exports = RentaDetalle;