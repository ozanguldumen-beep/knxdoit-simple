export const PANEL_CONFIG = {
  width: 980,
  height: 980,
  panelMargin: 32,
  railX: 78,
  railTop: 220,
  railSlots: 48,
  moduleUnit: 18,
  railHeight: 28,
  railGap: 170,
  deviceHeight: 92,
  rowCount: 5
};

export function createPanel() {
  const rails = [];

  for (let i = 0; i < PANEL_CONFIG.rowCount; i++) {
    rails.push({
      id: `rail-${i + 1}`,
      name: `${i + 1}. DIN Ray`,
      x: PANEL_CONFIG.railX,
      y: PANEL_CONFIG.railTop + i * PANEL_CONFIG.railGap,
      width: PANEL_CONFIG.railSlots * PANEL_CONFIG.moduleUnit,
      height: PANEL_CONFIG.railHeight,
      slots: PANEL_CONFIG.railSlots,
      modules: []
    });
  }

  return {
    id: 'main-panel',
    name: 'KNX Pano',
    width: PANEL_CONFIG.width,
    height: PANEL_CONFIG.height,
    rails
  };
}

export function cloneDevice(device) {
  return {
    ...device,
    instanceId: `${device.id || device.type}-${Date.now()}-${Math.floor(Math.random() * 10000)}`
  };
}

export function getUsedSlots(rail) {
  return rail.modules.reduce((total, item) => total + (item.moduleWidth || 2), 0);
}

export function findAvailableRail(panel, device) {
  const needed = device.moduleWidth || 2;
  return panel.rails.find((rail) => getUsedSlots(rail) + needed <= rail.slots) || null;
}

export function autoPlaceDevice(panel, rawDevice) {
  const device = cloneDevice(rawDevice);
  const rail = findAvailableRail(panel, device);

  if (!rail) {
    throw new Error('Panoda yeterli boş DIN ray alanı yok.');
  }

  const startSlot = getUsedSlots(rail);
  device.railId = rail.id;
  device.startSlot = startSlot;
  device.slot = startSlot;
  device.x = rail.x + startSlot * PANEL_CONFIG.moduleUnit;
  device.y = rail.y - Math.round((PANEL_CONFIG.deviceHeight - rail.height) / 2);
  device.width = (device.moduleWidth || 2) * PANEL_CONFIG.moduleUnit;
  device.height = PANEL_CONFIG.deviceHeight;

  rail.modules.push(device);
  return device;
}

export function clearPanel(panel) {
  panel.rails.forEach((rail) => {
    rail.modules = [];
  });
}

export function getAllDevices(panel) {
  return panel.rails.flatMap((rail) => rail.modules);
}
