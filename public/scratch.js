const flagOpcode = 'event_whenflagclicked';
const moveOpcode = 'motion_movesteps';
const turnOpcodes = ['motion_turnright', 'motion_turnleft'];
const bundle = './vendor/dist/scratch-gui-standalone.js';

const scripts = target => target.blocks.getScripts().map(id => target.blocks.getBlock(id)).filter(Boolean);
const flags = target => scripts(target).filter(block => block.opcode === flagOpcode);

function chain(target, start) {
  const seen = new Set();
  const blocks = [];
  for (let block = start; block && !seen.has(block.id); block = target.blocks.getBlock(block.next)) {
    blocks.push(block);
    seen.add(block.id);
  }
  return blocks;
}

function numberField(target, block, key) {
  const input = block.inputs[key];
  const raw = input && target.blocks.getBlock(input.block)?.fields.NUM?.value;
  return typeof raw === 'undefined' ? null : Number(raw);
}

function createBlock(target, opcode, field, value, position) {
  const id = crypto.randomUUID?.() ?? `labor-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const inputs = {};
  if (field) {
    const shadow = id + '-number';
    target.blocks.createBlock({
      id: shadow, opcode: 'math_number', next: null, parent: id, shadow: true, topLevel: false, inputs: {},
      fields: { NUM: { name: 'NUM', value: String(value) } }
    });
    inputs[field] = { name: field, block: shadow, shadow };
  }
  target.blocks.createBlock({ id, opcode, next: null, parent: null, shadow: false, topLevel: true,
    inputs, fields: {}, x: position.x, y: position.y });
  return target.blocks.getBlock(id);
}

export async function openScratch(container) {
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = bundle;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Scratch-Bundle fehlt.'));
    document.head.append(script);
  });
  const scratch = window.GUI;
  const state = new scratch.EditorState({ locale: 'de' });
  const fit = () => {
    const small = container.parentElement.clientWidth < (window.innerWidth >= 1096 ? 940 : 870);
    if (small !== compact) {
      compact = small;
      state.dispatch(scratch.setStageSize(small ? 'small' : 'large'));
    }
  };
  let compact;
  state.store.subscribe(() => {
    const value = state.store.getState().scratchGui.stageSize.stageSize;
    if (value) container.dataset.stage = value;
  });
  fit();
  new ResizeObserver(fit).observe(container.parentElement);
  const root = scratch.createStandaloneRoot(state, container);
  scratch.setAppElement(container);
  const vm = await new Promise(resolve => {
    root.render({
      onVmInit: resolve,
      basePath: new URL('./vendor/dist/', location.href).href,
      menuBarHidden: true, backpackVisible: false, canUseCloud: false, canSave: false,
      enableCommunity: false, showNewFeatureCallouts: false, isTelemetryEnabled: false
    });
  });
  const numbers = new Set();
  let turned = false;
  let currentRun = [];
  let timer;
  const sprites = () => vm.runtime.targets.filter(target => !target.isStage && target.isOriginal);
  vm.runtime.on('PROJECT_START', () => {
    clearTimeout(timer);
    currentRun = sprites().flatMap(target => flags(target).map(hat => {
      const stack = chain(target, hat);
      const move = stack.find(block => block.opcode === moveOpcode);
      return move && { target, x: target.x, y: target.y, direction: target.direction,
        amount: numberField(target, move, 'STEPS'), turn: stack.some(block => turnOpcodes.includes(block.opcode)) };
    }).filter(Boolean));
    timer = setTimeout(() => { currentRun = []; }, 240);
  });
  vm.runtime.on('TARGETS_UPDATE', () => {
    for (const { target, x, y, direction, amount, turn } of currentRun) {
      const moved = Math.hypot(target.x - x, target.y - y) > 0.1;
      if (moved && Number.isFinite(amount)) numbers.add(amount);
      if (turn && moved && target.direction !== direction) turned = true;
    }
  });

  return {
    has(check) {
      switch (check) {
        case 'move': return sprites().some(target => Object.values(target.blocks._blocks).some(block => block.opcode === moveOpcode));
        case 'stack': return sprites().some(target => flags(target).some(hat => chain(target, hat).some(block => block.opcode === moveOpcode)));
        case 'experiment': return numbers.size >= 2;
        case 'challenge': return turned;
        default: return true;
      }
    },
    async load(bytes) {
      currentRun = [];
      await vm.loadProject(bytes);
      numbers.clear();
      turned = false;
    },
    save() { return vm.saveProjectSb3(); },
    start() { vm.greenFlag(); },
    stop() { vm.stopAll(); },
    assist(action, steps) {
      const target = vm.editingTarget;
      if (!target || target.isStage) return 'Wähle zuerst eine Figur unter der Bühne.';
      const hat = flags(target)[0];
      const looseMove = scripts(target).find(block => block.opcode === moveOpcode);
      const moves = (hat ? chain(target, hat) : scripts(target)).filter(block => block.opcode === moveOpcode);
      if (action === 'try-move') {
        if (!looseMove) return 'Lege zuerst einen einzelnen Geh-Block auf die Codefläche.';
        vm.runtime.toggleScript(looseMove.id, { target, stackClick: true });
        return 'Beobachte die Figur auf der Bühne.';
      }
      const add = (opcode, field, value, parent) => {
        const y = Math.max(0, ...scripts(target).map(block => Number(block.y) || 0)) + 88;
        const block = createBlock(target, opcode, field, value, { x: 38, y });
        if (parent) target.blocks.moveBlock({ id: block.id, newParent: parent.id });
        return block;
      };
      let message;
      if (action === 'flag') {
        if (hat) return 'Die Figur hat bereits ein Startereignis.';
        const newHat = add(flagOpcode);
        if (looseMove) target.blocks.moveBlock({ id: looseMove.id, newParent: newHat.id });
        message = 'Startereignis eingefügt.';
      } else if (action === 'change') {
        const move = moves[0] ?? looseMove;
        const input = move && move.inputs.STEPS;
        if (!input || input.block !== input.shadow) return 'Wähle einen Geh-Block mit einem Zahlenfeld.';
        target.blocks.changeBlock({ id: input.block, element: 'field', name: 'NUM', value: String(steps) });
        message = `Schrittzahl auf ${steps} geändert.`;
      } else {
        if (action === 'turn' && !hat) return 'Füge zuerst ein Startereignis ein.';
        const parent = hat && chain(target, hat).at(-1);
        if (action === 'move') {
          add(moveOpcode, 'STEPS', steps, parent);
          message = 'Bewegungsblock eingefügt.';
        } else {
          add('motion_turnright', 'DEGREES', 15, parent);
          message = 'Drehblock eingefügt.';
        }
      }
      vm.refreshWorkspace();
      return message;
    }
  };
}
