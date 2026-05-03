import { createPanel, autoPlaceDevice } from "./panel.js";
import { createDeviceInstance } from "./devices.js";
import { drawPanel } from "./canvas.js";

const panel = createPanel(4);
const canvas = document.getElementById("panelCanvas");

function addDevice(deviceId) {
  const device = createDeviceInstance(deviceId);
  autoPlaceDevice(panel, device);
  drawPanel(canvas, panel);
  console.log("PANEL:", panel);
}

document.querySelectorAll("button[data-device]").forEach((button) => {
  button.addEventListener("click", () => addDevice(button.dataset.device));
});

addDevice("knx_power_supply");
addDevice("knx_ip_interface");
addDevice("relay_actuator_8ch");
addDevice("dimmer_4ch");
