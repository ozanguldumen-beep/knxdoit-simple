import { PANEL_CONFIG } from "./panel.js";
import { getCurrentFloor } from "./state.js";

const DPR = window.devicePixelRatio || 1;

export function draw(canvas, state) {
  const floor = getCurrentFloor(state);
  const ctx = setup(canvas, PANEL_CONFIG.width, PANEL_CONFIG.height);
  drawBackground(ctx);
  drawRooms(ctx, floor);
  drawCollectors(ctx, floor);
  drawPanelBox(ctx, floor);
  drawRails(ctx);
  drawProducts(ctx, floor);
  drawBus(ctx, floor);
  drawConnections(ctx, floor);
}

function setup(canvas, w, h) {
  canvas.width = w * DPR;
  canvas.height = h * DPR;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return ctx;
}

function drawBackground(ctx) {
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, PANEL_CONFIG.width, PANEL_CONFIG.height);
  roundRect(ctx, 26, 28, PANEL_CONFIG.width - 52, PANEL_CONFIG.height - 56, 20, "#fff", "#cbd5e1", 1.5);
  ctx.fillStyle = "#0f172a";
  ctx.font = "800 24px Arial";
  ctx.fillText("Kat Planı + Gerçek Pano Görünümü", 54, 70);
}

function drawRooms(ctx, floor) {
  ctx.fillStyle = "#334155";
  ctx.font = "800 16px Arial";
  ctx.fillText(`${floor.name} Odaları`, 54, 108);
  floor.rooms.forEach((room, i) => {
    const x = 54 + (i % 2) * 165;
    const y = 130 + Math.floor(i / 2) * 118;
    room.drawBox = { x, y, w: 145, h: 94 };
    roundRect(ctx, x, y, 145, 94, 14, "#eff6ff", "#60a5fa", 1.5);
    ctx.fillStyle = "#0f172a";
    ctx.font = "800 12px Arial";
    ctx.fillText(room.name, x + 12, y + 22);
    room.devices.forEach((d, di) => drawMiniDevice(ctx, x + 12 + (di % 4) * 30, y + 42 + Math.floor(di / 4) * 28, d));
  });
}

function drawCollectors(ctx, floor) {
  const baseY = 610;
  ctx.fillStyle = "#334155";
  ctx.font = "800 16px Arial";
  ctx.fillText("Kollektörler", 54, baseY - 16);
  floor.collectors.forEach((c, i) => {
    const x = 54;
    const y = baseY + i * 52;
    c.drawBox = { x, y, w: 280, h: 42 };
    roundRect(ctx, x, y, 280, 42, 12, "#ecfeff", "#06b6d4", 1.5);
    ctx.fillStyle = "#0891b2";
    ctx.font = "800 12px Arial";
    ctx.fillText(`Kollektör: ${c.name}`, x + 12, y + 25);
  });
}

function drawMiniDevice(ctx, x, y, d) {
  ctx.beginPath();
  ctx.fillStyle = d.color || "#64748b";
  ctx.arc(x + 10, y + 10, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "800 9px Arial";
  ctx.textAlign = "center";
  ctx.fillText(d.icon || "C", x + 10, y + 13);
  ctx.textAlign = "left";
}

function drawPanelBox(ctx, floor) {
  roundRect(ctx, 390, 86, 750, 760, 18, "#ffffff", "#94a3b8", 1.5);
  ctx.fillStyle = "#0f172a";
  ctx.font = "800 18px Arial";
  ctx.fillText(`${floor.name} KNX Panosu`, 420, 122);
}

function drawRails(ctx) {
  for (let i = 0; i < 5; i++) {
    const x = PANEL_CONFIG.railStartX;
    const y = PANEL_CONFIG.railStartY + 70 + i * PANEL_CONFIG.railGap;
    roundRect(ctx, x - 10, y - 8, PANEL_CONFIG.railSlots * PANEL_CONFIG.moduleUnit + 20, 46, 8, "#dbeafe", null, 0);
    roundRect(ctx, x, y, PANEL_CONFIG.railSlots * PANEL_CONFIG.moduleUnit, PANEL_CONFIG.railHeight, 5, "#94a3b8", "#64748b", 1);
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 1;
    for (let s = 0; s <= PANEL_CONFIG.railSlots; s++) {
      const sx = x + s * PANEL_CONFIG.moduleUnit;
      ctx.beginPath(); ctx.moveTo(sx, y + 3); ctx.lineTo(sx, y + PANEL_CONFIG.railHeight - 3); ctx.stroke();
    }
    ctx.fillStyle = "#334155";
    ctx.font = "800 14px Arial";
    ctx.fillText(`${i + 1}. DIN Ray`, x, y + 56);
  }
}

function drawProducts(ctx, floor) {
  floor.panel.products.forEach((p) => {
    const box = productBox(p);
    p.drawBox = box;
    roundRect(ctx, box.x, box.y, box.w, box.h, 8, p.color || "#2563eb", "#1e293b", 1.5);
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(box.x + 4, box.y + 5, Math.max(0, box.w - 8), 20);
    ctx.fillStyle = "#fff";
    ctx.font = "800 10px Arial";
    wrap(ctx, p.name, box.x + 7, box.y + 18, box.w - 14, 11, 2);
    ctx.font = "800 9px Arial";
    ctx.fillText(`${p.moduleWidth}M · ${p.channels || 1}K`, box.x + 7, box.y + box.h - 8);
  });
}

function productBox(p) {
  const x = PANEL_CONFIG.railStartX + (p.slot || 0) * PANEL_CONFIG.moduleUnit + 2;
  const railY = PANEL_CONFIG.railStartY + 70 + (p.railIndex || 0) * PANEL_CONFIG.railGap;
  const w = (p.moduleWidth || 2) * PANEL_CONFIG.moduleUnit - 4;
  const h = PANEL_CONFIG.deviceHeight;
  const y = railY - Math.round((h - PANEL_CONFIG.railHeight) / 2);
  return { x, y, w, h };
}

function drawBus(ctx, floor) {
  const devices = floor.panel.products.filter((p) => ["power_supply", "interface", "router", "actuator", "input"].includes(p.category));
  if (devices.length < 2) return;
  ctx.strokeStyle = "#dc2626";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  devices.forEach((p, i) => {
    const b = p.drawBox || productBox(p);
    const x = b.x + b.w / 2;
    const y = b.y + b.h + 12;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#dc2626";
  ctx.font = "800 9px Arial";
  ctx.fillText("KNX BUS", PANEL_CONFIG.railStartX, 153);
}

function drawConnections(ctx, floor) {
  floor.panel.products.forEach((p) => {
    (p.channelsData || []).forEach((ch) => {
      if (!ch.conn) return;
      const from = p.drawBox || productBox(p);
      const target = findTarget(floor, ch.conn.deviceId);
      if (!target?.drawBox) return;
      const x1 = from.x + from.w / 2;
      const y1 = from.y + from.h + 8;
      const x2 = target.drawBox.x + target.drawBox.w;
      const y2 = target.drawBox.y + target.drawBox.h / 2;
      ctx.strokeStyle = "#111827";
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1, y2);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.fillStyle = "#111827";
      ctx.font = "9px Arial";
      ctx.fillText(`CH${ch.no}`, x1 + 4, y2 - 4);
    });
  });
}

function findTarget(floor, id) {
  for (const room of floor.rooms) for (const d of room.devices) if (d.id === id) return d;
  for (const c of floor.collectors) if (c.id === id) return c;
  return null;
}

function roundRect(ctx, x, y, w, h, r, fill, stroke, lineWidth = 1) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
}

function wrap(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const words = String(text || "").split(" ");
  let line = ""; let lines = 0;
  for (const word of words) {
    const test = line + word + " ";
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line.trim(), x, y); y += lineHeight; line = word + " "; lines++;
      if (lines >= maxLines - 1) break;
    } else line = test;
  }
  ctx.fillText(line.trim(), x, y);
}
