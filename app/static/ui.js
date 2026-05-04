import { FIELD_DEVICES, DEFAULT_PANEL_PRODUCTS } from "./devices.js";
import { uid, getCurrentFloor } from "./state.js";
import { addPanelProduct, clearPanel, autoPlaceProducts } from "./panel.js";
import { validateProject, autoConnectLoads } from "./rules.js";
import { draw } from "./canvas.js";
import { downloadPdf, downloadKnxproj, previewGA } from "./pdf.js";

export function initUI(state, canvas) {
  bindButtons(state, canvas);
  renderAll(state, canvas);
}

function bindButtons(state, canvas) {
  document.getElementById("addFloorBtn").onclick = () => {
    const name = prompt("Kat adı:", `${state.floors.length}. Kat`);
    if (!name) return;
    state.floors.push({ id: uid("floor"), name, rooms: [], collectors: [], panel: { products: [] } });
    state.currentFloor = state.floors.length - 1;
    renderAll(state, canvas);
  };

  document.getElementById("addRoomBtn").onclick = () => {
    const floor = getCurrentFloor(state);
    const name = prompt("Oda adı:", "Salon");
    if (!name) return;
    floor.rooms.push({ id: uid("room"), name, devices: [] });
    renderAll(state, canvas);
  };

  document.getElementById("addCollectorBtn").onclick = () => {
    const floor = getCurrentFloor(state);
    const name = prompt("Kollektör adı:", `${floor.name} Kollektörü`);
    if (!name) return;
    floor.collectors.push({ id: uid("collector"), name, type: "collector", icon: "K", color: "#06b6d4", energy: true });
    autoConnectLoads(floor);
    renderAll(state, canvas);
  };

  document.getElementById("clearBtn").onclick = () => {
    clearPanel(getCurrentFloor(state));
    setStatus("Pano temizlendi.");
    renderAll(state, canvas);
  };

  document.getElementById("saveBtn").onclick = () => setStatus("Proje tarayıcıda hazır. .knxproj indirince kayda alınır.");
  document.getElementById("pdfBtn").onclick = async () => { await downloadPdf(state); setStatus("PDF indirildi."); };
  document.getElementById("knxBtn").onclick = async () => { await downloadKnxproj(state); setStatus(".knxproj indirildi."); };

  document.getElementById("zoomRange").oninput = (e) => setZoom(state, e.target.value);
  document.getElementById("zoomOut").onclick = () => setZoom(state, Math.max(50, state.zoom - 10));
  document.getElementById("zoomIn").onclick = () => setZoom(state, Math.min(150, state.zoom + 10));
  document.getElementById("zoomReset").onclick = () => setZoom(state, 100);
}

function setZoom(state, value) {
  state.zoom = Number(value);
  document.getElementById("zoomRange").value = state.zoom;
  document.getElementById("zoomReset").textContent = `${state.zoom}%`;
  document.getElementById("canvasStage").style.transform = `scale(${state.zoom / 100})`;
}

export async function renderAll(state, canvas) {
  renderFloorTabs(state, canvas);
  renderRoomSelect(state);
  renderFieldDevices(state, canvas);
  renderPanelProducts(state, canvas);
  autoPlaceProducts(getCurrentFloor(state));
  autoConnectLoads(getCurrentFloor(state));
  draw(canvas, state);
  renderStats(state);
  renderRules(state);
  await renderGA(state);
  setZoom(state, state.zoom);
}

function renderFloorTabs(state, canvas) {
  const el = document.getElementById("floorTabs");
  el.innerHTML = "";
  state.floors.forEach((floor, index) => {
    const btn = document.createElement("button");
    btn.className = `floor-tab ${index === state.currentFloor ? "active" : ""}`;
    btn.textContent = floor.name;
    btn.onclick = () => { state.currentFloor = index; renderAll(state, canvas); };
    el.appendChild(btn);
  });
}

function renderRoomSelect(state) {
  const floor = getCurrentFloor(state);
  const select = document.getElementById("roomSelect");
  select.innerHTML = "";
  if (floor.rooms.length === 0) {
    select.innerHTML = `<option>Önce oda ekle</option>`;
    return;
  }
  floor.rooms.forEach((room) => {
    const option = document.createElement("option");
    option.value = room.id;
    option.textContent = room.name;
    select.appendChild(option);
  });
}

function renderFieldDevices(state, canvas) {
  const el = document.getElementById("fieldDevices");
  el.innerHTML = "";
  FIELD_DEVICES.forEach((dev) => {
    const btn = document.createElement("button");
    btn.className = "device-btn";
    btn.innerHTML = `<span>${dev.name}</span><small>${dev.energy ? "Enerji" : "KNX Bus"}</small>`;
    btn.onclick = () => {
      const floor = getCurrentFloor(state);
      const roomId = document.getElementById("roomSelect").value;
      const room = floor.rooms.find((r) => r.id === roomId) || floor.rooms[0];
      if (!room) { setStatus("Önce oda eklemelisin.", true); return; }
      room.devices.push({ ...dev, id: uid(dev.id) });
      autoConnectLoads(floor);
      setStatus(`${dev.name}, ${room.name} odasına eklendi.`);
      renderAll(state, canvas);
    };
    el.appendChild(btn);
  });
}

function renderPanelProducts(state, canvas) {
  const el = document.getElementById("panelProducts");
  el.innerHTML = "";
  DEFAULT_PANEL_PRODUCTS.forEach((product) => {
    const btn = document.createElement("button");
    btn.className = "device-btn";
    btn.innerHTML = `<span>${product.name}</span><small>${product.din_width}M · ${product.channels}K</small>`;
    btn.onclick = () => {
      const floor = getCurrentFloor(state);
      addPanelProduct(floor, product);
      autoConnectLoads(floor);
      setStatus(`${product.name} panoya eklendi.`);
      renderAll(state, canvas);
    };
    el.appendChild(btn);
  });
}

function renderStats(state) {
  const rooms = state.floors.reduce((a, f) => a + f.rooms.length, 0);
  const products = state.floors.reduce((a, f) => a + f.panel.products.length, 0);
  const devices = state.floors.reduce((a, f) => a + f.rooms.reduce((r, room) => r + room.devices.length, 0) + f.collectors.length, 0);
  document.getElementById("roomCount").textContent = rooms;
  document.getElementById("productCount").textContent = products + devices;
}

function renderRules(state) {
  const warnings = validateProject(state);
  const el = document.getElementById("rulesText");
  el.innerHTML = warnings.length ? `<b>Kurallar:</b><br>${warnings.map((w) => `• ${w}`).join("<br>")}` : "Kurallar uygun görünüyor.";
}

async function renderGA(state) {
  const data = await previewGA(state);
  document.getElementById("gaCount").textContent = data.total || 0;
  const el = document.getElementById("gaList");
  el.innerHTML = (data.group_addresses || []).map((g) => `<div class="ga-row"><b>${g.address_str}</b><span>${g.name}</span><small>${g.dpt}</small></div>`).join("") || `<div class="empty-small">Cihaz ekleyince görünecek.</div>`;
}

function setStatus(text, error = false) {
  const el = document.getElementById("statusText");
  el.textContent = text;
  el.classList.toggle("error", error);
}
