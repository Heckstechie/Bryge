require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');

const routes       = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Security & logging ────────────────────────────────────────────────────────
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api', routes);

app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── Error handler (must be last) ──────────────────────────────────────────────
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`Bryge API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

// Express 5 calls server.unref() internally, which allows Node to exit when nothing
// else is pending. Re-ref the server so the process stays alive while it's listening.
server.ref();

// Surface bind errors (e.g. EADDRINUSE) instead of silently crashing
server.on('error', (err) => {
  console.error('Server error:', err.message);
  process.exit(1);
});

// Graceful shutdown on SIGTERM / SIGINT (Ctrl-C)
function shutdown(signal) {
  console.log(`\n${signal} received — shutting down gracefully`);
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
  // Force-kill after 10 s if connections are still open
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

module.exports = app;
