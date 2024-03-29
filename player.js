import './gamepad.js';
import './wakelock.js';
import { Gamepads } from './get_gamepads.js';
import { Peer } from './peer.js';

function error(e) {
  console.error(e);

  const template = document.createElement('template');
  template.innerHTML = `
    <dialog open style="position: absolute; inset: 0; font: 3vw sans-serif; padding: .5em 1em; background-color: #D02; border: 0; color: #FFF; border-radius: .25em">
      <p style="margin: 0">${e}</p>
      <form method="dialog" style="margin: 0; position: absolute; inset: 0 0 auto auto">
        <button style="all: unset; padding-right: .25em">&times;</button>
      </form>
    </dialog>
  `;

  document.body.append(template.content);
}

export async function startPlayer(roomCode) {
  const pad = document.createElement('gamepad-input');
  document.body.appendChild(pad);

  if (!window.isSecureContext) {
    error('web gamepad requires a secure context');
    // tell user we require secure context
    return;
  }

  const peerId = [...new Uint8Array(await crypto.subtle.digest("SHA-1", new TextEncoder("utf-8").encode(roomCode)))]
    .map(x => x.toString(16).padStart(2, '0'))
    .join('');
  const peer = new Peer();
  peer.on('error', error);
  peer.on('open', (id) => {
    if (!peerId) return;
    const conn = peer.connect(peerId);
    window.peer = peer;
    conn.on('error', error);
    conn.on('open', () => {
      conn.on('data', (data) => {
        if (data?.type != 'background') return;
        document.body.style.background = data.background;
      });
      // // TODO(geophree): find a way to make this work
      // // maybe we also want to do it on visibility change?
      // window.addEventListener('beforeunload', () => {
      //   conn.dataChannel.close();
      //   conn.close();
      // });
      const sentGamepads = [];
      const target = new EventTarget();

      const sendData = (force) => {
        const gamepads = navigator.getGamepads();
        let sendGamepads = force;
        for (const gamepad of gamepads) {
          const i = gamepad.index;
          sentGamepads[i] ??= {};
          const sentGamepad = sentGamepads[i];
          if (sentGamepad.timestamp >= gamepad.timestamp) continue;
          sendGamepads = true;
          for (const prop of ['axes', 'connected', 'id', 'index', 'mapping', 'timestamp']) {
            const val = gamepad[prop];
            if (val !== undefined) sentGamepad[prop] = val;
          }
          if (gamepad.buttons) {
            sentGamepad.buttons = gamepad.buttons.map(
              ({pressed, touched, value}) => ({pressed, touched, value})
            );
          }
        }
        if (sendGamepads) {
          conn.send({type: 'gamepads', timestamp: Date.now(), gamepads: sentGamepads});
        }
      }

      document.querySelectorAll('gamepad-input').forEach((el, index) => {
        el.addEventListener('input', () => sendData());
      });

      const sendDataOnAnimationFrame = () => {
        sendData(true);
        requestAnimationFrame(sendDataOnAnimationFrame);
      }
      sendData();
    });
  });

  {
    const gamepadInputs = document.querySelectorAll('gamepad-input');
    const target = new EventTarget();

    gamepadInputs.forEach((el, index) => {
      el.value = { index };

      const sendConnected = (e) => {
        if (!e.target.value.connected) return;

        el.removeEventListener('input', sendConnected);
        const event = new Event('gamepadconnected');
        event.gamepad = e.target.value;
        target.dispatchEvent(event);
      };

      el.addEventListener('input', sendConnected);
    });

    Gamepads.register(target, () => Array.from(gamepadInputs, el => el.value));
  }
}
