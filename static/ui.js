export function renderMenu(container, items, onSelect) {
  if (!container) return;
  container.innerHTML = '';

  items.forEach((device) => {
    const button = document.createElement('button');
    button.className = 'device-btn';
    button.type = 'button';
    button.innerHTML = `<span>${device.name}</span><small>${device.moduleWidth}M</small>`;
    button.addEventListener('click', () => onSelect(device));
    container.appendChild(button);
  });
}

export function bindToggle(button, container) {
  if (!button || !container) return;
  button.addEventListener('click', () => {
    container.classList.toggle('hidden');
    const text = button.textContent.trim().replace(/^▸|^▾/, '').trim();
    button.textContent = `${container.classList.contains('hidden') ? '▸' : '▾'} ${text}`;
  });
}

export function setStatus(message, isError = false) {
  const el = document.getElementById('statusText');
  if (!el) return;
  el.textContent = message;
  el.classList.toggle('error', isError);
}
