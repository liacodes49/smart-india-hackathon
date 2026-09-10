// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Server Entry Point
// ═══════════════════════════════════════════════════════════════

import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

const PORT = env.API_PORT;

app.listen(PORT, () => {
  logger.info(`🧊 Antarctic Digital Twin API running on port ${PORT}`);
  logger.info(`   Environment: ${env.NODE_ENV}`);
  logger.info(`   Health: http://localhost:${PORT}/api/v1/health`);
});
