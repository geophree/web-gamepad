export class GamepadDisplay extends HTMLElement {
  $body;
  $stems;
  $buttons;
  $thumbstickWells;
  $thumbsticks;

  updateState(gamepad) {
    gamepad ??= {};
    const {
      connected = false,
      axes = [],
      buttons = [],
      id,
      index,
      mapping,
      timestamp
    } = gamepad;

    this.$body.classList.toggle('disconnected', !connected);

    this.$thumbsticks.forEach((e, i) => {
      let h = axes[2 * i];
      let v = axes[2 * i + 1];

      const disconnected = h == undefined || v == undefined;
      this.$thumbstickWells[i].classList.toggle('disconnected', disconnected);

      if (disconnected) h = v = 0;
      e.style.setProperty('--horizontal-axis', h);
      e.style.setProperty('--vertical-axis', v);

      const atan = Math.atan(v / h) || 0;
      const sign = Math.sign(h) || 1;
      const angle = (1 - sign) * Math.PI / 2 + atan;
      this.$stems[i].style.setProperty('--angle', angle);
    });

    this.$buttons.forEach((e, i) => {
      const button = buttons[i];
      e.classList.toggle('disconnected', !button);
      if (!button) return;
      const {
        touched = false,
        pressed = false,
        value = 0
      } = button;
      e.classList.toggle('touched', touched);
      e.classList.toggle('pressed', pressed);
      e.style.setProperty('--pressure', value);
    });

    // get extra buttons/axes
    return ['id', 'index', 'mapping', 'timestamp'].map((x) => [x, gamepad[x]]);
    // gamepad.id
    // gamepad.index
    // gamepad.mapping
    // gamepad.timestamp
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    const sel = (s) => this.shadowRoot.querySelector(s);
    this.$body = sel('#body');
    this.$stems = [sel('#leftstem'), sel('#rightstem')];
    this.$buttons = Array.from(sel('#buttons').children);
    this.$thumbsticks = [sel('#leftthumbstick'), sel('#rightthumbstick')];
    this.$thumbstickWells = [sel('#leftthumbstickwell'), sel('#rightthumbstickwell')];
  }
}

const template = document.createElement('template');
template.innerHTML = `
<svg viewBox="-1-1 152 82" xmlns="http://www.w3.org/2000/svg">
  <style>
    * {
      stroke: #FFF;
    }
    #leftstem, #rightstem {
      --angle: 0;
      transform-box: fill-box;
      transform-origin: center;
      transform: rotate(calc(var(--angle, 0) * 1rad));
    }
    #leftthumbstick, #rightthumbstick {
      --horizontal-axis: 0;
      --vertical-axis: 0;
      transform-box: fill-box;
      transform: translate(calc(var(--horizontal-axis, 0) * 50%), calc(var(--vertical-axis, 0) * 50%));
    }
    #buttons > * {
      --pressure: 0;
      fill: rgb(calc(var(--pressure, 0) * 255) 0 0);
    }
    .touched {
      stroke: #7F0000;
    }
    .pressed {
      stroke: #F00;
    }
    .disconnected {
      stroke: #999 !important;
      fill: #888 !important;
    }
  </style>
  <path id="body" d="M30 10a30 30 0 00 0 60h90a30 30 0 00 0-60z"/>
  <circle id="leftthumbstickwell" cx="55" cy="54" r="9"/>
  <circle id="rightthumbstickwell" cx="95" cy="54" r="9"/>
  <path id="leftstem" d="M55 54m0 4a4 4 0 01 0-8h4v8z"/>
  <path id="rightstem" d="M95 54m0 4a4 4 0 01 0-8h4v8z"/>
  <g id="buttons">
    <circle cx="120" cy="46" r="4"/>
    <circle cx="130" cy="36" r="4"/>
    <circle cx="110" cy="36" r="4"/>
    <circle cx="120" cy="26" r="4"/>
    <path d="M30 10a4 4 0 01 4-4h15a4 4 0 01 4 4z"/>
    <path d="M120 10a4 4 0 00-4-4h-15a4 4 0 00-4 4z"/>
    <path d="M35 5a2 2 0 01 2-2a1 1 0 00 1-1a2 2 0 01 2-2h5a3 3 0 01 3 3v2z"/>
    <path d="M115 5a2 2 0 00-2-2a1 1 0 01-1-1a2 2 0 00-2-2h-5a3 3 0 00-3 3v2zz"/>
    <circle cx="65" cy="36" r="3"/>
    <circle cx="85" cy="36" r="3"/>
    <circle id="leftthumbstick" cx="55" cy="54" r="6"/>
    <circle id="rightthumbstick" cx="95" cy="54" r="6"/>
    <path d="M30 35l-4-4v-8h8v8z"/>
    <path d="M30 37l4 4v8h-8v-8z"/>
    <path d="M29 36l-4-4h-8v8h8z"/>
    <path d="M31 36l4-4h8v8h-8z"/>
    <circle cx="75" cy="27" r="5"/>
  </g>
</svg>
`;

window.customElements.define('gamepad-display', GamepadDisplay);
