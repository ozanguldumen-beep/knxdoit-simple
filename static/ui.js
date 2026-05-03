// static/ui.js

import { autoPlaceDevice, clearPanel, getAllConnections } from "./panel.js";
import { drawPanel } from "./canvas.js";
import { DEVICES } from "./devices.js";
import { isPanelDevice, isLoadDevice, connectDevice, canConnectDevice } from "./rules.js";
import { downloadPdf } from "./pdf.js";

export function initUI(panel, canvas) {
  createMenu("knxProducts", DEVICES.system || [], panel, canvas);
  createMenu("actuators", DEVICES.actuators || [], panel, canvas);
  createMenu("loads", DEVICES.loads || [], panel, canvas);
  bindActions(panel, canvas);
  updateConnectionList(panel);
  setStatus("Sistem hazır.");
}

function createMenu(menuId, items = [], panel, canvas) {
  const container = document.getElementById(menuId);
  const toggle = document.querySelector(`[data-toggle="${menuId}"]`);

  if (!container) return;

  container.innerHTML = "";

  if (toggle) {
    toggle.onclick = () => {
      container.classList.toggle("hidden");
      toggle.textContent = `${container.classList.contains("hidden") ? "▸" : "▾"} ${getMenuTitle(menuId)}`;
    };
  }

  items.forEach((device) => {
    const btn = document.createElement("button");
    btn.className = "device-btn";
    btn.innerHTML = `<span>${device.name}</span><small>${device.moduleWidth ? `${device.moduleWidth}M` : "Saha"}</small>`;

    btn.onclick = () => {
      if (isPanelDevice(device)) addPanelDevice(device, panel, canvas);
      else if (isLoadDevice(device)) addLoadDevice(device, panel, canvas);
      else setStatus(`${device.name} cihaz tipi tanınmadı.`, true);
    };

    container.appendChild(btn);
  });
}

function getMenuTitle(menuId) {
  if (menuId === "knxProducts") return "KNX Ürünler";
  if (menuId === "actuators") return "Aktüatörler";
  if (menuId === "loads") return "Yük / Cihazlar";
  return "Menü";
}

function addPanelDevice(device, panel, canvas) {
  try {
    autoPlaceDevice(panel, { ...device });
    drawPanel(canvas, panel);
    updateConnectionList(panel);
    setStatus(`${device.name} panoya eklendi.`);
  } catch (error) {
    setStatus(error.message, true);
  }
}

function addLoadDevice(load, panel, canvas) {
  const actuators = panel.rails.flatMap((rail) =>
    rail.modules.filter((device) => ["actuator", "dimmer", "curtain_actuator"].includes(device.type))
  );

  if (actuators.length === 0) {
    setStatus("Önce uygun aktüatör eklemelisin.", true);
    return;
  }

  const compatibleActuators = actuators.filter((actuator) => canConnectDevice(actuator, load).ok);

  if (compatibleActuators.length === 0) {
    setStatus("Bu yük için uygun veya boş kanallı aktüatör bulunamadı.", true);
    return;
  }

  const selectedActuator = compatibleActuators[0];
  const result = connectDevice(selectedActuator, { ...load });

  if (result.ok) {
    drawPanel(canvas, panel);
    updateConnectionList(panel);
    setStatus(result.message);
    return;
  }

  setStatus(result.message || "Bağlantı yapılamadı.", true);
}

function bindActions(panel, canvas) {
  const clearBtn = document.getElementById("clearPanel");
  const pdfBtn = document.getElementById("downloadPdf");

  if (clearBtn) {
    clearBtn.onclick = () => {
      clearPanel(panel);
      drawPanel(canvas, panel);
      updateConnectionList(panel);
      setStatus("Pano temizlendi.");
    };
  }

  if (pdfBtn) {
    pdfBtn.onclick = async () => {
      try {
        setStatus("PDF hazırlanıyor...");
        await downloadPdf(panel, canvas);
        setStatus("PDF indirildi.");
      } catch (error) {
        setStatus(error.message || "PDF oluşturulamadı.", true);
      }
    };
  }
}

function updateConnectionList(panel) {
  const el = document.getElementById("connectionList");
  if (!el) return;

  const connections = getAllConnections(panel);

  if (connections.length === 0) {
    el.textContent = "Henüz bağlantı yok.";
    return;
  }

  el.innerHTML = connections
    .map((conn) => `<div class="connection-item"><b>CH${conn.channel}</b> ${conn.sourceName} → ${conn.targetName}</div>`)
    .join("");
}

function setStatus(text, isError = false) {
  const el = document.getElementById("statusText");
  if (!el) return;
  el.textContent = text;
  el.classList.toggle("error", isError);
}
