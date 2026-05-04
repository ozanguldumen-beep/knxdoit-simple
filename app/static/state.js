export function createInitialState() {
  return {
    projectName: document.getElementById("app")?.dataset.projectName || "KNXdoit Projesi",
    currentFloor: 0,
    zoom: 100,
    floors: [
      { id: uid("floor"), name: "Zemin Kat", rooms: [], collectors: [], panel: { products: [] } }
    ]
  };
}

export function uid(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 99999)}`;
}

export function getCurrentFloor(state) {
  return state.floors[state.currentFloor];
}

export function allPanelProducts(state) {
  return state.floors.flatMap((floor) => floor.panel.products.map((p) => ({ ...p, floorId: floor.id, floorName: floor.name })));
}

export function allFieldDevices(state) {
  const list = [];
  state.floors.forEach((floor) => {
    floor.rooms.forEach((room) => {
      room.devices.forEach((device) => list.push({ ...device, floorId: floor.id, floorName: floor.name, roomId: room.id, roomName: room.name }));
    });
    floor.collectors.forEach((collector) => list.push({ ...collector, floorId: floor.id, floorName: floor.name, roomId: null, roomName: "Kollektör" }));
  });
  return list;
}
