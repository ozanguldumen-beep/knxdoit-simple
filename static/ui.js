import { autoPlaceDevice, clearPanel } from "./panel.js";
import { drawPanel } from "./canvas.js";
import { DEVICES } from "./devices.js";
import {
  isPanelDevice,
  isLoadDevice,
  connectDevice
} from "./rules.js";

export function initUI(panel, canvas) {
  const systemDevices = DEVICES.system || DEVICES.knxProducts || [];
  const actuators = DEVICES.actuators || [];
  const loads = DEVICES.loads || DEVICES.loadDevices || [];

  createMenu("knxProducts", systemDevices, panel, canvas);
  createMenu("actuators", actuators, panel, canvas);
  createMenu("loads", loads, panel, canvas);
  bindActions(panel, canvas);
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
    };
  }

  if (!Array.isArray(items) || items.length === 0) {
    container.innerHTML = `<div style="color:#9ca3af;font-size:13px;">Ürün yok</div>`;
    return;
  }

  items.forEach((device) => {
    const btn = document.createElement("button");
    btn.className = "device-btn";

    btn.innerHTML = `
      <span>${device.name}</span>
      <small>${device.moduleWidth || 1}M</small>
    `;

    btn.onclick = () => {
      if (isPanelDevice(device)) {
        addPanelDevice(device, panel, canvas);
      } else if (isLoadDevice(device)) {
        addLoadDevice(device, panel, canvas);
      } else {
        setStatus(`${device.name} cihaz tipi tanınmadı.`, true);
      }
    };

    container.appendChild(btn);
  });
}

function addPanelDevice(device, panel, canvas) {
  try {
    autoPlaceDevice(panel, { ...device });
    drawPanel(canvas, panel);
    setStatus(`${device.name} panoya eklendi.`);
  } catch (error) {
    setStatus(error.message, true);
  }
}

function addLoadDevice(load, panel, canvas) {
  const actuators = panel.rails.flatMap((rail) =>
    rail.modules.filter((device) =>
      ["actuator", "dimmer", "curtain_actuator"].includes(device.type)
    )
  );

  if (actuators.length === 0) {
    setStatus("Önce uygun aktüatör eklemelisin.", true);
    return;
  }

  for (const actuator of actuators) {
    const result = connectDevice(actuator, {
      ...load,
      id: `${load.type}-${Date.now()}`
    });

    if (result.ok) {
      drawPanel(canvas, panel);
      setStatus(result.message);
      return;
    }
  }

  setStatus("Bu yük için uygun veya boş kanallı aktüatör bulunamadı.", true);
}

function bindActions(panel, canvas) {
  const clearBtn = document.getElementById("clearPanel");
  const pdfBtn = document.getElementById("downloadPdf");

  if (clearBtn) {
    clearBtn.onclick = () => {
      clearPanel(panel);
      drawPanel(canvas, panel);
      setStatus("Pano temizlendi.");
    };
  }

  if (pdfBtn) {
    pdfBtn.onclick = () => {
      setStatus("PDF adımına sonra geçeceğiz.");
    };
  }
}

function setStatus(text, isError = false) {
  const el = document.getElementById("statusText");
  if (!el) return;

  el.textContent = text;
  el.classList.toggle("error", isError);
}
