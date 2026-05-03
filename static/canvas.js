export function drawPanel(canvas, panel) {
  const ctx = canvas.getContext("2d");
  canvas.width = panel.width;
  canvas.height = panel.height;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground(ctx, panel);
  drawRails(ctx, panel);
  drawDevices(ctx, panel);
}

function drawBackground(ctx, panel) {
  ctx.fillStyle = "#e5e7eb";
  ctx.fillRect(0, 0, panel.width, panel.height);

  ctx.fillStyle = "#f8fafc";
  roundRect(ctx, 28, 28, panel.width - 56, panel.height - 56, 18, true, true);

  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 22px Arial";
  ctx.fillText(panel.name, 50, 62);

  ctx.fillStyle = "#64748b";
  ctx.font = "13px Arial";
  ctx.fillText("DIN ray yerleşimi / KNX pano ön görünüm", 50, 82);
}

function drawRails(ctx, panel) {
  panel.rails.forEach(rail => {
    ctx.fillStyle = "#cbd5e1";
    roundRect(ctx, rail.x - 6, rail.y - 6, rail.width + 12, rail.height + 12, 8, true, false);

    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(rail.x, rail.y, rail.width, rail.height);

    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 1;
    for (let x = rail.x + 12; x < rail.x + rail.width; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, rail.y + 3);
      ctx.lineTo(x, rail.y + rail.height - 3);
      ctx.stroke();
    }

    ctx.fillStyle = "#334155";
    ctx.font = "bold 12px Arial";
    ctx.fillText(rail.name, rail.x, rail.y + rail.height + 24);
  });
}

function drawDevices(ctx, panel) {
  panel.rails.forEach(rail => {
    rail.modules.forEach(device => {
      ctx.fillStyle = device.color || "#111827";
      roundRect(ctx, device.x, device.y, device.width, device.height, 8, true, true);

      ctx.fillStyle = "rgba(255,255,255,0.16)";
      ctx.fillRect(device.x + 6, device.y + 8, device.width - 12, 18);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10px Arial";
      wrapText(ctx, device.name, device.x + 7, device.y + 20, device.width - 14, 12);

      ctx.fillStyle = "#e2e8f0";
      ctx.font = "9px Arial";
      ctx.fillText(`${device.moduleWidth}M`, device.x + 7, device.y + device.height - 10);

      drawTerminals(ctx, device);
    });
  });
}

function drawTerminals(ctx, device) {
  const terminals = Object.values(device.terminals || {}).flat();
  const max = Math.min(terminals.length, 8);
  const gap = device.width / (max + 1);

  for (let i = 0; i < max; i++) {
    const x = device.x + gap * (i + 1);
    const y = device.y + device.height - 27;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let lineCount = 0;
  for (const word of words) {
    const test = line + word + " ";
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line.trim(), x, y + lineCount * lineHeight);
      line = word + " ";
      lineCount++;
      if (lineCount > 1) break;
    } else {
      line = test;
    }
  }
  if (lineCount <= 1) ctx.fillText(line.trim(), x, y + lineCount * lineHeight);
}

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) {
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}
