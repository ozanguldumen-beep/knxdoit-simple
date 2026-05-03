export const LOAD_LIBRARY = [
  { id: "light-load", name: "Lamba Yükü", type: "light_load", moduleWidth: 0, channels: 1, color: "#f59e0b" },
  { id: "dim-light", name: "Dim Lamba", type: "dim_light", moduleWidth: 0, channels: 1, color: "#9333ea" },
  { id: "curtain-motor", name: "Perde Motoru", type: "curtain_motor", moduleWidth: 0, channels: 1, color: "#0ea5e9" }
];

export function normalizeProduct(product) {
  const channelType = product.channel_type || product.channelType || "switch";
  let type = product.type;
  if (!type) {
    if (["power_supply", "interface", "router"].includes(product.category)) type = product.category;
    else if (product.category === "input") type = "input";
    else if (product.category === "field_knx") type = channelType;
    else if (channelType === "dimmer") type = "dimmer";
    else if (channelType === "blind") type = "curtain_actuator";
    else type = "actuator";
  }

  return {
    id: String(product.id || product.name || Date.now()),
    name: product.name,
    category: product.category || "actuator",
    type,
    channelType,
    channels: product.channels || 1,
    moduleWidth: product.din_width ?? product.moduleWidth ?? 4,
    color: pickColor(type, channelType)
  };
}

function pickColor(type, channelType) {
  if (type === "power_supply") return "#2563eb";
  if (type === "interface" || type === "router") return "#7c3aed";
  if (type === "dimmer") return "#f97316";
  if (type === "curtain_actuator") return "#0f766e";
  if (type === "input") return "#64748b";
  if (type === "push" || channelType === "push") return "#60a5fa";
  if (type === "thermostat") return "#ef4444";
  return "#16a34a";
}

export async function fetchDevices() {
  const res = await fetch("/api/products");
  if (!res.ok) throw new Error("Ürün kütüphanesi alınamadı.");
  const products = await res.json();
  const normalized = products.map(normalizeProduct);
  return {
    system: normalized.filter((d) => ["power_supply", "interface", "router", "input"].includes(d.type)),
    actuators: normalized.filter((d) => ["actuator", "dimmer", "curtain_actuator"].includes(d.type)),
    fieldKnx: normalized.filter((d) => ["push", "thermostat", "thermostat_push"].includes(d.type) || d.category === "field_knx"),
    loads: LOAD_LIBRARY
  };
}
