const { Articulo, Categoria, RentaAbono, RentaDetalle, Renta, sequelize } = require('../models/index');
const cloudinary = require('cloudinary').v2; // Asegúrate de tenerlo para borrar fotos viejas
const { Op } = require('sequelize');
const inventarioCtrl = {
    /**
     * OBTENER TODOS LOS PRODUCTOS
     */
    obtenerTodo: async (req, res) => {
        try {
            const { Op } = require('sequelize'); // Asegúrate de importar Op de sequelize

            const productos = await Articulo.findAll({
                where: {
                    // Asumiendo que así se llama la FK en tu tabla Articulo
                    categoria_id: { [Op.ne]: 6 }
                },
                order: [['created_at', 'DESC']],
                include: [{
                    model: Categoria,
                    as: 'categoria',
                    attributes: ['nombre'],
                    required: true
                }]
            });

            const productosFormateados = productos.map(p => {
                const item = p.get({ plain: true });
                return {
                    ...item,
                    categoria_nombre: item.categoria ? item.categoria.nombre : 'Sin categoría'
                };
            });

            res.json({
                status: "success",
                data: productosFormateados
            });
        } catch (error) {
            console.error("❌ Error en obtenerTodo:", error);
            res.status(500).json({
                status: "error",
                data: [],
                message: "Error interno al consultar el inventario"
            });
        }
    },
    obtenerServicios: async (req, res) => {
        try {
            const { Op } = require('sequelize'); // Asegúrate de importar Op de sequelize

            const productos = await Articulo.findAll({
                where: {
                    // Asumiendo que así se llama la FK en tu tabla Articulo
                    categoria_id: { [Op.eq]: 6 }
                },
                order: [['created_at', 'DESC']],
                include: [{
                    model: Categoria,
                    as: 'categoria',
                    attributes: ['nombre'],
                    required: true
                }]
            });

            const productosFormateados = productos.map(p => {
                const item = p.get({ plain: true });
                return {
                    ...item,
                    categoria_nombre: item.categoria ? item.categoria.nombre : 'Sin categoría'
                };
            });

            res.json({
                status: "success",
                data: productosFormateados
            });
        } catch (error) {
            console.error("❌ Error en obtenerTodo:", error);
            res.status(500).json({
                status: "error",
                data: [],
                message: "Error interno al consultar el inventario"
            });
        }
    },
    /**
     * OBTENER UN SOLO PRODUCTO POR ID
     * GET /api/inventario/:id
     */
    obtenerPorId: async (req, res) => {
        try {
            const { id } = req.params;
            const producto = await Articulo.findByPk(id);
            if (!producto) return res.status(404).json({ message: "No existe el producto" });
            res.json({ status: "success", data: producto });
        } catch (error) {
            res.status(500).json({ status: "error", message: error.message });
        }
    },

    /**
     * CREAR ARTÍCULO
     */
    crearArticulo: async (req, res) => {
        try {
            const { nombre, precio_renta, cantidad_total, categoria_id, descripcion, estado } = req.body;

            const nuevo = await Articulo.create({
                nombre,
                descripcion: descripcion || '',
                categoria_id: parseInt(categoria_id) || 1,
                precio_renta: parseFloat(precio_renta) || 0,
                cantidad_total: parseInt(cantidad_total) || 0,
                estado: estado || 'disponible',
                foto_url: req.file ? req.file.path : null,
                cloudinary_id: req.file ? req.file.filename : null
            });

            return res.status(201).json({ status: "success", data: nuevo });
        } catch (error) {
            return res.status(500).json({ status: "error", message: error.message });
        }
    },

    /**
     * ACTUALIZAR ARTÍCULO
     * PUT /api/inventario/:id
     * Maneja actualización de texto y/o reemplazo de imagen
     */
    actualizarArticulo: async (req, res) => {
        try {
            const { id } = req.params;
            const producto = await Articulo.findByPk(id);

            if (!producto) return res.status(404).json({ message: "Producto no encontrado" });

            // 1. Preparar datos básicos (Body)
            // Usamos || para mantener el valor actual si no viene en el body
            const dataToUpdate = {
                nombre: req.body.nombre || producto.nombre,
                descripcion: req.body.descripcion !== undefined ? req.body.descripcion : producto.descripcion,
                categoria_id: req.body.categoria_id ? parseInt(req.body.categoria_id) : producto.categoria_id,
                precio_renta: req.body.precio_renta ? parseFloat(req.body.precio_renta) : producto.precio_renta,
                cantidad_total: req.body.cantidad_total ? parseInt(req.body.cantidad_total) : producto.cantidad_total,
                estado: req.body.estado || producto.estado
            };

            // 2. Si viene una NUEVA imagen
            if (req.file) {
                // Borrar la imagen anterior de Cloudinary para no llenar espacio
                if (producto.cloudinary_id) {
                    await cloudinary.uploader.destroy(producto.cloudinary_id);
                }
                // Actualizar con la nueva ruta
                dataToUpdate.foto_url = req.file.path;
                dataToUpdate.cloudinary_id = req.file.filename;
            }

            await producto.update(dataToUpdate);

            res.json({
                status: "success",
                message: "Actualizado correctamente",
                data: producto
            });

        } catch (error) {
            console.error("Error al actualizar:", error);
            res.status(500).json({ status: "error", message: error.message });
        }
    },

    /**
     * ELIMINAR ARTÍCULO
     */
    eliminarArticulo: async (req, res) => {
        try {
            const { id } = req.params;
            const producto = await Articulo.findByPk(id);

            if (!producto) {
                return res.status(404).json({ message: "Producto no encontrado" });
            }

            // Borrar imagen de Cloudinary si existe
            if (producto.cloudinary_id) {
                await cloudinary.uploader.destroy(producto.cloudinary_id);
            }

            await producto.destroy();
            res.json({ status: "success", message: "Producto eliminado definitivamente" });
        } catch (error) {
            res.status(500).json({ status: "error", message: error.message });
        }
    },
    // rentas.controller.js

    actualizarRentaConAbonos: async (req, res) => {
        const t = await sequelize.transaction();
        try {
            const { id } = req.params;
            const { abonos } = req.body;

            // 1. Borrar abonos anteriores dentro de la transacción
            await RentaAbono.destroy({ where: { renta_id: id }, transaction: t });

            let totalPagado = 0;

            // 2. Insertar los nuevos si existen y calcular el total pagado
            if (abonos && abonos.length > 0) {
                const nuevosAbonos = abonos.map(a => {
                    const monto = parseFloat(a.monto) || 0;
                    totalPagado += monto;
                    return {
                        renta_id: id,
                        monto: monto,
                        metodo: a.metodo || 'Efectivo',
                        fecha: a.fecha || new Date()
                    };
                });

                await RentaAbono.bulkCreate(nuevosAbonos, { transaction: t });
            }

            // 3. Obtener el total original de la renta para comparar
            const renta = await Renta.findByPk(id, { transaction: t });
            if (!renta) {
                throw new Error("La renta no existe");
            }

            // 4. Determinar el nuevo estado
            let nuevoEstado = renta.estado;

            // Si ya liquidó el total, se finaliza
            if (totalPagado >= parseFloat(renta.total)) {
                nuevoEstado = 'finalizada';
            }
            // Si hay abonos pero no llega al total y estaba apartada, se confirma
            else if (totalPagado > 0 && renta.estado === 'apartada') {
                nuevoEstado = 'confirmada';
            }
            // Si borraron todos los abonos y estaba confirmada/finalizada, vuelve a apartada
            else if (totalPagado === 0) {
                nuevoEstado = 'apartada';
            }

            // 5. Actualizar la cabecera de la renta (Estado y el campo anticipo)
            await renta.update({
                estado: nuevoEstado,
                anticipo: totalPagado // Mantenemos el campo anticipo sincronizado con la suma de abonos
            }, { transaction: t });

            await t.commit();

            res.json({
                status: "success",
                message: "Abonos y estado de renta actualizados",
                nuevoEstado,
                totalPagado
            });

        } catch (error) {
            await t.rollback();
            console.error("Error al actualizar abonos:", error);
            res.status(500).json({ status: "error", message: error.message });
        }
    },
    /**
     * OBTENER ABONOS DE UNA RENTA ESPECÍFICA
     */
    obtenerAbonosPorRenta: async (req, res) => {
        try {
            const { id } = req.params;

            // Usamos el modelo que acabamos de registrar en el index.js
            const abonos = await RentaAbono.findAll({
                where: { renta_id: id },
                order: [['fecha', 'ASC'], ['id', 'ASC']]
            });

            res.json({
                status: "success",
                data: abonos
            });
        } catch (error) {
            console.error("❌ Error al obtener abonos:", error);
            res.status(500).json({
                status: "error",
                message: "No se pudieron cargar los abonos"
            });
        }
    },
    consultarDisponibilidadGlobal: async (fechaSeleccionada) => {
        // 1. Traer todos los productos activos (el catálogo completo)
        const catalogo = await Articulo.findAll({
            where: { estado: 'disponible' }
        });

        // 2. Traer solo los detalles de rentas que coincidan con la fecha
        const ocupaciones = await RentaDetalle.findAll({
            include: [{
                model: Renta,
                as: 'renta', // Asegúrate que la asociación esté definida
                where: {
                    estado: { [Op.notIn]: ['cancelada', 'devuelta'] },
                    fecha_inicio: { [Op.lte]: fechaSeleccionada },
                    fecha_fin: { [Op.gte]: fechaSeleccionada }
                }
            }]
        });

        // 3. Cruzar datos: Mapear el catálogo y restar ocupación
        const resultado = catalogo.map(producto => {
            // Sumar cuántas unidades de este producto específico están apartadas
            const cantidadOcupada = ocupaciones
                .filter(det => det.producto_id === producto.id)
                .reduce((acc, current) => acc + current.cantidad, 0);

            return {
                id: producto.id,
                nombre: producto.nombre,
                foto: producto.foto_url,
                stock_total: producto.cantidad_total,
                cantidad_disponible: producto.cantidad_total - cantidadOcupada,
                es_critico: (producto.cantidad_total - cantidadOcupada) < 10 // Alerta visual
            };
        });

        return resultado;
    }
};

module.exports = inventarioCtrl;