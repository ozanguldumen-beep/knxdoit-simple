import { createPanel } from "./panel.js";
import { drawPanel } from "./canvas.js";
import { initUI } from "./ui.js";

window.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("panelCanvas");
  const panel = createPanel(5);

  drawPanel(canvas, panel);
  initUI(panel, canvas);

  window.KNXDOIT = { panel, canvas, redraw: () => drawPanel(canvas, panel) };
  console.log("KNXdoit v12 hazır", window.KNXDOIT);
});
