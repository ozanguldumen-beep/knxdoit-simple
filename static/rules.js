export function validateDevice(device) {
  if (!device) return { ok: false, message: 'Cihaz bulunamadı.' };
  if (!device.name) return { ok: false, message: 'Cihaz adı eksik.' };
  if (!device.moduleWidth || device.moduleWidth <= 0) return { ok: false, message: 'Modül genişliği hatalı.' };
  return { ok: true, message: 'Cihaz uygun.' };
}

export function validatePanel(panel) {
  const errors = [];
  panel.rails.forEach((rail) => {
    const used = rail.modules.reduce((total, item) => total + (item.moduleWidth || 2), 0);
    if (used > rail.slots) errors.push(`${rail.name} kapasitesi aşıldı.`);
  });
  return { ok: errors.length === 0, errors };
}
