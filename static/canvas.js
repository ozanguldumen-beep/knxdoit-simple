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
  roundRect(
    ctx,
    25,
    25,
    panel.width - 50,
    panel.height - 50,
    22,
    "#ffffff",
    "#94a3b8",
    2
  );

  ctx.fillStyle = "#0f172a";
  ctx.font = "700 24px Arial";
  ctx.fillText("KNX Pano", 55, 70);

  ctx.fillStyle = "#64748b";
  ctx.font = "13px Arial";
  ctx.fillText("Ön görünüm / DIN ray yerleşimi", 55, 92);
}

function drawRails(ctx, panel) {
  panel.rails.forEach((rail) => {
    drawDinRail(ctx, rail);
    drawRailLabel(ctx, rail);
  });
}

function drawDinRail(ctx, rail) {
  roundRect(
    ctx,
    rail.x - 8,
    rail.y - 5,
    rail.width + 16,
    rail.height + 10,
    6,
    "#cbd5e1",
    "#dbeafe",
    4
  );

  roundRect(
    ctx,
    rail.x,
    rail.y,
    rail.width,
    rail.height,
    3,
    "#94a3b8",
    "#94a3b8",
    1
  );

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
  ctx.font = "700 14px Arial";
  ctx.fillText(rail.name, rail.x, rail.y + rail.height + 28);
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
  const h = 72;

  const slot =
    device.slot ??
    device.startSlot ??
    device.start ??
    0;

  const x = rail.x + slot * PANEL_CONFIG.moduleUnit + 2;

  /*
    ÖNEMLİ DÜZELTME:
    Cihaz artık panel başlığına göre değil,
    ait olduğu DIN rayına göre çiziliyor.
    Böylece cihaz başlığın üzerine binmez.
  */
  const y = rail.y - h - 14;

  return { x, y, w, h };
}

function drawDevice(ctx, device, rail) {
  const box = getDeviceDrawBox(device, rail);

  const x = box.x;
  const y = box.y;
  const w = box.w;
  const h = box.h;

  roundRect(
    ctx,
    x,
    y,
    w,
    h,
    7,
    device.color || "#2563eb",
    "#1e293b",
    1
  );

  ctx.fillStyle = "rgba(255,255,255,0.13)";
  ctx.fillRect(x + 4, y + 5, Math.max(0, w - 8), 20);

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 11px Arial";
  wrapText(ctx, device.name, x + 7, y + 17, w - 14, 12, 2);

  ctx.font = "700 10px Arial";
  ctx.fillText(`${device.moduleWidth || 2}M`, x + 7, y + h - 8);

  drawTerminals(ctx, x, y, w, h, device);
}

function drawTerminals(ctx, x, y, w, h, device) {
  const count = Math.min(
    10,
    Math.max(
      2,
      device.terminals?.outputs?.length ||
        device.channels ||
        device.moduleWidth ||
        2
    )
  );

  const gap = w / (count + 1);

  ctx.fillStyle = "#ffffff";

  for (let i = 1; i <= count; i++) {
    ctx.beginPath();
    ctx.arc(x + gap * i, y + h - 28, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBusCable(ctx, panel) {
  const busDevices = [];

  panel.rails.forEach((rail) => {
    rail.modules.forEach((device) => {
      if (
        [
          "power_supply",
          "interface",
          "actuator",
          "dimmer",
          "curtain_actuator"
        ].includes(device.type)
      ) {
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
    const cy = box.y + box.h + 8;

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
