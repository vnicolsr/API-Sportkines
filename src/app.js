require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initTokenRefresh } = require('./services/tokenService');
const sucursalesRoutes = require('./routes/sucursalesRoutes');
const diasRoutes = require('./routes/diasRoutes');
const horariosRoutes = require('./routes/horariosRoutes');
const citaRoutes = require('./routes/citaRoutes');
const { logger } = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log de requests
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, { body: req.body });
  next();
});

// Rutas
app.use('/resolver-sucursal', sucursalesRoutes);
app.use('/obtener-dias', diasRoutes);
app.use('/obtener-horarios', horariosRoutes);
app.use('/confirmar-cita', citaRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Error no controlado:', err.message);
  res.status(500).json({ error: true, message: 'Error interno del servidor' });
});

async function bootstrap() {
  try {
    await initTokenRefresh();
    logger.info('Token inicial obtenido correctamente');
    app.listen(PORT, () => {
      logger.info(`Middleware Sportkines corriendo en puerto ${PORT}`);
    });
  } catch (error) {
    logger.error('Error al iniciar el servidor:', error.message);
    process.exit(1);
  }
}

bootstrap();
