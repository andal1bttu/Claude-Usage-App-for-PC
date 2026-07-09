# Claude Usage

A small Windows desktop widget that shows your Claude.ai session and weekly usage limits at a glance. Pixel-art wizard mascot included. Not an official Anthropic app.

## What it does

- Reads your Claude.ai session and weekly usage limits directly from your logged-in account
- Shows two live bars: session limit (5 hour window) and weekly limit (7 day window), each with a countdown to reset
- Mascot face expression changes with your session usage: happy under 50%, neutral at 50%, sad over 50%
- Two display modes: full wizard portrait, or a compact Tamagotchi-style round screen
- Lives in the system tray, floats in a corner of your screen, draggable, stays out of the way

## How it works

The app opens a normal Claude.ai login page inside the app (the same page you would see in a browser). You log in there once. After that, it polls Claude's own `usage` endpoint on an interval, the same data your account's usage page shows you, and renders it on the mascot.

No password, API key, or account data is sent anywhere outside your own machine. There is no backend server. The login session lives only in the app's local, isolated browser profile.

## Install

Download the latest installer from the Releases page and run it. Windows only for now.

## Use

1. Launch the app. A login window opens, pointed at claude.ai.
2. Log in with your normal Claude account.
3. The window closes itself and the widget appears in the corner of your screen with live numbers.
4. Right-click the tray icon to switch between Wizard and Tamagotchi mode, refresh manually, re-login, or quit.
5. Click the small `x` on the widget to hide it. Reopen from the tray icon.

## Build from source

```
npm install
npm run assets   # regenerates the mascot art from source PNGs
npm start         # run in dev mode
npm run dist       # build a Windows installer
```

## Status

Early build. The "extra purchased usage" indicator (for accounts that have bought additional usage beyond the plan limit) is not implemented yet.

## License

MIT
