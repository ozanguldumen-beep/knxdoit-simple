import { getDevicesByCategory, createDeviceInstance } from "./devices.js";
import { autoPlaceDevice, clearPanel } from "./panel.js";
import { drawPanel } from "./canvas.js";
import { validateProject } from "./rules.js";
import { downloadPdf } from "./pdf.js";

const CATEGORY_TITLES = {
  knxProducts: "KNX Ürünler",
  actuators: "Aktüatörler",
  loads: "Yük / Cihazlar"
};

export function initUI(panel, canvas) {
  renderDeviceButtons(panel, canvas);
  bindMenuToggles();
  bindActions(panel, canvas);
  setStatus("Sistem hazır. Menü başlıklarına tıklayın.");
}

function renderDeviceButtons(panel, canvas) {
  Object.keys(CATEGORY_TITLES).forEach((category) => {
    const container = document.getElementById(category);
    if (!container) return;

    container.innerHTML = "";
    getDevicesByCategory(category).forEach((device) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "device-btn";
      button.innerHTML = `<span>${device.name}</span><small>${device.moduleWidth}M</small>`;
      button.addEventListener("click", () => addDevice(panel, canvas, device.id));
      container.appendChild(button);
    });
  });
}

function bindMenuToggles() {
  document.querySelectorAll("[data-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.dataset.toggle;
      const target = document.getElementById(targetId);
      if (!target) return;

      target.classList.toggle("hidden");
      const open = !target.classList.contains("hidden");
      button.textContent = `${open ? "▾" : "▸"} ${CATEGORY_TITLES[targetId] || targetId}`;
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
    pdfButton.addEventListener("click", async () => {
      try {
        await downloadPdf(panel);
        setStatus("PDF çıktı hazırlandı.");
      } catch (error) {
        console.error(error);
        setStatus("PDF için backend bağlantısı kontrol edilmeli.", true);
      }
    });
  }
}

function addDevice(panel, canvas, deviceId) {
  try {
    const device = createDeviceInstance(deviceId);
    const placed = autoPlaceDevice(panel, device);
    drawPanel(canvas, panel);

    const messages = validateProject(panel);
    const error = messages.find((item) => item.level === "error");
    if (error) setStatus(error.message, true);
    else setStatus(`${placed.name} ${placed.railId} üzerine eklendi.`);
  } catch (error) {
    console.error(error);
    setStatus(error.message, true);
  }
}

export function setStatus(message, isError = false) {
  const status = document.getElementById("statusText");
  if (!status) return;
  status.textContent = message;
  status.className = isError ? "error" : "";
}
