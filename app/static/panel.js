import { uid } from "./state.js";

export const PANEL_CONFIG = {
  width: 1180,
  height: 900,
  padding: 54,
  railStartX: 420,
  railStartY: 100,
  railSlots: 48,
  moduleUnit: 17,
  railGap: 145,
  railHeight: 28,
  deviceHeight: 78
};

export function addPanelProduct(floor, product) {
  const p = {
    ...product,
    id: uid(product.id || "product"),
    baseId: product.id,
    moduleWidth: product.din_width || product.moduleWidth || 2,
    channelsData: Array.from({ length: product.channels || 1 }, (_, i) => ({ no: i + 1, conn: null, blocked: false }))
  };
  floor.panel.products.push(p);
  autoPlaceProducts(floor);
  return p;
}

export function clearPanel(floor) {
  floor.panel.products = [];
}

export function autoPlaceProducts(floor) {
  let railIndex = 0;
  let slot = 0;
  floor.panel.products.forEach((p) => {
    const w = p.moduleWidth || p.din_width || 2;
    if (slot + w > PANEL_CONFIG.railSlots) {
      railIndex += 1;
      slot = 0;
    }
    p.railIndex = railIndex;
    p.slot = slot;
    p.moduleWidth = w;
    slot += w;
  });
}
