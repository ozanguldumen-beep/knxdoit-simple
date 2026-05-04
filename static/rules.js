export function validateProject(state){
  const warnings = [];
  state.floors.forEach((floor)=>{
    if(!floor.panelProducts.some(p=>p.category==="power_supply")) warnings.push(`${floor.name}: Power Supply yok.`);
    const knxCount = floor.rooms.flatMap(r=>r.devices).filter(d=>!d.energy).reduce((a,d)=>a+d.count,0);
    if(knxCount > 64) warnings.push(`${floor.name}: KNX hattında 64 cihaz sınırı aşıldı.`);
  });
  return warnings;
}

export function connectionTargetFor(deviceType){
  if(deviceType==="dim") return "dimmer";
  if(deviceType==="curtain") return "curtain_actuator";
  if(deviceType==="light" || deviceType==="valve") return "relay";
  return null;
}
