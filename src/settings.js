const fs = require('fs');
const path = require('path');
const { app } = require('electron');

let filePath = null;
function getPath() {
  if (!filePath) filePath = path.join(app.getPath('userData'), 'settings.json');
  return filePath;
}

const defaults = {
  mode: 'wizard', // 'wizard' | 'tama'
  windowX: null,
  windowY: null
};

function load() {
  try {
    const raw = fs.readFileSync(getPath(), 'utf8');
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return { ...defaults };
  }
}

function save(partial) {
  const current = load();
  const next = { ...current, ...partial };
  fs.writeFileSync(getPath(), JSON.stringify(next, null, 2));
  return next;
}

module.exports = { load, save };
