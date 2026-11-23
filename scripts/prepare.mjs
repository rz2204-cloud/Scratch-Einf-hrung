import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { crc32 } from 'node:zlib';
import { fileURLToPath } from 'node:url';

process.chdir(fileURLToPath(new URL('..', import.meta.url)));
const archive = 'scratch-gui-15.3.0.tgz';
const bundle = 'public/vendor/dist/scratch-gui-standalone.js';
const digest = 'Iaa4Su+CA8pnZiGmBuN6ezLwNK06cfnH9zmVVKdPxRbGWbOTHGcIZ92C2gsvi51ArbKfPwcHboTQC4N3vs+maQ==';

if (!existsSync(bundle)) {
  if (!existsSync(archive)) {
    console.log('Lade den offiziellen Scratch-Standalone-Editor (ca. 150 MB) …');
    const response = await fetch('https://registry.npmjs.org/@scratch/scratch-gui/-/' + archive);
    if (!response.ok) throw new Error(`Scratch-Download fehlgeschlagen (HTTP ${response.status}).`);
    await writeFile(archive, Buffer.from(await response.arrayBuffer()));
  }
  if (createHash('sha512').update(await readFile(archive)).digest('base64') !== digest) {
    throw new Error(`Prüfsumme stimmt nicht. ${archive} bitte entfernen und erneut herunterladen.`);
  }
  await mkdir('public/vendor', { recursive: true });
  const result = spawnSync('tar', [
    '--exclude=*.map', '--exclude=package/dist/scratch-gui.js*', '--exclude=package/dist/types*',
    '-xzf', archive, '-C', 'public/vendor', '--strip-components=1',
    'package/dist', 'package/LICENSE', 'package/TRADEMARK'
  ], { stdio: 'inherit' });
  if (result.status !== 0 || !existsSync(bundle)) throw new Error('Scratch-Archiv konnte nicht entpackt werden. tar muss verfügbar sein.');
}

const entries = [];
async function costume(file, name, rotationCenterX, rotationCenterY) {
  const data = await readFile('public/assets/' + file);
  const assetId = createHash('md5').update(data).digest('hex');
  const md5ext = assetId + '.svg';
  entries.push([md5ext, data]);
  return { assetId, md5ext, name, rotationCenterX, rotationCenterY, bitmapResolution: 1, dataFormat: 'svg' };
}
const target = { variables: {}, lists: {}, broadcasts: {}, blocks: {}, comments: {}, currentCostume: 0, sounds: [], volume: 100 };
const project = {
  targets: [
    { ...target, isStage: true, name: 'Stage', layerOrder: 0, tempo: 60, videoTransparency: 50, videoState: 'on',
      costumes: [await costume('labor.svg', 'Labor', 240, 180)] },
    { ...target, isStage: false, name: 'Byte', layerOrder: 1, visible: true, x: -105, y: -1, size: 100, direction: 90, draggable: false,
      rotationStyle: 'all around', costumes: [await costume('byte.svg', 'Byte', 48, 48)] }
  ],
  monitors: [], extensions: [], meta: { semver: '3.0.0', vm: '0.2.0', agent: 'Scratch-Labor 7' }
};
entries.unshift(['project.json', Buffer.from(JSON.stringify(project))]);

// A Scratch project is a ZIP archive. The three small files are stored without compression.
const local = [];
const directory = [];
let offset = 0;
for (const [filename, data] of entries) {
  const name = Buffer.from(filename);
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(33, 12);
  header.writeUInt32LE(crc32(data), 14);
  header.writeUInt32LE(data.length, 18);
  header.writeUInt32LE(data.length, 22);
  header.writeUInt16LE(name.length, 26);
  local.push(header, name, data);
  const record = Buffer.alloc(46);
  record.writeUInt32LE(0x02014b50);
  record.writeUInt16LE(20, 4);
  header.copy(record, 6, 4);
  record.writeUInt32LE(offset, 42);
  directory.push(record, name);
  offset += header.length + name.length + data.length;
}
const index = Buffer.concat(directory);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50);
end.writeUInt16LE(entries.length, 8);
end.writeUInt16LE(entries.length, 10);
end.writeUInt32LE(index.length, 12);
end.writeUInt32LE(offset, 16);
await writeFile('public/assets/start.sb3', Buffer.concat([...local, index, end]));
console.log('Scratch-Labor vorbereitet.');
