export function validateProject(panel) {
  const messages = [];
  const devices = panel.rails.flatMap(rail => rail.modules);

  const hasPowerSupply = devices.some(device => device.type === "power_supply");
  if (!hasPowerSupply) {
    messages.push({ level: "error", message: "Power supply zorunludur." });
  }

  return messages;
}
