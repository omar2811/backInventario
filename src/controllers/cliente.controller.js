const { Cliente, Renta, Articulo, RentaDetalle } = require('../models/index');
const { Sequelize } = require('sequelize');

const clienteController = {
    // Listar todos con cálculos de saldo y rentas
    listar: async (req, res) => {
        try {
            const clientes = await Cliente.findAll({
                attributes: {
                    include: [
                        // Cálculo de total de rentas
                        [
                            Sequelize.literal(`(
                                SELECT COUNT(*) FROM rentas AS r 
                                WHERE r.cliente_id = Cliente.id AND r.estado != 'cancelada'
                            )`),
                            'total_rentas'
                        ],
                        // Cálculo de saldo pendiente real
                        [
                            Sequelize.literal(`(
                                SELECT COALESCE(SUM(rd.subtotal), 0) - COALESCE((
                                    SELECT SUM(a.monto) FROM renta_abonos a 
                                    INNER JOIN rentas r2 ON a.renta_id = r2.id 
                                    WHERE r2.cliente_id = Cliente.id AND r2.estado != 'cancelada'
                                ), 0)
                                FROM renta_detalle rd
                                INNER JOIN rentas r ON rd.renta_id = r.id
                                WHERE r.cliente_id = Cliente.id AND r.estado != 'cancelada'
                            )`),
                            'saldo_pendiente'
                        ]
                    ]
                },
                order: [['nombre', 'ASC']]
            });
            res.json({ success: true, data: clientes });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // Crear cliente
    crear: async (req, res) => {
        try {
            const nuevo = await Cliente.create(req.body);
            res.status(201).json({ success: true, data: nuevo });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    },

    // Actualizar cliente
    actualizar: async (req, res) => {
        try {
            const { id } = req.params;
            await Cliente.update(req.body, { where: { id } });
            const actualizado = await Cliente.findByPk(id);
            res.json({ success: true, data: actualizado });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    },

    // Eliminar cliente
    eliminar: async (req, res) => {
        try {
            const { id } = req.params;
            await Cliente.destroy({ where: { id } });
            res.json({ success: true, message: "Cliente eliminado correctamente" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    // controllers/clienteController.js
    obtenerHistorial: async (req, res) => {
        try {
            const { id } = req.params;
            const historial = await Renta.findAll({
                where: { cliente_id: id },
                include: [
                    {
                        model: RentaDetalle,
                        as: 'detalles',
                        include: [{ model: Articulo, as: 'producto', attributes: ['nombre'] }]
                    }
                ],
                order: [['fecha_inicio', 'DESC']]
            });
            res.json({ success: true, data: historial });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = clienteController;