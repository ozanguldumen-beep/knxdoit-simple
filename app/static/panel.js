export const PANEL_CONFIG = {
  width: 1060,
  height: 1120,
  padding: 72,
  headerSafeTop: 150,
  railSlots: 48,
  moduleUnit: 18,
  railHeight: 28,
  railGap: 170,
  deviceHeight: 86,
  deviceGapSlot: 1
};

export function createPanel(rowCount = 5) {
  const rails = [];
  for (let i = 0; i < rowCount; i++) {
    rails.push({
      id: `rail-${i + 1}`,
      name: `${i + 1}. DIN Ray`,
      x: PANEL_CONFIG.padding,
      y: PANEL_CONFIG.headerSafeTop + i * PANEL_CONFIG.railGap,
      width: PANEL_CONFIG.railSlots * PANEL_CONFIG.moduleUnit,
      height: PANEL_CONFIG.railHeight,
      slots: PANEL_CONFIG.railSlots,
      modules: []
    });
  }
  return { id: "main-panel", name: "KNX Pano", width: PANEL_CONFIG.width, height: PANEL_CONFIG.height, rails, fieldDevices: [] };
}

export function getRailUsedSlots(rail) {
  return rail.modules.reduce((total, device) => total + (device.moduleWidth || 2) + PANEL_CONFIG.deviceGapSlot, 0);
}

export function canPlaceDeviceOnRail(rail, device) {
  return getRailUsedSlots(rail) + (device.moduleWidth || 2) <= rail.slots;
}

export function findFirstAvailableRail(panel, device) {
  return panel.rails.find((rail) => canPlaceDeviceOnRail(rail, device)) || null;
}

export function autoPlaceDevice(panel, device) {
  const rail = findFirstAvailableRail(panel, device);
  if (!rail) throw new Error("Panoda yeterli boş DIN ray alanı yok.");
  const placedDevice = {
    ...device,
    instanceId: `${device.id || device.type}-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    railId: rail.id,
    startSlot: getRailUsedSlots(rail),
    moduleWidth: device.moduleWidth || 2,
    connections: []
  };
  rail.modules.push(placedDevice);
  return placedDevice;
}

export function addFieldDevice(panel, device) {
  const placed = {
    ...device,
    instanceId: `${device.id || device.type}-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    connections: []
  };
  panel.fieldDevices.push(placed);
  return placed;
}

export function clearPanel(panel) {
  panel.rails.forEach((rail) => { rail.modules = []; });
  panel.fieldDevices = [];
  return panel;
}

export function flattenPanelDevices(panel) {
  return panel.rails.flatMap((rail) => rail.modules);
}
