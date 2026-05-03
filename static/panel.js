export const PANEL_CONFIG = {
  width: 900,
  height: 1120,
  padding: 50,
  railHeight: 24,
  railGap: 185,
  moduleUnit: 18,
  deviceHeight: 92
};

export function createPanel(rowCount = 5) {
  const rails = [];
  for (let i = 0; i < rowCount; i++) {
    rails.push({
      id: `rail-${i + 1}`,
      name: `${i + 1}. DIN Ray`,
      x: PANEL_CONFIG.padding,
      y: 95 + i * PANEL_CONFIG.railGap,
      width: PANEL_CONFIG.width - PANEL_CONFIG.padding * 2,
      height: PANEL_CONFIG.railHeight,
      modules: []
    });
  }
  return { id: "main-panel", name: "KNX Pano", width: PANEL_CONFIG.width, height: PANEL_CONFIG.height, rails };
}

export function getModulePixelWidth(moduleWidth) {
  return moduleWidth * PANEL_CONFIG.moduleUnit;
}

export function getRailUsedWidth(rail) {
  return rail.modules.reduce((total, device) => total + getModulePixelWidth(device.moduleWidth), 0);
}

export function canPlaceDeviceOnRail(rail, device) {
  return getRailUsedWidth(rail) + getModulePixelWidth(device.moduleWidth) <= rail.width;
}

export function findFirstAvailableRail(panel, device) {
  return panel.rails.find(rail => canPlaceDeviceOnRail(rail, device)) || null;
}

export function autoPlaceDevice(panel, device) {
  const rail = findFirstAvailableRail(panel, device);
  if (!rail) throw new Error("Panoda yeterli boş DIN ray alanı yok");

  const usedWidth = getRailUsedWidth(rail);
  const placedDevice = {
    ...device,
    railId: rail.id,
    x: rail.x + usedWidth,
    y: rail.y - PANEL_CONFIG.deviceHeight - 9,
    width: getModulePixelWidth(device.moduleWidth),
    height: PANEL_CONFIG.deviceHeight
  };

  rail.modules.push(placedDevice);
  return placedDevice;
}

export function clearPanel(panel) {
  panel.rails.forEach(rail => { rail.modules = []; });
  return panel;
}
