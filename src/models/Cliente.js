const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Cliente = sequelize.define('Cliente', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(150), allowNull: false },
    telefono: { type: DataTypes.STRING(20) },
    email: { type: DataTypes.STRING(100) },
    notas: { type: DataTypes.TEXT }
}, {
    tableName: 'clientes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = Cliente;