import { createInitialState } from "./state.js";
import { initUI } from "./ui.js";

const state = createInitialState();
const canvas = document.getElementById("mainCanvas");

initUI(state, canvas);
