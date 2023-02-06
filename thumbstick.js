export class ThumbstickInput extends HTMLElement {
  $thumbstick;
  $nubbin;
  _nubbinTransform;
  _width;
  _height;
  _value = [0, 0];

  get value() {
    return this._value;
  }

  set value(axes) {
    let [horiz, vert] = axes;
    if (horiz == null || vert == null) return;
    // cap vector magnitude at 1
    // square root isn't needed because sqrt(1) === 1
    if (horiz**2 + vert**2 > 1) {
      let theta = Math.atan(vert / horiz);
      let sign = Math.sign(horiz);
      horiz = sign * Math.cos(theta);
      vert = sign * Math.sin(theta);
    }
    const translateX = horiz * this._width / 2;
    const translateY = vert * this._height / 2;
    this._nubbinTransform.translateSelf(translateX, translateY);
    this.$nubbin.style.transform = this._nubbinTransform;
    this._nubbinTransform.translateSelf(-translateX, -translateY);
    // TODO(geophree): make it able to switch to callback
    // callback(horiz, vert);
    this._value = [horiz, vert];
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

    this.$thumbstick = this.shadowRoot.querySelector(".thumbstick");
    let pointerId;
    this.$nubbin = this.$thumbstick.querySelector(".nubbin");
    this._nubbinTransform = new DOMMatrix();
    this._updateDimensions();

    let recordXY = ((e) => {
      if (pointerId != e.pointerId) return;
      let horiz = 2 * (e.offsetX / this._width) - 1;
      let vert = 2 * (e.offsetY / this._height) - 1;
      this.value = [horiz, vert];
      e.stopPropagation();
      e.preventDefault();
    }).bind(this);

    let startCapture = ((e) => {
      this.$thumbstick.removeEventListener('pointerdown', startCapture);
      this._updateDimensions();
      pointerId = e.pointerId;
      this.$thumbstick.setPointerCapture(pointerId);
      this.$thumbstick.addEventListener('pointermove', recordXY);
      recordXY(e);
    }).bind(this);

    let endCapture = (() => {
      this.$thumbstick.addEventListener('pointerdown', startCapture);
      this.$thumbstick.removeEventListener('pointermove', recordXY);
      this.value = [0,0];
    }).bind(this);

    this.$thumbstick.addEventListener('lostpointercapture', endCapture);
    endCapture();
  }
}

const template = document.createElement('template');
template.innerHTML = `
  <style>
    .thumbstick {
        position: relative;
        touch-action: none;
        opacity: .5;
        overflow: hidden;
        --color: black;
        --diameter: 4cm;
        --center-diameter: 40%;
        --arrow-width: 12%;
    }
    @media (pointer: coarse) {
        .thumbstick {
            --diameter: 8cm;
        }
    }
    .thumbstick * {
        pointer-events: none;
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
    .arrows, .arrows * {
        width: 100%;
        height: 100%;
    }
    .arrows > div {
        position: absolute;
    }
    .arrows > :nth-child(2) {
        transform: rotate(90deg);
    }
    .arrows > :nth-child(3) {
        transform: rotate(180deg);
    }
    .arrows > :nth-child(4) {
        transform: rotate(-90deg);
    }
    .arrows > :nth-child(5) {
        transform: rotate(45deg);
    }
    .arrows > :nth-child(6) {
        transform: rotate(135deg);
    }
    .arrows > :nth-child(7) {
        transform: rotate(-135deg);
    }
    .arrows > :nth-child(8) {
        transform: rotate(-45deg);
    }
    .arrows > div > div {
        transform: translate(calc( ( 100% + var(--center-diameter) ) / 4 ));
    }
    .arrows > div > div > div {
        width: var(--arrow-width);
        height: var(--arrow-width);
        transform: translate(-25%, -50%);
        overflow: hidden;
    }
    .arrows > div > div > div > div {
        background: var(--color);
        transform: translate(-71%) rotate(45deg);
    }
    .nubbin-container {
        --diameter: var(--center-diameter);
    }
    .nubbin {
        --diameter: 100%;
        background: var(--color);
    }
  </style>
  <div class="circle thumbstick">
    <div class="center circle background"></div>
    <div class="center arrows">
      <div><div><div class="center"><div></div></div></div></div>
      <div><div><div class="center"><div></div></div></div></div>
      <div><div><div class="center"><div></div></div></div></div>
      <div><div><div class="center"><div></div></div></div></div>
      <div><div><div class="center"><div></div></div></div></div>
      <div><div><div class="center"><div></div></div></div></div>
      <div><div><div class="center"><div></div></div></div></div>
      <div><div><div class="center"><div></div></div></div></div>
    </div>
    <div class="center circle nubbin-container">
      <div class="circle nubbin"></div>
    </div>
  </div>
`;

window.customElements.define('thumbstick-input', ThumbstickInput);
