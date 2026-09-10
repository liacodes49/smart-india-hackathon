// Frontend-specific constants
export const APP_NAME = 'Antarctic Digital Twin';
export const APP_DESCRIPTION = 'NCPOR Antarctic Research Station Digital Twin Platform';

export const NAVIGATION = [
  { name: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
  { name: 'Digital Twin', href: '/digital-twin', icon: 'Box' },
  { name: 'Telemetry', href: '/telemetry', icon: 'Activity' },
  { name: 'Alerts', href: '/alerts', icon: 'Bell' },
  { name: 'Predictions', href: '/predictions', icon: 'TrendingUp' },
  { name: 'Simulation', href: '/simulation', icon: 'Zap' },
  { name: 'Maintenance', href: '/maintenance', icon: 'Wrench' },
  { name: 'Reports', href: '/reports', icon: 'FileText' },
  { name: 'Settings', href: '/settings', icon: 'Settings' },
] as const;
