// Database seed script — generates realistic Antarctic station mock data
// Run with: pnpm db:seed

import { logger } from '../../config/logger.js';

async function seed() {
  logger.info('🌱 Starting database seed...');

  // TODO: Insert stations (Maitri, Bharati)
  // TODO: Insert buildings, rooms
  // TODO: Insert assets, sensors
  // TODO: Insert sample telemetry data
  // TODO: Insert sample alerts
  // TODO: Insert sample users with roles

  logger.info('✅ Database seeded successfully');
}

seed().catch((error) => {
  logger.error('❌ Seed failed:', error);
  process.exit(1);
});
