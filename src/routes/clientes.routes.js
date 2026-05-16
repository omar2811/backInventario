const { Router } = require('express');
const router = Router();
const clienteController = require('../controllers/cliente.controller');
const { validarJWT } = require('../middlewares/auth.middleware');

router.get('/',validarJWT, clienteController.listar);
router.post('/',validarJWT, clienteController.crear);
router.put('/:id',validarJWT, clienteController.actualizar);
router.delete('/:id',validarJWT, clienteController.eliminar);
router.get('/:id/historial',validarJWT, clienteController.obtenerHistorial);

module.exports = router;