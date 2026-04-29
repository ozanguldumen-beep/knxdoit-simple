let roomCount = 0;

function addRoom() {
    const canvas = document.getElementById("canvas");

    const room = document.createElement("div");
    room.style.position = "absolute";
    room.style.left = (50 + roomCount * 40) + "px";
    room.style.top = (50 + roomCount * 40) + "px";
    room.style.width = "150px";
    room.style.height = "100px";
    room.style.border = "2px solid black";
    room.style.background = "white";
    room.style.padding = "5px";

    room.innerHTML = `<strong>Oda ${roomCount + 1}</strong>`;

    canvas.appendChild(room);

    makeDraggable(room);

    roomCount++;
}

function addPanel() {
    const canvas = document.getElementById("canvas");

    const panel = document.createElement("div");
    panel.style.position = "absolute";
    panel.style.left = "500px";
    panel.style.top = "100px";
    panel.style.width = "150px";
    panel.style.height = "120px";
    panel.style.border = "2px solid blue";
    panel.style.background = "#eef";
    panel.style.padding = "5px";

    panel.innerHTML = `<strong>Pano</strong>`;

    canvas.appendChild(panel);

    makeDraggable(panel);
}

function setTool(tool) {
    alert("Seçilen: " + tool);
}

function generateGA() {
    alert("GA oluşturuldu (yakında gerçek olacak)");
}


// 🔥 Sürükleme sistemi
function makeDraggable(el) {
    let offsetX = 0;
    let offsetY = 0;
    let dragging = false;

    el.addEventListener("mousedown", (e) => {
        dragging = true;
        offsetX = e.offsetX;
        offsetY = e.offsetY;
    });

    document.addEventListener("mousemove", (e) => {
        if (!dragging) return;

        const canvasRect = document.getElementById("canvas").getBoundingClientRect();

        el.style.left = (e.clientX - canvasRect.left - offsetX) + "px";
        el.style.top = (e.clientY - canvasRect.top - offsetY) + "px";
    });

    document.addEventListener("mouseup", () => {
        dragging = false;
    });
}
