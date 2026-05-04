const U = 18;
export function drawPanel(canvas, floor){
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle="#fff"; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle="#94a3b8"; ctx.lineWidth=2; round(ctx,18,18,944,682,18); ctx.stroke();
  ctx.fillStyle="#0f172a"; ctx.font="700 18px Arial"; ctx.fillText(`${floor.name} KNX Panosu`,40,52);
  const rails = [90,230,370,510,650];
  rails.forEach((y,i)=>drawRail(ctx,60,y,860,i+1));
  placeProducts(ctx, floor, rails);
  drawBus(ctx, floor, rails);
  drawFieldSummary(ctx, floor);
}
function drawRail(ctx,x,y,w,n){
  ctx.fillStyle="#dbeafe"; round(ctx,x-10,y-12,w+20,44,8); ctx.fill();
  ctx.fillStyle="#94a3b8"; round(ctx,x,y,w,28,4); ctx.fill(); ctx.strokeStyle="#64748b"; ctx.lineWidth=1;
  for(let i=0;i<=48;i++){ const sx=x+i*18; ctx.beginPath(); ctx.moveTo(sx,y+3); ctx.lineTo(sx,y+25); ctx.stroke(); }
  ctx.fillStyle="#334155"; ctx.font="700 15px Arial"; ctx.fillText(`${n}. DIN Ray`,x,y+58);
}
function placeProducts(ctx,floor,rails){
  let rail=0, slot=0;
  floor.panelProducts.forEach(p=>{
    if(slot + p.moduleWidth > 48){ rail++; slot=0; }
    if(rail>=rails.length) return;
    const x=62+slot*U, y=rails[rail]-42, w=p.moduleWidth*U-3, h=72;
    ctx.fillStyle=p.color||"#2563eb"; round(ctx,x,y,w,h,7); ctx.fill();
    ctx.strokeStyle="#1e293b"; ctx.lineWidth=1; ctx.stroke();
    ctx.fillStyle="#fff"; ctx.font="700 9px Arial"; wrap(ctx,p.name,x+6,y+16,w-12,10,3);
    ctx.font="700 8px Arial"; ctx.fillText(`${p.moduleWidth}M · ${p.channels}K`,x+6,y+h-8);
    slot += p.moduleWidth;
  });
}
function drawBus(ctx,floor,rails){
  if(floor.panelProducts.length<2) return;
  ctx.strokeStyle="#dc2626"; ctx.lineWidth=1.5; ctx.setLineDash([5,4]);
  ctx.beginPath(); ctx.moveTo(80, rails[0]+45); ctx.lineTo(760, rails[0]+45); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle="#dc2626"; ctx.font="700 10px Arial"; ctx.fillText("KNX BUS",80,rails[0]+62);
}
function drawFieldSummary(ctx,floor){
  const loads = floor.rooms.flatMap(r=>r.devices.map(d=>({...d,room:r.name})));
  ctx.strokeStyle="#cbd5e1"; ctx.setLineDash([8,6]); ctx.beginPath(); ctx.moveTo(60,610); ctx.lineTo(920,610); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle="#475569"; ctx.font="700 13px Arial"; ctx.fillText("Saha Yükleri / Oda Cihazları Özeti",70,598);
  let x=70,y=630;
  loads.slice(0,30).forEach(d=>{
    ctx.fillStyle="#fff"; round(ctx,x,y,92,42,10); ctx.fill(); ctx.strokeStyle="#94a3b8"; ctx.stroke();
    ctx.fillStyle=color(d.type); ctx.beginPath(); ctx.arc(x+20,y+20,13,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#fff"; ctx.font="700 12px Arial"; ctx.textAlign="center"; ctx.fillText((d.icon||d.label[0]).slice(0,1),x+20,y+24); ctx.textAlign="left";
    ctx.fillStyle="#0f172a"; ctx.font="700 9px Arial"; wrap(ctx,d.label,x+40,y+16,45,10,2);
    x+=102; if(x>850){x=70;y+=50;}
  });
}
function color(t){return t==="dim"?"#9333ea":t==="curtain"?"#0ea5e9":t==="thermostat"?"#ef4444":t==="valve"?"#0f766e":t==="switch"?"#475569":"#f59e0b";}
function round(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);}
function wrap(ctx,text,x,y,maxWidth,lineHeight,maxLines){const words=String(text).split(" ");let line="",lines=0;for(const word of words){const test=line+word+" ";if(ctx.measureText(test).width>maxWidth&&line){ctx.fillText(line.trim(),x,y);line=word+" ";y+=lineHeight;lines++;if(lines>=maxLines-1)break;}else line=test;}ctx.fillText(line.trim(),x,y);}
