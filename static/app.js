let state = {
    rooms: [],
    panels: [],
    wires: []
};

let currentTool = null;
let selectedItem = null;
let selectedRoomId = null;
let selectedPanelId = null;
let roomCounter = 0;
let panelCounter = 0;

const deviceTypes = {
    lamp: { icon: "💡", label: "Lamba", energy: true },
    dimmer: { icon: "🔆", label: "Dimmer", energy: true },
    blind: { icon: "🪟", label: "Perde/Panjur", energy: true },
    valve: { icon: "🔥", label: "Vana", energy: true },
    thermostat: { icon: "🌡️", label: "KNX Termostat", energy: false },
    switch: { icon: "🔘", label: "KNX Anahtar", energy: false },
    sensor: { icon: "📡", label: "KNX Sensör", energy: false },
    thermo_switch: { icon: "🌡️🔘", label: "Termostatlı Anahtar", energy: false }
};

const moduleTypes = {
    power: { icon: "⚡", label: "Power Supply", channels: 0, channelType: "knx" },
    router: { icon: "🌐", label: "IP Router", channels: 0, channelType: "knx" },
    switch_actuator_6: { icon: "🔌", label: "Switch 6K", channels: 6, channelType: "switch" },
    switch_actuator_12: { icon: "🔌", label: "Switch 12K", channels: 12, channelType: "switch" },
    dimmer_actuator_4: { icon: "🔆", label: "Dimmer 4K", channels: 4, channelType: "dimmer" },
    blind_actuator_4: { icon: "🪟", label: "Jalüzi 4K", channels: 4, channelType: "blind" }
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

function closeMenus() {
    document.getElementById("roomMenu").style.display = "none";
    document.getElementById("panelMenu").style.display = "none";
}

document.addEventListener("click", () => closeMenus());

function clearSelection() {
    selectedItem = null;
    document.querySelectorAll(".box, .device, .channel, .knx-port").forEach(el => el.classList.remove("selected"));
}

function addRoom() {
    roomCounter++;
    const name = prompt("Oda adı:", roomCounter === 1 ? "Salon" : "Oda " + roomCounter);
    if (!name) return;

    state.rooms.push({
        id: uid("room"),
        name,
        x: 80 + (roomCounter - 1) * 35,
        y: 80 + (roomCounter - 1) * 35,
        devices: []
    });

    render();
    markDirty();
}

function addPanel() {
    panelCounter++;
    state.panels.push({
        id: uid("panel"),
        name: "Ana Pano",
        x: 560,
        y: 110 + (panelCounter - 1) * 35,
        modules: []
    });

    render();
    markDirty();
}

function addDeviceToSelectedRoom(type) {
    const room = state.rooms.find(r => r.id === selectedRoomId);
    if (!room) return;

    room.devices.push({
        id: uid("dev"),
        type,
        name: deviceTypes[type].label
    });

    closeMenus();
    render();
    markDirty();
}

function addModuleToSelectedPanel(type) {
    const panel = state.panels.find(p => p.id === selectedPanelId);
    if (!panel) return;

    const meta = moduleTypes[type];
    const module = {
        id: uid("module"),
        type,
        name: meta.label,
        channels: []
    };

    for (let i = 1; i <= meta.channels; i++) {
        module.channels.push({
            id: uid("ch"),
            no: i,
            label: "K" + i,
            usedBy: null,
            locked: false
        });
    }

    panel.modules.push(module);
    closeMenus();
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
            const meta = deviceTypes[dev.type];
            const d = document.createElement("div");
            d.className = "device";
            d.dataset.deviceId = dev.id;
            d.dataset.label = room.name + " - " + dev.name;
            d.innerHTML = `<div class="device-icon">${meta.icon}</div><div>${dev.name}</div>`;
            d.onclick = (e) => {
                e.stopPropagation();
                handleItemClick({ kind: "device", parentId: room.id, deviceId: dev.id, device: dev, label: room.name + " - " + dev.name }, d);
            };
            box.appendChild(d);
        });

        box.oncontextmenu = (e) => {
            e.preventDefault();
            e.stopPropagation();
            selectedRoomId = room.id;
            showMenu("roomMenu", e.clientX, e.clientY);
        };

        box.onclick = (e) => {
            e.stopPropagation();
            handleItemClick({ kind: "box", parentId: room.id, label: room.name }, box);
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
        box.innerHTML = `<div class="box-title">${panel.name}</div><div class="modules"></div>`;
        const modulesDiv = box.querySelector(".modules");

        panel.modules.forEach(module => {
            const meta = moduleTypes[module.type];
            const m = document.createElement("div");
            m.className = "module";
            m.dataset.moduleId = module.id;
            m.innerHTML = `
                <div class="module-device">${meta.icon}</div>
                <div class="module-title">${module.name}</div>
                <div class="knx-port" data-knx-port="${module.id}">KNX</div>
                <div class="channel-grid"></div>
            `;

            const grid = m.querySelector(".channel-grid");
            module.channels.forEach(ch => {
                const c = document.createElement("div");
                c.className = "channel" + (ch.usedBy ? " used" : "") + (ch.locked ? " locked" : "");
                c.dataset.channelId = ch.id;
                c.innerText = ch.locked ? ch.label + " 🔒" : ch.label;
                c.onclick = (e) => {
                    e.stopPropagation();
                    if (ch.locked) {
                        alert("Bu kanal perde/panjur için otomatik bloke edildi.");
                        return;
                    }
                    handleItemClick({
                        kind: "channel",
                        parentId: panel.id,
                        moduleId: module.id,
                        channelId: ch.id,
                        channel: ch,
                        module,
                        label: panel.name + " - " + module.name + " " + ch.label
                    }, c);
                };
                grid.appendChild(c);
            });

            const knxPort = m.querySelector(".knx-port");
            knxPort.onclick = (e) => {
                e.stopPropagation();
                handleItemClick({
                    kind: "knxport",
                    parentId: panel.id,
                    moduleId: module.id,
                    module,
                    label: panel.name + " - " + module.name + " KNX"
                }, knxPort);
            };

            modulesDiv.appendChild(m);
        });

        box.oncontextmenu = (e) => {
            e.preventDefault();
            e.stopPropagation();
            selectedPanelId = panel.id;
            showMenu("panelMenu", e.clientX, e.clientY);
        };

        box.onclick = (e) => {
            e.stopPropagation();
            handleItemClick({ kind: "box", parentId: panel.id, label: panel.name }, box);
        };

        makeDraggable(box, panel);
        canvas.appendChild(box);
    });

    drawWires();
    updateBom();
    updateChannelList();
}

function showMenu(id, x, y) {
    closeMenus();
    const menu = document.getElementById(id);
    menu.style.left = x + "px";
    menu.style.top = y + "px";
    menu.style.display = "block";
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

    if (!isConnectionAllowed(selectedItem.item, item, currentTool)) {
        clearSelection();
        return;
    }

    const wire = {
        id: uid("wire"),
        from: selectedItem.item,
        to: item,
        type: currentTool,
        fromLabel: selectedItem.item.label,
        toLabel: item.label
    };

    state.wires.push(wire);
    applyChannelUsage(wire);

    clearSelection();
    render();
    markDirty();
}

function isConnectionAllowed(a, b, type) {
    const deviceItem = [a, b].find(x => x.kind === "device");
    const channelItem = [a, b].find(x => x.kind === "channel");
    const knxItem = [a, b].find(x => x.kind === "knxport" || (x.kind === "device" && deviceTypes[x.device?.type]?.energy === false));

    if (type === "energy") {
        if (!channelItem) {
            alert("Enerji hattı için pano kanalı seçmelisin.");
            return false;
        }
        if (!deviceItem || deviceTypes[deviceItem.device.type]?.energy !== true) {
            alert("Enerji hattı sadece lamba, dimmer, perde/panjur, vana gibi enerji cihazlarına bağlanır.");
            return false;
        }

        const channelType = channelItem.module ? moduleTypes[channelItem.module.type].channelType : null;
        const devType = deviceItem.device.type;

        if (devType === "dimmer" && channelType !== "dimmer") {
            alert("Dimmer sadece Dimmer Aktüatör kanalına bağlanır.");
            return false;
        }

        if (devType === "blind" && channelType !== "blind") {
            alert("Perde/Panjur sadece Jalüzi Aktüatör kanalına bağlanır.");
            return false;
        }

        if (["lamp", "valve"].includes(devType) && channelType !== "switch") {
            alert("Lamba/Vana sadece Switch Aktüatör kanalına bağlanır.");
            return false;
        }
    }

    if (type === "knx") {
        const hasKnxDevice = [a, b].some(x => x.kind === "device" && deviceTypes[x.device?.type]?.energy === false);
        const hasKnxPort = [a, b].some(x => x.kind === "knxport" || x.kind === "box");

        if (!hasKnxDevice && !hasKnxPort) {
            alert("KNX hattı için KNX cihazı veya pano KNX portu seçmelisin.");
            return false;
        }

        if ([a, b].some(x => x.kind === "device" && deviceTypes[x.device?.type]?.energy === true)) {
            alert("Enerji cihazı KNX bus hattına bağlanamaz.");
            return false;
        }
    }

    return true;
}

function applyChannelUsage(wire) {
    if (wire.type !== "energy") return;

    const deviceItem = [wire.from, wire.to].find(x => x.kind === "device");
    const channelItem = [wire.from, wire.to].find(x => x.kind === "channel");
    if (!deviceItem || !channelItem) return;

    const panel = state.panels.find(p => p.id === channelItem.parentId);
    if (!panel) return;

    const module = panel.modules.find(m => m.id === channelItem.moduleId);
    if (!module) return;

    const channel = module.channels.find(c => c.id === channelItem.channelId);
    if (!channel) return;

    channel.usedBy = deviceItem.label;

    if (deviceItem.device.type === "blind") {
        const idx = module.channels.findIndex(c => c.id === channel.id);
        const next = module.channels[idx + 1];
        if (next) {
            next.locked = true;
            next.usedBy = deviceItem.label + " DOWN";
        }
    }
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
    if (item.kind === "device") return document.querySelector(`[data-device-id="${item.deviceId}"]`);
    if (item.kind === "channel") return document.querySelector(`[data-channel-id="${item.channelId}"]`);
    if (item.kind === "knxport") return document.querySelector(`[data-knx-port="${item.moduleId}"]`);
    return document.querySelector(`[data-id="${item.parentId}"]`);
}

function makeDraggable(el, obj) {
    let offsetX = 0;
    let offsetY = 0;
    let dragging = false;

    el.addEventListener("mousedown", (e) => {
        if (e.target.closest(".device") || e.target.closest(".channel") || e.target.closest(".knx-port")) return;
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
        panel.modules.forEach(m => {
            bom[m.name] = (bom[m.name] || 0) + 1;
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

function updateChannelList() {
    const list = document.getElementById("channelList");
    list.innerHTML = "";
    let has = false;

    state.panels.forEach(panel => {
        panel.modules.forEach(module => {
            module.channels.forEach(ch => {
                has = true;
                const div = document.createElement("div");
                div.className = "row";
                div.innerHTML = `<b>${panel.name}</b><br>${module.name} ${ch.label}: ${ch.usedBy || "Boş"} ${ch.locked ? "🔒" : ""}`;
                list.appendChild(div);
            });
        });
    });

    if (!has) list.innerHTML = "Henüz kanal yok.";
}

function saveProject() {
    localStorage.setItem("knxdoit_simple_v2_project", JSON.stringify(state));
    document.getElementById("status").innerText = "Kaydedildi";
}

function loadProject() {
    const saved = localStorage.getItem("knxdoit_simple_v2_project");
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
    localStorage.removeItem("knxdoit_simple_v2_project");
    roomCounter = 0;
    panelCounter = 0;
    render();
    markDirty();
}

function markDirty() {
    document.getElementById("status").innerText = "Kaydedilmedi";
}

async function downloadPdf() {
    const response = await fetch("/api/pdf", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(state)
    });

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "knxdoit_kablo_baglanti.pdf";
    a.click();
    window.URL.revokeObjectURL(url);
}

loadProject();
render();
