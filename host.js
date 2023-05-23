import { Gamepads } from './get_gamepads.js';
import './gamepad.js';
import './gamepad_display.js';
import './qr.js';
import './wakelock.js';

const WEB_GAMEPAD_URL = 'https://geophree.github.io/web-gamepad/';
const letters = 'BCDFGHJKLMNPQRSTVWXZ';
const getLetter = () => letters.charAt(Math.floor(Math.random() * letters.length));

export async function startHost() {
  let roomCode = Array.from({ length: 4 }, getLetter).join('');
  const peerId = [...new Uint8Array(await crypto.subtle.digest("SHA-1", new TextEncoder("utf-8").encode(roomCode)))]
    .map(x => x.toString(16).padStart(2, '0'))
    .join('');

  const peer = new Peer(peerId);//, {debug: 3});
  window.peer = peer;
  peer.on('error', console.log);
  peer.on('connection', (conn) => {
    conn.on('error', console.log);
    conn.on('open', () => {
      let heldGamepads = [];
      let heldTimestamp = 0;
      const target = new EventTarget();
      Gamepads.register(target, () => heldGamepads);

      conn.on('data', (data) => {
        if (data?.type != 'gamepads' || data.timestamp <= heldTimestamp) return;
        const oldGamepads = heldGamepads;
        heldTimestamp = data.timestamp;
        heldGamepads = data.gamepads;
        for (const gamepad of heldGamepads) {
          const { index, connected } = gamepad;
          const oldGamepad = oldGamepads[index];
          if (oldGamepad?.connected === connected) continue;
          const eventName = (connected) ? 'gamepadconnected' : 'gamepaddisconnected';
          const event = new Event(eventName);
          event.gamepad = gamepad;
          target.dispatchEvent(event);
        }
      });
      conn.on('close', () => {
        console.log('connection close');
        for (const gamepad of heldGamepads) {
          gamepad.connected = false;
        }
        for (const gamepad of heldGamepads) {
          const event = new Event('gamepaddisconnected');
          event.gamepad = gamepad;
          target.dispatchEvent(event);
        }
      });
      conn.peerConnection.addEventListener("connectionstatechange", (event) => {
        if (conn.peerConnection.connectionState === 'disconnected') {
          conn.close();
        }
      });
    });
  });

  const playerUrl = new URL(WEB_GAMEPAD_URL);
  playerUrl.hash = '?rc=' + roomCode;
  const qr = document.createElement('url-qr-code');
  qr.href = playerUrl.toString();

  return qr;
}

  const style = document.createElement('style');
  style.textContent = `
  gamepad-input {
    position: absolute;
    inset: 0;
    transform: translate(calc(var(--x, 0) * 1px), calc(var(--y, 0) * 1px));
    height: 10vmin;
    width: 10vmin;
    border-radius: 50%;
  }`;
  document.head.appendChild(style);

  window.addEventListener('gamepadconnected', (e) => {
    const padDisplay = document.createElement('gamepad-input');
    padDisplay.overlap = '';
    padDisplay.style.background = `hsl(${Math.random()}turn,100%,65%)`;
    padDisplay.value = e.gamepad;
    document.body.appendChild(padDisplay);

    const disconnect = ({gamepad}) => {
      if (padDisplay.value.index !== gamepad.index) return;
      padDisplay.remove();
      padDisplay.value = gamepad;
      window.removeEventListener('gamepaddisconnected', disconnect);
    };
    window.addEventListener('gamepaddisconnected', disconnect);

    let lastUpdate = Date.now();
    let x = 0;
    let y = 0;
    let lastPadTimestamp = Date.now();
    const updateDisplay = () => {
      if (!padDisplay.value.connected) return;
      const gamepad = navigator.getGamepads()[padDisplay.value.index];
      if (!gamepad?.connected) return;
      const timestamp = gamepad?.timestamp;
      if (timestamp != lastPadTimestamp) {
        padDisplay.value = gamepad;
        lastPadTimestamp = timestamp;
      }
      const currentTime = Date.now();
      const deltaTime = currentTime - lastUpdate;

      const deadZone = (axis) =>
        Math.sign(axis) * Math.max(Math.abs(axis) - .1, 0) / .9;
      let xAxis = deadZone(gamepad.axes[0]);
      let yAxis = deadZone(gamepad.axes[1]);
      if (xAxis**2 + yAxis**2 > 1) {
        let theta = Math.atan(yAxis / xAxis);
        let sign = Math.sign(xAxis);
        xAxis = sign * Math.cos(theta);
        yAxis = sign * Math.sin(theta);
      }

      x += xAxis * deltaTime;
      y += yAxis * deltaTime;
      const maxX = window.innerWidth - padDisplay.offsetWidth;
      const maxY = window.innerHeight - padDisplay.offsetHeight;
      x = (x < 0) ? 0 : (x > maxX) ? maxX : x;
      y = (y < 0) ? 0 : (y > maxY) ? maxY : y;
      padDisplay.style.setProperty('--x', x);
      padDisplay.style.setProperty('--y', y);
      lastUpdate = currentTime;
      requestAnimationFrame(updateDisplay);
    }
    updateDisplay();
  });

