import { Gamepads } from './get_gamepads.js';
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
