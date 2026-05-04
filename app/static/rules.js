export const KNX_RULES = [
  "Power Supply yoksa proje geçersiz.",
  "Tek röle kanalına tek yük bağlanır.",
  "Dim lamba sadece dimmer aktüatörüne bağlanır.",
  "Perde motoru sadece perde/jalüzi aktüatörüne bağlanır ve 2 kanal mantığıyla düşünülür.",
  "Termostat ve KNX anahtarlar yük sürmez; bus üzerinden kontrol eder.",
  "Kollektör kendi kat panosuna bağlanmalıdır.",
  "Bir KNX hattında 64 cihaz sınırı kontrol edilmelidir."
];

export function validateProject(state) {
  const warnings = [];
  state.floors.forEach((floor) => {
    const products = floor.panel.products || [];
    const hasPsu = products.some((p) => p.category === "power_supply");
    if (!hasPsu) warnings.push(`${floor.name}: Power Supply yok.`);
    const knxCount = floor.rooms.reduce((a, r) => a + r.devices.filter((d) => !d.energy).length, 0) + products.length;
    if (knxCount > 64) warnings.push(`${floor.name}: KNX hattında 64 cihaz sınırı aşıldı.`);
  });
  return warnings;
}

export function canConnect(product, device) {
  if (!product || !device) return { ok: false, message: "Kaynak veya hedef eksik." };
  if (product.category !== "actuator") return { ok: false, message: `${product.name} yük bağlamak için aktüatör değil.` };
  if (device.type === "light_load" && product.channel_type !== "switch") return { ok: false, message: "Lamba yükü switch aktüatöre bağlanmalıdır." };
  if (device.type === "dim_light" && product.channel_type !== "dimmer") return { ok: false, message: "Dim lamba sadece dimmer aktüatörüne bağlanır." };
  if (device.type === "curtain_motor" && product.channel_type !== "blind") return { ok: false, message: "Perde motoru sadece perde/jalüzi aktüatörüne bağlanır." };
  if (["thermostat", "knx_switch", "sensor"].includes(device.type)) return { ok: false, message: `${device.name} yük sürmez; KNX bus'a bağlanır.` };
  return { ok: true, message: "Bağlantı uygun." };
}

export function autoConnectLoads(floor) {
  const products = floor.panel.products || [];
  const loads = floor.rooms.flatMap((room) => room.devices.map((d) => ({ ...d, roomName: room.name, roomId: room.id })));
  floor.collectors.forEach((c) => loads.push({ ...c, roomName: "Kollektör", roomId: null }));

  products.forEach((p) => {
    p.channelsData = p.channelsData || Array.from({ length: p.channels || 1 }, (_, i) => ({ no: i + 1, conn: null, blocked: false }));
  });

  for (const load of loads.filter((d) => d.energy)) {
    if (products.some((p) => (p.channelsData || []).some((ch) => ch.conn?.deviceId === load.id))) continue;
    for (const product of products) {
      const rule = canConnect(product, load);
      if (!rule.ok) continue;
      const ch = product.channelsData.find((c) => !c.conn && !c.blocked);
      if (!ch) continue;
      ch.conn = { deviceId: load.id, deviceName: load.name, deviceType: load.type, roomName: load.roomName };
      if (load.type === "curtain_motor") {
        const next = product.channelsData[ch.no];
        if (next && !next.conn) next.blocked = true;
      }
      break;
    }
  }
}
