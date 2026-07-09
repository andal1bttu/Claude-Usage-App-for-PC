const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

const SRC = 'G:/My Drive/Obsidian/Andalib Master Vault/Social Media/Projects with Claude Code/Content-Studio/01 Planning/Brainstorming/App for Claude Usage';
const OUT = path.join(__dirname, '..', 'renderer', 'assets');

const PANEL_COLOR = { r: 166, g: 167, b: 152 };

// Regions inside the panel that are static baked art and must NOT be blanked:
// the face icon (frame + eyes; mouth is swapped separately) and the "CLAUDE USAGE" title.
const WIZARD_ICON_BOX = { x: 389, y: 1335, w: 74, h: 74 };
const WIZARD_TITLE_BOX = { x: 462, y: 1342, w: 250, h: 50 };
const WIZARD_MOUTH_BOX = { x: 408, y: 1382, w: 28, h: 15 };
// The wizard's pointing finger crosses into the panel above/beside the icon - preserve it.
const WIZARD_HAND_BOX = { x: 185, y: 1265, w: 225, h: 275 };
const WIZARD_PANEL_BOX = { minX: 301, minY: 1269, maxX: 742, maxY: 1736 };

const TAMA_ICON_BOX = { x: 214, y: 248, w: 98, h: 102 };
const TAMA_TITLE_BOX = { x: 328, y: 296, w: 256, h: 32 };
const TAMA_MOUTH_BOX = { x: 243, y: 311, w: 31, h: 16 };
const TAMA_PANEL_BOX = { minX: 169, minY: 225, maxX: 614, maxY: 691 };

function inBox(x, y, box) {
  return x >= box.x && x < box.x + box.w && y >= box.y && y < box.y + box.h;
}

async function blankPanelKeepingIcon(srcFile, outFile, panelBox, keepBoxes) {
  const img = await Jimp.read(path.join(SRC, srcFile));
  const { width, data } = img.bitmap;
  for (let y = panelBox.minY; y <= panelBox.maxY; y++) {
    for (let x = panelBox.minX; x <= panelBox.maxX; x++) {
      if (keepBoxes.some((b) => inBox(x, y, b))) continue;
      const i = (y * width + x) * 4;
      data[i] = PANEL_COLOR.r;
      data[i + 1] = PANEL_COLOR.g;
      data[i + 2] = PANEL_COLOR.b;
      data[i + 3] = 255;
    }
  }
  const outPath = path.join(OUT, outFile);
  await img.write(outPath);
  console.log('wrote', outPath, img.bitmap.width, img.bitmap.height);
}

async function extractMouth(srcFile, box, outFile) {
  const img = await Jimp.read(path.join(SRC, srcFile));
  img.crop({ x: box.x, y: box.y, w: box.w, h: box.h });
  const outPath = path.join(OUT, outFile);
  await img.write(outPath);
  console.log('wrote', outPath);
}

async function buildTrayIcon() {
  const img = await Jimp.read(path.join(SRC, 'App UI_Tamagotchi Only_Neutral_50.png'));
  img.resize({ w: 64, h: 64 });
  const outPath = path.join(OUT, 'tray-icon.png');
  await img.write(outPath);
  console.log('wrote', outPath);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });

  await blankPanelKeepingIcon('App UI_Neutral_50.png', 'wizard-frame.png', WIZARD_PANEL_BOX, [
    WIZARD_ICON_BOX,
    WIZARD_TITLE_BOX,
    WIZARD_HAND_BOX
  ]);
  await blankPanelKeepingIcon('App UI_Tamagotchi Only_Neutral_50.png', 'tama-frame.png', TAMA_PANEL_BOX, [
    TAMA_ICON_BOX,
    TAMA_TITLE_BOX
  ]);

  await extractMouth('App UI_Happy_Less than 50.png', WIZARD_MOUTH_BOX, 'mouth-wizard-happy.png');
  await extractMouth('App UI_Neutral_50.png', WIZARD_MOUTH_BOX, 'mouth-wizard-neutral.png');
  await extractMouth('App UI_Sad_More than 50.png', WIZARD_MOUTH_BOX, 'mouth-wizard-sad.png');

  await extractMouth('App UI_Tamagotchi Only_Happy_Less than 50.png', TAMA_MOUTH_BOX, 'mouth-tama-happy.png');
  await extractMouth('App UI_Tamagotchi Only_Neutral_50.png', TAMA_MOUTH_BOX, 'mouth-tama-neutral.png');
  await extractMouth('App UI_Tamagotchi Only__Sad_More than 50.png', TAMA_MOUTH_BOX, 'mouth-tama-sad.png');

  await buildTrayIcon();

  console.log('\nBox reference for renderer CSS (percent of full canvas):');
  console.log('wizard canvas 998x1953, mouth box', WIZARD_MOUTH_BOX);
  console.log('tama canvas 819x872, mouth box', TAMA_MOUTH_BOX);
})();
