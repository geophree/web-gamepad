export class ButtonClusterInput extends HTMLElement {
  $buttons;
  _value = [0, 0, 0, 0];

  get value() {
    return this._value;
  }

  set value(buttons) {
    let i = 0;
    const me = this;
    let changed = false;
    this.$buttons.forEach((e) => {
      const index = i;
      i++;
      let val = parseFloat(buttons[index]);
      if (isNaN(val) || val < 0 || val > 1 || val === me._value[index]) return;
      val = val > 1 ? 1 : val < 0 ? 0 : val;
      me._value[index] = val;
      changed = true;
      e.classList.toggle('pressed', val > 0);
    });
    if (changed) this.dispatchEvent(new InputEvent('input'));
  }

  _updateOne(index, val) {
    val = val > 1 ? 1 : val < 0 ? 0 : val;
    if (val === this._value[index]) return;
    this._value[index] = val;
    this.$buttons[index].classList.toggle('pressed', val > 0);
    this.dispatchEvent(new InputEvent('input'));
  }

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.appendChild(template.content.cloneNode(true));

    const cluster = root.querySelector('#cluster');
    // remove implicit capture for button area so you can roll from one
    // button to another without lifting your finger:
    cluster.addEventListener('gotpointercapture', (e) => {
      e.target.releasePointerCapture(e.pointerId);
    });

    let i = 0;
    const me = this;
    this.$buttons = Array.from(root.querySelectorAll('#buttons > *'));
    this.$buttons.forEach((el) => {
      let index = i;
      const down = (e) => {
        // in GNOME Web (WebKit), pressure is always 0.
        if (e.buttons & 1) me._updateOne(index, e.pressure || 1);
      };
      el.addEventListener('pointerenter', down);
      el.addEventListener('pointermove', down);
      el.addEventListener('pointerdown', down);

      const up = (e) => me._updateOne(index, 0);
      el.addEventListener('pointerout', up);
      el.addEventListener('pointerup', up);

      // remove implicit capture for button area so you can roll from one
      // button to another without lifting your finger:
      el.addEventListener('gotpointercapture', (e) => {
        e.target.releasePointerCapture(e.pointerId);
      });

      i++;
    });
    this.value = [0, 0, 0, 0];
  }
}

const template = document.createElement('template');
template.innerHTML = `
<style>
svg {
  height: 100%;
  width: 100%;
}
</style>
<svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
  <filter id="invert">
    <feColorMatrix in="SourceGraphic" type="matrix" values="-1 0 0 0 1
                                                            0 -1 0 0 1
                                                            0 0 -1 0 1
                                                            0 0 0 1 0"/>
  </filter>
  <style>
    * {
      pointer-events: none;
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
      fill: currentColor;
      --button-diameter: 33%;
    }
    circle {
      pointer-events: auto;
    }
    #cluster {
      opacity: .5;
    }
    #buttons {
      opacity: .75;
    }
    #buttons > :nth-child(1) {
      --angle: 90deg;
    }
    #buttons > :nth-child(2) {
      --angle: 0deg;
    }
    #buttons > :nth-child(3) {
      --angle: 180deg;
    }
    #buttons > :nth-child(4) {
      --angle: 270deg;
    }
    #buttons * {
      transform-origin: center;
      transform-box: fill-box;
      transform: rotate(var(--angle)) translate(27%) rotate(calc(-1 * var(--angle))) scale(var(--button-diameter));
    }
    .pressed {
      /* GNOME Web (WebKit) doesn't like invert(1), use an svg filter instead. */
      filter: url(#invert);
    }
    mask rect {
      width: 100%;
      height: 100%;
      fill: white;
    }
    mask text {
      font-family: sans-serif;
      font-weight: bold;
      text-anchor: middle;
      font-size: 6;
      dominant-baseline: central;
      fill: black;
    }
  </style>
  <mask id="A">
    <rect/>
    <text x="50%" y="50%">A</text>
  </mask>
  <mask id="B">
    <rect/>
    <text x="50%" y="50%">B</text>
  </mask>
  <mask id="X">
    <rect/>
    <text x="50%" y="50%">X</text>
  </mask>
  <mask id="Y">
    <rect/>
    <text x="50%" y="50%">Y</text>
  </mask>
  <g style="opacity: .5">
    <circle id="cluster" cx="5" cy="5" r="5"/>
    <g id="buttons">
      <circle cx="5" cy="5" r="5" mask="url(#A)"/>
      <circle cx="5" cy="5" r="5" mask="url(#B)"/>
      <circle cx="5" cy="5" r="5" mask="url(#X)"/>
      <circle cx="5" cy="5" r="5" mask="url(#Y)"/>
    </g>
  </g>
</svg>
`;

window.customElements.define('button-cluster-input', ButtonClusterInput);
