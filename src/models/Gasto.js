const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Gasto = sequelize.define('Gasto', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    concepto: { type: DataTypes.STRING(150), allowNull: false },
    monto: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    categoria: { type: DataTypes.STRING(50) }, // 'Mantenimiento', 'Sueldos', 'Servicios'
    fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    notas: { type: DataTypes.TEXT }
}, {
    tableName: 'gastos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = Gasto;