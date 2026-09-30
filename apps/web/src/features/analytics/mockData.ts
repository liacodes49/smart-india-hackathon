// ═══════════════════════════════════════════════════════════════
// Analytics Dashboard Mock Data — NCPOR Antarctic Digital Twin
// ═══════════════════════════════════════════════════════════════
// Realistic structured telemetry for Maitri and Bharati stations.
// Kept separate from UI components so it can be swapped with ML/API data.
// ═══════════════════════════════════════════════════════════════

import {
  StationAnalyticsDataset,
  MaitriVsBharatiComparison,
  EnergyDataPoint,
} from './types';

// Helper to generate 24H energy data points
function generate24hEnergy(baseDemand: number, baseGen: number): EnergyDataPoint[] {
  const points: EnergyDataPoint[] = [];
  const hours = [
    '00:00', '02:00', '04:00', '06:00', '08:00', '10:00',
    '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '24:00'
  ];

  hours.forEach((time, index) => {
    // Peak heating demand occurs in early morning and late evening
    // Deterministic diurnal noise based on index to guarantee 100% identical SSR & client hydration
    const noise = ((index * 7) % 5) - 2;
    const factor = Math.sin((index / 12) * Math.PI * 2 - 1.2) * 12 + noise;
    const demand = Math.round(baseDemand + factor);
    const gen = Math.round(baseGen + factor * 0.95);
    const renewable = Math.round(Math.max(0, 18 + Math.sin((index / 12) * Math.PI) * 14));
    const diesel = demand - renewable;

    points.push({
      timestamp: time,
      demandKw: demand,
      generationKw: gen,
      dieselKw: Math.max(20, diesel),
      renewableKw: renewable,
    });
  });
  return points;
}

// Helper to generate 7D energy data points
function generate7dEnergy(baseDemand: number, baseGen: number): EnergyDataPoint[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map((day, idx) => {
    const variation = Math.sin(idx * 0.9) * 16;
    return {
      timestamp: day,
      demandKw: Math.round(baseDemand + variation),
      generationKw: Math.round(baseGen + variation + 4),
      dieselKw: Math.round(baseDemand + variation - 22),
      renewableKw: 22,
    };
  });
}

// Helper to generate 30D energy data points
function generate30dEnergy(baseDemand: number, baseGen: number): EnergyDataPoint[] {
  const points: EnergyDataPoint[] = [];
  for (let i = 1; i <= 30; i += 3) {
    const variance = Math.cos(i * 0.3) * 22;
    points.push({
      timestamp: `Day ${i}`,
      demandKw: Math.round(baseDemand + variance),
      generationKw: Math.round(baseGen + variance + 6),
      dieselKw: Math.round(baseDemand + variance - 18),
      renewableKw: 18,
    });
  }
  return points;
}

// Helper to generate 90D energy data points
function generate90dEnergy(baseDemand: number, baseGen: number): EnergyDataPoint[] {
  const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'];
  return weeks.map((w, idx) => {
    const trend = (idx / 12) * 28; // Winter seasonal ramp-up
    return {
      timestamp: w,
      demandKw: Math.round(baseDemand - 10 + trend),
      generationKw: Math.round(baseGen - 8 + trend + 5),
      dieselKw: Math.round(baseDemand - 10 + trend - 15),
      renewableKw: 15,
    };
  });
}

// ═══════════════════════════════════════════════════════════════
// 1. MAITRI RESEARCH STATION (Schirmacher Oasis, 70°S)
// ═══════════════════════════════════════════════════════════════
export const MAITRI_ANALYTICS: StationAnalyticsDataset = {
  stationId: 'MAITRI',
  stationName: 'Maitri Research Station',
  coordinates: '70°46′S 11°44′E (117m ASL)',
  kpi: {
    powerDemandKw: 184,
    powerDemandDelta: 4.8,
    powerGenerationKw: 220,
    powerGenerationDelta: 2.1,
    fuelRemainingLitres: 128400,
    fuelRemainingPercent: 68.2,
    fuelDaysRemaining: 74,
    fuelDaysDelta: -3.2,
    generatorLoadPercent: 76.5,
    generatorLoadDelta: 6.2,
    temperatureC: -34.8,
    temperatureDelta: -5.4, // Colder
    stationHealthScore: 88,
    stationHealthDelta: -2.0,
    riskLevel: 'MODERATE',
    riskScore: 36,
  },
  energy: {
    currentDemandKw: 184,
    currentGenerationKw: 220,
    peakDemandKw: 218,
    peakDemandTime: '06:40 UTC',
    baselineDemandKw: 155,
    reserveHeadroomKw: 36,
    trendPercentage: 5.2,
    history: {
      '24H': generate24hEnergy(175, 210),
      '7D': generate7dEnergy(175, 210),
      '30D': generate30dEnergy(175, 210),
      '90D': generate90dEnergy(175, 210),
    },
  },
  generators: {
    totalRunningCount: 2,
    aggregateLoadPercent: 76.5,
    aggregateFuelBurnLph: 52.4,
    generators: [
      {
        id: 'GEN-01',
        name: 'Generator 01',
        model: 'Cummins KTA19-G4 250kVA',
        status: 'RUNNING',
        healthState: 'HEALTHY',
        loadPercent: 82,
        temperatureC: 84.2,
        runtimeHours: 3420,
        fuelConsumptionLph: 28.6,
        efficiencyPercent: 41.8,
        oilPressureBar: 4.6,
        vibrationMmS: 2.1,
        lastMaintenanceDate: '2026-08-14',
        nextServiceHours: 180,
      },
      {
        id: 'GEN-02',
        name: 'Generator 02',
        model: 'Cummins KTA19-G4 250kVA',
        status: 'RUNNING',
        healthState: 'WARNING', // Elevated temp under thermal load
        loadPercent: 71,
        temperatureC: 91.6, // Warning threshold >90°C
        runtimeHours: 4180,
        fuelConsumptionLph: 23.8,
        efficiencyPercent: 38.4,
        oilPressureBar: 4.1,
        vibrationMmS: 3.8, // Slightly elevated vibration
        lastMaintenanceDate: '2026-07-28',
        nextServiceHours: 42,
      },
      {
        id: 'GEN-03',
        name: 'Generator 03',
        model: 'Kirloskar Perkins 200kVA Standby',
        status: 'STANDBY',
        healthState: 'HEALTHY',
        loadPercent: 0,
        temperatureC: 22.4, // Preheated block heater
        runtimeHours: 1240,
        fuelConsumptionLph: 0,
        efficiencyPercent: 0,
        oilPressureBar: 0,
        vibrationMmS: 0.1,
        lastMaintenanceDate: '2026-09-02',
        nextServiceHours: 360,
      },
    ],
  },
  fuel: {
    currentReserveLitres: 128400,
    totalCapacityLitres: 188000,
    reservePercent: 68.2,
    dailyConsumptionLitres: 1735,
    daysRemaining: 74,
    projectedDepletionDate: '02 Dec 2026',
    resupplyDate: '15 Nov 2026',
    resupplyBufferDays: 17,
    isResupplyAtRisk: false,
    history: [
      { date: '13 Sep', dailyBurnL: 1690, projectedBurnL: 1700, ambientTempC: -31 },
      { date: '14 Sep', dailyBurnL: 1720, projectedBurnL: 1710, ambientTempC: -32 },
      { date: '15 Sep', dailyBurnL: 1760, projectedBurnL: 1740, ambientTempC: -34 },
      { date: '16 Sep', dailyBurnL: 1810, projectedBurnL: 1750, ambientTempC: -36 },
      { date: '17 Sep', dailyBurnL: 1780, projectedBurnL: 1770, ambientTempC: -35 },
      { date: '18 Sep', dailyBurnL: 1740, projectedBurnL: 1750, ambientTempC: -34 },
      { date: '19 Sep', dailyBurnL: 1735, projectedBurnL: 1730, ambientTempC: -34.8 },
    ],
    tanks: [
      { id: 'T-01', name: 'Bulk Tank Alpha', type: 'ATF/HSD Polar Grade', currentLitres: 58200, capacityLitres: 80000, percent: 72.8, status: 'OPTIMAL' },
      { id: 'T-02', name: 'Bulk Tank Bravo', type: 'ATF/HSD Polar Grade', currentLitres: 46800, capacityLitres: 80000, percent: 58.5, status: 'OPTIMAL' },
      { id: 'T-03', name: 'Reserve Tank Charlie', type: 'Emergency Bunker Reserve', currentLitres: 19800, capacityLitres: 24000, percent: 82.5, status: 'RESERVE' },
      { id: 'T-04', name: 'Genset Day Service Tank', type: 'Active Feeder Tank', currentLitres: 3600, capacityLitres: 4000, percent: 90.0, status: 'OPTIMAL' },
    ],
  },
  environmental: {
    current: {
      temperatureC: -34.8,
      windSpeedKmh: 48.2,
      windDirectionDeg: 195,
      windDirectionCardinal: 'SSW',
      pressureHpa: 982.4,
      humidityPercent: 62.1,
      visibilityKm: 4.8,
      windChillC: -49.2,
    },
    trendPoints: [
      { timestamp: '00:00', temperatureC: -32.1, windSpeedKmh: 38.4, windDirectionDeg: 185, pressureHpa: 987.2, humidityPercent: 58, visibilityKm: 12.0 },
      { timestamp: '04:00', temperatureC: -33.4, windSpeedKmh: 42.1, windDirectionDeg: 190, pressureHpa: 985.6, humidityPercent: 60, visibilityKm: 9.5 },
      { timestamp: '08:00', temperatureC: -34.2, windSpeedKmh: 46.8, windDirectionDeg: 192, pressureHpa: 984.1, humidityPercent: 61, visibilityKm: 6.2 },
      { timestamp: '12:00', temperatureC: -35.6, windSpeedKmh: 51.2, windDirectionDeg: 198, pressureHpa: 983.0, humidityPercent: 64, visibilityKm: 3.8 },
      { timestamp: '16:00', temperatureC: -35.1, windSpeedKmh: 49.5, windDirectionDeg: 196, pressureHpa: 982.8, humidityPercent: 63, visibilityKm: 4.2 },
      { timestamp: '20:00', temperatureC: -34.8, windSpeedKmh: 48.2, windDirectionDeg: 195, pressureHpa: 982.4, humidityPercent: 62.1, visibilityKm: 4.8 },
    ],
  },
  healthRisk: {
    overallHealthScore: 88,
    overallHealthStatus: 'HEALTHY',
    riskLevel: 'MODERATE',
    riskScore: 36,
    domains: {
      energy: {
        id: 'energy',
        name: 'Energy Subsystem',
        score: 87,
        status: 'WARNING',
        subsystems: ['Genset 01', 'Genset 02 (High Temp)', 'BESS 100kWh'],
        anomaliesCount: 1,
        trend: 'DOWN',
      },
      infrastructure: {
        id: 'infrastructure',
        name: 'Infrastructure',
        score: 92,
        status: 'HEALTHY',
        subsystems: ['Main Station Block', 'Boiler Circuit A', 'Trace Heating'],
        anomaliesCount: 0,
        trend: 'STABLE',
      },
      environment: {
        id: 'environment',
        name: 'Environment & Life Support',
        score: 84,
        status: 'WARNING',
        subsystems: ['HVAC Air Handling', 'Lake Priyadarshini Water Pump', 'Sewage Digest'],
        anomaliesCount: 1,
        trend: 'DOWN',
      },
      logistics: {
        id: 'logistics',
        name: 'Logistics & Supplies',
        score: 86,
        status: 'HEALTHY',
        subsystems: ['POL Farm', 'Food Stores 90D', 'Piston Bully Snowcats'],
        anomaliesCount: 0,
        trend: 'STABLE',
      },
      communications: {
        id: 'communications',
        name: 'Communications',
        score: 96,
        status: 'HEALTHY',
        subsystems: ['GSAT Ku-band Terminal', 'Iridium Certus', 'VHF Ice Fleet'],
        anomaliesCount: 0,
        trend: 'UP',
      },
      safety: {
        id: 'safety',
        name: 'Safety & Life Protection',
        score: 94,
        status: 'HEALTHY',
        subsystems: ['Fire Suppression Inergen', 'Survival Shelters 1-4', 'CO Monitors'],
        anomaliesCount: 0,
        trend: 'STABLE',
      },
    },
    riskBreakdown: [
      { category: 'Thermal Stress', score: 48, description: 'Ambient cold snap (-35°C) elevates trace heating load.' },
      { category: 'Genset Redundancy', score: 38, description: 'GEN-02 running hot at 91.6°C; loss would stress GEN-01.' },
      { category: 'Fuel Depletion', score: 24, description: 'Current buffer is 17 days beyond scheduled ship arrival.' },
      { category: 'Blizzard Impact', score: 32, description: 'Wind speeds gusting 51 km/h with low visibility.' },
    ],
  },
  forecasts: {
    powerDemand: {
      id: 'f-power',
      title: 'Power Demand Forecast (72H)',
      unit: 'kW',
      horizon: 'Next 72 Hours',
      currentValue: 184,
      projectedValue: 206,
      confidencePercent: 93.4,
      trendDirection: 'UP',
      summary: 'Expected to surge +12% during forecasted blizzard front as exterior heating cables activate.',
      series: [
        { timeOffset: '+0H', predicted: 184, lowerBound: 180, upperBound: 188 },
        { timeOffset: '+12H', predicted: 192, lowerBound: 185, upperBound: 198 },
        { timeOffset: '+24H', predicted: 199, lowerBound: 190, upperBound: 208 },
        { timeOffset: '+36H', predicted: 206, lowerBound: 194, upperBound: 218 },
        { timeOffset: '+48H', predicted: 204, lowerBound: 191, upperBound: 216 },
        { timeOffset: '+60H', predicted: 196, lowerBound: 186, upperBound: 207 },
        { timeOffset: '+72H', predicted: 188, lowerBound: 180, upperBound: 197 },
      ],
    },
    fuelReserve: {
      id: 'f-fuel',
      title: 'Fuel Reserve Burn Projection',
      unit: 'kL',
      horizon: 'Next 30 Days',
      currentValue: 128.4,
      projectedValue: 74.8,
      confidencePercent: 91.2,
      trendDirection: 'DOWN',
      summary: 'Projected burn rate of 1,780 L/day maintains 74 days reserve, comfortably meeting Nov 15 resupply.',
      series: [
        { timeOffset: 'Day 0', predicted: 128.4, lowerBound: 128.4, upperBound: 128.4 },
        { timeOffset: 'Day 5', predicted: 119.6, lowerBound: 118.2, upperBound: 120.9 },
        { timeOffset: 'Day 10', predicted: 110.5, lowerBound: 108.4, upperBound: 112.5 },
        { timeOffset: 'Day 15', predicted: 101.4, lowerBound: 98.8, upperBound: 103.8 },
        { timeOffset: 'Day 20', predicted: 92.4, lowerBound: 89.2, upperBound: 95.4 },
        { timeOffset: 'Day 25', predicted: 83.5, lowerBound: 79.8, upperBound: 87.0 },
        { timeOffset: 'Day 30', predicted: 74.8, lowerBound: 70.4, upperBound: 78.8 },
      ],
    },
    generatorLoad: {
      id: 'f-gen',
      title: 'Generator Load Profile Projection',
      unit: '%',
      horizon: 'Next 72 Hours',
      currentValue: 76.5,
      projectedValue: 86.0,
      confidencePercent: 88.5,
      trendDirection: 'UP',
      summary: 'Combined Genset load will approach 86%. Automation scheduled to spin up GEN-03 if load exceeds 88%.',
      series: [
        { timeOffset: '+0H', predicted: 76.5, lowerBound: 74, upperBound: 79 },
        { timeOffset: '+12H', predicted: 79.8, lowerBound: 76, upperBound: 83 },
        { timeOffset: '+24H', predicted: 83.0, lowerBound: 79, upperBound: 87 },
        { timeOffset: '+36H', predicted: 86.0, lowerBound: 81, upperBound: 91 },
        { timeOffset: '+48H', predicted: 84.5, lowerBound: 79, upperBound: 90 },
        { timeOffset: '+60H', predicted: 81.2, lowerBound: 76, upperBound: 86 },
        { timeOffset: '+72H', predicted: 78.0, lowerBound: 74, upperBound: 82 },
      ],
    },
    temperature: {
      id: 'f-temp',
      title: 'Polar Temperature Chill Model',
      unit: '°C',
      horizon: 'Next 72 Hours',
      currentValue: -34.8,
      projectedValue: -42.5,
      confidencePercent: 95.0,
      trendDirection: 'DOWN',
      summary: 'Incoming katabatic cold front will push ambient chill to -42.5°C with wind chill reaching -58°C.',
      series: [
        { timeOffset: '+0H', predicted: -34.8, lowerBound: -35.5, upperBound: -34.1 },
        { timeOffset: '+12H', predicted: -36.5, lowerBound: -37.8, upperBound: -35.2 },
        { timeOffset: '+24H', predicted: -39.2, lowerBound: -41.0, upperBound: -37.5 },
        { timeOffset: '+36H', predicted: -42.5, lowerBound: -44.8, upperBound: -40.1 },
        { timeOffset: '+48H', predicted: -41.8, lowerBound: -44.0, upperBound: -39.5 },
        { timeOffset: '+60H', predicted: -38.2, lowerBound: -40.5, upperBound: -36.0 },
        { timeOffset: '+72H', predicted: -35.0, lowerBound: -37.2, upperBound: -33.5 },
      ],
    },
  },
  insights: [
    {
      id: 'ins-01',
      severity: 'WARNING',
      category: 'GENERATOR',
      title: 'Generator 02 Elevated Manifold Temperature',
      description: 'Cylinder #4 exhaust temperature reached 91.6°C (+7.2°C above baseline). Vibration is trending up at 3.8 mm/s.',
      subsystem: 'Energy / Genset 02',
      timestamp: '10 mins ago',
      recommendation: 'Inspect injector clearance and throttle load balancing toward GEN-01 before temperatures exceed 95°C.',
    },
    {
      id: 'ins-02',
      severity: 'NORMAL',
      category: 'MICROGRID',
      title: 'Microgrid Frequency Stability Nominal',
      description: 'Grid frequency stabilized at 50.04 Hz ±0.03 Hz. BESS battery module absorbing momentary switching transients smoothly.',
      subsystem: 'Energy / Switchgear',
      timestamp: '25 mins ago',
    },
    {
      id: 'ins-03',
      severity: 'WARNING',
      category: 'LOGISTICS',
      title: 'Blizzard Fuel Burn Surge Advisory',
      description: 'Forecasted -42°C drop will spike fuel consumption by ~180 L/day for trace line heating to prevent water pump freeze.',
      subsystem: 'Logistics / POL Storage',
      timestamp: '1 hour ago',
      recommendation: 'Preheat Day Service Tank and verify emergency bunker line heat tracing circuits.',
    },
    {
      id: 'ins-04',
      severity: 'NORMAL',
      category: 'COMMUNICATIONS',
      title: 'GSAT Telemetry Link Operating at Full Margin',
      description: 'C-band/Ku-band carrier-to-noise ratio is 14.8 dB. Zero telemetry packet loss detected in past 6 hours.',
      subsystem: 'Communications / SATCOM',
      timestamp: '2 hours ago',
    },
  ],
  crossDomain: {
    scenarios: [
      {
        id: 'sc-blizzard',
        title: 'Severe Polar Cold Snap & Katabatic Wind',
        triggerEvent: 'Ambient temperature plunges to -52°C with 110 km/h wind gusts',
        tempChangeC: -17.2,
        overallRiskResult: 'HIGH',
        mechanicsDescription: 'Extreme cold drives exterior heat loss → electrical trace heating demands max power → generators run near capacity → fuel burn accelerates → reserve buffer narrows.',
        nodes: [
          { id: 'n-env', label: 'Environment', parameter: 'Ambient Temp & Wind', value: '-52.0°C / 110 km/h', status: 'CRITICAL', impactText: 'Severe cold front & hurricane-force katabatic winds' },
          { id: 'n-inf', label: 'Infrastructure', parameter: 'Habitat Heat Loss', value: '+42% Thermal Loss', status: 'WARNING', impactText: 'Window insulation limits reached; trace heaters engaged 100%' },
          { id: 'n-ene', label: 'Energy', parameter: 'Station Power Demand', value: '238 kW (+29%)', status: 'WARNING', impactText: 'Heating demand drives power load toward microgrid peak capacity' },
          { id: 'n-gen', label: 'Generator', parameter: 'Genset Load & Stress', value: '94% Load (GEN 1+2+3)', status: 'CRITICAL', impactText: 'Standby GEN-03 forced online; thermal strain on running units' },
          { id: 'n-fue', label: 'Fuel', parameter: 'Burn Rate Surge', value: '2,240 L/day (+29%)', status: 'WARNING', impactText: 'Fuel burn rises from 1,735 to 2,240 litres daily' },
          { id: 'n-log', label: 'Logistics', parameter: 'Fuel Days Remaining', value: '57 Days (-17 Days)', status: 'WARNING', impactText: 'Operational buffer shrinks; resupply vessel delivery critical' },
          { id: 'n-rsk', label: 'Risk', parameter: 'Composite Risk Level', value: 'HIGH (Score: 74/100)', status: 'CRITICAL', impactText: 'Resupply risk elevated; equipment failure risk during blizzard' },
        ],
      },
      {
        id: 'sc-nominal',
        title: 'Standard Polar Winter (Nominal Baseline)',
        triggerEvent: 'Routine Antarctic winter conditions (-34°C, 45 km/h winds)',
        tempChangeC: 0,
        overallRiskResult: 'LOW',
        mechanicsDescription: 'Standard seasonal baseline: 2 generators load-sharing comfortably with 74 days fuel reserve remaining.',
        nodes: [
          { id: 'n-env', label: 'Environment', parameter: 'Ambient Temp & Wind', value: '-34.8°C / 48 km/h', status: 'HEALTHY', impactText: 'Normal seasonal Antarctic temperature and wind regime' },
          { id: 'n-inf', label: 'Infrastructure', parameter: 'Habitat Heat Loss', value: 'Nominal HVAC Load', status: 'HEALTHY', impactText: 'All living modules maintain +21°C with standard heat loop' },
          { id: 'n-ene', label: 'Energy', parameter: 'Station Power Demand', value: '184 kW (Nominal)', status: 'HEALTHY', impactText: 'Microgrid running with comfortable 36 kW reserve headroom' },
          { id: 'n-gen', label: 'Generator', parameter: 'Genset Load & Stress', value: '76% Load (GEN 1+2)', status: 'HEALTHY', impactText: 'GEN-01 & 02 alternating; GEN-03 warm standby ready' },
          { id: 'n-fue', label: 'Fuel', parameter: 'Burn Rate Surge', value: '1,735 L/day (Baseline)', status: 'HEALTHY', impactText: 'Fuel burn matches scheduled POL allocation' },
          { id: 'n-log', label: 'Logistics', parameter: 'Fuel Days Remaining', value: '74 Days (+17 Buffer)', status: 'HEALTHY', impactText: 'Adequate margin for Nov 15 ship resupply' },
          { id: 'n-rsk', label: 'Risk', parameter: 'Composite Risk Level', value: 'LOW / MODERATE (36/100)', status: 'HEALTHY', impactText: 'Standard operational margins preserved across all domains' },
        ],
      },
      {
        id: 'sc-gen-trip',
        title: 'Generator 02 Emergency Trip Incident',
        triggerEvent: 'Genset 02 experiences cooling circuit failure and automatically trips offline',
        tempChangeC: 0,
        overallRiskResult: 'CRITICAL',
        mechanicsDescription: 'Loss of 50% active power generation forces load shedding on non-vital systems while GEN-03 auto-starts in sub-zero ambient.',
        nodes: [
          { id: 'n-env', label: 'Environment', parameter: 'Ambient Temp & Wind', value: '-34.8°C / 48 km/h', status: 'HEALTHY', impactText: 'Weather stable but cold demands uncompromised power' },
          { id: 'n-inf', label: 'Infrastructure', parameter: 'Non-Essential Shedding', value: 'Stage-1 Load Shedding', status: 'WARNING', impactText: 'Science labs & non-essential heating dropped to save life support' },
          { id: 'n-ene', label: 'Energy', parameter: 'Station Power Demand', value: '142 kW (Curtailed)', status: 'CRITICAL', impactText: 'Grid voltage droops momentarily until BESS injects power' },
          { id: 'n-gen', label: 'Generator', parameter: 'Genset Load & Stress', value: 'GEN-01 @ 98% (Overload)', status: 'CRITICAL', impactText: 'GEN-01 runs at maximum surge rating until GEN-03 synchronizes' },
          { id: 'n-fue', label: 'Fuel', parameter: 'Burn Rate Surge', value: '1,490 L/day (Throttled)', status: 'WARNING', impactText: 'Burn reduced due to shedding but generator efficiency plummets' },
          { id: 'n-log', label: 'Logistics', parameter: 'Spare Parts Consumption', value: 'Emergency Overhaul Reqd', status: 'WARNING', impactText: 'Maintenance crew mobilized in sub-zero conditions' },
          { id: 'n-rsk', label: 'Risk', parameter: 'Composite Risk Level', value: 'CRITICAL (Score: 88/100)', status: 'CRITICAL', impactText: 'Single point of failure active until GEN-03 parallel lock confirmed' },
        ],
      },
      {
        id: 'sc-resupply-delay',
        title: 'Polar Resupply Ship Delayed (+30 Days)',
        triggerEvent: 'Severe sea-ice pack in Prydz Bay traps MV Vasiliy Golovnin for 30 extra days',
        tempChangeC: 0,
        overallRiskResult: 'HIGH',
        mechanicsDescription: 'Logistics chain severed: Station must ration power and fuel to extend remaining reserves from 74 to 105 days.',
        nodes: [
          { id: 'n-env', label: 'Environment', parameter: 'Sea Ice & Weather', value: 'Dense Pack Ice (9/10)', status: 'WARNING', impactText: 'Ice-strengthened resupply vessel unable to penetrate coastal ice' },
          { id: 'n-inf', label: 'Infrastructure', parameter: 'Conservation Protocol', value: 'Defensive Heat Zoning', status: 'WARNING', impactText: 'Unoccupied storage modules winterized and temperatures lowered to +5°C' },
          { id: 'n-ene', label: 'Energy', parameter: 'Station Power Demand', value: '138 kW (-25%)', status: 'WARNING', impactText: 'Mandatory energy austerity plan enforced station-wide' },
          { id: 'n-gen', label: 'Generator', parameter: 'Genset Load & Stress', value: 'Single Genset Operation', status: 'WARNING', impactText: 'Run single generator at optimized 72% load point for best SFC' },
          { id: 'n-fue', label: 'Fuel', parameter: 'Burn Rate Surge', value: '1,210 L/day (-30%)', status: 'HEALTHY', impactText: 'Fuel burn suppressed by 525 L/day via aggressive conservation' },
          { id: 'n-log', label: 'Logistics', parameter: 'Fuel Days Remaining', value: '106 Days Extended', status: 'CRITICAL', impactText: 'Extended duration covers ship delay but leaves near-zero safety buffer' },
          { id: 'n-rsk', label: 'Risk', parameter: 'Composite Risk Level', value: 'HIGH (Score: 78/100)', status: 'CRITICAL', impactText: 'Extreme supply chain vulnerability; any additional failure is fatal' },
        ],
      },
    ],
  },
};

// ═══════════════════════════════════════════════════════════════
// 2. BHARATI RESEARCH STATION (Larsemann Hills, 69°S)
// ═══════════════════════════════════════════════════════════════
export const BHARATI_ANALYTICS: StationAnalyticsDataset = {
  stationId: 'BHARATI',
  stationName: 'Bharati Research Station',
  coordinates: '69°24′S 76°11′E (42m ASL)',
  kpi: {
    powerDemandKw: 215,
    powerDemandDelta: -1.2,
    powerGenerationKw: 260,
    powerGenerationDelta: 0.5,
    fuelRemainingLitres: 214000,
    fuelRemainingPercent: 82.3,
    fuelDaysRemaining: 102,
    fuelDaysDelta: 1.5,
    generatorLoadPercent: 68.4,
    generatorLoadDelta: -2.1,
    temperatureC: -26.4,
    temperatureDelta: 1.8, // Slightly warmer coastal climate
    stationHealthScore: 94,
    stationHealthDelta: 0.8,
    riskLevel: 'LOW',
    riskScore: 22,
  },
  energy: {
    currentDemandKw: 215,
    currentGenerationKw: 260,
    peakDemandKw: 242,
    peakDemandTime: '11:15 UTC',
    baselineDemandKw: 180,
    reserveHeadroomKw: 45,
    trendPercentage: -1.2,
    history: {
      '24H': generate24hEnergy(205, 250),
      '7D': generate7dEnergy(205, 250),
      '30D': generate30dEnergy(205, 250),
      '90D': generate90dEnergy(205, 250),
    },
  },
  generators: {
    totalRunningCount: 2,
    aggregateLoadPercent: 68.4,
    aggregateFuelBurnLph: 58.2,
    generators: [
      {
        id: 'BH-GEN-01',
        name: 'Generator 01',
        model: 'Volvo Penta D16 MG 350kVA',
        status: 'RUNNING',
        healthState: 'HEALTHY',
        loadPercent: 70,
        temperatureC: 78.4,
        runtimeHours: 2190,
        fuelConsumptionLph: 30.1,
        efficiencyPercent: 43.6,
        oilPressureBar: 4.8,
        vibrationMmS: 1.6,
        lastMaintenanceDate: '2026-08-22',
        nextServiceHours: 310,
      },
      {
        id: 'BH-GEN-02',
        name: 'Generator 02',
        model: 'Volvo Penta D16 MG 350kVA',
        status: 'RUNNING',
        healthState: 'HEALTHY',
        loadPercent: 66,
        temperatureC: 76.2,
        runtimeHours: 1940,
        fuelConsumptionLph: 28.1,
        efficiencyPercent: 42.9,
        oilPressureBar: 4.7,
        vibrationMmS: 1.8,
        lastMaintenanceDate: '2026-08-30',
        nextServiceHours: 380,
      },
      {
        id: 'BH-GEN-03',
        name: 'Generator 03',
        model: 'Volvo Penta D16 MG 350kVA',
        status: 'STANDBY',
        healthState: 'HEALTHY',
        loadPercent: 0,
        temperatureC: 24.0,
        runtimeHours: 850,
        fuelConsumptionLph: 0,
        efficiencyPercent: 0,
        oilPressureBar: 0,
        vibrationMmS: 0.1,
        lastMaintenanceDate: '2026-09-08',
        nextServiceHours: 480,
      },
    ],
  },
  fuel: {
    currentReserveLitres: 214000,
    totalCapacityLitres: 260000,
    reservePercent: 82.3,
    dailyConsumptionLitres: 2095,
    daysRemaining: 102,
    projectedDepletionDate: '30 Dec 2026',
    resupplyDate: '28 Nov 2026',
    resupplyBufferDays: 32,
    isResupplyAtRisk: false,
    history: [
      { date: '13 Sep', dailyBurnL: 2050, projectedBurnL: 2080, ambientTempC: -24 },
      { date: '14 Sep', dailyBurnL: 2080, projectedBurnL: 2090, ambientTempC: -25 },
      { date: '15 Sep', dailyBurnL: 2120, projectedBurnL: 2100, ambientTempC: -27 },
      { date: '16 Sep', dailyBurnL: 2150, projectedBurnL: 2120, ambientTempC: -28 },
      { date: '17 Sep', dailyBurnL: 2110, projectedBurnL: 2100, ambientTempC: -26 },
      { date: '18 Sep', dailyBurnL: 2070, projectedBurnL: 2080, ambientTempC: -25 },
      { date: '19 Sep', dailyBurnL: 2095, projectedBurnL: 2090, ambientTempC: -26.4 },
    ],
    tanks: [
      { id: 'BH-T-01', name: 'Coastal Bulk Tank 1', type: 'ATF Jet A-1 Polar Spec', currentLitres: 88400, capacityLitres: 100000, percent: 88.4, status: 'OPTIMAL' },
      { id: 'BH-T-02', name: 'Coastal Bulk Tank 2', type: 'ATF Jet A-1 Polar Spec', currentLitres: 79200, capacityLitres: 100000, percent: 79.2, status: 'OPTIMAL' },
      { id: 'BH-T-03', name: 'Station Sub-Bunker 3', type: 'Secondary Reserve', currentLitres: 41800, capacityLitres: 50000, percent: 83.6, status: 'RESERVE' },
      { id: 'BH-T-04', name: 'Day Tank Module', type: 'Gravity Feeder Unit', currentLitres: 4600, capacityLitres: 5000, percent: 92.0, status: 'OPTIMAL' },
    ],
  },
  environmental: {
    current: {
      temperatureC: -26.4,
      windSpeedKmh: 64.5, // Stronger coastal winds
      windDirectionDeg: 125,
      windDirectionCardinal: 'SE',
      pressureHpa: 994.2,
      humidityPercent: 74.5,
      visibilityKm: 8.5,
      windChillC: -41.2,
    },
    trendPoints: [
      { timestamp: '00:00', temperatureC: -24.8, windSpeedKmh: 58.2, windDirectionDeg: 120, pressureHpa: 998.0, humidityPercent: 70, visibilityKm: 14.0 },
      { timestamp: '04:00', temperatureC: -25.5, windSpeedKmh: 61.4, windDirectionDeg: 122, pressureHpa: 996.5, humidityPercent: 72, visibilityKm: 11.2 },
      { timestamp: '08:00', temperatureC: -26.1, windSpeedKmh: 63.8, windDirectionDeg: 124, pressureHpa: 995.1, humidityPercent: 73, visibilityKm: 9.8 },
      { timestamp: '12:00', temperatureC: -27.2, windSpeedKmh: 68.5, windDirectionDeg: 128, pressureHpa: 993.8, humidityPercent: 76, visibilityKm: 7.2 },
      { timestamp: '16:00', temperatureC: -26.9, windSpeedKmh: 66.2, windDirectionDeg: 126, pressureHpa: 994.0, humidityPercent: 75, visibilityKm: 7.8 },
      { timestamp: '20:00', temperatureC: -26.4, windSpeedKmh: 64.5, windDirectionDeg: 125, pressureHpa: 994.2, humidityPercent: 74.5, visibilityKm: 8.5 },
    ],
  },
  healthRisk: {
    overallHealthScore: 94,
    overallHealthStatus: 'HEALTHY',
    riskLevel: 'LOW',
    riskScore: 22,
    domains: {
      energy: {
        id: 'energy',
        name: 'Energy Subsystem',
        score: 95,
        status: 'HEALTHY',
        subsystems: ['Volvo Gensets 1 & 2', 'Microgrid Synchronizer', 'Wind Assist Turbines'],
        anomaliesCount: 0,
        trend: 'STABLE',
      },
      infrastructure: {
        id: 'infrastructure',
        name: 'Infrastructure',
        score: 96,
        status: 'HEALTHY',
        subsystems: ['Elevated Stilt Framework', 'Composite Panel Enclosure', 'Thermal Envelope'],
        anomaliesCount: 0,
        trend: 'STABLE',
      },
      environment: {
        id: 'environment',
        name: 'Environment & Life Support',
        score: 93,
        status: 'HEALTHY',
        subsystems: ['Dual Reverse Osmosis RO Plants', 'Macerator Unit', 'HVAC Economizer'],
        anomaliesCount: 0,
        trend: 'UP',
      },
      logistics: {
        id: 'logistics',
        name: 'Logistics & Supplies',
        score: 91,
        status: 'HEALTHY',
        subsystems: ['Helipad Bravo', 'Larsemann Fuel Tank Farm', 'Containerized Stores 120D'],
        anomaliesCount: 0,
        trend: 'STABLE',
      },
      communications: {
        id: 'communications',
        name: 'Communications',
        score: 98,
        status: 'HEALTHY',
        subsystems: ['ISRO Dedicated Telemetry Ground Station', 'BGAN Emergency', 'Fiber Intra-link'],
        anomaliesCount: 0,
        trend: 'UP',
      },
      safety: {
        id: 'safety',
        name: 'Safety & Life Protection',
        score: 96,
        status: 'HEALTHY',
        subsystems: ['High-Pressure Water Mist System', 'Refuge Module #1', 'Gas Detection Grid'],
        anomaliesCount: 0,
        trend: 'STABLE',
      },
    },
    riskBreakdown: [
      { category: 'Wind Gust Stress', score: 34, description: 'Sustained coastal winds of 64.5 km/h; structures rated for 200 km/h.' },
      { category: 'Sea Ice Dynamic', score: 26, description: 'Fast-ice edge is 1.8km seaward; safe landing for helicopters.' },
      { category: 'Microgrid Stability', score: 14, description: 'Modern automated switchgear maintains 99.98% uptime.' },
      { category: 'Fuel Depletion', score: 12, description: '102 days buffer remaining; low vulnerability.' },
    ],
  },
  forecasts: {
    powerDemand: {
      id: 'f-power-bh',
      title: 'Power Demand Forecast (72H)',
      unit: 'kW',
      horizon: 'Next 72 Hours',
      currentValue: 215,
      projectedValue: 228,
      confidencePercent: 95.8,
      trendDirection: 'STABLE',
      summary: 'Power demand projected to remain stable within ±6% nominal operating envelope.',
      series: [
        { timeOffset: '+0H', predicted: 215, lowerBound: 210, upperBound: 220 },
        { timeOffset: '+12H', predicted: 219, lowerBound: 212, upperBound: 225 },
        { timeOffset: '+24H', predicted: 224, lowerBound: 216, upperBound: 231 },
        { timeOffset: '+36H', predicted: 228, lowerBound: 219, upperBound: 236 },
        { timeOffset: '+48H', predicted: 225, lowerBound: 217, upperBound: 232 },
        { timeOffset: '+60H', predicted: 221, lowerBound: 214, upperBound: 227 },
        { timeOffset: '+72H', predicted: 217, lowerBound: 211, upperBound: 222 },
      ],
    },
    fuelReserve: {
      id: 'f-fuel-bh',
      title: 'Fuel Reserve Burn Projection',
      unit: 'kL',
      horizon: 'Next 30 Days',
      currentValue: 214.0,
      projectedValue: 151.2,
      confidencePercent: 94.2,
      trendDirection: 'DOWN',
      summary: 'Burn rate steady at 2,095 L/day. 102 days reserve provides generous 32-day margin beyond resupply.',
      series: [
        { timeOffset: 'Day 0', predicted: 214.0, lowerBound: 214.0, upperBound: 214.0 },
        { timeOffset: 'Day 5', predicted: 203.5, lowerBound: 202.0, upperBound: 205.0 },
        { timeOffset: 'Day 10', predicted: 193.1, lowerBound: 191.0, upperBound: 195.0 },
        { timeOffset: 'Day 15', predicted: 182.6, lowerBound: 179.8, upperBound: 185.2 },
        { timeOffset: 'Day 20', predicted: 172.1, lowerBound: 168.9, upperBound: 175.5 },
        { timeOffset: 'Day 25', predicted: 161.7, lowerBound: 157.8, upperBound: 165.8 },
        { timeOffset: 'Day 30', predicted: 151.2, lowerBound: 146.5, upperBound: 156.0 },
      ],
    },
    generatorLoad: {
      id: 'f-gen-bh',
      title: 'Generator Load Profile Projection',
      unit: '%',
      horizon: 'Next 72 Hours',
      currentValue: 68.4,
      projectedValue: 72.5,
      confidencePercent: 92.0,
      trendDirection: 'STABLE',
      summary: 'Genset load distribution optimal; units operating in peak thermal efficiency sweet spot (65-75%).',
      series: [
        { timeOffset: '+0H', predicted: 68.4, lowerBound: 66, upperBound: 71 },
        { timeOffset: '+12H', predicted: 69.8, lowerBound: 67, upperBound: 73 },
        { timeOffset: '+24H', predicted: 71.5, lowerBound: 68, upperBound: 75 },
        { timeOffset: '+36H', predicted: 72.5, lowerBound: 69, upperBound: 76 },
        { timeOffset: '+48H', predicted: 71.8, lowerBound: 68, upperBound: 75 },
        { timeOffset: '+60H', predicted: 70.2, lowerBound: 67, upperBound: 74 },
        { timeOffset: '+72H', predicted: 69.0, lowerBound: 66, upperBound: 72 },
      ],
    },
    temperature: {
      id: 'f-temp-bh',
      title: 'Polar Temperature Chill Model',
      unit: '°C',
      horizon: 'Next 72 Hours',
      currentValue: -26.4,
      projectedValue: -30.8,
      confidencePercent: 96.5,
      trendDirection: 'DOWN',
      summary: 'Maritime polar depression will drop temperatures moderately to -30.8°C with gusty winds.',
      series: [
        { timeOffset: '+0H', predicted: -26.4, lowerBound: -27.0, upperBound: -25.8 },
        { timeOffset: '+12H', predicted: -27.8, lowerBound: -28.6, upperBound: -27.0 },
        { timeOffset: '+24H', predicted: -29.5, lowerBound: -30.6, upperBound: -28.4 },
        { timeOffset: '+36H', predicted: -30.8, lowerBound: -32.2, upperBound: -29.4 },
        { timeOffset: '+48H', predicted: -29.8, lowerBound: -31.2, upperBound: -28.4 },
        { timeOffset: '+60H', predicted: -28.2, lowerBound: -29.5, upperBound: -26.8 },
        { timeOffset: '+72H', predicted: -27.0, lowerBound: -28.2, upperBound: -25.8 },
      ],
    },
  },
  insights: [
    {
      id: 'ins-bh-01',
      severity: 'NORMAL',
      category: 'GENERATOR',
      title: 'Volvo Penta Gensets In Peak Efficiency Zone',
      description: 'Both active units running at 43.6% and 42.9% thermal efficiency with vibration below 1.8 mm/s.',
      subsystem: 'Energy / Powerhouse',
      timestamp: '15 mins ago',
    },
    {
      id: 'ins-bh-02',
      severity: 'INFO',
      category: 'ENVIRONMENT',
      title: 'High Sustained Coastal Gale Detected',
      description: 'Coastal winds reached 68.5 km/h. Automated building aerodynamic baffles deployed nominally.',
      subsystem: 'Environment / Meteorological Mast',
      timestamp: '45 mins ago',
    },
    {
      id: 'ins-bh-03',
      severity: 'NORMAL',
      category: 'LIFE SUPPORT',
      title: 'Reverse Osmosis Fresh Water Production Exceeding Quota',
      description: 'RO unit produced 2,800 litres potable water today from seawater intake. Daily storage buffer at 98%.',
      subsystem: 'Infrastructure / Water Treatment',
      timestamp: '3 hours ago',
    },
  ],
  crossDomain: {
    scenarios: [
      {
        id: 'sc-bh-gale',
        title: 'Coastal Hurricane Gale (140 km/h gusts)',
        triggerEvent: 'Prydz Bay low pressure system brings category-1 equivalent polar gale',
        tempChangeC: -6.0,
        overallRiskResult: 'MODERATE',
        mechanicsDescription: 'High wind triggers automatic building dampening → exterior air louvers seal → HVAC recirculation rises → generator load increases slightly → fuel burn +8%.',
        nodes: [
          { id: 'n-env', label: 'Environment', parameter: 'Wind & Pressure', value: '142 km/h / 972 hPa', status: 'CRITICAL', impactText: 'Extreme coastal blizzard and violent gale' },
          { id: 'n-inf', label: 'Infrastructure', parameter: 'Aerodynamic Stilt Load', value: 'Baffles Engaged 100%', status: 'HEALTHY', impactText: 'Bharati stilt structure deflects wind snowdrift under hull' },
          { id: 'n-ene', label: 'Energy', parameter: 'Station Power Demand', value: '232 kW (+8%)', status: 'HEALTHY', impactText: 'Trace heaters on fresh water seawater intake intake lines' },
          { id: 'n-gen', label: 'Generator', parameter: 'Genset Load & Stress', value: '74% Load (GEN 1+2)', status: 'HEALTHY', impactText: 'Generators handle load with comfortable 118 kW reserve' },
          { id: 'n-fue', label: 'Fuel', parameter: 'Burn Rate Surge', value: '2,260 L/day (+8%)', status: 'HEALTHY', impactText: 'Fuel consumption easily absorbed by bulk farm' },
          { id: 'n-log', label: 'Logistics', parameter: 'Helipad Operations', value: 'FLIGHTS GROUNDED', status: 'WARNING', impactText: 'Helicopter and snowmobile missions suspended until gale clears' },
          { id: 'n-rsk', label: 'Risk', parameter: 'Composite Risk Level', value: 'MODERATE (Score: 38/100)', status: 'WARNING', impactText: 'External movement restricted; habitat security intact' },
        ],
      },
    ],
  },
};

// ═══════════════════════════════════════════════════════════════
// 8. MAITRI VS BHARATI COMPARISON MATRIX
// ═══════════════════════════════════════════════════════════════
export const MAITRI_VS_BHARATI_COMPARISON: MaitriVsBharatiComparison = {
  summaryNote: 'Bharati benefits from newer 3rd-generation modular architecture and coastal marine climate, yielding 14% lower fuel strain and +28 days greater reserve margin than inland Maitri.',
  lastSyncTime: 'Live Telemetry Bus Synced',
  metrics: [
    {
      metric: 'Power Demand',
      key: 'powerDemand',
      unit: 'kW',
      maitriValue: '184 kW',
      bharatiValue: '215 kW',
      maitriNumeric: 184,
      bharatiNumeric: 215,
      higherIsBetter: false,
      deltaText: 'Bharati draws +31 kW (larger science footprint & RO plant)',
      status: 'BALANCED',
    },
    {
      metric: 'Power Generation',
      key: 'powerGeneration',
      unit: 'kW',
      maitriValue: '220 kW',
      bharatiValue: '260 kW',
      maitriNumeric: 220,
      bharatiNumeric: 260,
      higherIsBetter: true,
      deltaText: 'Bharati capacity is +40 kW higher (Volvo Penta 350kVA vs Cummins 250kVA)',
      status: 'BHARATI_AHEAD',
    },
    {
      metric: 'Fuel Reserve',
      key: 'fuelReserve',
      unit: 'Litres',
      maitriValue: '128,400 L (68%)',
      bharatiValue: '214,000 L (82%)',
      maitriNumeric: 128400,
      bharatiNumeric: 214000,
      higherIsBetter: true,
      deltaText: 'Bharati holds +85,600 L more bulk POL reserve in coastal farm',
      status: 'BHARATI_AHEAD',
    },
    {
      metric: 'Fuel Days Remaining',
      key: 'fuelDaysRemaining',
      unit: 'Days',
      maitriValue: '74 Days',
      bharatiValue: '102 Days',
      maitriNumeric: 74,
      bharatiNumeric: 102,
      higherIsBetter: true,
      deltaText: 'Bharati has +28 extra days of autonomous winter endurance',
      status: 'BHARATI_AHEAD',
    },
    {
      metric: 'Generator Load',
      key: 'generatorLoad',
      unit: '%',
      maitriValue: '76.5%',
      bharatiValue: '68.4%',
      maitriNumeric: 76.5,
      bharatiNumeric: 68.4,
      higherIsBetter: false, // lower load on gensets means more headroom
      deltaText: 'Maitri gensets running 8.1% harder with GEN-02 warming to 91.6°C',
      status: 'MAITRI_AHEAD', // Maitri is closer to capacity limit
    },
    {
      metric: 'Temperature',
      key: 'temperature',
      unit: '°C',
      maitriValue: '-34.8°C',
      bharatiValue: '-26.4°C',
      maitriNumeric: -34.8,
      bharatiNumeric: -26.4,
      higherIsBetter: true, // warmer is easier on life support
      deltaText: 'Maitri is 8.4°C colder due to inland continental katabatic drainage',
      status: 'BHARATI_AHEAD',
    },
    {
      metric: 'Station Health',
      key: 'stationHealth',
      unit: '/100',
      maitriValue: '88 / 100',
      bharatiValue: '94 / 100',
      maitriNumeric: 88,
      bharatiNumeric: 94,
      higherIsBetter: true,
      deltaText: 'Bharati health index is +6 pts higher across all 6 engineering domains',
      status: 'BHARATI_AHEAD',
    },
    {
      metric: 'Risk Level',
      key: 'riskLevel',
      unit: 'Risk Score',
      maitriValue: 'MODERATE (36)',
      bharatiValue: 'LOW (22)',
      maitriNumeric: 36,
      bharatiNumeric: 22,
      higherIsBetter: false, // lower risk is better
      deltaText: 'Maitri carries +14 pts higher risk due to GEN-02 thermal advisory and narrower fuel window',
      status: 'BHARATI_AHEAD',
    },
  ],
};

// Helper lookup
export function getStationAnalytics(station: 'MAITRI' | 'BHARATI'): StationAnalyticsDataset {
  return station === 'BHARATI' ? BHARATI_ANALYTICS : MAITRI_ANALYTICS;
}
