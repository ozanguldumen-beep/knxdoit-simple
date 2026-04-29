let state = {
    rooms: [],
    panels: [],
    wires: []
};

let currentTool = null;
let selectedItem = null;
let roomCounter = 0;
let panelCounter = 0;

const deviceTypes = {
    lamp: { icon: "💡", label: "Lamba", energy: true },
    dimmer: { icon: "🔆", label: "Dimmer", energy: true },
    blind: { icon: "🪟", label: "Perde", energy: true },
    valve: { icon: "🔥", label: "Vana", energy: true },
    thermostat: { icon: "🌡️", label: "Termostat", energy: false },
    switch: { icon: "🔘", label: "Anahtar", energy: false }
};

function uid(prefix) {
    return prefix + "_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
}

function setTool(tool) {
    currentTool = tool;
    selectedItem = null;
    document.querySelectorAll("button").forEach(b => b.classList.remove("active"));
    const btn = document.getElementById(tool === "energy" ? "btn-energy" : "btn-knx");
    if (btn) btn.classList.add("active");
}

function clearSelection() {
    selectedItem = null;
    document.querySelectorAll(".box, .device").forEach(el => el.classList.remove("selected"));
}

function addRoom() {
    roomCounter++;
    const name = prompt("Oda adı:", roomCounter === 1 ? "Salon" : "Oda " + roomCounter);
    if (!name) return;

    state.rooms.push({
        id: uid("room"),
        name,
        x: 80 + (roomCounter - 1) * 30,
        y: 80 + (roomCounter - 1) * 30,
        devices: [
            { id: uid("dev"), type: "lamp", name: "Lamba" },
            { id: uid("dev"), type: "switch", name: "Anahtar" }
        ]
    });

    render();
    markDirty();
}

function addPanel() {
    panelCounter++;
    state.panels.push({
        id: uid("panel"),
        name: "Ana Pano",
        x: 620,
        y: 120 + (panelCounter - 1) * 30,
        devices: [
            { id: uid("dev"), type: "power", name: "Power Supply" },
            { id: uid("dev"), type: "router", name: "IP Router" },
            { id: uid("dev"), type: "actuator", name: "Switch Aktüatör" }
        ]
    });

    render();
    markDirty();
}

function addDeviceToRoom(roomId) {
    const room = state.rooms.find(r => r.id === roomId);
    if (!room) return;

    const choice = prompt("Cihaz tipi yaz:\nlamp, dimmer, blind, valve, thermostat, switch", "lamp");

    if (!deviceTypes[choice]) {
        alert("Geçersiz cihaz tipi.");
        return;
    }

    room.devices.push({
        id: uid("dev"),
        type: choice,
        name: deviceTypes[choice].label
    });

    render();
    markDirty();
}

function render() {
    const canvas = document.getElementById("canvas");
    canvas.querySelectorAll(".box").forEach(el => el.remove());

    state.rooms.forEach(room => {
        const box = document.createElement("div");
        box.className = "box room";
        box.style.left = room.x + "px";
        box.style.top = room.y + "px";
        box.dataset.id = room.id;
        box.innerHTML = `<div class="box-title">${room.name}</div>`;

        room.devices.forEach(dev => {
            const meta = deviceTypes[dev.type] || { icon: "⚙️", label: dev.name };
            const d = document.createElement("div");
            d.className = "device";
            d.dataset.deviceId = dev.id;
            d.dataset.parentId = room.id;
            d.innerHTML = `<div class="device-icon">${meta.icon}</div><div>${dev.name}</div>`;
            d.onclick = (e) => {
                e.stopPropagation();
                handleItemClick({ kind: "device", parentId: room.id, deviceId: dev.id, device: dev }, d);
            };
            box.appendChild(d);
        });

        box.ondblclick = (e) => {
            e.stopPropagation();
            addDeviceToRoom(room.id);
        };

        box.onclick = (e) => {
            e.stopPropagation();
            handleItemClick({ kind: "box", parentId: room.id }, box);
        };

        makeDraggable(box, room);
        canvas.appendChild(box);
    });

    state.panels.forEach(panel => {
        const box = document.createElement("div");
        box.className = "box panel";
        box.style.left = panel.x + "px";
        box.style.top = panel.y + "px";
        box.dataset.id = panel.id;
        box.innerHTML = `<div class="box-title">${panel.name}</div>`;

        panel.devices.forEach(dev => {
            const d = document.createElement("div");
            d.className = "device";
            d.dataset.deviceId = dev.id;
            d.dataset.parentId = panel.id;
            d.innerHTML = `<div class="device-icon">⚙️</div><div>${dev.name}</div>`;
            d.onclick = (e) => {
                e.stopPropagation();
                handleItemClick({ kind: "device", parentId: panel.id, deviceId: dev.id, device: dev }, d);
            };
            box.appendChild(d);
        });

        box.onclick = (e) => {
            e.stopPropagation();
            handleItemClick({ kind: "box", parentId: panel.id }, box);
        };

        makeDraggable(box, panel);
        canvas.appendChild(box);
    });

    drawWires();
    updateBom();
}

function handleItemClick(item, element) {
    if (!currentTool) {
        alert("Önce Enerji Hattı veya KNX Bus Hattı seç.");
        return;
    }

    if (!selectedItem) {
        clearSelection();
        selectedItem = { item, element };
        element.classList.add("selected");
        return;
    }

    if (selectedItem.item.parentId === item.parentId && selectedItem.item.deviceId === item.deviceId) {
        clearSelection();
        return;
    }

    if (!isConnectionAllowed(selectedItem.item, item, currentTool)) {
        clearSelection();
        return;
    }

    state.wires.push({
        id: uid("wire"),
        from: selectedItem.item,
        to: item,
        type: currentTool
    });

    clearSelection();
    render();
    markDirty();
}

function isConnectionAllowed(a, b, type) {
    const aEnergy = a.device?.type ? deviceTypes[a.device.type]?.energy : null;
    const bEnergy = b.device?.type ? deviceTypes[b.device.type]?.energy : null;

    if (type === "energy") {
        if (a.device && aEnergy === false) {
            alert("KNX cihazı enerji hattına bağlanamaz.");
            return false;
        }
        if (b.device && bEnergy === false) {
            alert("KNX cihazı enerji hattına bağlanamaz.");
            return false;
        }
    }

    if (type === "knx") {
        if (a.device && aEnergy === true) {
            alert("Enerji cihazı KNX bus hattına bağlanamaz.");
            return false;
        }
        if (b.device && bEnergy === true) {
            alert("Enerji cihazı KNX bus hattına bağlanamaz.");
            return false;
        }
    }

    return true;
}

function drawWires() {
    const svg = document.getElementById("wires");
    svg.innerHTML = "";

    state.wires.forEach(wire => {
        const a = findElementForItem(wire.from);
        const b = findElementForItem(wire.to);
        if (!a || !b) return;

        const canvasRect = document.getElementById("canvas").getBoundingClientRect();
        const ar = a.getBoundingClientRect();
        const br = b.getBoundingClientRect();

        const x1 = ar.left + ar.width / 2 - canvasRect.left;
        const y1 = ar.top + ar.height / 2 - canvasRect.top;
        const x2 = br.left + br.width / 2 - canvasRect.left;
        const y2 = br.top + br.height / 2 - canvasRect.top;

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", x1);
        line.setAttribute("y1", y1);
        line.setAttribute("x2", x2);
        line.setAttribute("y2", y2);
        line.setAttribute("class", wire.type === "energy" ? "energy-line" : "knx-line");

        svg.appendChild(line);
    });
}

function findElementForItem(item) {
    if (item.kind === "device" && item.deviceId) {
        return document.querySelector(`[data-device-id="${item.deviceId}"]`);
    }
    return document.querySelector(`[data-id="${item.parentId}"]`);
}

function makeDraggable(el, obj) {
    let offsetX = 0;
    let offsetY = 0;
    let dragging = false;

    el.addEventListener("mousedown", (e) => {
        if (e.target.classList.contains("device")) return;
        dragging = true;
        offsetX = e.offsetX;
        offsetY = e.offsetY;
    });

    document.addEventListener("mousemove", (e) => {
        if (!dragging) return;

        const canvasRect = document.getElementById("canvas").getBoundingClientRect();
        obj.x = e.clientX - canvasRect.left - offsetX;
        obj.y = e.clientY - canvasRect.top - offsetY;

        el.style.left = obj.x + "px";
        el.style.top = obj.y + "px";
        drawWires();
    });

    document.addEventListener("mouseup", () => {
        if (dragging) {
            dragging = false;
            markDirty();
        }
    });
}

async function generateGA() {
    const response = await fetch("/api/group-addresses", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ rooms: state.rooms })
    });

    const data = await response.json();
    const list = document.getElementById("gaList");
    list.innerHTML = "";

    if (!data.length) {
        list.innerHTML = "Henüz grup adresi yok.";
        return;
    }

    data.forEach(row => {
        const div = document.createElement("div");
        div.className = "row";
        div.innerHTML = `<b>${row.address}</b><br>${row.room} - ${row.device}<br>${row.function} / ${row.dpt}`;
        list.appendChild(div);
    });
}

function updateBom() {
    const bom = {};

    state.rooms.forEach(room => {
        room.devices.forEach(dev => {
            const label = deviceTypes[dev.type]?.label || dev.name;
            bom[label] = (bom[label] || 0) + 1;
        });
    });

    state.panels.forEach(panel => {
        panel.devices.forEach(dev => {
            bom[dev.name] = (bom[dev.name] || 0) + 1;
        });
    });

    const list = document.getElementById("bomList");
    list.innerHTML = "";

    const entries = Object.entries(bom);
    if (!entries.length) {
        list.innerHTML = "Henüz ürün yok.";
        return;
    }

    entries.forEach(([name, qty]) => {
        const div = document.createElement("div");
        div.className = "row";
        div.innerHTML = `${name}: <b>${qty}</b>`;
        list.appendChild(div);
    });
}

function saveProject() {
    localStorage.setItem("knxdoit_simple_project", JSON.stringify(state));
    document.getElementById("status").innerText = "Kaydedildi";
}

function loadProject() {
    const saved = localStorage.getItem("knxdoit_simple_project");
    if (!saved) return;

    try {
        state = JSON.parse(saved);
        roomCounter = state.rooms.length;
        panelCounter = state.panels.length;
        render();
        document.getElementById("status").innerText = "Kayıttan yüklendi";
    } catch (e) {
        console.error(e);
    }
}

function clearCanvas() {
    if (!confirm("Projeyi temizlemek istiyor musun?")) return;
    state = { rooms: [], panels: [], wires: [] };
    localStorage.removeItem("knxdoit_simple_project");
    roomCounter = 0;
    panelCounter = 0;
    render();
    markDirty();
}

function markDirty() {
    document.getElementById("status").innerText = "Kaydedilmedi";
}

loadProject();
render();
