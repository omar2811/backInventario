const router = require('express').Router();
const authCtrl = require('../controllers/auth.controller');
const { validarJWT } = require('../middlewares/auth.middleware');

// Obtener los 2 usuarios para la pantalla de bienvenida
router.get('/profiles', authCtrl.getPublicProfiles);

// Login mediante PIN
router.post('/login-pin', authCtrl.loginWithPin);
router.post('/registro', authCtrl.crearUsuario);
router.get('/check-token', validarJWT, authCtrl.checkToken);

module.exports = router;