const { Router } = require('express');
const router = Router();
const finanzaController = require('../controllers/finanza.controller');
const { validarJWT } = require('../middlewares/auth.middleware');

// Resumen de KPIs (Ingresos vs Gastos)
router.get('/resumen', validarJWT, finanzaController.getResumen);

// Listado de transacciones recientes
router.get('/transacciones', validarJWT, finanzaController.getTransacciones);

// Registrar gastos operativos
router.post('/gastos', finanzaController.registrarGasto);

module.exports = router;