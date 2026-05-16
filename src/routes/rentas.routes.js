const { Router } = require('express');
const router = Router();
const rentasCtrl = require('../controllers/rentas.controller');
const { validarJWT } = require('../middlewares/auth.middleware');

router.get('/disponibilidad', validarJWT, rentasCtrl.getCalendarioData);
// Simplifica el router, no abras un callback si el controlador ya es uno
router.get('/ocupacion-mensual', validarJWT, rentasCtrl.consultarOcupacionMes);



router.post('/abono', validarJWT, rentasCtrl.registrarAbono);
// Obtener historial de rentas
router.get('/', validarJWT, rentasCtrl.obtenerTodas);
router.get('/:id', validarJWT, rentasCtrl.obtenerPorId);

// Crear nueva renta (Descuenta stock automáticamente)
router.post('/', validarJWT, rentasCtrl.crearRenta);
router.put('/:id/estado', validarJWT, rentasCtrl.actualizarEstado);
router.put('/:id/finalizar', validarJWT, rentasCtrl.finalizarRenta);



module.exports = router;