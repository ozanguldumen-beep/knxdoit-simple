let state={floors:[],devices:[]}
let floor=1

function addFloor(){
 floor++
 alert("Kat "+floor+" eklendi")
}

function addRoom(){
 const name=prompt("Oda adı")
 if(!name) return
 const div=document.createElement("div")
 div.className="box"
 div.innerText=name
 div.style.left="100px"
 div.style.top="100px"
 document.getElementById("canvas").appendChild(div)
 drag(div)
}

function addDevice(type){
 const div=document.createElement("div")
 div.className="box"
 div.innerText=type
 div.style.left="200px"
 div.style.top="200px"
 document.getElementById("canvas").appendChild(div)
 drag(div)
}

function drag(el){
 let offsetX,offsetY,dragging=false
 el.onmousedown=e=>{
  dragging=true
  offsetX=e.offsetX
  offsetY=e.offsetY
 }
 document.onmousemove=e=>{
  if(!dragging) return
  el.style.left=(e.clientX-offsetX)+"px"
  el.style.top=(e.clientY-offsetY)+"px"
 }
 document.onmouseup=()=>dragging=false
}

function save(){
 localStorage.setItem("proj",document.getElementById("canvas").innerHTML)
}

function load(){
 const data=localStorage.getItem("proj")
 if(data) document.getElementById("canvas").innerHTML=data
}
