export const PANEL_CONFIG = {
  width: 1000,
  height: 1180,
  padding: 60,
  topOffset: 135,
  railCount: 5,
  slotsPerRail: 48,
  moduleUnit: 18,
  railHeight: 28,
  railGap: 190,
  deviceHeight: 86,
  deviceGap: 3
};

export function createPanel(rowCount = PANEL_CONFIG.railCount) {
  const railWidth = PANEL_CONFIG.slotsPerRail * PANEL_CONFIG.moduleUnit;
  const rails = [];

  for (let i = 0; i < rowCount; i++) {
    rails.push({
      id: `rail-${i + 1}`,
      name: `${i + 1}. DIN Ray`,
      x: PANEL_CONFIG.padding,
      y: PANEL_CONFIG.topOffset + i * PANEL_CONFIG.railGap,
      width: railWidth,
      height: PANEL_CONFIG.railHeight,
      slots: PANEL_CONFIG.slotsPerRail,
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

function overlaps(aStart, aWidth, bStart, bWidth) {
  return aStart < bStart + bWidth && aStart + aWidth > bStart;
}

export function findFreeSlot(rail, moduleWidth) {
  for (let slot = 0; slot <= rail.slots - moduleWidth; slot++) {
    const busy = rail.modules.some((device) =>
      overlaps(slot, moduleWidth, device.slotStart, device.moduleWidth)
    );
    if (!busy) return slot;
  }
  return -1;
}

export function autoPlaceDevice(panel, device) {
  const moduleWidth = Number(device.moduleWidth || 2);

  for (const rail of panel.rails) {
    const slotStart = findFreeSlot(rail, moduleWidth);
    if (slotStart !== -1) {
      const placedDevice = {
        ...device,
        moduleWidth,
        railId: rail.id,
        slotStart,
        x: rail.x + slotStart * PANEL_CONFIG.moduleUnit,
        y: rail.y - PANEL_CONFIG.deviceHeight - 12,
        width: moduleWidth * PANEL_CONFIG.moduleUnit - PANEL_CONFIG.deviceGap,
        height: PANEL_CONFIG.deviceHeight
      };
      rail.modules.push(placedDevice);
      return placedDevice;
    }
  }

  throw new Error("Panoda yeterli boş DIN ray alanı yok.");
}

export function clearPanel(panel) {
  panel.rails.forEach((rail) => {
    rail.modules = [];
  });
}

export function getAllDevices(panel) {
  return panel.rails.flatMap((rail) => rail.modules);
}
