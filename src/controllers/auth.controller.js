const { Usuario } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const authCtrl = {
    loginWithPin: async (req, res) => {
        try {
            // Recibimos el ID del usuario (porque son solo 2, se seleccionan en la UI)
            // y el PIN que enviará el frontend como un string de dígitos
            const { usuarioId, pin } = req.body;

            // 1. Buscar al usuario específico
            const usuario = await Usuario.findByPk(usuarioId);
            if (!usuario) {
                return res.status(404).json({
                    success: false,
                    message: "Usuario no encontrado"
                });
            }

            // 2. Comparar el PIN (que está hasheado en la DB como una contraseña)
            const validPin = await bcrypt.compare(pin, usuario.password);
            if (!validPin) {
                return res.status(401).json({
                    success: false,
                    message: "PIN incorrecto"
                });
            }

            // 3. Generar JWT (Igual que antes, para mantener seguridad)
            const token = jwt.sign(
                { id: usuario.id, rol: usuario.rol },
                process.env.JWT_SECRET || 'secret_pin_2026',
                { expiresIn: '12h' } // Sesión más corta por ser PIN
            );

            res.json({
                success: true,
                message: `Acceso concedido, hola ${usuario.nombre}`,
                data: {
                    token,
                    user: {
                        id: usuario.id,
                        nombre: usuario.nombre,
                        avatar: usuario.avatar,
                        rol: usuario.rol
                    }
                }
            });

        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // Endpoint simple para listar los 2 usuarios y mostrarlos en la pantalla de entrada
    getPublicProfiles: async (req, res) => {
        try {
            const usuarios = await Usuario.findAll({
                attributes: ['id', 'nombre', 'avatar'],
                limit: 2
            });
            res.json({ success: true, data: usuarios });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    crearUsuario: async (req, res) => {
        try {
            const { nombre, email, password, rol, avatar } = req.body;

            // 1. Validar si el correo ya existe
            const existe = await Usuario.findOne({ where: { email } });
            if (existe) {
                return res.status(400).json({
                    success: false,
                    message: "El correo electrónico ya está registrado"
                });
            }

            // 2. Crear el usuario
            // Nota: req.body.password debe ser el PIN de 4 dígitos (ej: "1234")
            const nuevoUsuario = await Usuario.create({
                nombre,
                email,
                password, // El modelo lo hasheará automáticamente
                rol,
                avatar,
                activo: true
            });

            res.status(201).json({
                success: true,
                message: "Usuario creado exitosamente",
                data: {
                    id: nuevoUsuario.id,
                    nombre: nuevoUsuario.nombre,
                    email: nuevoUsuario.email
                }
            });

        } catch (error) {
            console.error("Error al crear usuario:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    },
    checkToken: async (req, res) => {
        try {
            // El ID del usuario vendrá del Middleware "validarJWT" 
            // que extraerá la info del token enviado por el frontend
            const usuario = await Usuario.findByPk(req.usuarioId, {
                attributes: ['id', 'nombre', 'email', 'rol', 'avatar', 'activo']
            });

            if (!usuario || !usuario.activo) {
                return res.status(401).json({
                    success: false,
                    message: "Usuario no encontrado o inactivo"
                });
            }

            res.json({
                success: true,
                data: usuario
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
};

module.exports = authCtrl;