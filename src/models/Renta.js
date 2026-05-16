const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Renta = sequelize.define('Renta', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    cliente_id: { type: DataTypes.INTEGER, allowNull: false },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    fecha_inicio: { type: DataTypes.DATEONLY, allowNull: false },
    fecha_fin: { type: DataTypes.DATEONLY, allowNull: false },
    total: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    anticipo: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    estado: {
        type: DataTypes.ENUM('apartada', 'entregada', 'devuelta', 'cancelada'),
        defaultValue: 'apartada'
    }
}, {
    tableName: 'rentas',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = Renta;