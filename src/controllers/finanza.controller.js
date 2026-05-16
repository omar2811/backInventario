const { RentaAbono, Gasto, Renta, Cliente } = require('../models/index');
const { Sequelize, Op, fn, col } = require('sequelize');
const finanzaController = {

    getResumen: async (req, res) => {
        try {
            const { mes, anio } = req.query;
            const hoy = new Date();
            const m = parseInt(mes) || hoy.getMonth() + 1;
            const a = parseInt(anio) || hoy.getFullYear();

            // 1. Rango para el mes actual (KPIs)
            const fechaInicio = new Date(a, m - 1, 1);
            const fechaFin = new Date(a, m, 0, 23, 59, 59);

            // 2. Rango para el historial (Últimos 6 meses)
            const haceSeisMeses = new Date(a, m - 6, 1);

            // --- CONSULTAS PARA KPIs ---
            const ingresos = await RentaAbono.sum('monto', {
                where: { fecha: { [Op.between]: [fechaInicio, fechaFin] } }
            }) || 0;

            const gastos = await Gasto.sum('monto', {
                where: { fecha: { [Op.between]: [fechaInicio, fechaFin] } }
            }) || 0;

            // --- CONSULTA PARA HISTORIAL (Gráfica) ---
            // Agrupamos abonos por mes
            const historialIngresos = await RentaAbono.findAll({
                attributes: [
                    [fn('MONTH', col('fecha')), 'mes'],
                    [fn('SUM', col('monto')), 'total']
                ],
                where: {
                    fecha: { [Op.gte]: haceSeisMeses }
                },
                group: [fn('MONTH', col('fecha'))],
                order: [[fn('MONTH', col('fecha')), 'ASC']],
                raw: true
            });

            // Formatear nombres de meses para el Frontend
            const nombresMeses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

            const chartDataRaw = historialIngresos.map(item => ({
                mes: nombresMeses[item.mes - 1],
                total: parseFloat(item.total)
            }));

            res.json({
                success: true,
                data: {
                    ingresos: parseFloat(ingresos),
                    gastos: parseFloat(gastos),
                    utilidad: parseFloat(ingresos - gastos),
                    mes: m,
                    anio: a,
                    // Enviamos estos dos arreglos listos para la gráfica
                    labels: chartDataRaw.map(d => d.mes),
                    serie: chartDataRaw.map(d => d.total)
                }
            });
        } catch (error) {
            console.error("Error en Resumen:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 2. Obtener Transacciones Recientes (Mix de Abonos y Gastos)
    getTransacciones: async (req, res) => {
        try {
            // 1. Obtener parámetros de la URL (?mes=2&anio=2026)
            const { mes, anio } = req.query;
            const hoy = new Date();
            const m = parseInt(mes) || hoy.getMonth() + 1;
            const a = parseInt(anio) || hoy.getFullYear();

            // 2. Definir el rango de fecha (Primer y último día del mes)
            const fechaInicio = new Date(a, m - 1, 1);
            const fechaFin = new Date(a, m, 0, 23, 59, 59);

            const filtroFecha = {
                fecha: { [Op.between]: [fechaInicio, fechaFin] }
            };

            // 3. Buscar Abonos del mes seleccionado
            const abonos = await RentaAbono.findAll({
                where: filtroFecha,
                order: [['fecha', 'DESC']],
                include: [{
                    model: Renta,
                    as: 'renta',
                    include: [{ model: Cliente, as: 'cliente', attributes: ['nombre'] }]
                }]
            });

            // 4. Buscar Gastos del mes seleccionado
            const gastos = await Gasto.findAll({
                where: filtroFecha,
                order: [['fecha', 'DESC']]
            });

            // 5. Unificar y formatear
            const transacciones = [
                ...abonos.map(a => ({
                    id: `AB-${a.id}`,
                    tipo: 'ingreso',
                    concepto: `Abono: ${a.renta?.cliente?.nombre || 'S/N'}`,
                    monto: parseFloat(a.monto),
                    metodo: a.metodo || 'Abono Renta',
                    fecha: a.fecha // Usamos la fecha del abono, no created_at
                })),
                ...gastos.map(g => ({
                    id: `GA-${g.id}`,
                    tipo: 'gasto',
                    concepto: g.concepto,
                    monto: parseFloat(g.monto),
                    metodo: g.metodo || 'Gasto General',
                    fecha: g.fecha
                }))
            ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

            // Retornamos todas las del mes (o puedes limitar si son demasiadas)
            res.json({
                success: true,
                data: transacciones,
                periodo: `${m}-${a}`
            });

        } catch (error) {
            console.error("Error en getTransacciones:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // 3. Registrar un Gasto Nuevo
    registrarGasto: async (req, res) => {
        try {
            const nuevoGasto = await Gasto.create(req.body);
            res.status(201).json({ success: true, data: nuevoGasto });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
};

module.exports = finanzaController;