// ═══════════════════════════════════════════════════════════════
// Antarctic Digital Twin — Rich Database Seed Script
// ═══════════════════════════════════════════════════════════════
// Generates realistic operational data for Maitri and Bharati
// stations, buildings, rooms/zones, assets, sensors, and users.
// Run with: pnpm db:seed
// ═══════════════════════════════════════════════════════════════

import { db } from '../../config/database.js';
import { logger } from '../../config/logger.js';
import { hashPassword } from '../../lib/crypto.js';
import {
  stations,
  buildings,
  rooms,
  assets,
  sensors,
  users,
  alerts,
  telemetry,
  inventoryItems,
  resourceConsumption,
  weatherObservations,
  predictions,
  simulations,
  maintenanceRecords,
  auditLogs,
  incidents,
  edgeSyncBatches,
  edgeOutbox,
  reports,
} from '../schema/index.js';

async function seed() {
  logger.info('🌱 Starting rich Antarctic Digital Twin database seed...');

  logger.info('  → Clearing existing data...');
  await db.delete(reports);
  await db.delete(edgeOutbox);
  await db.delete(edgeSyncBatches);
  await db.delete(incidents);
  await db.delete(weatherObservations);
  await db.delete(resourceConsumption);
  await db.delete(inventoryItems);
  await db.delete(telemetry);
  await db.delete(alerts);
  await db.delete(predictions);
  await db.delete(simulations);
  await db.delete(maintenanceRecords);
  await db.delete(auditLogs);
  await db.delete(sensors);
  await db.delete(assets);
  await db.delete(rooms);
  await db.delete(buildings);
  await db.delete(users);
  await db.delete(stations);

  // 1. Seed Stations
  logger.info('  → Seeding Stations (Maitri & Bharati)...');
  const [maitri] = await db
    .insert(stations)
    .values({
      stationId: 'MAITRI',
      name: 'Maitri Research Station',
      latitude: -70.7667,
      longitude: 11.7333,
      altitude: 117,
      status: 'OPERATIONAL',
      timezone: 'UTC+5:30',
      description:
        'India’s second continental research station, situated in the ice-free rocky Schirmacher Oasis. Established in 1989, it supports year-round interdisciplinary research in earth sciences, meteorology, geomagnetism, and human physiology.',
      imageUrl:
        'https://images.unsplash.com/photo-1517825738774-7de9363ef735?auto=format&fit=crop&w=1200&q=80',
      metadata: {
        establishedYear: 1989,
        summerCapacity: 65,
        winterCapacity: 25,
        lakeSource: 'Lake Priyadarshini',
        structuralFraming: 'Heavy insulated steel modular construction',
      },
    })
    .onConflictDoNothing()
    .returning();

  const [bharati] = await db
    .insert(stations)
    .values({
      stationId: 'BHARATI',
      name: 'Bharati Research Station',
      latitude: -69.4067,
      longitude: 76.1947,
      altitude: 42,
      status: 'OPERATIONAL',
      timezone: 'UTC+5:30',
      description:
        'India’s state-of-the-art third research station located in Larsemann Hills. Commissioned in 2012, this cutting-edge aerodynamic stilt-elevated facility utilizes 134 prefabricated modular shipping containers with automated thermal efficiency and environmental monitoring.',
      imageUrl:
        'https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?auto=format&fit=crop&w=1200&q=80',
      metadata: {
        establishedYear: 2012,
        summerCapacity: 72,
        winterCapacity: 47,
        designType: 'Containerized Aerodynamic Stilt',
        satelliteLink: 'High-speed dedicated ISRO GSAT downlink',
      },
    })
    .onConflictDoNothing()
    .returning();

  // If already seeded and returned undefined due to conflict, re-fetch
  const maitriStation =
    maitri ??
    (await db.query.stations.findFirst({ where: (s, { eq }) => eq(s.stationId, 'MAITRI') }))!;
  const bharatiStation =
    bharati ??
    (await db.query.stations.findFirst({ where: (s, { eq }) => eq(s.stationId, 'BHARATI') }))!;

  // 2. Seed Buildings
  logger.info('  → Seeding Buildings & Zones...');
  const [mMain] = await db
    .insert(buildings)
    .values({
      stationId: maitriStation.id,
      name: 'Main Station Living Complex',
      code: 'MTR-MAIN',
      floors: 2,
      purpose: 'Primary habitation, crew dining, infirmary, and core laboratories',
      coordinates: { x: 0, y: 0, z: 0 },
    })
    .returning();

  const [mPower] = await db
    .insert(buildings)
    .values({
      stationId: maitriStation.id,
      name: 'Central Generator Shed',
      code: 'MTR-PWR',
      floors: 1,
      purpose: 'Heavy diesel gensets, main busbars, and distribution switchgear',
      coordinates: { x: 45, y: 20, z: 0 },
    })
    .returning();

  const [mWater] = await db
    .insert(buildings)
    .values({
      stationId: maitriStation.id,
      name: 'Priyadarshini Pump House',
      code: 'MTR-WTR',
      floors: 1,
      purpose: 'Lake Priyadarshini water extraction and heated delivery manifold',
      coordinates: { x: 15, y: -50, z: 0 },
    })
    .returning();

  const [bHabitat] = await db
    .insert(buildings)
    .values({
      stationId: bharatiStation.id,
      name: 'Main Aerodynamic Habitat Block',
      code: 'BHR-HAB',
      floors: 3,
      purpose: 'Elevated aerodynamic living block, research laboratories, and bridge',
      coordinates: { x: 0, y: 0, z: 0 },
    })
    .returning();

  const [bEnergy] = await db
    .insert(buildings)
    .values({
      stationId: bharatiStation.id,
      name: 'Energy & CHP Plant',
      code: 'BHR-ENG',
      floors: 1,
      purpose: 'Combined heat and power (CHP) generation and fuel conditioning',
      coordinates: { x: 35, y: -25, z: 0 },
    })
    .returning();

  const [bSat] = await db
    .insert(buildings)
    .values({
      stationId: bharatiStation.id,
      name: 'ISRO Satellite Earth Station',
      code: 'BHR-SAT',
      floors: 1,
      purpose: 'GSAT satellite communication dome and atmospheric radar receiver',
      coordinates: { x: -45, y: 35, z: 0 },
    })
    .returning();

  // 3. Seed Rooms
  logger.info('  → Seeding Rooms & Compartments...');
  await db
    .insert(rooms)
    .values([
      {
        buildingId: mMain.id,
        name: 'Maitri Communications & Control Center',
        code: 'MTR-OPS',
        floor: 1,
        purpose: 'Operations monitoring, HF radio communications, and twin telemetry console',
        area: 50,
      },
      {
        buildingId: mMain.id,
        name: 'Atmospheric Physics Laboratory',
        code: 'MTR-LAB-1',
        floor: 2,
        purpose: 'Greenhouse gas measurements and Dobson spectrophotometer station',
        area: 45,
      },
      {
        buildingId: mPower.id,
        name: 'Main Generator Bay',
        code: 'MTR-GEN-BAY',
        floor: 0,
        purpose: 'Three 62.5 kVA Kirloskar diesel generator sets',
        area: 95,
      },
      {
        buildingId: mWater.id,
        name: 'Lake Intake Valve Chamber',
        code: 'MTR-VALVE-ROOM',
        floor: 0,
        purpose: 'Submerged heated trace pipe intake and sand filtration array',
        area: 30,
      },
      {
        buildingId: bHabitat.id,
        name: 'Digital Twin Master Command Bridge',
        code: 'BHR-BRIDGE',
        floor: 2,
        purpose: 'Real-time 3D station twin telemetry, BMS controls, and satellite status',
        area: 80,
      },
      {
        buildingId: bHabitat.id,
        name: 'Bio-Sciences & Cryobiology Lab',
        code: 'BHR-BIO-LAB',
        floor: 1,
        purpose: 'Microbiology incubators, -80°C ultra-low freezers, and sterile hood',
        area: 55,
      },
      {
        buildingId: bEnergy.id,
        name: 'Tri-generation Engine Hall',
        code: 'BHR-ENG-HALL',
        floor: 0,
        purpose: 'Primary cogeneration turbines and district heating heat-exchangers',
        area: 120,
      },
      {
        buildingId: bSat.id,
        name: 'Telemetry Processing Center',
        code: 'BHR-TPC',
        floor: 0,
        purpose: 'High-throughput ground station demodulators and edge compute cluster',
        area: 40,
      },
    ])
    .returning();

  // 4. Seed Assets & Equipment
  logger.info('  → Seeding Critical Assets...');
  const [gen1, pump1, chp1, radome1] = await db
    .insert(assets)
    .values([
      {
        stationId: maitriStation.id,
        buildingId: mPower.id,
        name: 'Maitri Diesel Generator Unit 1',
        code: 'MTR-GEN-01',
        category: 'GENERATOR',
        manufacturer: 'Kirloskar Oil Engines',
        model: 'Arctic Polar Diesel 62.5 kVA',
        serialNumber: 'KIR-2018-PLR-0941',
        status: 'NORMAL',
        metadata: { ratedKW: 50, phase: 3, fuelType: 'Antarctic High-Pour Fuel (D-80)' },
      },
      {
        stationId: maitriStation.id,
        buildingId: mWater.id,
        name: 'Lake Priyadarshini Deep Intake Pump',
        code: 'MTR-PUMP-01',
        category: 'WATER_TREATMENT',
        manufacturer: 'Grundfos Polar Series',
        model: 'SP 5A-25 Arctic Edition',
        serialNumber: 'GF-2020-AQ-771',
        status: 'NORMAL',
        metadata: { maxFlowM3PerHour: 5.5, heatedTracerWatts: 1500 },
      },
      {
        stationId: bharatiStation.id,
        buildingId: bEnergy.id,
        name: 'Bharati Combined Heat & Power (CHP) Unit 1',
        code: 'BHR-CHP-01',
        category: 'GENERATOR',
        manufacturer: 'Caterpillar Marine',
        model: 'C9.3 ACERT Cogeneration 250 ekW',
        serialNumber: 'CAT-2021-CHP-4412',
        status: 'NORMAL',
        metadata: { thermalOutputKW: 300, electricalOutputKW: 250, heatRecoveryEfficiency: 0.88 },
      },
      {
        stationId: bharatiStation.id,
        buildingId: bSat.id,
        name: 'Bharati ISRO Radome Antenna System',
        code: 'BHR-RADOME-01',
        category: 'COMMUNICATION',
        manufacturer: 'Cobham SATCOM',
        model: 'Sea Tel 9711 Ku/C Dual-Band 2.4m',
        serialNumber: 'COB-2019-ANT-008',
        status: 'NORMAL',
        metadata: { trackingBand: 'Ku-Band', windSurvivabilityKmH: 220 },
      },
    ])
    .returning();

  // 5. Seed Sensors
  logger.info('  → Seeding Sensors & Thresholds...');
  const insertedSensors = await db
    .insert(sensors)
    .values([
      // MAITRI SENSORS
      {
        assetId: gen1.id,
        stationId: maitriStation.id,
        name: 'Gen-1 Coolant Temperature',
        type: 'TEMPERATURE',
        unit: '°C',
        minThreshold: 40,
        maxThreshold: 98,
        warningThreshold: 92,
        criticalThreshold: 98,
        status: 'NORMAL',
        lastReading: 82.4,
      },
      {
        assetId: gen1.id,
        stationId: maitriStation.id,
        name: 'Active Power Demand',
        type: 'POWER',
        unit: 'kW',
        minThreshold: 0,
        maxThreshold: 160,
        warningThreshold: 125,
        criticalThreshold: 145,
        status: 'NORMAL',
        lastReading: 85.0,
      },
      {
        assetId: gen1.id,
        stationId: maitriStation.id,
        name: 'Gen-1 Power Output',
        type: 'POWER',
        unit: '%',
        minThreshold: 10,
        maxThreshold: 100,
        warningThreshold: 30,
        criticalThreshold: 15,
        status: 'NORMAL',
        lastReading: 68.5,
      },
      {
        assetId: gen1.id,
        stationId: maitriStation.id,
        name: 'Gen-1 Fuel Level (Day Tank)',
        type: 'FUEL',
        unit: '%',
        minThreshold: 0,
        maxThreshold: 100,
        warningThreshold: 25,
        criticalThreshold: 10,
        status: 'NORMAL',
        lastReading: 84.0,
      },
      {
        assetId: gen1.id,
        stationId: maitriStation.id,
        name: 'Gen-2 Coolant Temperature',
        type: 'TEMPERATURE',
        unit: '°C',
        minThreshold: 40,
        maxThreshold: 98,
        warningThreshold: 92,
        criticalThreshold: 98,
        status: 'NORMAL',
        lastReading: 80.1,
      },
      {
        assetId: gen1.id,
        stationId: maitriStation.id,
        name: 'Gen-2 Power Output',
        type: 'POWER',
        unit: '%',
        minThreshold: 10,
        maxThreshold: 100,
        warningThreshold: 30,
        criticalThreshold: 15,
        status: 'NORMAL',
        lastReading: 0.0,
      },
      {
        assetId: pump1.id,
        stationId: maitriStation.id,
        name: 'Lake Priyadarshini Intake Flow',
        type: 'WATER',
        unit: 'L/min',
        minThreshold: 0,
        maxThreshold: 50,
        warningThreshold: 10,
        criticalThreshold: 5,
        status: 'NORMAL',
        lastReading: 22.5,
      },
      {
        assetId: pump1.id,
        stationId: maitriStation.id,
        name: 'Priyadarshini Line Water Pressure',
        type: 'PRESSURE',
        unit: 'bar',
        minThreshold: 0,
        maxThreshold: 6.0,
        warningThreshold: 2.0,
        criticalThreshold: 1.0,
        status: 'NORMAL',
        lastReading: 3.8,
      },
      {
        assetId: pump1.id,
        stationId: maitriStation.id,
        name: 'Water Storage Level',
        type: 'WATER',
        unit: '%',
        minThreshold: 0,
        maxThreshold: 100,
        warningThreshold: 30,
        criticalThreshold: 15,
        status: 'NORMAL',
        lastReading: 78.0,
      },
      {
        assetId: pump1.id,
        stationId: maitriStation.id,
        name: 'Outside Ambient Temperature',
        type: 'TEMPERATURE',
        unit: '°C',
        minThreshold: -70,
        maxThreshold: 15,
        warningThreshold: -60,
        criticalThreshold: -65,
        status: 'NORMAL',
        lastReading: -25.4,
      },
      {
        assetId: pump1.id,
        stationId: maitriStation.id,
        name: 'Wind Speed',
        type: 'WIND_SPEED',
        unit: 'km/h',
        minThreshold: 0,
        maxThreshold: 250,
        warningThreshold: 100,
        criticalThreshold: 150,
        status: 'NORMAL',
        lastReading: 45.2,
      },
      {
        assetId: pump1.id,
        stationId: maitriStation.id,
        name: 'Atmospheric Pressure',
        type: 'PRESSURE',
        unit: 'hPa',
        minThreshold: 950,
        maxThreshold: 1050,
        warningThreshold: 970,
        criticalThreshold: 960,
        status: 'NORMAL',
        lastReading: 985.4,
      },
      {
        assetId: pump1.id,
        stationId: maitriStation.id,
        name: 'Station Interior Temperature',
        type: 'TEMPERATURE',
        unit: '°C',
        minThreshold: 10,
        maxThreshold: 30,
        warningThreshold: 15,
        criticalThreshold: 12,
        status: 'NORMAL',
        lastReading: 21.5,
      },
      {
        assetId: pump1.id,
        stationId: maitriStation.id,
        name: 'Station CO2 Level',
        type: 'CO2',
        unit: 'ppm',
        minThreshold: 300,
        maxThreshold: 2000,
        warningThreshold: 800,
        criticalThreshold: 1200,
        status: 'NORMAL',
        lastReading: 420.0,
      },
      {
        assetId: gen1.id,
        stationId: maitriStation.id,
        name: 'UPS Battery Charge',
        type: 'BATTERY',
        unit: '%',
        minThreshold: 0,
        maxThreshold: 100,
        warningThreshold: 40,
        criticalThreshold: 20,
        status: 'NORMAL',
        lastReading: 100.0,
      },
      {
        assetId: pump1.id,
        stationId: maitriStation.id,
        name: 'Geomagnetic Field Intensity',
        type: 'STRUCTURAL',
        unit: 'nT',
        minThreshold: 20000,
        maxThreshold: 80000,
        warningThreshold: 25000,
        criticalThreshold: 20000,
        status: 'NORMAL',
        lastReading: 45000,
      },
      {
        assetId: pump1.id,
        stationId: maitriStation.id,
        name: 'Seismograph Ground Velocity',
        type: 'VIBRATION',
        unit: 'nm/s',
        minThreshold: 0,
        maxThreshold: 100,
        warningThreshold: 50,
        criticalThreshold: 80,
        status: 'NORMAL',
        lastReading: 12.4,
      },

      // BHARATI SENSORS
      {
        assetId: chp1.id,
        stationId: bharatiStation.id,
        name: 'CHP Unit-1 Electrical Output',
        type: 'POWER',
        unit: 'kW',
        minThreshold: 0,
        maxThreshold: 300,
        warningThreshold: 260,
        criticalThreshold: 280,
        status: 'NORMAL',
        lastReading: 185.0,
      },
      {
        assetId: chp1.id,
        stationId: bharatiStation.id,
        name: 'Active Power Demand',
        type: 'POWER',
        unit: 'kW',
        minThreshold: 0,
        maxThreshold: 300,
        warningThreshold: 260,
        criticalThreshold: 280,
        status: 'NORMAL',
        lastReading: 185.0,
      },
      {
        assetId: chp1.id,
        stationId: bharatiStation.id,
        name: 'CHP Unit-1 Thermal Output',
        type: 'TEMPERATURE',
        unit: '°C',
        minThreshold: 50,
        maxThreshold: 130,
        warningThreshold: 110,
        criticalThreshold: 125,
        status: 'NORMAL',
        lastReading: 95.0,
      },
      {
        assetId: chp1.id,
        stationId: bharatiStation.id,
        name: 'Jet A-1 Fuel Tank Level',
        type: 'FUEL',
        unit: '%',
        minThreshold: 0,
        maxThreshold: 100,
        warningThreshold: 25,
        criticalThreshold: 10,
        status: 'NORMAL',
        lastReading: 72.0,
      },
      {
        assetId: radome1.id,
        stationId: bharatiStation.id,
        name: 'ISRO Radome Signal Strength',
        type: 'NETWORK',
        unit: 'dBm',
        minThreshold: -120,
        maxThreshold: 0,
        warningThreshold: -90,
        criticalThreshold: -100,
        status: 'NORMAL',
        lastReading: -55.0,
      },
      {
        assetId: radome1.id,
        stationId: bharatiStation.id,
        name: 'Bharati Outside Ambient Air Temp',
        type: 'TEMPERATURE',
        unit: '°C',
        minThreshold: -70,
        maxThreshold: 15,
        warningThreshold: -60,
        criticalThreshold: -70,
        status: 'NORMAL',
        lastReading: -24.8,
      },
      {
        assetId: radome1.id,
        stationId: bharatiStation.id,
        name: 'Katabatic Wind Speed',
        type: 'WIND_SPEED',
        unit: 'km/h',
        minThreshold: 0,
        maxThreshold: 300,
        warningThreshold: 120,
        criticalThreshold: 180,
        status: 'NORMAL',
        lastReading: 55.0,
      },
      {
        assetId: radome1.id,
        stationId: bharatiStation.id,
        name: 'RO Water Production Rate',
        type: 'WATER',
        unit: 'L/hr',
        minThreshold: 0,
        maxThreshold: 600,
        warningThreshold: 100,
        criticalThreshold: 50,
        status: 'NORMAL',
        lastReading: 350.0,
      },
      {
        assetId: radome1.id,
        stationId: bharatiStation.id,
        name: 'Water Distribution Pressure',
        type: 'PRESSURE',
        unit: 'bar',
        minThreshold: 0,
        maxThreshold: 6.0,
        warningThreshold: 2.0,
        criticalThreshold: 1.0,
        status: 'NORMAL',
        lastReading: 3.6,
      },
      {
        assetId: radome1.id,
        stationId: bharatiStation.id,
        name: 'Habitat Interior Humidity',
        type: 'HUMIDITY',
        unit: '%',
        minThreshold: 0,
        maxThreshold: 100,
        warningThreshold: 25,
        criticalThreshold: 15,
        status: 'NORMAL',
        lastReading: 45.0,
      },
      {
        assetId: radome1.id,
        stationId: bharatiStation.id,
        name: 'Solar Irradiance',
        type: 'SOLAR_RADIATION',
        unit: 'W/m²',
        minThreshold: 0,
        maxThreshold: 1200,
        warningThreshold: 0,
        criticalThreshold: 0,
        status: 'NORMAL',
        lastReading: 120.0,
      },
      {
        assetId: radome1.id,
        stationId: bharatiStation.id,
        name: 'Edge Cluster CPU Load',
        type: 'NETWORK',
        unit: '%',
        minThreshold: 0,
        maxThreshold: 100,
        warningThreshold: 85,
        criticalThreshold: 95,
        status: 'NORMAL',
        lastReading: 42.0,
      },
      {
        assetId: radome1.id,
        stationId: bharatiStation.id,
        name: 'Edge Cluster Storage Used',
        type: 'NETWORK',
        unit: '%',
        minThreshold: 0,
        maxThreshold: 100,
        warningThreshold: 80,
        criticalThreshold: 90,
        status: 'NORMAL',
        lastReading: 65.0,
      },
      {
        assetId: radome1.id,
        stationId: bharatiStation.id,
        name: 'Seismic Accelerometer (E-W)',
        type: 'VIBRATION',
        unit: 'µm/s',
        minThreshold: 0,
        maxThreshold: 50,
        warningThreshold: 20,
        criticalThreshold: 35,
        status: 'NORMAL',
        lastReading: 5.2,
      },
    ])
    .returning();

  // 6. Seed Sample Telemetry Readings
  logger.info('  → Seeding Baseline Telemetry...');
  const now = Date.now();
  const telemetryData: any[] = [];
  for (let i = 0; i < 24; i++) {
    const time = new Date(now - (23 - i) * 3600 * 1000);

    insertedSensors.forEach((s) => {
      // Create a slightly jittery baseline value
      const val = s.lastReading != null ? (s.lastReading as number) : 50;
      telemetryData.push({
        sensorId: s.id,
        stationId: s.stationId,
        timestamp: time,
        value: +(val + (Math.random() - 0.5) * 2).toFixed(2),
        unit: s.unit,
        status: 'NORMAL' as const,
        quality: 100,
      });
    });
  }
  await db.insert(telemetry).values(telemetryData);

  // 7. Seed Sample Alerts
  logger.info('  → Seeding Initial Alerts...');
  const mFuelSensor = insertedSensors.find((s) => s.name.includes('Fuel Level'));
  const bWindSensor = insertedSensors.find((s) => s.name.includes('Katabatic Wind Speed'));

  await db.insert(alerts).values([
    {
      stationId: maitriStation.id,
      sensorId: mFuelSensor?.id,
      title: 'Scheduled Antarctic Fuel Replenishment Window',
      message:
        'Maitri bulk tank transfer scheduled from northern fuel bladders. Ensure heated tracing is engaged.',
      severity: 'INFO',
      status: 'ACTIVE',
      category: 'POWER',
    },
    {
      stationId: bharatiStation.id,
      sensorId: bWindSensor?.id,
      title: 'Approaching Katabatic Wind Front',
      message:
        'Meteorological sensors register pressure drop of 4.2 hPa/hr. External doors locked down.',
      severity: 'WARNING',
      status: 'ACTIVE',
      category: 'ENVIRONMENTAL',
    },
  ]);

  // 8. Seed Default System Users
  logger.info('  → Seeding System & Station Commander Accounts...');
  const defaultPassword = hashPassword('Antarctic2026!');

  await db
    .insert(users)
    .values([
      {
        id: '00000001-0000-0000-0000-000000000001',
        email: 'admin@antarctic.gov.in',
        name: 'Dr. Rajeshwar Sharma',
        passwordHash: defaultPassword,
        role: 'SUPER_ADMIN',
        isActive: true,
      },
      {
        id: '00000001-0000-0000-0000-000000000002',
        email: 'commander.maitri@antarctic.gov.in',
        name: 'Col. Amitav Banerjee',
        passwordHash: defaultPassword,
        role: 'STATION_ADMIN',
        stationId: maitriStation.id,
        isActive: true,
      },
      {
        id: '00000001-0000-0000-0000-000000000003',
        email: 'commander.bharati@antarctic.gov.in',
        name: 'Cmdr. Sunita Rao',
        passwordHash: defaultPassword,
        role: 'STATION_ADMIN',
        stationId: bharatiStation.id,
        isActive: true,
      },
      {
        email: 'scientist.lead@antarctic.gov.in',
        name: 'Dr. Priya Narayanan',
        passwordHash: defaultPassword,
        role: 'SCIENTIST',
        stationId: bharatiStation.id,
        isActive: true,
      },
      {
        email: 'operator.ops@antarctic.gov.in',
        name: 'Vikramaditya Joshi',
        passwordHash: defaultPassword,
        role: 'OPERATOR',
        stationId: maitriStation.id,
        isActive: true,
      },
      {
        email: 'observer@antarctic.gov.in',
        name: 'Ananya Deshmukh',
        passwordHash: defaultPassword,
        role: 'VIEWER',
        isActive: true,
      },
    ])
    .onConflictDoNothing();

  // 9. Seed Inventory & Polar Resources
  logger.info('  → Seeding Critical Polar Inventory & Fuel Reserves...');
  const [fuelItem] = await db
    .insert(inventoryItems)
    .values([
      {
        stationId: maitriStation.id,
        name: 'Maitri Bulk Arctic Diesel Bladder Alpha',
        code: 'MTR-FUEL-BLK-01',
        category: 'FUEL',
        currentStock: 42500,
        minimumThreshold: 10000,
        unit: 'L',
        location: 'South Fuel Bladder Farm',
      },
      {
        stationId: maitriStation.id,
        name: 'Generator Day Tank Fuel Buffer',
        code: 'MTR-FUEL-DAY-01',
        category: 'FUEL',
        currentStock: 1100,
        minimumThreshold: 300,
        unit: 'L',
        location: 'Central Generator Shed',
      },
      {
        stationId: maitriStation.id,
        name: 'Lake Priyadarshini Potable Water Buffer',
        code: 'MTR-WTR-RES-01',
        category: 'WATER',
        currentStock: 14200,
        minimumThreshold: 3000,
        unit: 'L',
        location: 'Main Complex Storage Cistern',
      },
      {
        stationId: maitriStation.id,
        name: 'Winter Over Emergency Dry Rations',
        code: 'MTR-FOOD-DRY-01',
        category: 'FOOD',
        currentStock: 180,
        minimumThreshold: 45,
        unit: 'packs',
        location: 'Food Store B',
      },
      {
        stationId: bharatiStation.id,
        name: 'Bharati Jet A-1 Fuel Tank Array',
        code: 'BHR-FUEL-BLK-01',
        category: 'FUEL',
        currentStock: 78000,
        minimumThreshold: 20000,
        unit: 'L',
        location: 'Energy Central Fuel Vault',
      },
      {
        stationId: bharatiStation.id,
        name: 'RO Desalinated Potable Water Buffer',
        code: 'BHR-WTR-RO-01',
        category: 'WATER',
        currentStock: 24000,
        minimumThreshold: 5000,
        unit: 'L',
        location: 'Water Processing Plant',
      },
      {
        stationId: bharatiStation.id,
        name: 'Polar Critical Care Trauma Surgical Pack',
        code: 'BHR-MED-SURG-01',
        category: 'MEDICAL',
        currentStock: 24,
        minimumThreshold: 6,
        unit: 'kits',
        location: 'Habitat Level 1 Infirmary',
      },
    ])
    .onConflictDoNothing()
    .returning();

  if (fuelItem) {
    await db.insert(resourceConsumption).values({
      inventoryItemId: fuelItem.id,
      stationId: maitriStation.id,
      quantity: 450,
      unit: 'L',
      notes: 'Initial baseline generator run consumption',
    });
  }

  // 7. Seed Initial Polar Weather Observations
  logger.info('  → Seeding Baseline Polar Weather Observations...');
  await db.insert(weatherObservations).values([
    {
      stationId: maitriStation.id,
      temperature: -28.0,
      windSpeed: 54.0,
      windGust: 78.3,
      windDirection: 'SSE',
      windChill: -44.2,
      pressure: 978.0,
      humidity: 55,
      visibilityMeters: 4500,
      condition: 'KATABATIC_GALE',
      provenance: 'SIMULATED',
      recordedAt: new Date(),
    },
    {
      stationId: bharatiStation.id,
      temperature: -18.5,
      windSpeed: 42.0,
      windGust: 60.9,
      windDirection: 'ENE',
      windChill: -30.8,
      pressure: 992.0,
      humidity: 78,
      visibilityMeters: 6000,
      condition: 'OVERCAST',
      provenance: 'SIMULATED',
      recordedAt: new Date(),
    },
  ]);

  logger.info(
    '✅ Antarctic Digital Twin database seeded successfully with Maitri, Bharati, and realistic operational assets!',
  );
  logger.info('🔑 Default accounts created with password: Antarctic2026!');
  logger.info('   • SUPER_ADMIN: admin@antarctic.gov.in');
  logger.info('   • STATION_ADMIN (Maitri): commander.maitri@antarctic.gov.in');
  logger.info('   • STATION_ADMIN (Bharati): commander.bharati@antarctic.gov.in');
  logger.info('   • SCIENTIST: scientist.lead@antarctic.gov.in');
  logger.info('   • OPERATOR: operator.ops@antarctic.gov.in');
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error('❌ Seed failed:', error);
    process.exit(1);
  });
