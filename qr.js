export class URLQRCode extends HTMLElement {
  $image;
  $text;
  $a;

  static get observedAttributes() {
    return ['href'];
  }

  get href() {
    return this.getAttribute('href');
  }

  set href(val) {
    if (val) {
      this.setAttribute('href', val);
    } else {
      this.removeAttribute('href');
    }
  }

  async attributeChangedCallback(attrName, oldVal, newVal) {
    if (attrName === 'href') {
      const href = newVal.toString();
      console.log({ href });
      this.$text.textContent = href;
      this.$a.setAttribute('href', href);
      const QRCode = this.ownerDocument.defaultView.QRCode;
      if (!QRCode) {
        this.$text.textContent = "Requires QRCode library";
      } else {
        this.$image.setAttribute('href',  await QRCode.toDataURL(href));
      }
    }
  }

  constructor() {
    super();
    const me = this;
    const root = me.attachShadow({ mode: 'open' });
    root.appendChild(template.content.cloneNode(true));
    me.$image = root.querySelector('image');
    me.$text = root.querySelector('text');
    me.$a = root.querySelector('a');
  }
}

const template = document.createElement('template');
template.innerHTML = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <style>
    image {
      image-rendering: pixelated;
    }
    text {
      font-family: sans;
      text-anchor: middle;
      font-size: 5;
      dominant-baseline: top;
    }
  </style>
  <a>
  <image width="100" height="100" />
  <text x="50%" y="5"></text>
  </a>
</svg>
`;

window.customElements.define('url-qr-code', URLQRCode);
