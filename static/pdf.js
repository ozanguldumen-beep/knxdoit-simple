import { getAllDevices } from './panel.js';

export async function requestPdf(panel) {
  const devices = getAllDevices(panel);

  const response = await fetch('/api/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ devices })
  });

  if (!response.ok) {
    throw new Error('PDF servisi cevap vermedi.');
  }

  return response.json();
}
