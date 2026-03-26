export type DeviceRecord = {
  deviceId: string;
  studentId: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet';
  os: string;
  browser: string;
  ipAddress: string;
  lastActiveAt: string;
  blocked?: boolean;
  blockedReason?: string;
};

let devices: Record<string, DeviceRecord> = {};

export function registerDevice(rec: Omit<DeviceRecord, 'lastActiveAt'>) {
  const record: DeviceRecord = { ...rec, lastActiveAt: new Date().toISOString() };
  devices[rec.deviceId] = record;
  return record;
}

export function getDevice(deviceId: string) {
  return devices[deviceId];
}

export function updateActivity(deviceId: string) {
  if (!devices[deviceId]) return false;
  devices[deviceId].lastActiveAt = new Date().toISOString();
  return true;
}