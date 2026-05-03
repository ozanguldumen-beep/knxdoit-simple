// static/rules_engine.js
// KNXdoit v15 merkezi kural motoru.
// Bu dosya KNXdoit Kurallar Tablosu v11 mantığını yazılım kurallarına çevirir.

export const RULE_IDS = {
  POWER_SOURCE: 1,
  KNX_NO_POWER_DISTRIBUTION: 2,
  DIRECT_POWER: 3,
  EXCLUDED_WHITE_GOODS: 4,
  FLOOR_PANEL_POWER: 5,
  FLOOR_BASED_LINE: 6,
  LINE_COUPLER: 7,
  LINE_DEVICE_LIMIT: 8,
  NO_RING_TOPOLOGY: 9,
  T_CONNECTION: 10,
  POWER_SUPPLY_REQUIRED: 11,
  POWER_SUPPLY_PER_LINE: 12,
  SWITCH_ACTUATOR_CHANNELS: 13,
  ONE_RELAY_ONE_LOAD: 14,
  ONE_LOAD_ONE_OUTPUT: 15,
  CURTAIN_TWO_RELAYS: 16,
  CURTAIN_INTERLOCK: 17,
  DIMMER_ONLY: 18,
  MULTI_CONTROL_GA: 19,
  GROUP_ADDRESS_CONTROL: 20,
  HVAC_GATEWAY: 21,
  BOILER_DRY_CONTACT: 22,
  HEATING_COLLECTOR_PER_FLOOR: 23,
  VALVE_CONTROL: 24,
  THERMOSTAT_BUS: 25,
  SENSOR_NO_LOAD_DRIVE: 26
};

export const DEVICE_RULES = {
  actuator: {
    ruleId: RULE_IDS.ONE_RELAY_ONE_LOAD,
    label: "Röle Aktüatör",
    allowedLoads: ["light_load", "valve_load", "onoff_load"]
  },
  dimmer: {
    ruleId: RULE_IDS.DIMMER_ONLY,
    label: "Dimmer Aktüatör",
    allowedLoads: ["dim_light"]
  },
  curtain_actuator: {
    ruleId: RULE_IDS.CURTAIN_TWO_RELAYS,
    label: "Perde/Jalüzi Aktüatörü",
    allowedLoads: ["curtain_motor"],
    requiredAdjacentChannels: 2
  }
};

export const PANEL_DEVICE_TYPES = [
  "power_supply", "interface", "router", "line_coupler", "input",
  "actuator", "dimmer", "curtain_actuator"
];

export const LOAD_DEVICE_TYPES = [
  "light_load", "dim_light", "curtain_motor", "valve_load", "onoff_load"
];

export const FIELD_KNX_DEVICE_TYPES = [
  "push", "thermostat", "thermostat_push", "sensor", "input"
];

export function isPanelDevice(device) {
  return PANEL_DEVICE_TYPES.includes(device?.type);
}

export function isLoadDevice(device) {
  return LOAD_DEVICE_TYPES.includes(device?.type);
}

export function isFieldKnxDevice(device) {
  return FIELD_KNX_DEVICE_TYPES.includes(device?.type) || device?.category === "field_knx";
}

export function getMaxChannels(device) {
  if (!device) return 0;
  if (Number.isFinite(Number(device.channels))) return Number(device.channels);
  if (device.type === "actuator") return 8;
  if (device.type === "dimmer") return 4;
  if (device.type === "curtain_actuator") return 4;
  return 0;
}

export function getUsedChannels(device) {
  if (!device || !device.connections) return 0;
  return device.connections.reduce((sum, connection) => sum + (connection.channelSpan || 1), 0);
}

export function getNextAvailableChannel(device, targetDevice) {
  const max = getMaxChannels(device);
  const used = new Set();
  (device.connections || []).forEach((connection) => {
    const start = connection.channel || 1;
    const span = connection.channelSpan || 1;
    for (let i = 0; i < span; i++) used.add(start + i);
  });

  const span = targetDevice?.type === "curtain_motor" ? 2 : 1;
  for (let channel = 1; channel <= max; channel++) {
    let free = true;
    for (let i = 0; i < span; i++) {
      if (channel + i > max || used.has(channel + i)) {
        free = false;
        break;
      }
    }
    if (free) return { channel, span };
  }

  return null;
}

export function canConnectDevice(sourceDevice, targetDevice, panel = null) {
  if (!sourceDevice || !targetDevice) {
    return ruleError(null, "Kaynak veya hedef cihaz eksik.");
  }

  if (isFieldKnxDevice(sourceDevice) || sourceDevice.type === "power_supply" || sourceDevice.type === "router" || sourceDevice.type === "interface") {
    return ruleError(RULE_IDS.KNX_NO_POWER_DISTRIBUTION, "KNX cihazlara enerji hattı bağlanamaz.");
  }

  const rule = DEVICE_RULES[sourceDevice.type];
  if (!rule) {
    return ruleError(RULE_IDS.SWITCH_ACTUATOR_CHANNELS, `${sourceDevice.name} bağlantı için uygun bir aktüatör değil.`);
  }

  if (!rule.allowedLoads.includes(targetDevice.type)) {
    if (targetDevice.type === "dim_light") {
      return ruleError(RULE_IDS.DIMMER_ONLY, "Dim lamba sadece Dimmer Actuator kanalına bağlanır.");
    }
    if (targetDevice.type === "curtain_motor") {
      return ruleError(RULE_IDS.CURTAIN_TWO_RELAYS, "Perde/Panjur için yanındaki röle boş olmalı ve perde aktüatörü kullanılmalıdır.");
    }
    return ruleError(rule.ruleId, `${targetDevice.name}, ${rule.label} ile bağlanamaz.`);
  }

  if (panel && isLoadAlreadyConnected(panel, targetDevice)) {
    return ruleError(RULE_IDS.ONE_LOAD_ONE_OUTPUT, "Bu yüke ikinci kablo bağlanamaz.");
  }

  const next = getNextAvailableChannel(sourceDevice, targetDevice);
  if (!next) {
    if (targetDevice.type === "curtain_motor") {
      return ruleError(RULE_IDS.CURTAIN_TWO_RELAYS, "Perde/Panjur için yanındaki röle boş olmalı.");
    }
    return ruleError(RULE_IDS.ONE_RELAY_ONE_LOAD, "Bu röle zaten kullanılıyor.");
  }

  return ruleOk(`${targetDevice.name}, ${sourceDevice.name} cihazına bağlanabilir.`, { channel: next.channel, channelSpan: next.span });
}

export function connectDevice(sourceDevice, targetDevice, panel = null) {
  const validation = canConnectDevice(sourceDevice, targetDevice, panel);
  if (!validation.ok) return validation;

  if (!sourceDevice.connections) sourceDevice.connections = [];

  const connection = {
    id: `conn-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    sourceId: sourceDevice.instanceId || sourceDevice.id,
    sourceName: sourceDevice.name,
    sourceType: sourceDevice.type,
    targetId: `${targetDevice.id || targetDevice.type}-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    targetName: targetDevice.name,
    targetType: targetDevice.type,
    channel: validation.channel,
    channelSpan: validation.channelSpan || 1,
    interlock: targetDevice.type === "curtain_motor"
  };

  sourceDevice.connections.push(connection);

  const suffix = connection.channelSpan === 2 ? `Kanal ${connection.channel}-${connection.channel + 1}` : `Kanal ${connection.channel}`;
  return ruleOk(`${targetDevice.name}, ${sourceDevice.name} ${suffix} üzerine bağlandı.`, { connection });
}

export function validatePanel(panel) {
  const errors = [];
  const warnings = [];
  const devices = flattenPanelDevicesLocal(panel);
  const fieldDevices = panel?.fieldDevices || [];

  const hasPowerSupply = devices.some((device) => device.type === "power_supply");
  if (!hasPowerSupply && devices.length > 0) {
    errors.push(makeIssue(RULE_IDS.POWER_SUPPLY_REQUIRED, "Power Supply yok. Proje geçersiz."));
  }

  const lineDeviceCount = devices.filter((device) => PANEL_DEVICE_TYPES.includes(device.type)).length + fieldDevices.length;
  if (lineDeviceCount > 64) {
    errors.push(makeIssue(RULE_IDS.LINE_DEVICE_LIMIT, "Bu KNX hattında 64 cihaz sınırı aşıldı."));
  }

  fieldDevices.forEach((device) => {
    if (["thermostat", "thermostat_push"].includes(device.type)) {
      warnings.push(makeIssue(RULE_IDS.THERMOSTAT_BUS, "Termostat KNX Bus'a bağlanmalıdır."));
    }
    if (device.type === "sensor") {
      warnings.push(makeIssue(RULE_IDS.SENSOR_NO_LOAD_DRIVE, "Sensör yük süremez; kontrolü grup adresiyle yapar."));
    }
  });

  devices.forEach((device) => {
    (device.connections || []).forEach((connection) => {
      if (connection.targetType === "curtain_motor" && connection.channelSpan !== 2) {
        errors.push(makeIssue(RULE_IDS.CURTAIN_TWO_RELAYS, "Perde/Panjur 2 röle kullanır: UP ve DOWN."));
      }
    });
  });

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    summary: errors[0]?.message || warnings[0]?.message || "Kurallar uygun."
  };
}

export function collectConnections(panel) {
  const list = [];
  (panel?.rails || []).forEach((rail) => {
    (rail.modules || []).forEach((device) => {
      (device.connections || []).forEach((connection) => list.push({ ...connection }));
    });
  });
  return list;
}

function isLoadAlreadyConnected(panel, targetDevice) {
  if (!targetDevice?.instanceId) return false;
  return collectConnections(panel).some((connection) => connection.targetId === targetDevice.instanceId);
}

function flattenPanelDevicesLocal(panel) {
  return (panel?.rails || []).flatMap((rail) => rail.modules || []);
}

function makeIssue(ruleId, message) {
  return { ruleId, message };
}

function ruleError(ruleId, message, extra = {}) {
  return { ok: false, ruleId, message, ...extra };
}

function ruleOk(message, extra = {}) {
  return { ok: true, message, ...extra };
}
