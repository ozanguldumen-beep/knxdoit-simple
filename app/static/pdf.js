import { collectConnections } from "./rules.js";
import { flattenPanelDevices } from "./panel.js";

export function collectProjectData(panel) {
  return {
    project_name: window.KNXDOIT_PROJECT_NAME || "KNXdoit Projesi",
    ets_version: document.getElementById("etsVersion")?.value || "ETS6",
    devices: flattenPanelDevices(panel).map((d) => ({
      name: d.name,
      type: d.type,
      moduleWidth: d.moduleWidth,
      channels: d.channels || 1
    })),
    fieldDevices: (panel.fieldDevices || []).map((d) => ({ name: d.name, type: d.type, channels: d.channels || 1 })),
    connections: collectConnections(panel)
  };
}

export async function downloadPdf(panel) {
  const response = await fetch("/api/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(collectProjectData(panel))
  });
  if (!response.ok) throw new Error("PDF oluşturulamadı.");
  await downloadBlob(response, "knxdoit_elektrikci.pdf");
}

export async function downloadKnx(panel) {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(collectProjectData(panel))
  });
  if (!response.ok) throw new Error(".knxproj oluşturulamadı.");
  await downloadBlob(response, "KNXdoit_Projesi.knxproj");
}

export async function saveProject(panel) {
  const response = await fetch("/api/save-project", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(collectProjectData(panel))
  });
  if (!response.ok) throw new Error("Proje kaydedilemedi.");
  return response.json();
}

async function downloadBlob(response, filename) {
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
