const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Usamos tu misma conexión

const RentaAbono = sequelize.define('RentaAbono', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    renta_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'renta_id'
    },
    monto: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    },
    metodo: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'Efectivo'
    },
    fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false
    }
}, {
    tableName: 'renta_abonos', // El nombre exacto de tu tabla en MySQL
    timestamps: false, // Normalmente los abonos no llevan createdAt/updatedAt a menos que tú quieras
    underscored: true
});

module.exports = RentaAbono;
