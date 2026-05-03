// static/panel.js

export const PANEL_CONFIG = {
  width: 980,
  height: 1120,
  padding: 70,
  headerSafeTop: 170,

  railSlots: 48,
  moduleUnit: 18,
  railHeight: 28,
  railGap: 150,

  deviceHeight: 86,
  deviceGapSlot: 0
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

  return {
    id: "main-panel",
    name: "KNX Pano",
    width: PANEL_CONFIG.width,
    height: PANEL_CONFIG.height,
    rails
  };
}

export function getRailUsedSlots(rail) {
  return rail.modules.reduce((total, device) => {
    return total + (device.moduleWidth || 2) + PANEL_CONFIG.deviceGapSlot;
  }, 0);
}

export function canPlaceDeviceOnRail(rail, device) {
  const usedSlots = getRailUsedSlots(rail);
  const neededSlots = device.moduleWidth || 2;
  return usedSlots + neededSlots <= rail.slots;
}

export function findFirstAvailableRail(panel, device) {
  return panel.rails.find((rail) => canPlaceDeviceOnRail(rail, device)) || null;
}

export function autoPlaceDevice(panel, device) {
  const rail = findFirstAvailableRail(panel, device);

  if (!rail) {
    throw new Error("Panoda yeterli boş DIN ray alanı yok.");
  }

  const startSlot = getRailUsedSlots(rail);
  const moduleWidth = device.moduleWidth || 2;

  const placedDevice = {
    ...device,
    instanceId: `${device.id || device.type}-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    railId: rail.id,
    startSlot,
    slot: startSlot,
    moduleWidth,
    connections: []
  };

  rail.modules.push(placedDevice);
  return placedDevice;
}

export function clearPanel(panel) {
  panel.rails.forEach((rail) => {
    rail.modules = [];
  });

  return panel;
}

export function getAllPanelDevices(panel) {
  return panel.rails.flatMap((rail) => rail.modules.map((device) => ({ ...device, railId: rail.id })));
}

export function getAllConnections(panel) {
  const connections = [];

  panel.rails.forEach((rail) => {
    rail.modules.forEach((device) => {
      (device.connections || []).forEach((connection) => {
        connections.push({
          ...connection,
          sourceId: device.instanceId,
          sourceName: device.name,
          railId: rail.id
        });
      });
    });
  });

  return connections;
}
