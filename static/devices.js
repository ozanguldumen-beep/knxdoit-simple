export const ROOM_DEVICES = [
  { id:"light", label:"Lamba Yükü", type:"light", energy:true, icon:"L" },
  { id:"dim", label:"Dim Lamba", type:"dim", energy:true, icon:"D" },
  { id:"curtain", label:"Perde Motoru", type:"curtain", energy:true, icon:"M" },
  { id:"valve", label:"Vana", type:"valve", energy:true, icon:"V" },
  { id:"thermostat", label:"Termostat", type:"thermostat", energy:false, icon:"T" },
  { id:"switch", label:"KNX Anahtar", type:"switch", energy:false, icon:"K" },
  { id:"sensor", label:"Sensör", type:"sensor", energy:false, icon:"S" }
];

export const PANEL_PRODUCTS = [
  { id:"psu640", name:"KNX Power Supply 640mA", category:"power_supply", moduleWidth:4, channels:1, color:"#2563eb" },
  { id:"ip-interface", name:"KNX IP Interface", category:"interface", moduleWidth:2, channels:1, color:"#7c3aed" },
  { id:"ip-router", name:"KNX IP Router", category:"router", moduleWidth:2, channels:1, color:"#334155" },
  { id:"relay8", name:"Switch Aktüatör 8 Kanal", category:"relay", moduleWidth:8, channels:8, color:"#16a34a" },
  { id:"relay12", name:"Switch Aktüatör 12 Kanal", category:"relay", moduleWidth:12, channels:12, color:"#16a34a" },
  { id:"relay24", name:"Switch Aktüatör 24 Kanal", category:"relay", moduleWidth:12, channels:24, color:"#159947" },
  { id:"dimmer4", name:"Dimmer Aktüatör 4 Kanal", category:"dimmer", moduleWidth:4, channels:4, color:"#f97316" },
  { id:"dimmer8", name:"Dimmer Aktüatör 8 Kanal", category:"dimmer", moduleWidth:6, channels:8, color:"#f97316" },
  { id:"curtain4", name:"Jalüzi/Perde Aktüatörü 4 Kanal", category:"curtain_actuator", moduleWidth:4, channels:4, color:"#0f766e" },
  { id:"curtain8", name:"Jalüzi/Perde Aktüatörü 8 Kanal", category:"curtain_actuator", moduleWidth:6, channels:8, color:"#0f766e" },
  { id:"binary4", name:"Binary Input 4 Kanal", category:"input", moduleWidth:2, channels:4, color:"#475569" },
  { id:"binary8", name:"Binary Input 8 Kanal", category:"input", moduleWidth:4, channels:8, color:"#475569" }
];
