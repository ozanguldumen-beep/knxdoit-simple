import { PANEL_CONFIG } from "./panel.js";

const DPR = window.devicePixelRatio || 1;

export function drawPanel(canvas, panel) {
  if (!canvas || !panel) return;

  const ctx = setupCanvas(canvas, panel.width, panel.height);

  drawWorkspace(ctx, panel);
  drawPanelBox(ctx, panel);
  drawRails(ctx, panel);
  drawDevices(ctx, panel);
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
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, panel.width, panel.height);
}

function drawPanelBox(ctx, panel) {
  roundRect(ctx, 25, 25, panel.width - 50, panel.height - 50, 22, "#ffffff", "#94a3b8", 2);

  ctx.fillStyle = "#0f172a";
  ctx.font = "700 30px Arial";
  ctx.fillText("KNX Pano", 70, 78);

  ctx.fillStyle = "#64748b";
  ctx.font = "16px Arial";
  ctx.fillText("Ön görünüm / DIN ray yerleşimi", 70, 108);
}

function drawRails(ctx, panel) {
  panel.rails.forEach((rail) => {
    drawDinRail(ctx, rail);
    drawRailLabel(ctx, rail);
  });
}

function drawDinRail(ctx, rail) {
  roundRect(ctx, rail.x - 10, rail.y - 8, rail.width + 20, rail.height + 16, 7, "#dbeafe", "#dbeafe", 1);
  roundRect(ctx, rail.x, rail.y, rail.width, rail.height, 4, "#94a3b8", "#64748b", 1);

  ctx.strokeStyle = "#64748b";
  ctx.lineWidth = 1;

  for (let i = 0; i <= rail.slots; i++) {
    const x = rail.x + i * PANEL_CONFIG.moduleUnit;
    ctx.beginPath();
    ctx.moveTo(x, rail.y + 3);
    ctx.lineTo(x, rail.y + rail.height - 3);
    ctx.stroke();
  }
}

function drawRailLabel(ctx, rail) {
  ctx.fillStyle = "#334155";
  ctx.font = "700 16px Arial";
  ctx.fillText(rail.name, rail.x, rail.y + rail.height + 34);
}

function drawDevices(ctx, panel) {
  panel.rails.forEach((rail) => {
    rail.modules.forEach((device) => {
      drawDevice(ctx, device, rail);
    });
  });
}

function getDeviceDrawBox(device, rail) {
  const moduleWidth = device.moduleWidth || 2;
  const w = moduleWidth * PANEL_CONFIG.moduleUnit - 4;
  const h = PANEL_CONFIG.deviceHeight || 86;

  const slot = device.startSlot ?? device.slot ?? 0;
  const x = rail.x + slot * PANEL_CONFIG.moduleUnit + 2;
  const y = rail.y - Math.round((h - rail.height) / 2);

  return { x, y, w, h };
}

function drawDevice(ctx, device, rail) {
  const { x, y, w, h } = getDeviceDrawBox(device, rail);

  roundRect(ctx, x, y, w, h, 7, device.color || "#2563eb", "#1e293b", 2);

  ctx.fillStyle = "rgba(255,255,255,0.14)";
  ctx.fillRect(x + 4, y + 5, Math.max(0, w - 8), 22);

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 12px Arial";
  wrapText(ctx, device.name, x + 8, y + 19, w - 16, 13, 2);

  ctx.font = "700 11px Arial";
  ctx.fillText(`${device.moduleWidth || 2}M`, x + 8, y + h - 9);

  drawTerminals(ctx, x, y, w, h, device);
}

function drawTerminals(ctx, x, y, w, h, device) {
  const count = Math.min(10, Math.max(2, device.terminals?.outputs?.length || device.channels || device.moduleWidth || 2));
  const gap = w / (count + 1);

  ctx.fillStyle = "#ffffff";

  for (let i = 1; i <= count; i++) {
    ctx.beginPath();
    ctx.arc(x + gap * i, y + h - 30, 2.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

function getAllConnectedDevices(panel) {
  const list = [];

  panel.rails.forEach((rail) => {
    rail.modules.forEach((device) => {
      if (device.connections && device.connections.length > 0) {
        device.connections.forEach((connection, index) => {
          list.push({
            actuator: device,
            rail,
            connection,
            index
          });
        });
      }
    });
  });

  return list;
}

function getLoadPosition(panel, itemIndex) {
  const startX = 80;
  const startY = panel.height - 190;
  const gapX = 125;
  const gapY = 82;
  const perRow = 6;

  const col = itemIndex % perRow;
  const row = Math.floor(itemIndex / perRow);

  return {
    x: startX + col * gapX,
    y: startY + row * gapY
  };
}

function drawFieldLoads(ctx, panel) {
  const loads = getAllConnectedDevices(panel);

  if (loads.length === 0) {
    drawFieldAreaTitle(ctx, panel);
    return;
  }

  drawFieldAreaTitle(ctx, panel);

  loads.forEach((item, index) => {
    const pos = getLoadPosition(panel, index);
    drawLoadIcon(ctx, pos.x, pos.y, item.connection, index);
  });
}

function drawFieldAreaTitle(ctx, panel) {
  const y = panel.height - 230;

  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(55, y);
  ctx.lineTo(panel.width - 55, y);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#475569";
  ctx.font = "700 15px Arial";
  ctx.fillText("Saha Yükleri / Bağlanan Cihazlar", 70, y - 15);
}

function drawLoadIcon(ctx, x, y, connection, index) {
  const type = connection.targetType;
  const label = connection.targetName || "Yük";
  const channel = connection.channel || index + 1;

  roundRect(ctx, x, y, 92, 56, 12, "#ffffff", "#94a3b8", 1.5);

  ctx.fillStyle = getLoadColor(type);
  ctx.beginPath();
  ctx.arc(x + 24, y + 26, 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 16px Arial";
  ctx.textAlign = "center";
  ctx.fillText(getLoadSymbol(type), x + 24, y + 31);
  ctx.textAlign = "left";

  ctx.fillStyle = "#0f172a";
  ctx.font = "700 10px Arial";
  wrapText(ctx, label, x + 44, y + 20, 42, 11, 2);

  ctx.fillStyle = "#64748b";
  ctx.font = "10px Arial";
  ctx.fillText(`K${channel}`, x + 44, y + 48);
}

function getLoadColor(type) {
  if (type === "dim_light") return "#9333ea";
  if (type === "curtain_motor") return "#0ea5e9";
  return "#f59e0b";
}

function getLoadSymbol(type) {
  if (type === "dim_light") return "D";
  if (type === "curtain_motor") return "M";
  return "L";
}

function drawLoadCables(ctx, panel) {
  const loads = getAllConnectedDevices(panel);

  loads.forEach((item, index) => {
    const deviceBox = getDeviceDrawBox(item.actuator, item.rail);
    const loadPos = getLoadPosition(panel, index);

    const fromX = deviceBox.x + deviceBox.w / 2;
    const fromY = deviceBox.y + deviceBox.h;
    const toX = loadPos.x + 46;
    const toY = loadPos.y;

    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 1.8;
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(fromX, fromY + 24);
    ctx.lineTo(toX, fromY + 24);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.fillStyle = "#111827";
    ctx.font = "10px Arial";
    ctx.fillText(`CH${item.connection.channel}`, toX + 5, toY - 6);
  });
}

function drawBusCable(ctx, panel) {
  const busDevices = [];

  panel.rails.forEach((rail) => {
    rail.modules.forEach((device) => {
      if (["power_supply", "interface", "actuator", "dimmer", "curtain_actuator"].includes(device.type)) {
        busDevices.push({ device, rail });
      }
    });
  });

  if (busDevices.length < 2) return;

  ctx.strokeStyle = "#dc2626";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();

  busDevices.forEach((item, index) => {
    const box = getDeviceDrawBox(item.device, item.rail);
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h + 12;

    if (index === 0) ctx.moveTo(cx, cy);
    else ctx.lineTo(cx, cy);
  });

  ctx.stroke();
  ctx.setLineDash([]);
}

function roundRect(ctx, x, y, w, h, r, fill, stroke, lineWidth = 1) {
  const radius = Math.min(r, w / 2, h / 2);

  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();

  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }

  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 2) {
  const words = String(text || "").split(" ");
  let line = "";
  let lines = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";

    if (ctx.measureText(testLine).width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, y);
      line = words[n] + " ";
      y += lineHeight;
      lines++;

      if (lines >= maxLines - 1) break;
    } else {
      line = testLine;
    }
  }

  ctx.fillText(line.trim(), x, y);
}
