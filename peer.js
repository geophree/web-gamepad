export let Peer = window.Peer;
if (!Peer) {
  Peer = await new Promise((res, rej) => {
    const script = document.createElement('script');
    script.onload = () => res(window.Peer);
    script.onerror = rej;
    script.src = 'https://unpkg.com/peerjs@1.4.7/dist/peerjs.js';
    document.body.appendChild(script);
  });
}
if (!Peer) throw new Error('Requires Peer.js library');
