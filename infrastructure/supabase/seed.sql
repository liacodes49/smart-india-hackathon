-- Antarctic Digital Twin — Initial Seed SQL
-- This runs after migrations to populate base data.

-- Insert Maitri Station
INSERT INTO stations (station_id, name, latitude, longitude, altitude, status, timezone, description)
VALUES (
  'MAITRI',
  'Maitri Research Station',
  -70.7667, 11.7333, 117,
  'OPERATIONAL',
  'UTC+5:30',
  'Indian permanent research station in Schirmacher Oasis, Antarctica. Established 1989.'
) ON CONFLICT (station_id) DO NOTHING;

-- Insert Bharati Station
INSERT INTO stations (station_id, name, latitude, longitude, altitude, status, timezone, description)
VALUES (
  'BHARATI',
  'Bharati Research Station',
  -69.4067, 76.1947, 42,
  'OPERATIONAL',
  'UTC+5:30',
  'Indian research station in Larsemann Hills, Antarctica. Established 2012. Modern containerized design.'
) ON CONFLICT (station_id) DO NOTHING;
