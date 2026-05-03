export const PANEL_CONFIG = {
  width: 900,
  height: 760,
  padding: 50,
  railHeight: 30,
  railGap: 165,
  moduleUnit: 18,
  deviceHeight: 92
};

export function createPanel(rowCount = 4) {
  const rails = [];
  for (let i = 0; i < rowCount; i++) {
    rails.push({
      id: `rail-${i + 1}`,
      name: `${i + 1}. DIN Ray`,
      x: PANEL_CONFIG.padding,
      y: PANEL_CONFIG.padding + 80 + i * PANEL_CONFIG.railGap,
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

export function autoPlaceDevice(panel, device) {
  for (const rail of panel.rails) {
    if (canPlaceDeviceOnRail(rail, device)) {
      const usedWidth = getRailUsedWidth(rail);
      const placedDevice = {
        ...device,
        railId: rail.id,
        x: rail.x + usedWidth,
        y: rail.y - PANEL_CONFIG.deviceHeight - 10,
        width: getModulePixelWidth(device.moduleWidth),
        height: PANEL_CONFIG.deviceHeight
      };
      rail.modules.push(placedDevice);
      return placedDevice;
    }
  }
  throw new Error("Panoda yeterli boş DIN ray alanı yok");
}
