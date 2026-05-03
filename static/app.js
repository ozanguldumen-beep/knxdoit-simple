import { DEVICES } from './devices.js';
import { createPanel, autoPlaceDevice, clearPanel } from './panel.js';
import { drawPanel } from './canvas.js';
import { validateDevice } from './rules.js';
import { renderMenu, bindToggle, setStatus } from './ui.js';
import { requestPdf } from './pdf.js';

let panel;
let canvas;

window.addEventListener('DOMContentLoaded', init);

function init() {
  canvas = document.getElementById('panelCanvas');
  panel = createPanel();

  drawPanel(canvas, panel);
  setupMenus();
  setupActions();
  setStatus('Sistem hazır.');
}

function setupMenus() {
  renderMenu(document.getElementById('knxProducts'), DEVICES.system, handleDeviceClick);
  renderMenu(document.getElementById('actuators'), DEVICES.actuators, handleDeviceClick);
  renderMenu(document.getElementById('loads'), DEVICES.loads, handleDeviceClick);

  document.querySelectorAll('[data-toggle]').forEach((button) => {
    const target = document.getElementById(button.dataset.toggle);
    bindToggle(button, target);
  });
}

function setupActions() {
  const clearButton = document.getElementById('clearPanel');
  const pdfButton = document.getElementById('downloadPdf');

  if (clearButton) {
    clearButton.addEventListener('click', () => {
      clearPanel(panel);
      drawPanel(canvas, panel);
      setStatus('Pano temizlendi.');
    });
  }

  if (pdfButton) {
    pdfButton.addEventListener('click', async () => {
      try {
        const result = await requestPdf(panel);
        setStatus(result.message || 'PDF isteği hazırlandı.');
      } catch (error) {
        setStatus(error.message, true);
      }
    });
  }
}

function handleDeviceClick(device) {
  const check = validateDevice(device);
  if (!check.ok) {
    setStatus(check.message, true);
    return;
  }

  try {
    const placed = autoPlaceDevice(panel, device);
    drawPanel(canvas, panel);
    setStatus(`${placed.name} ${placed.railId} üzerine eklendi.`);
  } catch (error) {
    setStatus(error.message, true);
  }
}
