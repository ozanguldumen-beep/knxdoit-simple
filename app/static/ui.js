import { autoPlaceDevice, addFieldDevice, clearPanel, flattenPanelDevices } from "./panel.js";
import { drawPanel, setCanvasZoom, getCanvasZoom } from "./canvas.js";
import { fetchDevices } from "./devices.js";
import { isPanelDevice, isLoadDevice, isFieldKnxDevice, connectDevice, validatePanel } from "./rules.js";
import { downloadPdf, downloadKnx, saveProject, collectProjectData } from "./pdf.js";

export async function initUI(panel, canvas) {
  try {
    const devices = await fetchDevices();
    createMenu("knxProducts", devices.system || [], panel, canvas);
    createMenu("actuators", devices.actuators || [], panel, canvas);
    createMenu("loads", devices.loads || [], panel, canvas);
    createMenu("fieldKnx", devices.fieldKnx || [], panel, canvas);
    bindActions(panel, canvas);
    bindZoom(canvas);
    await updateGA(panel);
    setStatus("Sistem hazır.");
  } catch (error) {
    setStatus(error.message, true);
  }
}

function createMenu(menuId, items = [], panel, canvas) {
  const container = document.getElementById(menuId);
  const toggle = document.querySelector(`[data-toggle="${menuId}"]`);
  if (!container) return;
  container.innerHTML = "";
  if (toggle) toggle.onclick = () => container.classList.toggle("collapsed");
  items.forEach((device) => {
    const btn = document.createElement("button");
    btn.className = "device-btn";
    btn.innerHTML = `<span>${device.name}</span><small>${device.moduleWidth || 0}M · ${device.channels || 1}K</small>`;
    btn.onclick = async () => {
      if (isPanelDevice(device)) await addPanelDevice(device, panel, canvas);
      else if (isLoadDevice(device)) await addLoadDevice(device, panel, canvas);
      else if (isFieldKnxDevice(device)) await addKnxFieldDevice(device, panel, canvas);
      else setStatus(`${device.name} cihaz tipi tanınmadı.`, true);
    };
    container.appendChild(btn);
  });
}

async function addPanelDevice(device, panel, canvas) {
  try {
    autoPlaceDevice(panel, { ...device });
    drawPanel(canvas, panel);
    await refresh(panel);
    setStatus(`${device.name} panoya eklendi.`);
  } catch (error) { setStatus(error.message, true); }
}

async function addKnxFieldDevice(device, panel, canvas) {
  addFieldDevice(panel, { ...device });
  drawPanel(canvas, panel);
  await refresh(panel);
  setStatus(`${device.name} saha cihazı olarak eklendi.`);
}

async function addLoadDevice(load, panel, canvas) {
  const actuators = flattenPanelDevices(panel).filter((device) => ["actuator", "dimmer", "curtain_actuator"].includes(device.type));
  if (actuators.length === 0) { setStatus("Önce uygun aktüatör eklemelisin.", true); return; }
  for (const actuator of actuators) {
    const result = connectDevice(actuator, { ...load }, panel);
    if (result.ok) {
      drawPanel(canvas, panel);
      await refresh(panel);
      setStatus(result.message);
      return;
    }
  }
  setStatus("Bu yük için uygun veya boş kanallı aktüatör bulunamadı.", true);
}

function bindActions(panel, canvas) {
  document.getElementById("clearPanel")?.addEventListener("click", async () => {
    clearPanel(panel); drawPanel(canvas, panel); await refresh(panel); setStatus("Pano temizlendi.");
  });
  document.getElementById("downloadPdf")?.addEventListener("click", async () => {
    try { await downloadPdf(panel); setStatus("PDF indirildi."); } catch (e) { setStatus(e.message, true); }
  });
  document.getElementById("downloadKnx")?.addEventListener("click", async () => {
    try { await downloadKnx(panel); setStatus(".knxproj indirildi."); } catch (e) { setStatus(e.message, true); }
  });
  document.getElementById("saveProject")?.addEventListener("click", async () => {
    try { await saveProject(panel); setStatus("Proje kaydedildi."); } catch (e) { setStatus(e.message, true); }
  });
}

async function refresh(panel) {
  document.getElementById("deviceCount").textContent = String(flattenPanelDevices(panel).length + (panel.fieldDevices || []).length);
  await updateGA(panel);
  updateRuleStatus(panel);
}

function bindZoom(canvas) {
  const slider = document.getElementById("zoomRange");
  const label = document.getElementById("zoomLabel");
  const minus = document.getElementById("zoomOut");
  const plus = document.getElementById("zoomIn");
  const reset = document.getElementById("zoomReset");

  const apply = (value) => {
    const zoom = Math.max(50, Math.min(150, Number(value) || 100));
    setCanvasZoom(canvas, zoom);
    if (slider) slider.value = String(zoom);
    if (label) label.textContent = `${zoom}%`;
  };

  slider?.addEventListener("input", () => apply(slider.value));
  minus?.addEventListener("click", () => apply(getCanvasZoom(canvas) - 10));
  plus?.addEventListener("click", () => apply(getCanvasZoom(canvas) + 10));
  reset?.addEventListener("click", () => apply(100));
  apply(100);
}

function updateRuleStatus(panel) {
  const box = document.getElementById("rulesStatus");
  if (!box) return;
  const result = validatePanel(panel);
  const errors = result.errors || [];
  const warnings = result.warnings || [];
  if (!errors.length && !warnings.length) {
    box.innerHTML = `<b>Kurallar:</b> Uygun`;
    box.classList.remove("has-error");
    return;
  }
  const items = [...errors, ...warnings].slice(0, 3).map((issue) => `<div>Kural ${issue.ruleId}: ${issue.message}</div>`).join("");
  box.innerHTML = `<b>Kurallar:</b>${items}`;
  box.classList.toggle("has-error", errors.length > 0);
}

async function updateGA(panel) {
  const payload = collectProjectData(panel);
  const listEl = document.getElementById("gaList");
  const countEl = document.getElementById("gaCount");
  try {
    const res = await fetch("/api/group-addresses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    const addresses = data.addresses || [];
    countEl.textContent = String(addresses.length);
    if (!addresses.length) { listEl.textContent = "Cihaz ve bağlantı ekleyince oluşacak."; return; }
    listEl.innerHTML = addresses.map((ga) => `<div class="ga-item"><b>${ga.address_str}</b><span>${ga.name}</span><small>${ga.dpt}</small></div>`).join("");
  } catch (error) {
    listEl.textContent = "Grup adresleri alınamadı.";
  }
}

function setStatus(text, isError = false) {
  const el = document.getElementById("statusText");
  if (!el) return;
  el.textContent = text;
  el.classList.toggle("error", isError);
}
