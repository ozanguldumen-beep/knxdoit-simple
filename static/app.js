const catalog = {
  knx_switch:{icon:"▣", name:"KNX Anahtar", kind:"knx"},
  knx_thermostat:{icon:"🌡️", name:"KNX Termostat", kind:"knx"},
  knx_sensor:{icon:"◉", name:"KNX Sensör", kind:"knx"},
  ip_router:{icon:"🌐", name:"IP Router", kind:"knx"},
  power_supply:{icon:"⚡", name:"Power Supply", kind:"knx"},
  knx_thermo_switch:{icon:"🌡️▣", name:"KNX Termostatlı Anahtar", kind:"knx"},
  line_coupler:{icon:"🔗", name:"Line Coupler", kind:"knx"},
  binary_input:{icon:"🔘", name:"Universal Binary Input", kind:"knx"},
  switch_actuator:{icon:"🔌", name:"Switch Actuator", kind:"actuator"},
  dimmer_actuator:{icon:"🔆", name:"Dimmer Actuator", kind:"actuator"},
  blind_actuator:{icon:"↕️", name:"Blind Actuator", kind:"actuator"},
  rgbw_actuator:{icon:"🌈", name:"RGBW Actuator", kind:"actuator"},
  lamp:{icon:"💡", name:"Lamba", kind:"energy"},
  dim_lamp:{icon:"🔆", name:"Dim Lamba", kind:"energy"},
  blind:{icon:"↕️", name:"Perde/Panjur", kind:"energy"},
  aircon:{icon:"❄️", name:"Klima", kind:"energy"},
  boiler:{icon:"🔥", name:"Kombi", kind:"energy"},
  valve:{icon:"🚰", name:"Vana", kind:"energy"},
  door:{icon:"🚪", name:"Kapı", kind:"energy"},
  motor_valve:{icon:"⚙️", name:"Motorlu Vana", kind:"energy"},
  onoff:{icon:"🔴", name:"ON/OFF Cihaz", kind:"energy"},
  collector:{icon:"🔥", name:"Yerden Isıtma Kollektörü", kind:"collector"}
};

let state = {
  projectName:"Villa Projesi",
  activeFloor:0,
  floors:[{id:uid("floor"), name:"1. Kat", rooms:[]}],
  panels:[],
  collectors:[],
  wires:[]
};
let selected = null;
let tool = null;

function uid(p){ return p+"_"+Date.now()+"_"+Math.floor(Math.random()*9999); }

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
  const col = n % 2;
  const row = Math.floor(n / 2);
  floor.rooms.push({id:uid("room"), name, x:80 + col*820, y:90 + row*260, devices:[]});
  render(); markDirty();
}

function addCollector(){
  const n = state.collectors.length;
  state.collectors.push({id:uid("collector"), name:"Yerden Isıtma Kollektörü", x:760, y:360+n*170, devices:[
    {id:uid("dev"), type:"valve", name:"Kollektör Vana 1"},
    {id:uid("dev"), type:"valve", name:"Kollektör Vana 2"}
  ]});
  render(); markDirty();
}

function addDevice(type){
  const meta = catalog[type];
  if(!meta) return;
  if(meta.kind==="collector"){ addCollector(); return; }

  if(meta.kind==="actuator" || ["ip_router","power_supply","line_coupler"].includes(type)){
    if(!state.panels.length){
      state.panels.push({id:uid("panel"), name:"Ana Pano", x:520, y:350, devices:[]});
    }
    state.panels[0].devices.push({id:uid("dev"), type, name:meta.name});
  } else {
    const floor = state.floors[state.activeFloor];
    if(!floor.rooms.length){ alert("Önce oda eklemelisin."); return; }
    floor.rooms[floor.rooms.length-1].devices.push({id:uid("dev"), type, name:meta.name});
  }
  render(); markDirty();
}

function setTool(t){
  tool=t; selected=null;
  document.querySelectorAll("button").forEach(b=>b.classList.remove("active"));
  const btn=document.getElementById(t==="energy"?"btn-energy":t==="knx"?"btn-knx":"btn-delete");
  if(btn) btn.classList.add("active");
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

  const canvas=document.getElementById("canvas");
  canvas.querySelectorAll(".box,.bus-bar,.bus-label").forEach(x=>x.remove());

  const floor=state.floors[state.activeFloor];
  floor.rooms.forEach(room=>renderBox(canvas, room, "room"));
  state.panels.forEach(panel=>renderBox(canvas, panel, "panel"));
  state.collectors.forEach(c=>renderBox(canvas, c, "collector"));

  drawBus(canvas);
  drawWires();
  updateBom();
  updateWireList();
}

function renderBox(canvas, obj, cls){
  const box=document.createElement("div");
  box.className="box "+cls;
  box.style.left=obj.x+"px"; box.style.top=obj.y+"px";
  box.dataset.id=obj.id;
  box.innerHTML=`<div class="box-title">${obj.name}</div><div class="device-wrap"></div>`;
  const wrap=box.querySelector(".device-wrap");

  obj.devices.forEach(dev=>{
    const meta=catalog[dev.type] || {icon:"⚙️", name:dev.name, kind:"energy"};
    const d=document.createElement("div");
    d.className="device";
    d.dataset.deviceId=dev.id;
    d.innerHTML=`<div class="device-icon">${meta.icon}</div><div>${dev.name}</div>`;
    d.onclick=(e)=>{
      e.stopPropagation();
      if(tool==="delete"){ deleteDevice(dev.id); return; }
      clickItem({kind:"device", id:dev.id, type:dev.type, label:obj.name+" - "+dev.name}, d);
    };
    d.oncontextmenu=(e)=>{ e.preventDefault(); e.stopPropagation(); deleteDevice(dev.id); };
    wrap.appendChild(d);
  });

  box.onclick=(e)=>{
    e.stopPropagation();
    if(tool==="delete"){ deleteBox(obj.id, cls); return; }
    clickItem({kind:"box", id:obj.id, type:cls, label:obj.name}, box);
  };

  makeDraggable(box,obj);
  canvas.appendChild(box);
}

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
  const wire={
    id:uid("wire"),
    type:tool,
    from:selected.item,
    to:item,
    fromLabel:selected.item.label,
    toLabel:item.label,
    label:tool==="knx"?"KNX BUS T":"220V"
  };
  if(tool==="energy" && (selected.item.type==="blind" || item.type==="blind")){
    wire.label="UP";
    state.wires.push(wire);
    state.wires.push({...wire, id:uid("wire"), label:"DOWN", autoDown:true});
  } else {
    state.wires.push(wire);
  }
  clearSel(); render(); markDirty();
}


function hasEnergyConnection(deviceId){
  return state.wires.some(w => w.type === "energy" && (w.from.id === deviceId || w.to.id === deviceId));
}

function allowed(a,b,t){
  const energyTypes=["lamp","dim_lamp","blind","aircon","boiler","valve","door","motor_valve","onoff"];
  const knxTypes=["knx_switch","knx_thermostat","knx_sensor","ip_router","power_supply","knx_thermo_switch","line_coupler","binary_input","switch_actuator","dimmer_actuator","blind_actuator","rgbw_actuator"];
  if(t==="knx" && (energyTypes.includes(a.type)||energyTypes.includes(b.type))){ alert("Enerji ürünü KNX hattına bağlanamaz."); return false; }
  if(t==="energy" && knxTypes.includes(a.type)&&knxTypes.includes(b.type)){ alert("Enerji hattı iki KNX ürün arasında çizilemez."); return false; }
  const energyA = energyTypes.includes(a.type);
  const energyB = energyTypes.includes(b.type);
  const energyItem = energyA ? a : (energyB ? b : null);
  if(t==="energy" && energyItem && hasEnergyConnection(energyItem.id)){
    alert("Bu enerji ürününe zaten bir röle/kablo bağlandı. İkinci enerji kablosu bağlanamaz.");
    return false;
  }
  return true;
}

function clearSel(){
  selected=null;
  document.querySelectorAll(".selected").forEach(x=>x.classList.remove("selected"));
}

function drawBus(canvas){
  const label=document.createElement("div");
  label.className="bus-label";
  label.innerText="KNX BUS HATTI";
  const bar=document.createElement("div");
  bar.className="bus-bar";
  canvas.appendChild(label);
  canvas.appendChild(bar);
}

function drawWires(){
  const svg=document.getElementById("wires");
  svg.innerHTML="";
  const canvasRect=document.getElementById("canvas").getBoundingClientRect();
  state.wires.forEach(w=>{
    const a=document.querySelector(`[data-device-id="${w.from.id}"],[data-id="${w.from.id}"]`);
    const b=document.querySelector(`[data-device-id="${w.to.id}"],[data-id="${w.to.id}"]`);
    if(!a||!b) return;
    const ar=a.getBoundingClientRect(), br=b.getBoundingClientRect();
    const x1=ar.left+ar.width/2-canvasRect.left, y1=ar.top+ar.height/2-canvasRect.top;
    const x2=br.left+br.width/2-canvasRect.left, y2=br.top+br.height/2-canvasRect.top;
    let el;
    if(w.type==="knx"){
      const busY=canvasRect.height-31;
      el=document.createElementNS("http://www.w3.org/2000/svg","path");
      el.setAttribute("d",`M ${x1} ${y1} L ${x1} ${busY} L ${x2} ${busY} L ${x2} ${y2}`);
      el.setAttribute("class","knx-line");
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

function makeDraggable(el,obj){
  let drag=false, ox=0, oy=0;
  el.onmousedown=e=>{
    if(e.target.closest(".device") || e.target.closest("button") || e.target.closest("input")) return;
    drag=true; ox=e.offsetX; oy=e.offsetY;
  };
  document.onmousemove=e=>{
    if(!drag) return;
    const r=document.getElementById("canvas").getBoundingClientRect();
    obj.x=e.clientX-r.left-ox; obj.y=e.clientY-r.top-oy;
    el.style.left=obj.x+"px"; el.style.top=obj.y+"px";
    drawWires();
  };
  document.onmouseup=()=>{ if(drag){ drag=false; markDirty(); } };
}

function deleteWire(id){
  if(!confirm("Bu kablo silinsin mi?")) return;
  state.wires=state.wires.filter(w=>w.id!==id);
  render(); markDirty();
}

function deleteDevice(id){
  if(!confirm("Bu ürün silinsin mi?")) return;
  state.floors.forEach(f=>f.rooms.forEach(r=>r.devices=r.devices.filter(d=>d.id!==id)));
  state.panels.forEach(p=>p.devices=p.devices.filter(d=>d.id!==id));
  state.collectors.forEach(c=>c.devices=c.devices.filter(d=>d.id!==id));
  state.wires=state.wires.filter(w=>w.from.id!==id && w.to.id!==id);
  render(); markDirty();
}

function deleteBox(id,cls){
  if(!confirm("Bu kutu silinsin mi?")) return;
  if(cls==="room") state.floors.forEach(f=>f.rooms=f.rooms.filter(r=>r.id!==id));
  if(cls==="panel") state.panels=state.panels.filter(p=>p.id!==id);
  if(cls==="collector") state.collectors=state.collectors.filter(c=>c.id!==id);
  state.wires=state.wires.filter(w=>w.from.id!==id && w.to.id!==id);
  render(); markDirty();
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
  state={projectName:"Villa Projesi",activeFloor:0,floors:[{id:uid("floor"),name:"1. Kat",rooms:[]}],panels:[],collectors:[],wires:[]};
  render();
}

function markDirty(){ document.getElementById("status").innerText="Kaydedilmedi"; }

async function downloadPdf(){
  updateProjectName();
  const res=await fetch("/api/pdf",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(state)});
  const blob=await res.blob();
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url; a.download="knxdoit_v5_1_elektrikci_semasi.pdf"; a.click();
  URL.revokeObjectURL(url);
}

render();
showProjects();
