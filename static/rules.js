// static/rules.js
// KNXdoit v12 - KNX Kurallar Motoru

export const DEVICE_RULES = {
  actuator: {
    label: "Röle Aktüatör",
    allowedLoads: ["light_load"],
    maxChannelsField: "channels"
  },

  dimmer: {
    label: "Dimmer Aktüatör",
    allowedLoads: ["dim_light"],
    maxChannelsField: "channels"
  },

  curtain_actuator: {
    label: "Perde Aktüatörü",
    allowedLoads: ["curtain_motor"],
    maxChannelsField: "channels"
  }
};

export function isPanelDevice(device) {
  return [
    "power_supply",
    "interface",
    "actuator",
    "dimmer",
    "curtain_actuator"
  ].includes(device.type);
}

export function isLoadDevice(device) {
  return [
    "light_load",
    "dim_light",
    "curtain_motor"
  ].includes(device.type);
}

export function canConnectDevice(sourceDevice, targetDevice) {
  if (!sourceDevice || !targetDevice) {
    return {
      ok: false,
      message: "Kaynak veya hedef cihaz eksik."
    };
  }

  const rule = DEVICE_RULES[sourceDevice.type];

  if (!rule) {
    return {
      ok: false,
      message: `${sourceDevice.name} bağlantı için uygun bir aktüatör değil.`
    };
  }

  if (!rule.allowedLoads.includes(targetDevice.type)) {
    return {
      ok: false,
      message: `${targetDevice.name}, ${rule.label} ile bağlanamaz.`
    };
  }

  const maxChannels = getMaxChannels(sourceDevice);
  const usedChannels = getUsedChannels(sourceDevice);

  if (usedChannels >= maxChannels) {
    return {
      ok: false,
      message: `${sourceDevice.name} üzerinde boş kanal kalmadı.`
    };
  }

  return {
    ok: true,
    message: `${targetDevice.name}, ${sourceDevice.name} cihazına bağlanabilir.`
  };
}

export function connectDevice(sourceDevice, targetDevice) {
  const validation = canConnectDevice(sourceDevice, targetDevice);

  if (!validation.ok) {
    return validation;
  }

  if (!sourceDevice.connections) {
    sourceDevice.connections = [];
  }

  const channelNo = sourceDevice.connections.length + 1;

  const connection = {
    id: `conn-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    sourceId: sourceDevice.id,
    sourceName: sourceDevice.name,
    targetId: targetDevice.id,
    targetName: targetDevice.name,
    targetType: targetDevice.type,
    channel: channelNo
  };

  sourceDevice.connections.push(connection);

  return {
    ok: true,
    message: `${targetDevice.name}, ${sourceDevice.name} Kanal ${channelNo} üzerine bağlandı.`,
    connection
  };
}

export function disconnectDevice(sourceDevice, connectionId) {
  if (!sourceDevice || !sourceDevice.connections) {
    return {
      ok: false,
      message: "Bağlantı bulunamadı."
    };
  }

  sourceDevice.connections = sourceDevice.connections.filter(
    (conn) => conn.id !== connectionId
  );

  return {
    ok: true,
    message: "Bağlantı silindi."
  };
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
  if (!device || !device.connections) return 0;
  return device.connections.length;
}

export function getFreeChannels(device) {
  return Math.max(0, getMaxChannels(device) - getUsedChannels(device));
}

export function getRuleSummary(device) {
  if (!device) return "Cihaz seçilmedi.";

  const max = getMaxChannels(device);
  const used = getUsedChannels(device);
  const free = getFreeChannels(device);

  if (!DEVICE_RULES[device.type]) {
    return `${device.name} için kanal kuralı yok.`;
  }

  return `${device.name}: ${used}/${max} kanal kullanıldı, ${free} kanal boş.`;
}

export function validatePanel(panel) {
  const errors = [];
  const warnings = [];

  if (!panel || !panel.rails) {
    errors.push("Pano bilgisi bulunamadı.");
    return { ok: false, errors, warnings };
  }

  panel.rails.forEach((rail) => {
    rail.modules.forEach((device) => {
      if (DEVICE_RULES[device.type]) {
        const max = getMaxChannels(device);
        const used = getUsedChannels(device);

        if (used > max) {
          errors.push(`${device.name} kanal kapasitesi aşıldı.`);
        }

        if (used === 0) {
          warnings.push(`${device.name} üzerinde henüz bağlantı yok.`);
        }
      }
    });
  });

  return {
    ok: errors.length === 0,
    errors,
    warnings
  };
}
