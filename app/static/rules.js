// static/rules.js
// Geriye uyumluluk için ana kural fonksiyonlarını merkezi rules_engine dosyasından dışa aktarır.
export {
  RULE_IDS,
  DEVICE_RULES,
  isPanelDevice,
  isLoadDevice,
  isFieldKnxDevice,
  getMaxChannels,
  getUsedChannels,
  getNextAvailableChannel,
  canConnectDevice,
  connectDevice,
  collectConnections,
  validatePanel
} from "./rules_engine.js";
