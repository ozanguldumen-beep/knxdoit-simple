import { PANEL_CONFIG } from "./panel.js";
import { collectConnections } from "./rules.js";

const DPR = window.devicePixelRatio || 1;

export function setCanvasZoom(canvas, percent = 100) {
  if (!canvas) return;
  const zoom = Math.max(50, Math.min(150, Number(percent) || 100));
  canvas.dataset.zoom = String(zoom);
  canvas.style.transformOrigin = "top left";
  canvas.style.transform = `scale(${zoom / 100})`;
  const wrap = canvas.closest(".canvas-wrap");
  if (wrap) {
    wrap.style.setProperty("--canvas-zoom", String(zoom / 100));
  }
}

export function getCanvasZoom(canvas) {
  return Number(canvas?.dataset?.zoom || 100);
}


export function drawPanel(canvas, panel) {
  if (!canvas || !panel) return;
  const ctx = setupCanvas(canvas, panel.width, panel.height);
  drawWorkspace(ctx, panel);
  drawPanelBox(ctx, panel);
  drawRails(ctx, panel);
  drawDevices(ctx, panel);
  drawFieldKnxDevices(ctx, panel);
  drawBusCable(ctx, panel);
  drawFieldLoads(ctx, panel);
  drawLoadCables(ctx, panel);
}

function setupCanvas(canvas, width, height) {
  canvas.width = width * DPR;
  canvas.height = height * DPR;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.clearRect(0, 0, width, height);
  return ctx;
}

function drawWorkspace(ctx, panel) {
  ctx.fillStyle = "#f1f5f9";
  ctx.fillRect(0, 0, panel.width, panel.height);
}

function drawPanelBox(ctx, panel) {
  roundRect(ctx, 34, 28, panel.width - 68, panel.height - 70, 24, "#ffffff", "#94a3b8", 2);
  ctx.fillStyle = "#0f172a";
  ctx.font = "700 30px Arial";
  ctx.fillText("KNX Pano", 74, 80);
  ctx.fillStyle = "#64748b";
  ctx.font = "16px Arial";
  ctx.fillText("DIN ray yerleşimi + saha yükleri + KNX bus", 74, 108);
}

function drawRails(ctx, panel) {
  panel.rails.forEach((rail) => {
    roundRect(ctx, rail.x - 10, rail.y - 8, rail.width + 20, rail.height + 16, 7, "#dbeafe", "#dbeafe", 1);
    roundRect(ctx, rail.x, rail.y, rail.width, rail.height, 4, "#94a3b8", "#64748b", 1);
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 1;
    for (let i = 0; i <= rail.slots; i++) {
      const x = rail.x + i * PANEL_CONFIG.moduleUnit;
      ctx.beginPath(); ctx.moveTo(x, rail.y + 3); ctx.lineTo(x, rail.y + rail.height - 3); ctx.stroke();
    }
    ctx.fillStyle = "#334155";
    ctx.font = "700 16px Arial";
    ctx.fillText(rail.name, rail.x, rail.y + rail.height + 34);
  });
}

function drawDevices(ctx, panel) {
  panel.rails.forEach((rail) => rail.modules.forEach((device) => drawDevice(ctx, device, rail)));
}

function getDeviceDrawBox(device, rail) {
  const w = (device.moduleWidth || 2) * PANEL_CONFIG.moduleUnit - 4;
  const h = PANEL_CONFIG.deviceHeight;
  const x = rail.x + (device.startSlot || 0) * PANEL_CONFIG.moduleUnit + 2;
  const y = rail.y - Math.round((h - rail.height) / 2);
  return { x, y, w, h };
}

function drawDevice(ctx, device, rail) {
  const { x, y, w, h } = getDeviceDrawBox(device, rail);
  roundRect(ctx, x, y, w, h, 8, device.color || "#2563eb", "#1e293b", 2);
  ctx.fillStyle = "rgba(255,255,255,0.16)";
  ctx.fillRect(x + 4, y + 5, Math.max(0, w - 8), 22);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 11px Arial";
  wrapText(ctx, device.name, x + 8, y + 18, w - 16, 12, 2);
  ctx.font = "700 10px Arial";
  ctx.fillText(`${device.moduleWidth || 2}M · ${device.channels || 1}K`, x + 8, y + h - 9);
  drawTerminals(ctx, x, y, w, h, device);
}

function drawTerminals(ctx, x, y, w, h, device) {
  const count = Math.min(12, Math.max(2, device.channels || device.moduleWidth || 2));
  const gap = w / (count + 1);
  ctx.fillStyle = "#ffffff";
  for (let i = 1; i <= count; i++) { ctx.beginPath(); ctx.arc(x + gap * i, y + h - 30, 2.8, 0, Math.PI * 2); ctx.fill(); }
}

function drawBusCable(ctx, panel) {
  const busDevices = [];
  panel.rails.forEach((rail) => rail.modules.forEach((device) => {
    if (["power_supply", "interface", "router", "input", "actuator", "dimmer", "curtain_actuator"].includes(device.type)) busDevices.push({ device, rail });
  }));
  if (busDevices.length < 2) return;
  ctx.strokeStyle = "#dc2626";
  ctx.lineWidth = 2;
  ctx.setLineDash([7, 5]);
  ctx.beginPath();
  busDevices.forEach((item, index) => {
    const box = getDeviceDrawBox(item.device, item.rail);
    const cx = box.x + box.w / 2, cy = box.y + box.h + 12;
    if (index === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
  });
  ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = "#dc2626";
  ctx.font = "700 11px Arial";
  const first = busDevices[0]; const b = getDeviceDrawBox(first.device, first.rail);
  ctx.fillText("KNX BUS", b.x, b.y + b.h + 30);
}

function drawFieldKnxDevices(ctx, panel) {
  if (!panel.fieldDevices?.length) return;
  const y = 855;
  ctx.fillStyle = "#475569";
  ctx.font = "700 15px Arial";
  ctx.fillText("KNX Saha Cihazları", 74, y - 16);
  panel.fieldDevices.forEach((dev, index) => {
    const x = 92 + (index % 7) * 130;
    const yy = y + Math.floor(index / 7) * 70;
    roundRect(ctx, x, yy, 104, 50, 12, "#eff6ff", "#93c5fd", 1.5);
    ctx.fillStyle = dev.type === "thermostat" ? "#ef4444" : "#64748b";
    ctx.beginPath(); ctx.arc(x + 22, yy + 25, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#0f172a"; ctx.font = "700 10px Arial";
    wrapText(ctx, dev.name, x + 42, yy + 20, 54, 11, 2);
  });
}

function getAllConnectedDevices(panel) {
  const list = [];
  panel.rails.forEach((rail) => rail.modules.forEach((device) => (device.connections || []).forEach((connection, index) => list.push({ actuator: device, rail, connection, index }))));
  return list;
}

function getFieldBaseY(panel) {
  return Math.min(panel.height - 255, panel.rails[panel.rails.length - 1].y + 95);
}

function getLoadPosition(panel, itemIndex) {
  const startX = 92, startY = getFieldBaseY(panel) + 45, gapX = 136, gapY = 82, perRow = 6;
  return { x: startX + (itemIndex % perRow) * gapX, y: startY + Math.floor(itemIndex / perRow) * gapY };
}

function drawFieldLoads(ctx, panel) {
  const y = getFieldBaseY(panel);
  ctx.strokeStyle = "#cbd5e1"; ctx.lineWidth = 1; ctx.setLineDash([8, 6]);
  ctx.beginPath(); ctx.moveTo(60, y); ctx.lineTo(panel.width - 60, y); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = "#475569"; ctx.font = "700 15px Arial";
  ctx.fillText("Saha Yükleri / Bağlanan Cihazlar", 74, y - 16);
  getAllConnectedDevices(panel).forEach((item, index) => {
    const pos = getLoadPosition(panel, index); drawLoadIcon(ctx, pos.x, pos.y, item.connection, index);
  });
}

function drawLoadIcon(ctx, x, y, connection, index) {
  roundRect(ctx, x, y, 106, 56, 12, "#ffffff", "#94a3b8", 1.5);
  ctx.fillStyle = getLoadColor(connection.targetType);
  ctx.beginPath(); ctx.arc(x + 24, y + 28, 15, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#ffffff"; ctx.font = "700 17px Arial"; ctx.textAlign = "center";
  ctx.fillText(getLoadSymbol(connection.targetType), x + 24, y + 34); ctx.textAlign = "left";
  ctx.fillStyle = "#0f172a"; ctx.font = "700 10px Arial";
  wrapText(ctx, connection.targetName || "Yük", x + 46, y + 20, 52, 11, 2);
  ctx.fillStyle = "#64748b"; ctx.font = "10px Arial"; ctx.fillText(`K${connection.channel || index + 1}`, x + 46, y + 49);
}

function drawLoadCables(ctx, panel) {
  getAllConnectedDevices(panel).forEach((item, index) => {
    const deviceBox = getDeviceDrawBox(item.actuator, item.rail);
    const loadPos = getLoadPosition(panel, index);
    const fromX = deviceBox.x + deviceBox.w / 2, fromY = deviceBox.y + deviceBox.h + 5;
    const toX = loadPos.x + 53, toY = loadPos.y;
    const midY = Math.max(fromY + 35, toY - 35);
    ctx.strokeStyle = "#111827"; ctx.lineWidth = 2; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(fromX, fromY); ctx.lineTo(fromX, midY); ctx.lineTo(toX, midY); ctx.lineTo(toX, toY); ctx.stroke();
    ctx.fillStyle = "#111827"; ctx.font = "10px Arial"; ctx.fillText(`CH${item.connection.channel}`, toX + 6, toY - 6);
  });
}

function getLoadColor(type) { if (type === "dim_light") return "#9333ea"; if (type === "curtain_motor") return "#0ea5e9"; return "#f59e0b"; }
function getLoadSymbol(type) { if (type === "dim_light") return "D"; if (type === "curtain_motor") return "M"; return "L"; }

function roundRect(ctx, x, y, w, h, r, fill, stroke, lineWidth = 1) {
  const radius = Math.min(r, w / 2, h / 2); ctx.beginPath();
  ctx.moveTo(x + radius, y); ctx.lineTo(x + w - radius, y); ctx.quadraticCurveTo(x + w, y, x + w, y + radius); ctx.lineTo(x + w, y + h - radius); ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h); ctx.lineTo(x + radius, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - radius); ctx.lineTo(x, y + radius); ctx.quadraticCurveTo(x, y, x + radius, y); ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 2) {
  const words = String(text || "").split(" "); let line = "", lines = 0;
  for (let n = 0; n < words.length; n++) { const testLine = line + words[n] + " "; if (ctx.measureText(testLine).width > maxWidth && n > 0) { ctx.fillText(line.trim(), x, y); line = words[n] + " "; y += lineHeight; lines++; if (lines >= maxLines - 1) break; } else line = testLine; }
  ctx.fillText(line.trim(), x, y);
}
