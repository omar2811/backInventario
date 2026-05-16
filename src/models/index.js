const Articulo = require('./Articulo');
const Categoria = require('./Categoria');
const Cliente = require('./Cliente');
const Renta = require('./Renta');
const RentaDetalle = require('./RentaDetalle');
const RentaAbono = require('./RentaAbono');
const Gasto = require('./Gasto'); // <--- 1. IMPORTAR EL NUEVO MODELO
const Usuario = require('./Usuario'); // <--- 1. IMPORTAR EL NUEVO MODELO
const sequelize = require('../config/db');
/**
 * RELACIONES DE INVENTARIO
 */
Articulo.belongsTo(Categoria, {
    as: 'categoria',
    foreignKey: 'categoria_id'
});

Categoria.hasMany(Articulo, {
    as: 'productos',
    foreignKey: 'categoria_id'
});

/**
 * RELACIONES DE RENTAS
 */

// 1. Un Cliente tiene muchas Rentas
Cliente.hasMany(Renta, {
    as: 'rentas',
    foreignKey: 'cliente_id'
});
Renta.belongsTo(Cliente, {
    as: 'cliente',
    foreignKey: 'cliente_id'
});

// 2. Una Renta tiene muchos Detalles (productos rentados)
Renta.hasMany(RentaDetalle, {
    as: 'detalles',
    foreignKey: 'renta_id'
});
RentaDetalle.belongsTo(Renta, {
    as: 'renta',
    foreignKey: 'renta_id'
});

// 3. Un Detalle de renta pertenece a un Artículo (Producto)
RentaDetalle.belongsTo(Articulo, {
    as: 'producto',
    foreignKey: 'producto_id'
});
Articulo.hasMany(RentaDetalle, {
    as: 'detalles_renta',
    foreignKey: 'producto_id'
});

/**
 * RELACIONES DE ABONOS
 */

// Una Renta tiene muchos Abonos
Renta.hasMany(RentaAbono, {
    as: 'abonos',
    foreignKey: 'renta_id'
});

RentaAbono.belongsTo(Renta, {
    as: 'renta',
    foreignKey: 'renta_id'
});

// Nota: El modelo Gasto usualmente no tiene relaciones directas 
// a menos que quieras asociar un gasto a un proveedor o empleado.

module.exports = {
    Articulo,
    Categoria,
    Cliente,
    Renta,
    RentaDetalle,
    RentaAbono,
    Gasto, // <--- 2. EXPORTAR EL NUEVO MODELO
    Usuario,
    sequelize// <--- 2. EXPORTAR EL NUEVO MODELO
};