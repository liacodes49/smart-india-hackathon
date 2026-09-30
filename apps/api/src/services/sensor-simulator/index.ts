import { sensorsRepository } from '../../modules/sensors/sensors.repository.js';
import { telemetryService } from '../../modules/telemetry/telemetry.service.js';
import { SensorStatus } from '@repo/shared';
import { logger } from '../../config/logger.js';
import type { TelemetryBatchInput } from '@repo/schemas';

const TICK_INTERVAL_MS = 30 * 1000; // 30 seconds

// Antarctic weather state machine
type WeatherState = 'CLEAR' | 'OVERCAST' | 'BLIZZARD' | 'WHITEOUT';

export class SensorSimulator {
  private timer: NodeJS.Timeout | null = null;
  private weatherState: WeatherState = 'CLEAR';
  private hoursInCurrentState = 0;

  public async start() {
    if (this.timer) return;
    
    logger.info('🚀 Starting Antarctic Sensor Simulator (30s tick)...');
    
    // Run first tick immediately
    await this.tick();
    
    // Schedule subsequent ticks
    this.timer = setInterval(() => this.tick(), TICK_INTERVAL_MS);
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      logger.info('🛑 Stopped Antarctic Sensor Simulator.');
    }
  }

  private updateWeatherState() {
    this.hoursInCurrentState += (TICK_INTERVAL_MS / 3600000);
    
    // Probabilistic state transitions every ~4 simulated hours
    if (this.hoursInCurrentState > 4) {
      const rand = Math.random();
      switch (this.weatherState) {
        case 'CLEAR':
          if (rand > 0.7) this.weatherState = 'OVERCAST';
          break;
        case 'OVERCAST':
          if (rand > 0.8) this.weatherState = 'BLIZZARD';
          else if (rand < 0.3) this.weatherState = 'CLEAR';
          break;
        case 'BLIZZARD':
          if (rand > 0.9) this.weatherState = 'WHITEOUT';
          else if (rand < 0.4) this.weatherState = 'OVERCAST';
          break;
        case 'WHITEOUT':
          if (rand > 0.6) this.weatherState = 'BLIZZARD';
          break;
      }
      this.hoursInCurrentState = 0;
    }
  }

  private async tick() {
    try {
      this.updateWeatherState();
      
      const sensors = await sensorsRepository.findAll({ limit: 1000 });
      if (!sensors.data || sensors.data.length === 0) return;

      const readings: TelemetryBatchInput['readings'] = [];
      const now = new Date().toISOString();

      for (const sensor of sensors.data) {
        const value = this.generateReading(sensor);
        
        readings.push({
          sensorId: sensor.id,
          stationId: sensor.stationId,
          value,
          unit: sensor.unit,
          timestamp: now,
          status: SensorStatus.NORMAL,
          quality: 100
        });
      }

      await telemetryService.ingestBatch({ readings }, 'SYSTEM_SIMULATOR');
      
    } catch (error) {
      logger.error('Error during simulation tick', error);
    }
  }

  private generateReading(sensor: any): number {
    const hour = new Date().getHours();
    const type = sensor.type;
    const name = sensor.name.toLowerCase();
    
    let base = sensor.lastReading != null ? sensor.lastReading : (sensor.minThreshold + sensor.maxThreshold) / 2;
    if (isNaN(base)) base = 50;

    // Physics Models
    switch (type) {
      case 'TEMPERATURE':
        if (name.includes('outside') || name.includes('ambient')) {
           // Diurnal cycle
           let target = -30 + 5 * Math.sin(Math.PI * (hour - 6) / 12);
           if (this.weatherState === 'BLIZZARD' || this.weatherState === 'WHITEOUT') target -= 15; // massive temp drop
           return +(target + (Math.random() - 0.5) * 2).toFixed(2);
        } else if (name.includes('interior') || name.includes('habitat')) {
           return +(20 + (Math.random() - 0.5)).toFixed(2); // Stable indoor temp
        } else {
           // Coolant/Engine temps
           return +(82 + Math.sin(Date.now() / 10000) * 3 + (Math.random() - 0.5)).toFixed(2);
        }
        
      case 'WIND_SPEED':
        let windBase = 20;
        if (this.weatherState === 'OVERCAST') windBase = 40;
        if (this.weatherState === 'BLIZZARD') windBase = 120;
        if (this.weatherState === 'WHITEOUT') windBase = 180;
        
        // Weibull-like distribution for gusts
        const gust = windBase * (1 + Math.random() * 0.5); 
        return +(gust).toFixed(1);

      case 'POWER':
        // Load curve higher during the day
        const powerBase = hour > 6 && hour < 22 ? 75 : 45;
        return +(powerBase + (Math.random() - 0.5) * 5).toFixed(1);

      case 'FUEL':
        // Monotonic decrease
        if (base <= 10) base = 95; // Refuel!
        return +(base - 0.05).toFixed(2);

      case 'SIGNAL':
        let sigBase = -55;
        if (this.weatherState === 'WHITEOUT') sigBase = -95; // Signal loss in whiteout
        else if (this.weatherState === 'BLIZZARD') sigBase = -75;
        return +(sigBase + (Math.random() - 0.5) * 2).toFixed(1);
        
      case 'PRESSURE':
        let presBase = 985;
        if (this.weatherState === 'BLIZZARD' || this.weatherState === 'WHITEOUT') presBase = 955; // Pressure drop
        return +(presBase + (Math.random() - 0.5) * 2).toFixed(1);

      default:
        // Default random walk
        const step = (sensor.maxThreshold - sensor.minThreshold) * 0.01;
        return +(base + (Math.random() - 0.5) * step).toFixed(2);
    }
  }
}

export const simulatorService = new SensorSimulator();
