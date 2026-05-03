// static/ui.js

import { autoPlaceDevice, clearPanel } from "./panel.js";
import { drawPanel } from "./canvas.js";
import { DEVICES } from "./devices.js";
import {
  isPanelDevice,
  isLoadDevice,
  connectDevice,
  getRuleSummary
} from "./rules.js";

export function initUI(panel, canvas) {
  bindMenus(panel, canvas);
  bindActions(panel, canvas);
}

function bindMenus(panel, canvas) {
  createMenu("knxProducts", DEVICES.system, panel, canvas);
  createMenu("actuators", DEVICES.actuators, panel, canvas);
  createMenu("loads", DEVICES.loads, panel, canvas);
}

function createMenu(menuId, items, panel, canvas) {
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
      if (isPanelDevice(device)) {
        addPanelDevice(device, panel, canvas);
      } else if (isLoadDevice(device)) {
        addLoadDevice(device, panel, canvas);
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

function addPanelDevice(device, panel, canvas) {
  try {
    autoPlaceDevice(panel, device);
    drawPanel(canvas, panel);

    setStatus(`${device.name} panoya eklendi.`);
  } catch (e) {
    setStatus(e.message, true);
  }
}

// 🔥 BURASI KRİTİK
function addLoadDevice(load, panel, canvas) {
  // uygun aktüatör bul
  const actuators = panel.rails.flatMap((r) =>
    r.modules.filter((d) =>
      ["actuator", "dimmer", "curtain_actuator"].includes(d.type)
    )
  );

  if (actuators.length === 0) {
    setStatus("Önce aktüatör eklemelisin.", true);
    return;
  }

  // ilk uygun aktüatöre bağla
  for (let actuator of actuators) {
    const result = connectDevice(actuator, load);

    if (result.ok) {
      drawPanel(canvas, panel);

      setStatus(result.message);
      return;
    }
  }

  setStatus("Bu yük için uygun aktüatör bulunamadı.", true);
}

function bindActions(panel, canvas) {
  document.getElementById("clearPanel").onclick = () => {
    clearPanel(panel);
    drawPanel(canvas, panel);
    setStatus("Pano temizlendi.");
  };

  document.getElementById("downloadPdf").onclick = () => {
    setStatus("PDF özelliği yakında.");
  };
}

function setStatus(text, isError = false) {
  const el = document.getElementById("statusText");

  if (!el) return;

  el.textContent = text;
  el.style.color = isError ? "#ef4444" : "#22c55e";
}
