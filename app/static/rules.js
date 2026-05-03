export const DEVICE_RULES = {
  actuator: { label: "Röle Aktüatör", allowedLoads: ["light_load"] },
  dimmer: { label: "Dimmer Aktüatör", allowedLoads: ["dim_light"] },
  curtain_actuator: { label: "Perde/Jalüzi Aktüatörü", allowedLoads: ["curtain_motor"] }
};

export function isPanelDevice(device) {
  return ["power_supply", "interface", "router", "input", "actuator", "dimmer", "curtain_actuator"].includes(device.type);
}

export function isLoadDevice(device) {
  return ["light_load", "dim_light", "curtain_motor"].includes(device.type);
}

export function isFieldKnxDevice(device) {
  return ["push", "thermostat", "thermostat_push"].includes(device.type) || device.category === "field_knx";
}

export function canConnectDevice(sourceDevice, targetDevice) {
  if (!sourceDevice || !targetDevice) return { ok: false, message: "Kaynak veya hedef cihaz eksik." };
  const rule = DEVICE_RULES[sourceDevice.type];
  if (!rule) return { ok: false, message: `${sourceDevice.name} bağlantı için uygun bir aktüatör değil.` };
  if (!rule.allowedLoads.includes(targetDevice.type)) return { ok: false, message: `${targetDevice.name}, ${rule.label} ile bağlanamaz.` };
  if (getUsedChannels(sourceDevice) >= getMaxChannels(sourceDevice)) return { ok: false, message: `${sourceDevice.name} üzerinde boş kanal kalmadı.` };
  return { ok: true, message: `${targetDevice.name}, ${sourceDevice.name} cihazına bağlanabilir.` };
}

export function connectDevice(sourceDevice, targetDevice) {
  const validation = canConnectDevice(sourceDevice, targetDevice);
  if (!validation.ok) return validation;
  if (!sourceDevice.connections) sourceDevice.connections = [];
  const channelNo = sourceDevice.connections.length + 1;
  const connection = {
    id: `conn-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    sourceId: sourceDevice.instanceId || sourceDevice.id,
    sourceName: sourceDevice.name,
    sourceType: sourceDevice.type,
    targetId: `${targetDevice.id || targetDevice.type}-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    targetName: targetDevice.name,
    targetType: targetDevice.type,
    channel: channelNo
  };
  sourceDevice.connections.push(connection);
  return { ok: true, message: `${targetDevice.name}, ${sourceDevice.name} Kanal ${channelNo} üzerine bağlandı.`, connection };
}

export function getMaxChannels(device) {
  if (!device) return 0;
  if (device.channels) return device.channels;
  if (device.type === "actuator") return 8;
  if (device.type === "dimmer") return 4;
  if (device.type === "curtain_actuator") return 4;
  return 0;
}

export function getUsedChannels(device) {
  return !device || !device.connections ? 0 : device.connections.length;
}

export function collectConnections(panel) {
  const list = [];
  panel.rails.forEach((rail) => {
    rail.modules.forEach((device) => {
      (device.connections || []).forEach((connection) => list.push({ ...connection }));
    });
  });
  return list;
}
