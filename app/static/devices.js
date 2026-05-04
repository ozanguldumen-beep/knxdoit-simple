export const FIELD_DEVICES = [
  { id: "light", name: "Lamba Yükü", type: "light_load", icon: "L", color: "#f59e0b", energy: true },
  { id: "dim-light", name: "Dim Lamba", type: "dim_light", icon: "D", color: "#9333ea", energy: true },
  { id: "curtain", name: "Perde Motoru", type: "curtain_motor", icon: "M", color: "#0ea5e9", energy: true },
  { id: "valve", name: "Vana", type: "valve", icon: "V", color: "#14b8a6", energy: true },
  { id: "thermostat", name: "Termostat", type: "thermostat", icon: "T", color: "#ef4444", energy: false },
  { id: "knx-switch-1", name: "1 Gang KNX Anahtar", type: "knx_switch", icon: "K", color: "#475569", energy: false },
  { id: "knx-switch-2", name: "2 Gang KNX Anahtar", type: "knx_switch", icon: "K", color: "#475569", energy: false },
  { id: "sensor", name: "Sensör", type: "sensor", icon: "S", color: "#64748b", energy: false }
];

export const DEFAULT_PANEL_PRODUCTS = [
  { id: "psu", name: "KNX Power Supply 640mA", category: "power_supply", channel_type: "power", channels: 1, din_width: 4, color: "#2563eb" },
  { id: "ip-interface", name: "KNX IP Interface", category: "interface", channel_type: "interface", channels: 1, din_width: 2, color: "#7c3aed" },
  { id: "ip-router", name: "KNX IP Router", category: "router", channel_type: "router", channels: 1, din_width: 2, color: "#334155" },
  { id: "relay-8", name: "Switch Aktüatör 8 Kanal", category: "actuator", channel_type: "switch", channels: 8, din_width: 8, color: "#16a34a" },
  { id: "relay-12", name: "Switch Aktüatör 12 Kanal", category: "actuator", channel_type: "switch", channels: 12, din_width: 12, color: "#16a34a" },
  { id: "relay-24", name: "Switch Aktüatör 24 Kanal", category: "actuator", channel_type: "switch", channels: 24, din_width: 12, color: "#16a34a" },
  { id: "dimmer-4", name: "Dimmer Aktüatör 4 Kanal", category: "actuator", channel_type: "dimmer", channels: 4, din_width: 4, color: "#f97316" },
  { id: "dimmer-8", name: "Dimmer Aktüatör 8 Kanal", category: "actuator", channel_type: "dimmer", channels: 8, din_width: 6, color: "#f97316" },
  { id: "blind-4", name: "Jalüzi/Perde Aktüatörü 4 Kanal", category: "actuator", channel_type: "blind", channels: 4, din_width: 4, color: "#0f766e" },
  { id: "blind-8", name: "Jalüzi/Perde Aktüatörü 8 Kanal", category: "actuator", channel_type: "blind", channels: 8, din_width: 6, color: "#0f766e" },
  { id: "binary-4", name: "Binary Input 4 Kanal", category: "input", channel_type: "input", channels: 4, din_width: 2, color: "#64748b" },
  { id: "binary-8", name: "Binary Input 8 Kanal", category: "input", channel_type: "input", channels: 8, din_width: 4, color: "#64748b" }
];
