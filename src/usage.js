const { BrowserWindow, session } = require('electron');
const { EventEmitter } = require('events');

const PARTITION = 'persist:claude-usage';
const POLL_INTERVAL_MS = 2 * 60 * 1000;
const LOGIN_CHECK_INTERVAL_MS = 2000;

class UsageService extends EventEmitter {
  constructor() {
    super();
    this.authWindow = null;
    this.orgId = null;
    this.pollTimer = null;
    this.loginCheckTimer = null;
  }

  async start() {
    this.authWindow = new BrowserWindow({
      width: 480,
      height: 720,
      show: false,
      title: 'Log in to Claude',
      webPreferences: {
        partition: PARTITION,
        sandbox: true
      }
    });

    this.authWindow.on('closed', () => {
      this.authWindow = null;
    });

    await this.authWindow.loadURL('https://claude.ai/login');
    this._waitForLogin();
  }

  async _getOrgId() {
    const ses = session.fromPartition(PARTITION);
    const cookies = await ses.cookies.get({ name: 'lastActiveOrg' });
    const cookie = cookies.find((c) => c.domain && c.domain.includes('claude.ai'));
    return cookie ? cookie.value : null;
  }

  _waitForLogin() {
    if (this.loginCheckTimer) clearInterval(this.loginCheckTimer);
    this.loginCheckTimer = setInterval(async () => {
      const orgId = await this._getOrgId();
      if (orgId) {
        clearInterval(this.loginCheckTimer);
        this.loginCheckTimer = null;
        this.orgId = orgId;
        if (this.authWindow && !this.authWindow.isDestroyed()) {
          this.authWindow.hide();
        }
        this.emit('auth-ok');
        this._startPolling();
      } else if (this.authWindow && !this.authWindow.isDestroyed() && !this.authWindow.isVisible()) {
        // Not logged in yet and window is hidden - show it so the user can log in.
        this.authWindow.show();
        this.emit('auth-required');
      }
    }, LOGIN_CHECK_INTERVAL_MS);
  }

  showLogin() {
    if (this.authWindow && !this.authWindow.isDestroyed()) {
      this.authWindow.show();
    }
  }

  _startPolling() {
    this.refresh();
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = setInterval(() => this.refresh(), POLL_INTERVAL_MS);
  }

  async refresh() {
    if (!this.authWindow || this.authWindow.isDestroyed() || !this.orgId) return;
    try {
      const script = `fetch('https://claude.ai/api/organizations/${this.orgId}/usage', { credentials: 'include' }).then(r => r.json())`;
      const raw = await this.authWindow.webContents.executeJavaScript(script);
      const parsed = this._parse(raw);
      if (parsed) this.emit('usage', parsed);
    } catch (err) {
      this.emit('error', err);
    }
  }

  _parse(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const normalize = (w, hours) => {
      if (!w || typeof w.utilization !== 'number' || !Number.isFinite(w.utilization)) return null;
      return {
        utilization: Math.max(0, Math.min(100, w.utilization)),
        resets_at: typeof w.resets_at === 'string' ? w.resets_at : null,
        window_hours: hours
      };
    };
    const five_hour = normalize(raw.five_hour, 5);
    const seven_day = normalize(raw.seven_day, 24 * 7);
    if (!five_hour && !seven_day) return null;
    return { five_hour, seven_day };
  }

  stop() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.loginCheckTimer) clearInterval(this.loginCheckTimer);
    if (this.authWindow && !this.authWindow.isDestroyed()) this.authWindow.destroy();
  }
}

module.exports = { UsageService };
