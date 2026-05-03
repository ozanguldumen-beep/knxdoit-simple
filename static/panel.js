/* static/panel.js */

const PANEL = {
  rails: [
    { slots: 48, devices: [] },
    { slots: 48, devices: [] },
    { slots: 48, devices: [] },
    { slots: 48, devices: [] }
  ]
};

export function addDeviceToPanel(device) {
  const width = device.moduleWidth || 2;

  for (let r = 0; r < PANEL.rails.length; r++) {
    const rail = PANEL.rails[r];

    let position = findSlot(rail, width);

    if (position !== -1) {
      rail.devices.push({
        ...device,
        start: position,
        width: width
      });

      return true;
    }
  }

  alert("Panoda yer kalmadı!");
  return false;
}

function findSlot(rail, width) {
  for (let i = 0; i <= rail.slots - width; i++) {
    let free = true;

    for (let d of rail.devices) {
      if (
        i < d.start + d.width &&
        i + width > d.start
      ) {
        free = false;
        break;
      }
    }

    if (free) return i;
  }

  return -1;
}

export function getPanelState() {
  return PANEL;
}
