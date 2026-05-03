import { autoPlaceDevice, addFieldDevice, clearPanel, flattenPanelDevices } from "./panel.js";
import { drawPanel } from "./canvas.js";
import { fetchDevices } from "./devices.js";
import { isPanelDevice, isLoadDevice, isFieldKnxDevice, connectDevice, collectConnections } from "./rules.js";
import { downloadPdf, downloadKnx, saveProject, collectProjectData } from "./pdf.js";

export async function initUI(panel, canvas) {
  try {
    const devices = await fetchDevices();
    createMenu("knxProducts", devices.system || [], panel, canvas);
    createMenu("actuators", devices.actuators || [], panel, canvas);
    createMenu("loads", devices.loads || [], panel, canvas);
    createMenu("fieldKnx", devices.fieldKnx || [], panel, canvas);
    bindActions(panel, canvas);
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
    const result = connectDevice(actuator, { ...load });
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
