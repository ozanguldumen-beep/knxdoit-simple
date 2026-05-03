import { createDeviceInstance } from "./devices.js";
import { autoPlaceDevice } from "./panel.js";
import { drawPanel } from "./canvas.js";

export function initUI(panel, canvas) {

  // Aktüatör butonları oluştur
  const actuatorContainer = document.getElementById("actuatorList");

  const devices = [
    { id: "knx_power_supply", name: "Power Supply" },
    { id: "knx_ip_interface", name: "IP Interface" },
    { id: "relay_actuator_8ch", name: "8CH Aktüatör" },
    { id: "dimmer_4ch", name: "Dimmer" }
  ];

  devices.forEach(d => {
    const btn = document.createElement("button");
    btn.innerText = d.name;
    btn.style.display = "block";
    btn.style.margin = "5px 0";

    btn.onclick = () => {
      const device = createDeviceInstance(d.id);
      autoPlaceDevice(panel, device);
      drawPanel(canvas, panel);
    };

    actuatorContainer.appendChild(btn);
  });

  // Menü aç/kapat
  const toggle = document.getElementById("toggleActuator");

  toggle.onclick = () => {
    if (actuatorContainer.style.display === "none") {
      actuatorContainer.style.display = "block";
    } else {
      actuatorContainer.style.display = "none";
    }
  };
}
