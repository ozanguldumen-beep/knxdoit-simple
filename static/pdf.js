export async function downloadPdf(payload) {
  const response = await fetch("/api/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) throw new Error("PDF oluşturulamadı");

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "knxdoit-v12.pdf";
  link.click();
  URL.revokeObjectURL(url);
}
