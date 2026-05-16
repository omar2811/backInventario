const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const bcrypt = require('bcryptjs');

const Usuario = sequelize.define('Usuario', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    rol: {
        type: DataTypes.ENUM('admin', 'empleado'), // Coincide con tu DB
        defaultValue: 'admin'
    },
    avatar: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'usuarios',
    // --- AQUÍ ESTÁ LA SOLUCIÓN ---
    timestamps: true, // Activamos timestamps
    createdAt: 'created_at', // Mapeamos created_at correctamente
    updatedAt: false, // DESACTIVAMOS updatedAt porque no existe en tu tabla
    hooks: {
        beforeSave: async (usuario) => {
            // Verificamos si el password cambió o es nuevo
            if (usuario.changed('password')) {
                // Convertimos a String explícitamente para evitar el error "Illegal arguments: number"
                const pinString = String(usuario.password);

                const salt = await bcrypt.genSalt(10);
                usuario.password = await bcrypt.hash(pinString, salt);
            }
        }
    }
});

Usuario.prototype.validarPin = async function (pinIngresado) {
    return await bcrypt.compare(pinIngresado, this.password);
};

module.exports = Usuario;