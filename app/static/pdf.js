export async function downloadPdf(state) {
  const data = collectExportData(state);
  const response = await fetch("/api/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error("PDF oluşturulamadı.");
  downloadBlob(await response.blob(), `${data.project_name}_elektrikci.pdf`);
}

export async function downloadKnxproj(state) {
  const data = collectExportData(state);
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error(".knxproj oluşturulamadı.");
  downloadBlob(await response.blob(), `${data.project_name}.knxproj`);
}

export async function previewGA(state) {
  const data = collectExportData(state);
  const response = await fetch("/api/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!response.ok) return { group_addresses: [], total: 0 };
  return response.json();
}

function collectExportData(state) {
  return {
    project_name: state.projectName || "KNXdoit Projesi",
    ets_version: document.getElementById("etsSelect")?.value || "ETS6",
    floors: state.floors.map((floor) => ({
      id: floor.id,
      name: floor.name,
      rooms: floor.rooms.map((room) => ({ id: room.id, name: room.name, devices: room.devices })),
      collectors: floor.collectors,
      panel: floor.panel
    }))
  };
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
