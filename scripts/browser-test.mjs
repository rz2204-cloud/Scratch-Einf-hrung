import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { chromium, devices } from 'playwright-core';

const port = 4174;
const origin = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['scripts/serve.mjs'], {
  env: { ...process.env, SCRATCH_LAB_PORT: String(port) }, stdio: ['ignore', 'pipe', 'inherit']
});
const temporary = await mkdtemp(join(tmpdir(), 'scratch-labor-qa-'));
let browser;
try {
  await Promise.race([
    once(server.stdout, 'data'),
    once(server, 'exit').then(([code]) => { throw new Error(`Testserver beendet (${code}).`); })
  ]);
  await mkdir('screenshots', { recursive: true });
  browser = await chromium.launch({
    channel: process.env.SCRATCH_LAB_BROWSER || 'chrome',
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
  });
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  const desktopPage = await desktop.newPage();
  desktopPage.setDefaultTimeout(10000);
  const errors = [];
  const failed = new Set();
  const external = new Set();
  const offlineCostumeMessages = new Set();
  let offline = false;
  const monitor = page => {
    page.on('response', response => {
      if (response.status() >= 400) failed.add(`${response.status()} ${response.url()}`);
    });
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() !== 'error') return;
      const source = message.location().url.replace(origin, '');
      const description = `${message.text()} ${source}`.trim();
      // Scratch preloads the optional costume editor in an isolated iframe.
      const costumeResource = /^\/static\/assets\/(?:paper-core\.min|paper-import|runner)\.[a-f0-9]+\.js\?resource$/;
      if (offline && page === desktopPage && costumeResource.test(source)
        && /net::ERR_(CONNECTION_REFUSED|INTERNET_DISCONNECTED)/.test(message.text())) {
        offlineCostumeMessages.add(source);
      } else {
        errors.push(description);
      }
    });
    page.on('request', request => {
      if (request.url().startsWith('http') && !request.url().startsWith(origin + '/')) external.add(new URL(request.url()).origin);
    });
  };
  monitor(desktopPage);
  const ready = page => page.waitForFunction(() => document.getElementById('editor-status').dataset.ready === 'true', null, { timeout: 25000 });
  try {
    await desktopPage.goto(origin);
    await ready(desktopPage);
  } catch (error) {
    console.error(errors, [...failed]);
    await desktopPage.screenshot({ path: 'screenshots/diagnose.png' });
    throw error;
  }
  await desktopPage.screenshot({ path: 'screenshots/desktop.png', fullPage: true });
  if (process.argv.includes('--inspect')) {
    console.log(await desktopPage.locator('#editor').evaluate(element => ({
      text: element.innerText.slice(0, 2200), canvas: [...element.querySelectorAll('canvas')].map(c => c.getBoundingClientRect().toJSON()),
      inputs: [...element.querySelectorAll('input')].map(input => ({ label: input.getAttribute('aria-label'), value: input.value })),
      controls: [...element.querySelectorAll('[title]')].map(item => item.title).slice(0, 45),
      flyout: [...element.querySelectorAll('.blocklyFlyout text')].map(item => item.textContent).slice(0, 25)
    })));
    console.log({ errors, failed: [...failed], external: [...external] });
  } else {
    const p = desktopPage;
    const x = page => page.locator('#editor input').nth(1);
    const direction = page => page.locator('#editor input').nth(4);
    const button = (page, id) => page.locator('#' + id);
    const next = button(p, 'next');
    const expectValue = async (input, value) => {
      await input.page().waitForFunction(([element, expected]) => element.value === expected,
        [await input.elementHandle(), String(value)]);
    };
    const press = async control => { await control.focus(); await control.press('Enter'); };
    const hint = p.locator('#hint summary');
    await press(hint);
    assert.equal(await p.locator('#hint').getAttribute('open'), '');
    await press(next);
    assert.equal(await p.locator('#hint').getAttribute('open'), null);
    assert.equal(await p.locator('#step-title').innerText(), 'Lerne die Scratch-Oberfläche kennen');
    for (const [id, name] of [['stage', 'Bühne'], ['sprites', 'Figurenliste'], ['blocks', 'Blockpalette'], ['scripts', 'Skriptbereich']]) {
      await press(p.locator(`[data-area="${id}"]`));
      assert.match(await p.locator('#area-note').innerText(), new RegExp(`^${name}`));
      const marker = await p.locator('#area-marker').boundingBox();
      assert.ok(marker?.width > 25 && marker.height > 15);
    }
    await p.screenshot({ path: 'screenshots/orientierung.png', fullPage: true });
    await p.locator('#area-answer').selectOption('blocks');
    await press(next);
    assert.match(await p.locator('#feedback').innerText(), /freie Arbeitsfläche/);
    await p.locator('#area-answer').selectOption('scripts');
    await press(next);
    assert.equal(await p.locator('#area-note').isHidden(), true);
    await press(next);
    assert.match(await p.locator('#feedback').innerText(), /zuerst einen Geh-Block/);

    const flyoutBlock = p.locator('.blocklyFlyout .blocklyDraggable').filter({ hasText: /gehe\s*er\s+Schritt|gehe\s*10\s*er\s+Schritt/ }).first();
    const workspace = p.locator('.blocklyMainBackground').first();
    const target = await workspace.boundingBox();
    const palette = await p.locator('.blocklyFlyout').first().boundingBox();
    assert.ok(target && target.width > 100);
    const originBlock = await flyoutBlock.boundingBox();
    assert.ok(originBlock, 'Der native Bewegungsblock ist vorhanden.');
    await p.mouse.move(originBlock.x + 35, originBlock.y + 14);
    await p.mouse.down();
    await p.mouse.move(palette.x + palette.width + 55, target.y + 105, { steps: 16 });
    await p.mouse.up();
    await p.locator('.blocklyBlockCanvas .blocklyDraggable:not(.blocklyFlyout *)').filter({ hasText: /er\s+Schritt/ }).first().waitFor();
    await press(next);
    assert.equal(await p.locator('#step-title').innerText(), 'Gib das Startsignal');
    const assist = p.locator('#assist summary');
    await press(assist);
    await press(button(p, 'flag'));
    await press(next);
    assert.equal(await p.locator('#step-title').innerText(), 'Starte und verändere');

    await p.locator('[title="Los"]').click();
    await expectValue(x(p), -95);
    await p.locator('#distance').fill('40');
    await press(button(p, 'change'));
    await press(button(p, 'run'));
    await expectValue(x(p), -55);
    await press(next);
    assert.equal(await p.locator('#step-title').innerText(), 'Dein eigenes Manöver');
    await press(button(p, 'turn'));
    await press(button(p, 'run'));
    await expectValue(x(p), -15);
    await expectValue(direction(p), 105);
    await press(next);
    assert.equal(await p.locator('#count').innerText(), '6 / 6 erledigt');
    await p.screenshot({ path: 'screenshots/mission-abgeschlossen.png', fullPage: true });

    const download = p.waitForEvent('download');
    await press(button(p, 'save'));
    const savedFile = join(temporary, 'mission.sb3');
    await (await download).saveAs(savedFile);
    await p.reload();
    await ready(p);
    await expectValue(x(p), -105);
    assert.equal(await p.locator('#count').innerText(), '6 / 6 erledigt');
    await p.locator('#file').setInputFiles(savedFile);
    await p.locator('#file-status').getByText(/Projekt geladen/).waitFor();
    await expectValue(x(p), -15);
    await p.locator('[title="Los"]').click();
    await expectValue(direction(p), 120);
    assert.ok(Number(await x(p).inputValue()) > 20, 'Geladenes Projekt läuft wieder.');

    const tablet = await browser.newContext({ ...devices['iPad Mini'], viewport: { width: 820, height: 1180 }, locale: 'de-DE' });
    const ip = await tablet.newPage();
    ip.setDefaultTimeout(10000);
    monitor(ip);
    await ip.goto(origin);
    await ready(ip);
    await ip.locator('#next').tap();
    await ip.locator('[data-area="stage"]').tap();
    await ip.locator('#workspace').waitFor();
    assert.equal(await ip.locator('#show-editor').getAttribute('aria-pressed'), 'true');
    assert.match(await ip.locator('#area-note').innerText(), /^Bühne/);
    await ip.locator('#area-marker').waitFor();
    assert.equal(await ip.evaluate(() => document.documentElement.scrollWidth), 820);
    await ip.locator('#assist summary').tap();
    await button(ip, 'move').tap();
    await button(ip, 'try-move').tap();
    await expectValue(x(ip), -95);
    await button(ip, 'flag').tap();
    await button(ip, 'run').tap();
    await expectValue(x(ip), -85);
    await ip.screenshot({ path: 'screenshots/ipad-portrait.png', fullPage: true });
    await ip.setViewportSize({ width: 1180, height: 820 });
    await ip.locator('#show-mission').tap();
    await ip.locator('#step-title').waitFor();
    assert.equal(await ip.evaluate(() => document.documentElement.scrollWidth), 1180);
    await ip.screenshot({ path: 'screenshots/ipad-querformat.png', fullPage: true });

    await p.waitForFunction(() => navigator.serviceWorker.controller !== null);
    offline = true;
    await desktop.setOffline(true);
    server.kill();
    await p.reload();
    await ready(p);
    await p.locator('#file').setInputFiles(savedFile);
    await p.locator('#file-status').getByText(/Projekt geladen/).waitFor();
    await p.locator('[title="Los"]').click();
    await expectValue(direction(p), 120);
    assert.deepEqual(errors, [], 'Browserkonsole');
    assert.deepEqual([...failed], [], 'HTTP-Fehler');
    assert.deepEqual([...external], [], 'Externe Anfragen im Mission-1-Lernweg');
    if (offlineCostumeMessages.size) console.log('Offline-Hinweis: Der optionale Kostümeditor benötigt den Server.');
    console.log('Bestanden: nativer Drag, Tastatur, sechs Aufgaben, VM-Ausführung, SB3-Rundlauf, iPad-Touchprofil in beiden Formaten und Offline-Neuladen bei gestopptem Server.');
  }
} finally {
  await browser?.close();
  server.kill();
  await rm(temporary, { recursive: true, force: true });
}
