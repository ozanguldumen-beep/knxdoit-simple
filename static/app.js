import { createPanel, autoPlaceDevice, clearPanel } from "./panel.js";
import { drawPanel } from "./canvas.js";
import { DEVICES } from "./devices.js";

const canvas = document.getElementById("panelCanvas");

let panel = createPanel();

init();

function init() {
  renderUI();
  drawPanel(canvas, panel);
}

function renderUI() {
  bindMenu("knxProducts", DEVICES.system);
  bindMenu("actuators", DEVICES.actuators);
  bindMenu("loads", DEVICES.loads);

  document.getElementById("clearPanel").onclick = () => {
    clearPanel(panel);
    drawPanel(canvas, panel);
    setStatus("Pano temizlendi.");
  };

  document.getElementById("downloadPdf").onclick = () => {
    setStatus("PDF özelliği yakında.");
  };
}

function bindMenu(menuId, items) {
  const container = document.getElementById(menuId);
  if (!container) return;

  container.innerHTML = "";

  items.forEach((device) => {
    const btn = document.createElement("button");
    btn.className = "device-btn";

    btn.innerHTML = `
      <span>${device.name}</span>
      <small>${device.moduleWidth}M</small>
    `;

    btn.onclick = () => {
      try {
        autoPlaceDevice(panel, device);
        drawPanel(canvas, panel);
        setStatus(`${device.name} eklendi.`);
      } catch (e) {
        setStatus(e.message, true);
      }
    };

    container.appendChild(btn);
  });

  // Aç/Kapa
  const toggle = document.querySelector(`[data-toggle="${menuId}"]`);
  if (toggle) {
    toggle.onclick = () => {
      container.classList.toggle("hidden");
    };
  }
}

function setStatus(text, isError = false) {
  const el = document.getElementById("statusText");
  el.textContent = text;
  el.classList.toggle("error", isError);
}
