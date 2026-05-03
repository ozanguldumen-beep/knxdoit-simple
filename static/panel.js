// static/panel.js

export const PANEL_CONFIG = {
  width: 980,
  height: 980,
  padding: 70,
  headerSafeTop: 150,

  railSlots: 48,
  moduleUnit: 18,
  railHeight: 28,
  railGap: 170,

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

export function getModulePixelWidth(moduleWidth) {
  return moduleWidth * PANEL_CONFIG.moduleUnit;
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
    railId: rail.id,
    startSlot,
    slot: startSlot,
    moduleWidth,

    x: rail.x + startSlot * PANEL_CONFIG.moduleUnit,
    y: rail.y - Math.round((PANEL_CONFIG.deviceHeight - rail.height) / 2),

    width: getModulePixelWidth(moduleWidth),
    height: PANEL_CONFIG.deviceHeight
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
