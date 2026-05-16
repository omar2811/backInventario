const express = require('express');
const router = express.Router();
const inventarioCtrl = require('../controllers/inventario.controller');
const { uploadCloud } = require('../config/cloudinary');
const { validarJWT } = require('../middlewares/auth.middleware');

/**
 * RUTAS PARA /api/inventario
 */

// 1. Obtener todos los productos
router.get('/', validarJWT, inventarioCtrl.obtenerTodo);
router.get('/servicios', validarJWT, inventarioCtrl.obtenerServicios);

// 2. Obtener un producto específico
router.get('/:id', validarJWT, inventarioCtrl.obtenerPorId);

// 3. Crear artículo (con imagen)
router.post('/', (req, res, next) => {
    uploadCloud.single('imagen')(req, res, (err) => {
        if (err) {
            console.error("❌ ERROR EN POST (MULTER):", err);
            return res.status(500).json({ error: "Error en la subida", detalle: err.message });
        }
        inventarioCtrl.crearArticulo(req, res);
    });
});

// 4. Actualizar artículo (con o sin imagen)
// Esta ruta sirve tanto para el Modal de Editar como para el stock rápido
router.put('/:id', (req, res, next) => {
    uploadCloud.single('imagen')(req, res, (err) => {
        if (err) {
            console.error("❌ ERROR EN PUT (MULTER):", err);
            return res.status(500).json({ error: "Error al actualizar imagen", detalle: err.message });
        }
        inventarioCtrl.actualizarArticulo(req, res);
    });
});

// 5. Eliminar artículo
router.delete('/:id', validarJWT, inventarioCtrl.eliminarArticulo);
router.put('/abonos/:id', validarJWT, inventarioCtrl.actualizarRentaConAbonos);
router.get('/:id/abonos', validarJWT, inventarioCtrl.obtenerAbonosPorRenta);
module.exports = router;