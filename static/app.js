import { createPanel } from "./panel.js";
import { drawPanel } from "./canvas.js";
import { initUI } from "./ui.js";

const panel = createPanel(5);
const canvas = document.getElementById("panelCanvas");

drawPanel(canvas, panel);
initUI(panel, canvas);

window.KNXDOIT = { panel, canvas };
