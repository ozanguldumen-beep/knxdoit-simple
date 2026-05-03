// static/pdf.js

import { getAllPanelDevices, getAllConnections } from "./panel.js";

export async function downloadPdf(panel, canvas) {
  const devices = getAllPanelDevices(panel).map((device) => ({
    name: device.name,
    moduleWidth: device.moduleWidth,
    channels: device.channels || 1,
    type: device.type
  }));

  const connections = getAllConnections(panel);
  const groupAddresses = await createGroupAddresses(devices);
  const imageDataUrl = canvas ? canvas.toDataURL("image/png") : null;

  const response = await fetch("/api/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ devices, connections, groupAddresses, imageDataUrl })
  });

  if (!response.ok) throw new Error("PDF oluşturulamadı.");

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "knxdoit-pano-raporu.pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

async function createGroupAddresses(devices) {
  try {
    const response = await fetch("/api/group-addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ devices })
    });

    if (!response.ok) return [];
    const data = await response.json();
    return data.addresses || [];
  } catch (error) {
    console.error("Grup adresleri alınamadı:", error);
    return [];
  }
}
