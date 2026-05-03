import { getDevicesByCategory, createDeviceInstance } from "./devices.js";
import { autoPlaceDevice, clearPanel } from "./panel.js";
import { drawPanel } from "./canvas.js";

const CATEGORY_MAP = {
  knxProducts: "KNX Ürünler",
  actuators: "Aktüatörler",
  loads: "Yük / Cihazlar"
};

export function initUI(panel, canvas) {
  renderDeviceLists(panel, canvas);
  bindMenuToggles();
  bindActions(panel, canvas);
  setStatus("Ürün menüleri hazır. Başlığa tıklayıp ürün ekleyebilirsin.");
}

function renderDeviceLists(panel, canvas) {
  Object.keys(CATEGORY_MAP).forEach(category => {
    const container = document.getElementById(category);
    if (!container) return;
    container.innerHTML = "";

    const devices = getDevicesByCategory(category);
    devices.forEach(device => {
      const button = document.createElement("button");
      button.className = "device-btn";
      button.innerHTML = `<span>${device.name}</span><small>${device.moduleWidth}M</small>`;
      button.addEventListener("click", () => addDeviceToPanel(panel, canvas, device.id));
      container.appendChild(button);
    });
  });
}

function bindMenuToggles() {
  document.querySelectorAll("[data-toggle]").forEach(button => {
    button.addEventListener("click", () => {
      const targetId = button.getAttribute("data-toggle");
      const target = document.getElementById(targetId);
      if (!target) return;
      target.classList.toggle("hidden");
      button.textContent = `${target.classList.contains("hidden") ? "▸" : "▾"} ${CATEGORY_MAP[targetId] || targetId}`;
    });
  });
}

function bindActions(panel, canvas) {
  const clearButton = document.getElementById("clearPanel");
  if (clearButton) {
    clearButton.addEventListener("click", () => {
      clearPanel(panel);
      drawPanel(canvas, panel);
      setStatus("Pano temizlendi.");
    });
  }

  const pdfButton = document.getElementById("downloadPdf");
  if (pdfButton) {
    pdfButton.addEventListener("click", () => {
      setStatus("PDF modülü bir sonraki aşamada bağlanacak.");
    });
  }
}

function addDeviceToPanel(panel, canvas, deviceId) {
  try {
    const device = createDeviceInstance(deviceId);
    const placed = autoPlaceDevice(panel, device);
    drawPanel(canvas, panel);
    setStatus(`${placed.name} panoya eklendi.`);
  } catch (error) {
    setStatus(error.message, true);
  }
}

function setStatus(message, isError = false) {
  const status = document.getElementById("statusText");
  if (!status) return;
  status.textContent = message;
  status.className = isError ? "error" : "";
}
