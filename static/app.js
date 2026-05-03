// static/app.js

import { createPanel } from "./panel.js";
import { drawPanel } from "./canvas.js";
import { initUI } from "./ui.js";

const canvas = document.getElementById("panelCanvas");
const panel = createPanel();

drawPanel(canvas, panel);
initUI(panel, canvas);
