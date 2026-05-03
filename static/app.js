const catalog = {
  knx_switch_1:{icon:"▣", name:"KNX Anahtar 1 Buton", kind:"knx", buttons:1},
  knx_switch_2:{icon:"▣", name:"KNX Anahtar 2 Buton", kind:"knx", buttons:2},
  knx_switch_4:{icon:"▣", name:"KNX Anahtar 4 Buton", kind:"knx", buttons:4},
  knx_switch_6:{icon:"▣", name:"KNX Anahtar 6 Buton", kind:"knx", buttons:6},
  knx_switch_8:{icon:"▣", name:"KNX Anahtar 8 Buton", kind:"knx", buttons:8},
  knx_thermostat:{icon:"🌡️", name:"KNX Termostat", kind:"knx"},
  knx_sensor:{icon:"◉", name:"KNX Sensör", kind:"knx"},
  ip_router:{icon:"🌐", name:"IP Router", kind:"knx"},
  power_supply:{icon:"⚡", name:"Power Supply", kind:"knx", required:true},
  knx_thermo_switch:{icon:"🌡️▣", name:"KNX Termostatlı Anahtar", kind:"knx", buttons:4},
  line_coupler:{icon:"🔗", name:"Line Coupler", kind:"knx"},
  binary_input:{icon:"🔘", name:"Universal Binary Input", kind:"knx"},
  aircon_gateway:{icon:"❄️", name:"KNX Klima Gateway", kind:"knx", directPower:true},
  switch_actuator_8:{icon:"🔌", name:"Switch Actuator 8 Çıkış", kind:"actuator", channelType:"switch", outputs:8, amp:10},
  switch_actuator_12:{icon:"🔌", name:"Switch Actuator 12 Çıkış", kind:"actuator", channelType:"switch", outputs:12, amp:10},
  switch_actuator_16:{icon:"🔌", name:"Switch Actuator 16 Çıkış", kind:"actuator", channelType:"switch", outputs:16, amp:10},
  switch_actuator_24:{icon:"🔌", name:"Switch Actuator 24 Çıkış", kind:"actuator", channelType:"switch", outputs:24, amp:10},
  dimmer_actuator_2:{icon:"🔆", name:"Dimmer Actuator 2 Kanal", kind:"actuator", channelType:"dimmer", outputs:2, amp:4},
  dimmer_actuator_4:{icon:"🔆", name:"Dimmer Actuator 4 Kanal", kind:"actuator", channelType:"dimmer", outputs:4, amp:4},
  dimmer_actuator_8:{icon:"🔆", name:"Dimmer Actuator 8 Kanal", kind:"actuator", channelType:"dimmer", outputs:8, amp:4},
  rgbw_actuator:{icon:"🌈", name:"RGBW Actuator 4 Kanal", kind:"actuator", channelType:"rgbw", outputs:4, amp:4},
  lamp:{icon:"💡", name:"Lamba", kind:"energy", load:1},
  dim_lamp:{icon:"🔆", name:"Dim Lamba", kind:"energy", load:1},
  blind:{icon:"↕️", name:"Perde/Panjur", kind:"energy", load:2, needsTwoOutputs:true},
  aircon_direct:{icon:"❄️", name:"Klima Direkt Besleme", kind:"direct", directPower:true},
  boiler:{icon:"🔥", name:"Kombi Kuru Kontak", kind:"dry", directPower:true},
  valve:{icon:"🚰", name:"Vana", kind:"energy", load:0.5},
  door:{icon:"🚪", name:"Kapı", kind:"energy", load:1},
  motor_valve:{icon:"⚙️", name:"Motorlu Vana", kind:"energy", load:1},
  onoff:{icon:"🔴", name:"ON/OFF Cihaz", kind:"energy", load:1},  dish  modem:{icon:"🌐", name:"Modem", kind:"direct", directPower:true},
  collector:{icon:"🔥", name:"Yerden Isıtma Kollektörü", kind:"collector"}
};

const groups = {
  knxProducts:["knx_switch_1","knx_switch_2","knx_switch_4","knx_switch_6","knx_switch_8","knx_thermostat","knx_sensor","ip_router","power_supply","knx_thermo_switch","line_coupler","binary_input","aircon_gateway"],
  actuatorProducts:["switch_actuator_8","switch_actuator_12","switch_actuator_16","switch_actuator_24","dimmer_actuator_2","dimmer_actuator_4","dimmer_actuator_8","rgbw_actuator"],
  energyProducts:["lamp","dim_lamp","blind","valve","collector","motor_valve","onoff","boiler","aircon_direct","modem"]
};

let state = {
  projectName:"Villa Projesi",
  activeFloor:0,
  floors:[{id:uid("floor"), name:"1. Kat", rooms:[]}],
  panels:[],
  collectors:[],
  wires:[],
  validation:[]
};
let selected = null;
let tool = null;
let zoom = 1;

function uid(p){ return p+"_"+Date.now()+"_"+Math.floor(Math.random()*9999); }

function renderProductMenus(){
  Object.entries(groups).forEach(([containerId, keys])=>{
    const el=document.getElementById(containerId);
    el.innerHTML="";
    keys.forEach(type=>{
      const meta=catalog[type];
      const row=document.createElement("div");
      row.className="product-row";
      row.innerHTML=`
        <div class="name">${meta.icon} ${meta.name}</div>
        <button class="add-btn" onclick="addDevice('${type}')">Ekle</button>
      `;
      el.appendChild(row);
    });
  });
}

function toggleRightbar(){
  document.getElementById("appRoot").classList.toggle("right-hidden");
  setTimeout(drawWires, 50);
}

function zoomIn(){
  zoom = Math.min(1.6, +(zoom + 0.1).toFixed(2));
  applyZoom();
}
function zoomOut(){
  zoom = Math.max(0.5, +(zoom - 0.1).toFixed(2));
  applyZoom();
}
function applyZoom(){
  document.getElementById("zoomLayer").style.transform = `scale(${zoom})`;
  document.getElementById("zoomLabel").innerText = Math.round(zoom*100)+"%";
  drawWires();
}

function showTab(name, ev){
  document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach(p=>p.classList.remove("active"));
  if(ev) ev.target.classList.add("active");
  else {
    const order = ["projects","ga","bom","wires","validation"];
    const idx = order.indexOf(name);
    if(idx >= 0) document.querySelectorAll(".tab")[idx].classList.add("active");
  }
  document.getElementById("tab-"+name).classList.add("active");
}

function updateProjectName(){
  state.projectName = document.getElementById("projectName").value || "KNXdoit Projesi";
  document.getElementById("titleProject").innerText = state.projectName;
  markDirty();
}

function addFloor(){
  const name = prompt("Kat adı:", (state.floors.length+1)+". Kat");
  if(!name) return;
  state.floors.push({id:uid("floor"), name, rooms:[]});
  state.activeFloor = state.floors.length-1;
  render();
}

function setFloor(i){ state.activeFloor=i; render(); }

function addRoom(){
  const floor = state.floors[state.activeFloor];
  const name = prompt("Oda adı:", "Salon");
  if(!name) return;
  const n = floor.rooms.length;
  floor.rooms.push({id:uid("room"), name, x:80+(n%2)*820, y:90+Math.floor(n/2)*260, devices:[]});
  render(); markDirty();
}

function createChannels(meta){
  const channels = [];
  const outputs = meta.outputs || 0;
  for(let i=1;i<=outputs;i++){
    channels.push({id:uid("ch"), no:i, label:"K"+i, used:false, locked:false, usedBy:null, direction:null});
  }
  return channels;
}

function addCollector(count=2){
  const n = state.collectors.length;
  const c = prompt("Kollektör kaç vanalı olsun?", String(count || 4));
  const valveCount = Math.max(1, parseInt(c || "4"));
  const devices = [];
  for(let i=1;i<=valveCount;i++){
    devices.push({id:uid("dev"), type:"valve", name:"Kollektör Vana "+i, kind:"energy"});
  }
  state.collectors.push({id:uid("collector"), name:"Yerden Isıtma Kollektörü ("+valveCount+" vana)", x:760, y:360+n*190, devices});
  render(); markDirty();
}

function addDevice(type){
  const meta = catalog[type];
  if(!meta) return;

  if(meta.kind==="collector"){
    addCollector(4);
    return;
  }

  const device = {
    id:uid("dev"),
    type,
    name:meta.name,
    kind:meta.kind,
    channelType:meta.channelType || null,
    outputs:meta.outputs || 0,
    amp:meta.amp || null,
    buttons:meta.buttons || 0,
    channels:createChannels(meta)
  };

  if(meta.kind==="actuator" || ["ip_router","power_supply","line_coupler"].includes(type)){
    if(!state.panels.length){
      state.panels.push({id:uid("panel"), name:"Ana Pano", x:520, y:350, devices:[]});
    }
    state.panels[0].devices.push(device);
  } else {
    const floor = state.floors[state.activeFloor];
    if(!floor.rooms.length){ alert("Önce oda eklemelisin."); return; }
    floor.rooms[floor.rooms.length-1].devices.push(device);
  }
  render(); markDirty();
}

function setTool(t){
  tool=t; selected=null;
  document.querySelectorAll("button").forEach(b=>b.classList.remove("active"));
  const btn=document.getElementById(t==="energy"?"btn-energy":t==="knx"?"btn-knx":"btn-delete");
  if(btn) btn.classList.add("active");
}

function allDevices(){
  const arr=[];
  state.floors.forEach(f=>f.rooms.forEach(r=>r.devices.forEach(d=>arr.push({...d, location:r.name}))));
  state.panels.forEach(p=>p.devices.forEach(d=>arr.push({...d, location:p.name})));
  state.collectors.forEach(c=>c.devices.forEach(d=>arr.push({...d, location:c.name})));
  return arr;
}

function getDeviceById(id){
  return allDevices().find(d=>d.id===id);
}

function render(){
  document.getElementById("projectName").value=state.projectName;
  document.getElementById("titleProject").innerText=state.projectName;

  const tabs=document.getElementById("floorTabs");
  tabs.innerHTML="";
  state.floors.forEach((f,i)=>{
    const b=document.createElement("button");
    b.className="floor-tab"+(i===state.activeFloor?" active":"");
    b.innerText=f.name;
    b.onclick=()=>setFloor(i);
    tabs.appendChild(b);
  });

  const layer=document.getElementById("zoomLayer");
  layer.querySelectorAll(".box,.bus-bar,.bus-label").forEach(x=>x.remove());

  const floor=state.floors[state.activeFloor];
  floor.rooms.forEach(room=>renderBox(layer, room, "room"));
  state.panels.forEach(panel=>renderBox(layer, panel, "panel"));
  state.collectors.forEach(c=>renderBox(layer, c, "collector"));

  drawBus(layer);
  drawWires();
  updateBom();
  updateWireList();
  updateValidationUI(false);
}

function renderBox(layer, obj, cls){
  const box=document.createElement("div");
  box.className="box "+cls;
  box.style.left=obj.x+"px"; box.style.top=obj.y+"px";
  box.dataset.id=obj.id;
  box.innerHTML=`<div class="box-title">${obj.name}</div><div class="device-wrap"></div>`;
  const wrap=box.querySelector(".device-wrap");

  obj.devices.forEach(dev=>{
    const meta=catalog[dev.type] || {icon:"⚙️", name:dev.name, kind:dev.kind};
    if(dev.kind==="actuator"){
      const m=document.createElement("div");
      m.className="module-card";
      m.dataset.deviceId=dev.id;
      m.innerHTML=`
        <div class="module-title">${meta.icon} ${dev.name}</div>
        <div class="module-meta">${dev.outputs} çıkış / ${dev.amp || "-"}A</div>
        <div class="knx-port" data-device-id="${dev.id}">KNX</div>
        <div class="channel-grid"></div>
      `;
      const port=m.querySelector(".knx-port");
      port.onclick=(e)=>{
        e.stopPropagation();
        if(tool==="delete"){ deleteDevice(dev.id); return; }
        clickItem({kind:"knxport", id:dev.id, type:dev.type, label:obj.name+" - "+dev.name+" KNX"}, port);
      };
      const grid=m.querySelector(".channel-grid");
      dev.channels.forEach(ch=>{
        const c=document.createElement("div");
        c.className="channel"+(ch.used?" used":"")+(ch.locked?" locked":"");
        c.dataset.channelId=ch.id;
        c.dataset.deviceId=dev.id;
        c.innerHTML=`<b>${ch.label}${ch.direction ? " "+ch.direction : ""}</b><br><small>${ch.usedBy ? shortName(ch.usedBy) : "Boş"}</small>`;
        c.onclick=(e)=>{
          e.stopPropagation();
          if(tool==="delete"){ clearChannel(dev.id, ch.id); return; }
          if(ch.locked){ alert("Bu kanal Perde/Panjur DOWN için otomatik kilitli."); return; }
          clickItem({kind:"channel", id:ch.id, deviceId:dev.id, type:dev.type, channelType:dev.channelType, label:obj.name+" - "+dev.name+" "+ch.label, channelNo:ch.no}, c);
        };
        grid.appendChild(c);
      });
      wrap.appendChild(m);
    } else {
      const d=document.createElement("div");
      d.className="device";
      const relatedWarnings = (state.validation||[]).filter(v=>v.deviceId===dev.id);
      if(relatedWarnings.some(v=>v.level==="error")) d.classList.add("error");
      else if(relatedWarnings.length) d.classList.add("warn");
      d.dataset.deviceId=dev.id;
      d.innerHTML=`<div class="device-icon">${meta.icon}</div><div>${dev.name}</div>`;

      if(dev.buttons){
        const bg=document.createElement("div");
        bg.className="button-grid";
        for(let i=1;i<=dev.buttons;i++){
          const bc=document.createElement("div");
          bc.className="button-cell";
          bc.innerHTML=`B${i}`;
          bc.onclick=(e)=>{
            e.stopPropagation();
            if(tool==="delete"){ deleteDevice(dev.id); return; }
            clickItem({kind:"button", id:uid("btnref"), deviceId:dev.id, type:dev.type, label:obj.name+" - "+dev.name+" Buton "+i}, bc);
          };
          bg.appendChild(bc);
        }
        d.appendChild(bg);
      }

      d.onclick=(e)=>{
        e.stopPropagation();
        if(tool==="delete"){ deleteDevice(dev.id); return; }
        clickItem({kind:"device", id:dev.id, type:dev.type, label:obj.name+" - "+dev.name}, d);
      };
      d.oncontextmenu=(e)=>{ e.preventDefault(); e.stopPropagation(); deleteDevice(dev.id); };
      wrap.appendChild(d);
    }
  });

  box.onclick=(e)=>{
    e.stopPropagation();
    if(tool==="delete"){ deleteBox(obj.id, cls); return; }
    clickItem({kind:"box", id:obj.id, type:cls, label:obj.name}, box);
  };

  makeDraggable(box,obj);
  layer.appendChild(box);
}

function shortName(s){ return (s||"").split(" - ").pop().slice(0,14); }

function clickItem(item, el){
  if(!tool){ alert("Önce Enerji / KNX / Silme modu seç."); return; }
  if(tool==="delete") return;
  if(!selected){
    selected={item,el};
    el.classList.add("selected");
    return;
  }
  if(!allowed(selected.item,item,tool)){
    clearSel();
    return;
  }
  createConnection(selected.item, item, tool);
  clearSel(); render(); markDirty();
}

function createConnection(a,b,t){
  const wire={
    id:uid("wire"),
    type:t,
    from:a,
    to:b,
    fromLabel:a.label,
    toLabel:b.label,
    label:t==="knx"?"KNX BUS T":"220V"
  };

  if(t==="energy"){
    const loadItem = isLoad(a.type) ? a : b;
    const channelItem = a.kind==="channel" ? a : b;
    if(loadItem.type==="blind"){
      wire.label="UP";
      state.wires.push(wire);
      markChannelUsed(channelItem, loadItem, "UP", false);
      const down = getNextChannelItem(channelItem);
      if(down){
        const downWire={...wire, id:uid("wire"), from:down, to:loadItem, fromLabel:down.label, label:"DOWN", autoDown:true};
        state.wires.push(downWire);
        markChannelUsed(down, loadItem, "DOWN", true);
      }
      return;
    }
    markChannelUsed(channelItem, loadItem, null, false);
  }
  state.wires.push(wire);
}

function markChannelUsed(channelItem, loadItem, direction, locked){
  const dev=getRealDevice(channelItem.deviceId);
  if(!dev) return;
  const ch=dev.channels.find(c=>c.id===channelItem.id);
  if(!ch) return;
  ch.used=true;
  ch.usedBy=loadItem.label;
  ch.direction=direction;
  ch.locked=locked;
}

function getNextChannelItem(channelItem){
  const dev=getRealDevice(channelItem.deviceId);
  if(!dev) return null;
  const idx=dev.channels.findIndex(c=>c.id===channelItem.id);
  const next=dev.channels[idx+1];
  if(!next || next.used || next.locked) return null;
  return {kind:"channel", id:next.id, deviceId:dev.id, type:dev.type, channelType:dev.channelType, label:dev.name+" "+next.label, channelNo:next.no};
}

function getRealDevice(id){
  for(const p of state.panels){
    const d=p.devices.find(x=>x.id===id);
    if(d) return d;
  }
  for(const f of state.floors){
    for(const r of f.rooms){
      const d=r.devices.find(x=>x.id===id);
      if(d) return d;
    }
  }
  for(const c of state.collectors){
    const d=c.devices.find(x=>x.id===id);
    if(d) return d;
  }
  return null;
}

function isLoad(t){
  return ["lamp","dim_lamp","blind","valve","door","motor_valve","onoff"].includes(t);
}
function isDirectPowered(t){
  return ["aircon_direct","boiler","modem","aircon_gateway"].includes(t);
}
function isKnxOnly(t){
  const meta=catalog[t];
  return meta && meta.kind==="knx";
}
function isActuator(t){
  const meta=catalog[t];
  return meta && meta.kind==="actuator";
}
function hasEnergyConnection(deviceId){
  return state.wires.some(w => w.type === "energy" && ((w.from.deviceId===deviceId || w.to.deviceId===deviceId) || (w.from.id === deviceId || w.to.id === deviceId)));
}
function hasKnxConnection(deviceId){
  return state.wires.some(w => w.type === "knx" && (w.from.id === deviceId || w.to.id === deviceId || w.from.deviceId === deviceId || w.to.deviceId === deviceId));
}


function validateConnection(a,b,t){
  if(t==="knx"){
    if(isLoad(a.type)||isLoad(b.type)) return "KNX Bus enerji/yük hattına bağlanamaz.";
    if(isDirectPowered(a.type)||isDirectPowered(b.type)){
      if(a.type==="aircon_gateway" || b.type==="aircon_gateway") return true;
      return "Bu cihaz direkt panodan beslenir; KNX Bus ile kontrol edilmez.";
    }
    return true;
  }

  if(t==="energy"){
    const aLoad=isLoad(a.type), bLoad=isLoad(b.type);
    const aCh=a.kind==="channel", bCh=b.kind==="channel";
    const loadItem = aLoad ? a : (bLoad ? b : null);
    const chItem = aCh ? a : (bCh ? b : null);

    if(isDirectPowered(a.type)||isDirectPowered(b.type)){
      return "Klima, kombi, beyaz eşya ve modem gibi cihazların enerjisi direkt panodan gelir; KNX aktüatör üzerinden enerji bağlanmaz.";
    }
    if(aLoad && bLoad) return "Enerjili/yük cihazları birbirine bağlanamaz. Lamba lambaya bağlanmaz.";
    if(isKnxOnly(a.type) || isKnxOnly(b.type)) return "KNX cihazlar enerji hattına bağlanamaz.";
    if(!loadItem || !chItem) return "Enerji hattı yalnızca aktüatör röle kanalı ile küçük yük arasında çizilir.";

    const channelMeta=catalog[chItem.type];
    if(!channelMeta || channelMeta.kind!=="actuator") return "Enerji hattı için aktüatör kanalı seçmelisin.";

    if(loadItem.type==="dim_lamp" && chItem.channelType!=="dimmer") return "Dim lamba sadece Dimmer Actuator kanalına bağlanır.";
    if(loadItem.type==="blind" && chItem.channelType!=="switch") return "Perde/Panjur Switch Actuator kanalına bağlanır.";
    if(loadItem.type!=="dim_lamp" && loadItem.type!=="blind" && chItem.channelType!=="switch") return "Bu yük Switch Actuator kanalına bağlanmalı.";

    if(hasEnergyConnection(loadItem.id)) return "Bu yüke zaten bir röle/kablo bağlandı. İkinci enerji kablosu bağlanamaz.";

    if(loadItem.type==="blind"){
      const next=getNextChannelItem(chItem);
      if(!next) return "Perde/Panjur için yanındaki DOWN kanalı boş olmalı.";
    }
  }
  return true;
}

function allowed(a,b,t){
  const result = validateConnection(a,b,t);
  if(result !== true){
    alert(result);
    return false;
  }
  return true;
}


function clearSel(){
  selected=null;
  document.querySelectorAll(".selected").forEach(x=>x.classList.remove("selected"));
}

function drawBus(layer){
  const label=document.createElement("div");
  label.className="bus-label";
  label.innerText="KNX BUS HATTI";
  const bar=document.createElement("div");
  bar.className="bus-bar";
  layer.appendChild(label);
  layer.appendChild(bar);
}

function drawWires(){
  const svg=document.getElementById("wires");
  svg.innerHTML="";
  const layerRect=document.getElementById("zoomLayer").getBoundingClientRect();
  state.wires.forEach(w=>{
    const a=findElementForItem(w.from);
    const b=findElementForItem(w.to);
    if(!a||!b) return;
    const ar=a.getBoundingClientRect(), br=b.getBoundingClientRect();
    const x1=(ar.left+ar.width/2-layerRect.left)/zoom, y1=(ar.top+ar.height/2-layerRect.top)/zoom;
    const x2=(br.left+br.width/2-layerRect.left)/zoom, y2=(br.top+br.height/2-layerRect.top)/zoom;
    let el;
    if(w.type==="knx"){
      const busY=1120;
      el=document.createElementNS("http://www.w3.org/2000/svg","path");
      el.setAttribute("d",`M ${x1} ${y1} L ${x1} ${busY} L ${x2} ${busY} L ${x2} ${y2}`);
      el.setAttribute("class","knx-line");
      el.setAttribute("fill","none");
    } else {
      el=document.createElementNS("http://www.w3.org/2000/svg","line");
      el.setAttribute("x1",x1); el.setAttribute("y1",y1); el.setAttribute("x2",x2); el.setAttribute("y2",y2);
      el.setAttribute("class",w.autoDown?"auto-down-line":"energy-line");
    }
    el.onclick=()=>deleteWire(w.id);
    svg.appendChild(el);
    const txt=document.createElementNS("http://www.w3.org/2000/svg","text");
    txt.setAttribute("x",(x1+x2)/2+6); txt.setAttribute("y",(y1+y2)/2-6); txt.setAttribute("class","wire-label");
    txt.textContent=w.label;
    svg.appendChild(txt);
  });
}

function findElementForItem(item){
  if(item.kind==="channel") return document.querySelector(`[data-channel-id="${item.id}"]`);
  if(item.kind==="knxport") return document.querySelector(`.knx-port[data-device-id="${item.id}"]`);
  if(item.kind==="button") return document.querySelector(`[data-device-id="${item.deviceId}"]`);
  if(item.kind==="device") return document.querySelector(`[data-device-id="${item.id}"]`);
  return document.querySelector(`[data-id="${item.id}"]`);
}


function makeDraggable(el,obj){
  let dragging=false, startX=0, startY=0, startLeft=0, startTop=0;

  el.addEventListener("pointerdown", (e)=>{
    if(e.target.closest(".device") || e.target.closest(".channel") || e.target.closest(".knx-port") || e.target.closest(".button-cell")) return;
    dragging=true;
    el.setPointerCapture(e.pointerId);
    startX=e.clientX;
    startY=e.clientY;
    startLeft=obj.x;
    startTop=obj.y;
    e.preventDefault();
  });

  el.addEventListener("pointermove", (e)=>{
    if(!dragging) return;
    obj.x = startLeft + (e.clientX-startX)/zoom;
    obj.y = startTop + (e.clientY-startY)/zoom;
    el.style.left=obj.x+"px";
    el.style.top=obj.y+"px";
    drawWires();
  });

  el.addEventListener("pointerup", ()=>{
    if(dragging){
      dragging=false;
      markDirty();
    }
  });
}


function deleteWire(id){
  if(!confirm("Bu kablo silinsin mi?")) return;
  const w=state.wires.find(x=>x.id===id);
  state.wires=state.wires.filter(w=>w.id!==id);
  refreshChannels();
  render(); markDirty();
}

function refreshChannels(){
  state.panels.forEach(p=>p.devices.forEach(d=>{
    if(d.channels) d.channels.forEach(ch=>{ch.used=false; ch.locked=false; ch.usedBy=null; ch.direction=null;});
  }));
  const old=[...state.wires];
  state.wires=[];
  old.forEach(w=>{
    if(w.type==="energy"){
      const chItem = w.from.kind==="channel" ? w.from : w.to.kind==="channel" ? w.to : null;
      const loadItem = isLoad(w.from.type) ? w.from : isLoad(w.to.type) ? w.to : null;
      if(chItem && loadItem){
        markChannelUsed(chItem, loadItem, w.label==="UP"||w.label==="DOWN"?w.label:null, !!w.autoDown);
      }
    }
    state.wires.push(w);
  });
}

function clearChannel(deviceId, channelId){
  if(!confirm("Bu kanal bağlantısı temizlensin mi?")) return;
  state.wires=state.wires.filter(w => !([w.from,w.to].some(x=>x.id===channelId) || (w.autoDown && [w.from,w.to].some(x=>x.deviceId===deviceId))));
  refreshChannels();
  render(); markDirty();
}

function deleteDevice(id){
  if(!confirm("Bu ürün silinsin mi?")) return;
  state.floors.forEach(f=>f.rooms.forEach(r=>r.devices=r.devices.filter(d=>d.id!==id)));
  state.panels.forEach(p=>p.devices=p.devices.filter(d=>d.id!==id));
  state.collectors.forEach(c=>c.devices=c.devices.filter(d=>d.id!==id));
  state.wires=state.wires.filter(w=>![w.from,w.to].some(x=>x.id===id || x.deviceId===id));
  refreshChannels();
  render(); markDirty();
}

function deleteBox(id,cls){
  if(!confirm("Bu kutu silinsin mi?")) return;
  if(cls==="room") state.floors.forEach(f=>f.rooms=f.rooms.filter(r=>r.id!==id));
  if(cls==="panel") state.panels=state.panels.filter(p=>p.id!==id);
  if(cls==="collector") state.collectors=state.collectors.filter(c=>c.id!==id);
  state.wires=state.wires.filter(w=>w.from.id!==id && w.to.id!==id);
  refreshChannels();
  render(); markDirty();
}

function validateProject(){
  const issues=[];
  const devices = allDevices();
  const powerSupplyCount = devices.filter(d=>d.type==="power_supply").length;

  if(powerSupplyCount===0){
    issues.push({level:"error", message:"Power Supply yok. KNX sistemi Power Supply olmadan geçersizdir."});
  }

  devices.forEach(d=>{
    const meta=catalog[d.type];
    if(!meta) return;
    if((meta.kind==="knx" || meta.kind==="actuator") && d.type!=="power_supply"){
      if(!hasKnxConnection(d.id)){
        issues.push({level:"warn", deviceId:d.id, message:`${d.name} KNX Bus hattına bağlı değil. KNX ürünü bus olmadan çalışmaz.`});
      }
    }
    if(meta.kind==="energy" && !hasEnergyConnection(d.id)){
      issues.push({level:"warn", deviceId:d.id, message:`${d.name} henüz aktüatör kanalına bağlı değil.`});
    }
  });

  state.validation = issues;
  return issues;
}

function validateAndShow(){
  const issues = validateProject();
  updateValidationUI(true);
  showTab("validation");
  render();
}

function updateValidationUI(force){
  const issues = state.validation || [];
  const pill=document.getElementById("validationPill");
  const list=document.getElementById("validationList");
  if(!pill || !list) return;

  if(!force && issues.length===0){
    pill.className="validation-pill";
    pill.innerText="Kontrol bekliyor";
    return;
  }

  list.innerHTML="";
  if(issues.length===0){
    pill.className="validation-pill ok";
    pill.innerText="Proje uygun";
    list.innerHTML='<div class="validation-ok">Proje temel KNX kurallarına uygun görünüyor.</div>';
    return;
  }

  const hasError = issues.some(i=>i.level==="error");
  pill.className="validation-pill "+(hasError?"error":"warn");
  pill.innerText = hasError ? "Hata var" : "Uyarı var";

  issues.forEach(i=>{
    const div=document.createElement("div");
    div.className=i.level==="error"?"validation-error":"validation-warn";
    div.innerText=i.message;
    list.appendChild(div);
  });
}

async function generateGA(){
  const res=await fetch("/api/group-addresses",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(state)});
  const data=await res.json();
  const list=document.getElementById("gaList");
  list.innerHTML="";
  data.forEach(r=>{
    const div=document.createElement("div");
    div.className="row";
    div.innerHTML=`<b>${r.address}</b> <small>${r.physical}</small><br>${r.floor} / ${r.room}<br>${r.device} - ${r.function}`;
    list.appendChild(div);
  });
  showTab("ga");
}

function updateBom(){
  const bom={};
  state.floors.forEach(f=>f.rooms.forEach(r=>r.devices.forEach(d=>bom[d.name]=(bom[d.name]||0)+1)));
  state.panels.forEach(p=>p.devices.forEach(d=>bom[d.name]=(bom[d.name]||0)+1));
  state.collectors.forEach(c=>c.devices.forEach(d=>bom[d.name]=(bom[d.name]||0)+1));
  const list=document.getElementById("bomList");
  list.innerHTML="";
  Object.entries(bom).forEach(([k,v])=>{
    const div=document.createElement("div"); div.className="row"; div.innerHTML=`${k}: <b>${v}</b>`; list.appendChild(div);
  });
  if(!Object.keys(bom).length) list.innerHTML="Henüz ürün yok.";
}

function updateWireList(){
  const list=document.getElementById("wireList");
  list.innerHTML="";
  state.wires.forEach(w=>{
    const div=document.createElement("div"); div.className="row"; div.innerHTML=`<b>${w.type}</b> ${w.label}<br>${w.fromLabel} → ${w.toLabel}`;
    list.appendChild(div);
  });
  if(!state.wires.length) list.innerHTML="Henüz bağlantı yok.";
}

function saveProject(){
  updateProjectName();
  const all=JSON.parse(localStorage.getItem("knxdoit_projects")||"{}");
  all[state.projectName]=state;
  localStorage.setItem("knxdoit_projects",JSON.stringify(all));
  document.getElementById("status").innerText="Kaydedildi";
  showProjects();
}

function showProjects(){
  const all=JSON.parse(localStorage.getItem("knxdoit_projects")||"{}");
  const list=document.getElementById("projectList");
  list.innerHTML="";
  Object.keys(all).forEach(name=>{
    const div=document.createElement("div");
    div.className="row";
    div.innerHTML=`<b>${name}</b><br><button onclick="openProject('${name}')">Aç</button> <button onclick="deleteProject('${name}')">Sil</button>`;
    list.appendChild(div);
  });
  if(!Object.keys(all).length) list.innerHTML="Henüz kayıtlı proje yok.";
}

function openProject(name){
  const all=JSON.parse(localStorage.getItem("knxdoit_projects")||"{}");
  state=all[name];
  if(!state.collectors) state.collectors=[];
  if(!state.validation) state.validation=[];
  render();
  document.getElementById("status").innerText="Proje açıldı";
}

function deleteProject(name){
  const all=JSON.parse(localStorage.getItem("knxdoit_projects")||"{}");
  delete all[name];
  localStorage.setItem("knxdoit_projects",JSON.stringify(all));
  showProjects();
}

function clearCurrent(){
  if(!confirm("Ekran temizlensin mi?")) return;
  state={projectName:"Villa Projesi",activeFloor:0,floors:[{id:uid("floor"),name:"1. Kat",rooms:[]}],panels:[],collectors:[],wires:[],validation:[]};
  render();
}

function markDirty(){ document.getElementById("status").innerText="Kaydedilmedi"; }

async function downloadPdf(){
  updateProjectName();
  state.validation = validateProject();
  const res=await fetch("/api/pdf",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(state)});
  const blob=await res.blob();
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url; a.download="knxdoit_v10_releli_rapor.pdf"; a.click();
  URL.revokeObjectURL(url);
}

renderProductMenus();
render();
showProjects();
applyZoom();
