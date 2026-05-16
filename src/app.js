require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');

// Importar las rutas
const inventarioRoutes = require('./routes/inventario.routes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// USAR LAS RUTAS
// Todas las rutas dentro de inventarioRoutes tendrán el prefijo /api/inventario
app.use('/api/inventario', inventarioRoutes);
app.use('/api/clientes', require('./routes/clientes.routes'));
app.use('/api/rentas', require('./routes/rentas.routes'));
app.use('/api/finanzas', require('./routes/finanza.routes'));
app.use('/api/auth', require('./routes/auth.routes'));
const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Conexión a MySQL establecida.');

        await sequelize.sync({ force: false });
        console.log('✅ Tablas sincronizadas.');

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`🚀 Servidor listo en: http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ ERROR CRÍTICO:', error);
        process.exit(1);
    }
};

startServer();