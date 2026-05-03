import { getAllDevices } from "./panel.js";

export function validateProject(panel) {
  const messages = [];
  const devices = getAllDevices(panel);

  const hasPowerSupply = devices.some((device) => device.type === "power_supply");
  if (!hasPowerSupply) {
    messages.push({ level: "warning", message: "Projede KNX Power Supply yok." });
  }

  const hasActuator = devices.some((device) => ["actuator", "dimmer", "curtain_actuator"].includes(device.type));
  const hasLoad = devices.some((device) => ["lamp", "dim_lamp", "blind"].includes(device.type));
  if (hasLoad && !hasActuator) {
    messages.push({ level: "error", message: "Yük eklediniz ama aktüatör yok." });
  }

  return messages;
}
