export const DEVICES = {
  knx_power_supply: {
    id: "knx_power_supply",
    name: "KNX Power Supply",
    type: "power_supply",
    category: "knxProducts",
    moduleWidth: 4,
    color: "#2563eb",
    terminals: { power: ["L", "N"], bus: ["KNX+", "KNX-"] }
  },
  knx_ip_interface: {
    id: "knx_ip_interface",
    name: "KNX IP Interface",
    type: "interface",
    category: "knxProducts",
    moduleWidth: 2,
    color: "#7c3aed",
    terminals: { bus: ["KNX+", "KNX-"], ethernet: ["LAN"] }
  },
  relay_actuator_8ch: {
    id: "relay_actuator_8ch",
    name: "8CH Röle Aktüatör",
    type: "actuator",
    category: "actuators",
    moduleWidth: 8,
    color: "#16a34a",
    terminals: { power: ["L", "N"], bus: ["KNX+", "KNX-"], outputs: ["CH1", "CH2", "CH3", "CH4", "CH5", "CH6", "CH7", "CH8"] }
  },
  dimmer_4ch: {
    id: "dimmer_4ch",
    name: "4CH Dimmer",
    type: "dimmer",
    category: "actuators",
    moduleWidth: 6,
    color: "#f97316",
    terminals: { power: ["L", "N"], bus: ["KNX+", "KNX-"], outputs: ["D1", "D2", "D3", "D4"] }
  },
  curtain_actuator_4ch: {
    id: "curtain_actuator_4ch",
    name: "4CH Perde Aktüatörü",
    type: "curtain_actuator",
    category: "actuators",
    moduleWidth: 8,
    color: "#0f766e",
    terminals: { power: ["L", "N"], bus: ["KNX+", "KNX-"], outputs: ["CH1-UP", "CH1-DOWN", "CH2-UP", "CH2-DOWN", "CH3-UP", "CH3-DOWN", "CH4-UP", "CH4-DOWN"] }
  },
  lamp: {
    id: "lamp",
    name: "Lamba Yükü",
    type: "lamp",
    category: "loads",
    moduleWidth: 2,
    color: "#64748b",
    terminals: { load: ["L", "N"] }
  },
  dim_lamp: {
    id: "dim_lamp",
    name: "Dim Lamba",
    type: "dim_lamp",
    category: "loads",
    moduleWidth: 2,
    color: "#94a3b8",
    terminals: { load: ["DIM", "N"] }
  },
  blind: {
    id: "blind",
    name: "Perde Motoru",
    type: "blind",
    category: "loads",
    moduleWidth: 2,
    color: "#475569",
    terminals: { load: ["UP", "DOWN", "N"] }
  }
};

export function getDeviceTemplate(deviceId) {
  return DEVICES[deviceId] || null;
}

export function getDevicesByCategory(category) {
  return Object.values(DEVICES).filter(device => device.category === category);
}

export function createDeviceInstance(deviceId) {
  const template = getDeviceTemplate(deviceId);
  if (!template) throw new Error("Cihaz bulunamadı: " + deviceId);

  return {
    ...template,
    instanceId: `${deviceId}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    railId: null,
    x: 0,
    y: 0,
    width: 0,
    height: 0
  };
}
