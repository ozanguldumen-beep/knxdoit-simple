export function drawPanel(canvas, panel) {
  const ctx = canvas.getContext("2d");
  canvas.width = panel.width;
  canvas.height = panel.height;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#1f2937";
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 20, panel.width - 40, panel.height - 40);

  ctx.fillStyle = "#111827";
  ctx.font = "bold 18px Arial";
  ctx.fillText("KNX Pano Yerleşimi", 40, 55);

  panel.rails.forEach((rail) => {
    drawRail(ctx, rail);
    rail.modules.forEach((device) => drawDevice(ctx, device));
  });
}

function drawRail(ctx, rail) {
  ctx.fillStyle = "#d1d5db";
  ctx.fillRect(rail.x, rail.y, rail.width, rail.height);
  ctx.strokeStyle = "#6b7280";
  ctx.lineWidth = 1;
  ctx.strokeRect(rail.x, rail.y, rail.width, rail.height);

  for (let x = rail.x; x < rail.x + rail.width; x += 18) {
    ctx.strokeStyle = "#9ca3af";
    ctx.beginPath();
    ctx.moveTo(x, rail.y);
    ctx.lineTo(x, rail.y + rail.height);
    ctx.stroke();
  }

  ctx.fillStyle = "#374151";
  ctx.font = "12px Arial";
  ctx.fillText(rail.name, rail.x, rail.y + rail.height + 18);
}

function drawDevice(ctx, device) {
  ctx.fillStyle = device.color || "#111827";
  roundRect(ctx, device.x, device.y, device.width, device.height, 6, true, false);

  ctx.strokeStyle = "#111827";
  ctx.lineWidth = 1.5;
  roundRect(ctx, device.x, device.y, device.width, device.height, 6, false, true);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 11px Arial";
  wrapText(ctx, device.name, device.x + 6, device.y + 18, device.width - 12, 13);

  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "10px Arial";
  ctx.fillText(`${device.moduleWidth}M`, device.x + 6, device.y + device.height - 8);

  drawTerminals(ctx, device);
}

function drawTerminals(ctx, device) {
  const terminalCount = Math.min(device.moduleWidth, 10);
  const gap = device.width / (terminalCount + 1);
  for (let i = 1; i <= terminalCount; i++) {
    ctx.fillStyle = "#f9fafb";
    ctx.beginPath();
    ctx.arc(device.x + gap * i, device.y + device.height - 24, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  for (const word of words) {
    const testLine = line + word + " ";
    if (ctx.measureText(testLine).width > maxWidth && line.length > 0) {
      ctx.fillText(line, x, y);
      line = word + " ";
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
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
  if (stroke) ctx.stroke();
}
