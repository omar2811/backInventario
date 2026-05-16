const { Renta, RentaDetalle, Articulo, Cliente, RentaAbono } = require('../models/index');
const sequelize = require('../config/db');
const { Op } = require('sequelize');
const inventarioService = require('./inventario.controller');

const rentasCtrl = {
    // CREAR NUEVA RENTA
    crearRenta: async (req, res) => {
        const t = await sequelize.transaction();
        try {
            const {
                cliente_id, usuario_id, fecha_inicio, fecha_fin,
                anticipo, productos, metodo_pago // Agregamos metodo_pago del body
            } = req.body;

            // 1. Calcular total de la renta
            let totalAcumulado = 0;
            productos.forEach(p => { totalAcumulado += p.cantidad * p.precio_unitario; });

            // --- LÓGICA DE ESTADO DINÁMICO ---
            // Si hay anticipo, la renta nace como 'confirmada', si no, 'apartada'
            const estadoInicial = (anticipo && anticipo > 0) ? 'confirmada' : 'apartada';

            // 2. Crear la cabecera de la renta
            const nuevaRenta = await Renta.create({
                cliente_id,
                usuario_id,
                fecha_inicio,
                fecha_fin,
                total: totalAcumulado,
                anticipo: anticipo || 0,
                estado: estadoInicial
            }, { transaction: t });

            // --- REGISTRO AUTOMÁTICO DE ABONO ---
            // Si el usuario envió un anticipo, lo registramos en la tabla de abonos
            if (anticipo && anticipo > 0) {
                await RentaAbono.create({
                    renta_id: nuevaRenta.id,
                    monto: anticipo,
                    metodo: metodo_pago || 'Efectivo', // Default si no viene el método
                    fecha: new Date(),
                    nota: 'Anticipo inicial al crear renta'
                }, { transaction: t });
            }

            // 3. Registrar los detalles y descontar stock (Tu lógica existente)
            for (const item of productos) {
                const prodDB = await Articulo.findByPk(item.producto_id);
                if (!prodDB) throw new Error(`Producto no encontrado ID: ${item.producto_id}`);

                const esServicioEspecial = item.producto_id === 4 || item.producto_id === 5;

                if (!esServicioEspecial) {
                    if (prodDB.cantidad_total < item.cantidad) {
                        throw new Error(`Stock insuficiente para: ${prodDB.nombre}`);
                    }
                }

                await RentaDetalle.create({
                    renta_id: nuevaRenta.id,
                    producto_id: item.producto_id,
                    cantidad: item.cantidad,
                    precio_unitario: item.precio_unitario,
                    subtotal: item.cantidad * item.precio_unitario
                }, { transaction: t });

                if (!esServicioEspecial) {
                    await prodDB.update({
                        cantidad_total: prodDB.cantidad_total - item.cantidad
                    }, { transaction: t });
                }
            }

            await t.commit();
            res.status(201).json({ status: "success", data: nuevaRenta });

        } catch (error) {
            await t.rollback();
            console.error("Error en Renta:", error);
            res.status(400).json({ status: "error", message: error.message });
        }
    },

    // OBTENER TODAS LAS RENTAS CON NOMBRE DE CLIENTE
    obtenerTodas: async (req, res) => {
        try {
            const rentas = await Renta.findAll({
                include: [
                    {
                        model: Cliente,
                        as: 'cliente',
                        attributes: ['nombre', 'telefono']
                    },
                    {
                        model: RentaDetalle,
                        as: 'detalles',
                        include: [
                            {
                                model: Articulo,
                                as: 'producto',
                                attributes: ['id', 'nombre', 'foto_url', 'precio_renta']
                            }
                        ]
                    },
                    {
                        model: RentaAbono,
                        as: 'abonos',
                        // CAMBIO AQUÍ: Usamos 'fecha' y 'metodo' como dice tu modelo
                        attributes: ['id', 'monto', 'fecha', 'metodo']
                    }
                ],
                order: [
                    ['created_at', 'DESC'],
                    // También corregimos el ordenamiento por 'fecha'
                    [{ model: RentaAbono, as: 'abonos' }, 'fecha', 'ASC']
                ]
            });
            res.json({ success: true, data: rentas });
        } catch (error) {
            console.error("Error al obtener rentas:", error);
            res.status(500).json({ success: false, error: error.message });
        }
    },
    // OBTENER DETALLE DE UNA RENTA (Para ver qué productos lleva)
    obtenerPorId: async (req, res) => {
        try {
            const { id } = req.params;
            const renta = await Renta.findByPk(id, {
                include: [
                    { model: Cliente, as: 'cliente' },
                    {
                        model: RentaDetalle,
                        as: 'detalles',
                        include: [{ model: Articulo, as: 'producto' }]
                    }
                ]
            });

            if (!renta) return res.status(404).json({ status: "error", message: "Renta no encontrada" });

            res.json({ status: "success", data: renta });
        } catch (error) {
            res.status(500).json({ status: "error", message: error.message });
        }
    },

    // FINALIZAR RENTA (Devolver stock al inventario)
    finalizarRenta: async (req, res) => {
        const t = await sequelize.transaction();
        try {
            const { id } = req.params;
            const renta = await Renta.findByPk(id, {
                include: [{ model: RentaDetalle, as: 'detalles' }]
            });

            if (!renta) throw new Error("Renta no encontrada");
            if (renta.estado === 'finalizada') throw new Error("Esta renta ya fue finalizada");

            // 1. Devolver el stock a los artículos
            for (const item of renta.detalles) {
                if (item.producto_id) { // Solo si es un producto físico, no un servicio
                    const prodDB = await Articulo.findByPk(item.producto_id);
                    await prodDB.update({
                        cantidad_total: prodDB.cantidad_total + item.cantidad
                    }, { transaction: t });
                }
            }

            // 2. Cambiar estado
            await renta.update({ estado: 'finalizada' }, { transaction: t });

            await t.commit();
            res.json({ status: "success", message: "Renta finalizada y stock devuelto" });

        } catch (error) {
            await t.rollback();
            res.status(400).json({ status: "error", message: error.message });
        }
    },

    // ACTUALIZAR ESTADO SIMPLE (Ej. para cancelar o poner 'en curso')
    actualizarEstado: async (req, res) => {
        try {
            const { id } = req.params;
            const { estado } = req.body;

            const renta = await Renta.findByPk(id);
            if (!renta) return res.status(404).json({ status: "error", message: "No existe la renta" });

            await renta.update({ estado });
            res.json({ status: "success", data: renta });
        } catch (error) {
            res.status(500).json({ status: "error", message: error.message });
        }
    },
    // CORREGIDO: getCalendarioData
    getCalendarioData: async (req, res) => {
        try {
            const { fecha } = req.query;
            if (!fecha) throw new Error("La fecha es requerida");

            // Llamamos al servicio (asegúrate de que este método exista en el otro archivo)
            const disponibilidad = await inventarioService.consultarDisponibilidadGlobal(fecha);

            const eventos = await Renta.findAll({
                where: {
                    estado: { [Op.ne]: 'cancelada' },
                    [Op.and]: [
                        { fecha_inicio: { [Op.lte]: fecha } },
                        { fecha_fin: { [Op.gte]: fecha } }
                    ]
                },
                include: [{ model: Cliente, as: 'cliente', attributes: ['nombre'] }]
            });

            res.json({ success: true, disponibilidad, eventos });
        } catch (e) {
            console.error("Error en getCalendarioData:", e);
            res.status(500).json({ success: false, error: e.message });
        }
    },

    // CORREGIDO: consultarOcupacionMes (Ahora recibe req, res)
    consultarOcupacionMes: async (req, res) => {
        try {
            const { anio, mes } = req.query;

            const fechaInicio = new Date(Date.UTC(anio, mes, 1));
            const fechaFin = new Date(Date.UTC(anio, parseInt(mes) + 1, 0, 23, 59, 59));

            const rentas = await Renta.findAll({
                where: {
                    estado: { [Op.ne]: 'cancelada' },
                    [Op.and]: [
                        {
                            [Op.or]: [
                                { fecha_inicio: { [Op.between]: [fechaInicio, fechaFin] } },
                                { fecha_fin: { [Op.between]: [fechaInicio, fechaFin] } },
                                {
                                    [Op.and]: [
                                        { fecha_inicio: { [Op.lte]: fechaInicio } },
                                        { fecha_fin: { [Op.gte]: fechaFin } }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                include: [
                    {
                        model: Cliente,
                        as: 'cliente',
                        attributes: ['id', 'nombre', 'telefono']
                    },
                    {
                        model: RentaDetalle,
                        as: 'detalles',
                        include: [{
                            model: Articulo,
                            as: 'producto',
                            attributes: ['id', 'nombre', 'foto_url']
                        }]
                    },
                    // --- NUEVA INCLUSIÓN PARA LOS ABONOS ---
                    {
                        model: RentaAbono, // Asegúrate de que el nombre del modelo sea correcto
                        as: 'abonos', // Debe coincidir con el "as" definido en tu asociación (hasMany)
                        attributes: ['id', 'monto', 'fecha', 'metodo']
                    }
                ],
                // Agregamos 'total' o 'saldo' si los necesitas para el Dashboard
                attributes: ['id', 'fecha_inicio', 'fecha_fin', 'estado'],
                order: [['fecha_inicio', 'ASC']]
            });

            res.json({ success: true, ocupacion: rentas });
        } catch (error) {
            console.error("Error en consultarOcupacionMes:", error);
            res.status(500).json({ success: false, error: error.message });
        }
    },
    registrarAbono: async (req, res) => {
        try {
            const { renta_id, monto, metodo, banco } = req.body;

            // 1. Crear el registro del abono
            const nuevoAbono = await RentaAbono.create({
                renta_id,
                monto: parseFloat(monto),
                metodo,
                banco,
                fecha: new Date()
            });

            // 2. Obtener la renta con sus detalles y todos los abonos para calcular el saldo
            const renta = await Renta.findByPk(renta_id, {
                include: [{ model: RentaAbono, as: 'abonos' }]
            });

            if (!renta) {
                return res.status(404).json({ success: false, message: "Renta no encontrada" });
            }

            // 3. Calcular el total pagado sumando todos los abonos registrados
            const totalPagado = renta.abonos.reduce((acc, abono) => acc + parseFloat(abono.monto), 0);

            // 4. Lógica de cambio de estado
            // Si el total pagado es igual o mayor al total de la renta, finalizamos
            if (totalPagado >= parseFloat(renta.total)) {
                await renta.update({
                    estado: 'finalizada',
                    anticipo: totalPagado // Actualizamos el campo anticipo para que refleje el total cobrado
                });
            } else {
                // Si apenas es el primer abono y estaba 'apartada', la pasamos a 'confirmada'
                if (renta.estado === 'apartada') {
                    await renta.update({ estado: 'confirmada' });
                }
            }
            console.log(totalPagado, renta.total)
            res.json({
                success: true,
                message: totalPagado >= renta.total
                    ? "Abono registrado y renta finalizada (Total pagado)"
                    : "Abono registrado correctamente",
                data: nuevoAbono,
                saldo_pendiente: renta.total - totalPagado
            });

        } catch (error) {
            console.error("Error al registrar abono:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = rentasCtrl;