export class ThumbstickInput extends HTMLElement {
  $thumbstick;
  $nubbin;
  _boundingRect;
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
    this.$nubbin.style.setProperty('--horizontal-axis', horiz);
    this.$nubbin.style.setProperty('--vertical-axis', vert);
    // TODO(geophree): make it able to switch to callback
    // callback(horiz, vert);
    this._value = [horiz, vert];
    this.dispatchEvent(new InputEvent('input'));
  }

  _updateDimensions() {
    this._boundingRect = this.$thumbstick.getBoundingClientRect();
  }

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.appendChild(template.content.cloneNode(true));

    this.$thumbstick = root.querySelector("#thumbstick");
    let pointerId;
    this.$nubbin = root.querySelector("#nubbin");
    this._updateDimensions();

    let recordXY = ((e) => {
      if (pointerId != e.pointerId) return;
      let { x, y, width, height } = this._boundingRect;
      let horiz = 2 * ((e.x - x) / width) - 1;
      let vert = 2 * ((e.y - y) / height) - 1;
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
svg {
  height: 100%;
  width: 100%;
}
</style>
<svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
  <style>
    * {
      pointer-events: none;
      touch-action: none;
      fill: currentColor;
      --center-diameter: 40%;
      --arrow-width: 12%;
    }
    #thumbstick {
      pointer-events: auto;
      opacity: .5;
    }
    #arrows > :nth-child(1) {
      --angle: 0deg;
    }
    #arrows > :nth-child(2) {
      --angle: 90deg;
    }
    #arrows > :nth-child(3) {
      --angle: 180deg;
    }
    #arrows > :nth-child(4) {
      --angle: -90deg;
    }
    #arrows > * {
      transform-origin: center;
      transform-box: fill-box;
      transform: rotate(var(--angle)) translate(calc(50% + var(--center-diameter) / 2)) scale(var(--arrow-width));
    }
    #arrows45 {
      transform-origin: center;
      transform: rotate(45deg);
    }
    #nubbin {
      r: calc(var(--center-diameter) / 2);
      --horizontal-axis: 0;
      --vertical-axis: 0;
      transform: translate(calc(var(--horizontal-axis, 0) * 50%), calc(var(--vertical-axis, 0) * 50%));
    }
  </style>
  <defs>
    <clipPath id="bounds">
      <use href="#thumbstick"/>
    </clipPath>
    <path id="arrow" d="M7.5 5l-5-5v10z"/>
  </defs>
  <g style="opacity: .5" clip-path="url(#bounds)">
    <circle id="thumbstick" cx="5" cy="5" r="5"/>
    <g id="arrows">
      <use href="#arrow"/>
      <use href="#arrow"/>
      <use href="#arrow"/>
      <use href="#arrow"/>
    </g>
    <use id="arrows45" href="#arrows"/>
    <circle id="nubbin" cx="5" cy="5"/>
  </g>
</svg>
`;

window.customElements.define('thumbstick-input', ThumbstickInput);
