const jwt = require('jsonwebtoken');

const validarJWT = (req, res, next) => {
    // Leer el token del header 'x-token'
    const token = req.header('x-token');

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'No hay token en la petición'
        });
    }

    try {
        // Verificar el token
        const { id } = jwt.verify(token, process.env.JWT_SECRET || 'secret_pin_2026');

        // Añadir el id del usuario a la petición para que el controlador lo use
        req.usuarioId = id;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token no válido o expirado'
        });
    }
};

module.exports = { validarJWT };