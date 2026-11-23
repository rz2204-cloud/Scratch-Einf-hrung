import { mission } from './mission.js';
import { openScratch } from './scratch.js';

const byId = id => document.getElementById(id);
const progressKey = 'scratch-labor-7-mission-1';
const lab = document.querySelector('.lab');
let record = {};
try {
  record = JSON.parse(localStorage.getItem(progressKey)) ?? {};
} catch {
  // Private browsing and school browser policy may disable local storage.
}
let index = Number.isInteger(record.index) && mission[record.index] ? record.index : 0;
const complete = new Set(Array.isArray(record.complete) ? record.complete.filter(value => Number.isInteger(value) && mission[value]) : []);
let hintIndex = 0;
let scratch;
let busy = true;
let filename = 'Mission-1-Byte.sb3';

function remember() {
  try { localStorage.setItem(progressKey, JSON.stringify({ index, complete: [...complete] })); } catch { /* Session continues. */ }
}

function displayHint() {
  const hints = mission[index].hints;
  byId('hint-text').textContent = hints[hintIndex];
  byId('more').hidden = hintIndex >= hints.length - 1;
}

function feedback(message) {
  byId('feedback').textContent = message;
  byId('feedback').hidden = !message;
}

function updateProgress() {
  byId('progress').value = complete.size;
  byId('count').textContent = `${complete.size} / ${mission.length} erledigt`;
  [...byId('steps').children].forEach((button, step) => {
    button.dataset.done = complete.has(step);
    if (step === index) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
    button.setAttribute('aria-label', `${step + 1}. ${mission[step].title}${complete.has(step) ? ', erledigt' : ''}`);
  });
}

function showStep(step, focus = true) {
  index = step;
  const task = mission[index];
  byId('step-label').textContent = `AUFGABE ${index + 1} VON ${mission.length}`;
  byId('step-title').textContent = task.title;
  byId('instruction').textContent = task.instruction;
  byId('work').hidden = index === 0;
  byId('back').disabled = index === 0;
  byId('next').textContent = task.action ?? 'Prüfen und weiter';
  byId('hint').open = false;
  hintIndex = 0;
  displayHint();
  feedback(index === mission.length - 1 && complete.has(index) ? task.success : '');
  updateProgress();
  remember();
  if (focus) byId('step-title').focus({ preventScroll: true });
}

function view(name, focus = true) {
  lab.dataset.view = name;
  byId('show-mission').setAttribute('aria-pressed', String(name === 'mission'));
  byId('show-editor').setAttribute('aria-pressed', String(name === 'editor'));
  if (focus) byId(name === 'mission' ? 'step-title' : 'workspace-label').focus();
  requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
}

mission.forEach((task, step) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = step + 1;
  button.addEventListener('click', () => showStep(step));
  byId('steps').append(button);
});
showStep(index, false);
byId('show-mission').onclick = () => view('mission');
byId('show-editor').onclick = () => view('editor');
byId('work').onclick = () => view('editor');
byId('back').onclick = () => showStep(index - 1);
byId('more').onclick = () => { hintIndex += 1; displayHint(); };
byId('next').onclick = () => {
  const task = mission[index];
  if (task.check && !complete.has(index)) {
    if (busy || !scratch) return feedback('Warte kurz, bis der Editor bereit ist.');
    if (!scratch.has(task.check)) return feedback(task.wait);
  }
  complete.add(index);
  if (index < mission.length - 1) {
    showStep(index + 1);
    if (task.success) feedback(task.success);
  } else {
    remember();
    updateProgress();
    feedback(task.success);
  }
};

function setBusy(value) {
  busy = value;
  for (const id of ['open', 'save', 'flag', 'move', 'try-move', 'change', 'turn', 'run', 'stop']) byId(id).disabled = value;
}

byId('open').onclick = () => byId('file').click();
byId('file').onchange = async event => {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file) return;
  if (!file.name.toLowerCase().endsWith('.sb3')) {
    byId('file-status').textContent = 'Wähle eine Scratch-Projektdatei mit der Endung .sb3.';
    return;
  }
  setBusy(true);
  byId('file-status').textContent = 'Projekt wird geladen …';
  try {
    const backup = await scratch.save();
    try {
      await scratch.load(await file.arrayBuffer());
    } catch (error) {
      await scratch.load(await backup.arrayBuffer());
      throw error;
    }
    filename = file.name;
    byId('file-status').textContent = `Projekt geladen: ${file.name}`;
    view('editor', false);
  } catch {
    byId('file-status').textContent = 'Diese Datei konnte Scratch nicht öffnen. Versuche es mit einer gültigen .sb3-Datei.';
  } finally {
    setBusy(false);
  }
};
byId('save').onclick = async () => {
  setBusy(true);
  try {
    const blob = await scratch.save();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    byId('file-status').textContent = 'Download gestartet. Die .sb3-Datei liegt in deinen Downloads oder im gewählten Ordner.';
  } catch {
    byId('file-status').textContent = 'Das Projekt konnte nicht gespeichert werden. Versuche es noch einmal.';
  } finally {
    setBusy(false);
  }
};

for (const action of ['flag', 'move', 'try-move', 'change', 'turn']) {
  byId(action).onclick = () => {
    const input = byId('distance');
    if (['move', 'change'].includes(action) && (input.value === '' || !input.reportValidity())) {
      byId('assist-status').textContent = 'Gib eine ganze Schrittzahl zwischen −480 und 480 ein.';
      input.focus();
      return;
    }
    byId('assist-status').textContent = scratch.assist(action, input.valueAsNumber);
  };
}
byId('run').onclick = () => scratch.start();
byId('stop').onclick = () => scratch.stop();

async function prepareOffline() {
  if (!('serviceWorker' in navigator)) return;
  try {
    await navigator.serviceWorker.register('./offline.js');
    if (!navigator.serviceWorker.controller) {
      await new Promise(resolve => {
        navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true });
        setTimeout(resolve, 2500);
      });
    }
  } catch {
    // An already installed local server remains usable without a service worker.
  }
}

async function initialize() {
  await prepareOffline();
  const start = fetch('./assets/start.sb3').then(async response => {
    if (!response.ok) throw new Error('Startprojekt fehlt.');
    return response.arrayBuffer();
  });
  const [editor, bytes] = await Promise.all([openScratch(byId('editor')), start]);
  await editor.load(bytes);
  scratch = editor;
  byId('editor-status').textContent = 'Scratch bereit';
  byId('editor-status').dataset.ready = 'true';
  setBusy(false);
}

const timeout = setTimeout(() => {
  byId('editor-status').textContent = 'Editor lädt länger. Prüfe Browser und WebGL.';
}, 15000);
initialize().catch(error => {
  byId('editor-status').textContent = 'Editor konnte nicht starten';
  byId('file-status').textContent = 'Prüfe die Startanleitung und lade die Seite neu.';
  console.error(error);
}).finally(() => clearTimeout(timeout));
