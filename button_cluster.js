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

  _updateDimensions() {
    let {width, height} = this.$thumbstick.getBoundingClientRect();
    this._width = width;
    this._height = height;
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    const cluster = this.shadowRoot.querySelector(".cluster");
    if (this.ownerDocument.defaultView.matchMedia("(pointer: coarse)").matches) {
      //cluster.style.setProperty("--diameter", `calc(2 * ${cluster.style.getPropertyValue("--diameter")})`);
    }
    // remove implicit capture for button area so you can roll from one
    // button to another without lifting your finger:
    cluster.addEventListener('gotpointercapture', (e) => {
      console.log(e);
      e.target.releasePointerCapture(e.pointerId);
    });

    let i = 0;
    const me = this;
    this.$buttons = Array.from(cluster.querySelectorAll('.buttons .circle'));
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
  <style>
    .cluster {
        position: relative;
        touch-action: none;
        user-select: none;
        opacity: .5;
        overflow: hidden;
        --color: black;
        --diameter: 4cm;
        --button-diameter: 33%;
        --button-position: 28%;
    }
    @media (pointer: coarse) {
        .cluster {
            --diameter: 8cm;
        }
    }
    .thumbstick * {
        user-select: none;
    }
    .center {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }
    .circle {
        width: var(--diameter);
        height: var(--diameter);
        border-radius: 50%;
    }
    .background {
        background: var(--color);
        opacity: .5;
    }
    .buttons {
      --button-translate: calc((100% / var(--button-diameter)) * var(--button-position));
      position: absolute;
      width: 100%;
      height: 100%;
    }
    .buttons > :nth-child(1) {
      top: calc(50% + var(--button-position));
    }
    .buttons > :nth-child(2) {
      left: calc(50% + var(--button-position));
    }
    .buttons > :nth-child(3) {
      left: calc(50% - var(--button-position));
    }
    .buttons > :nth-child(4) {
      top: calc(50% - var(--button-position));
    }
    .buttons > * {
      --diameter: var(--button-diameter);
      background: var(--color);
    }
    .pressed {
      filter: invert(1);
    }
    .buttons text {
      font-family: sans;
      font-weight: bold;
      text-anchor: middle;
      font-size: .6;
      dominant-baseline: central;
      fill: grey;
    }
  </style>
  <div class="circle cluster">
    <div class="center circle background"></div>
    <div class="center buttons">
      <svg class="center circle" viewBox="0 0 1 1">
        <text x="50%" y="50%">A</text>
      </svg>
      <svg class="center circle" viewBox="0 0 1 1">
        <text x="50%" y="50%">B</text>
      </svg>
      <svg class="center circle" viewBox="0 0 1 1">
        <text x="50%" y="50%">X</text>
      </svg>
      <svg class="center circle" viewBox="0 0 1 1">
        <text x="50%" y="50%">Y</text>
      </svg>
    </div>
  </div>
`;

window.customElements.define('button-cluster-input', ButtonClusterInput);
