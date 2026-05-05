document.getElementById("ocrBtn")?.addEventListener("click", async () => {
  const fileInput = document.getElementById("receiptFile");
  const status = document.getElementById("ocrStatus");
  const file = fileInput.files[0];
  if (!file) return alert("Lütfen önce harcama belgesi seç.");
  const formData = new FormData();
  formData.append("receipt", file);
  try {
    status.textContent = "Google Vision + AI ile belge okunuyor...";
    document.getElementById("ocrBtn").disabled = true;
    const resp = await fetch("/api/ocr", { method: "POST", body: formData });
    const data = await resp.json();
    if (!resp.ok) { status.textContent = "OCR hata: " + (data.error || "Bilinmeyen hata"); alert(status.textContent); return; }
    setVal("merchant", data.unvan || data.merchant);
    setVal("document_date", data.tarih || data.date);
    setVal("receipt_no", data.fis_no || data.receipt_no);
    setVal("tax_base", data.matrah);
    setVal("vat_amount", data.kdv);
    setVal("total_amount", data.toplam || data.total);
    setVal("ocr_text", data.rawText || "");
    status.textContent = "Belge okundu ✅\nFirma Ünvanı: " + (data.unvan || data.merchant || "-") + "\nBelge Tarihi: " + (data.tarih || data.date || "-") + "\nBelge No: " + (data.fis_no || data.receipt_no || "-") + "\nMatrah: " + (data.matrah || "-") + "\nKDV: " + (data.kdv || "-") + "\nToplam: " + (data.toplam || data.total || "-") + "\n\nLütfen göndermeden önce alanları kontrol et.";
  } catch (err) { console.error(err); status.textContent = "OCR hata: " + err.message; alert("OCR hata: " + err.message); }
  finally { document.getElementById("ocrBtn").disabled = false; }
});
function setVal(id, value) { const el = document.getElementById(id); if (el && value !== undefined && value !== null && String(value).trim() !== "") el.value = value; }
