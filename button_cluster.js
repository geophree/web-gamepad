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

    const cluster = root.querySelector("#cluster");
    // remove implicit capture for button area so you can roll from one
    // button to another without lifting your finger:
    cluster.addEventListener('gotpointercapture', (e) => {
      e.target.releasePointerCapture(e.pointerId);
    });

    let i = 0;
    const me = this;
    this.$buttons = Array.from(root.querySelectorAll('#buttons > *'));
    this.$buttons.forEach((e) => {
      let index = i;
      const down = (e) => {
        if (e.buttons & 1) me._updateOne(index, e.pressure);
      };
      e.addEventListener('pointerenter', down);
      e.addEventListener('pointermove', down);
      e.addEventListener('pointerdown', down);
      const up = (e) => me._updateOne(index, 0);
      e.addEventListener('pointerout', up);
      e.addEventListener('pointerup', up);
      i++;
    });
    this.value = [0, 0, 0, 0];
  }
}

const template = document.createElement('template');
template.innerHTML = `
<svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
  <style>
    * {
      pointer-events: none;
      touch-action: none;
      user-select: none;
      fill: black;
      --button-diameter: 33%;
    }
    #cluster {
      opacity: .5;
    }
    /*#cluster,*/ #buttons circle {
      pointer-events: auto;
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
      --angle: -90deg;
    }
    #buttons > * {
      transform-origin: center;
      transform-box: fill-box;
      transform: rotate(var(--angle)) translate(27%) rotate(calc(-1 * var(--angle))) scale(var(--button-diameter));
    }
    .pressed {
      filter: invert(1);
    }
    text {
      font-family: sans;
      font-weight: bold;
      text-anchor: middle;
      font-size: 6;
      dominant-baseline: central;
      fill: grey;
    }
  </style>
  <g style="opacity: .5">
    <circle id="cluster" cx="5" cy="5" r="5"/>
    <g id="buttons">
      <g>
        <circle cx="5" cy="5" r="5"/>
        <text x="50%" y="50%">A</text>
      </g>
      <g>
        <circle cx="5" cy="5" r="5"/>
        <text x="50%" y="50%">B</text>
      </g>
      <g>
        <circle cx="5" cy="5" r="5"/>
        <text x="50%" y="50%">X</text>
      </g>
      <g>
        <circle cx="5" cy="5" r="5"/>
        <text x="50%" y="50%">Y</text>
      </g>
    </g>
  </g>
</svg>
`;

window.customElements.define('button-cluster-input', ButtonClusterInput);
