// stop device from sleeping
let wakeLock = null;
const requestWakeLock = async () => {
  if (wakeLock !== null || document.visibilityState !== 'visible') {
    return;
  }
  try {
    wakeLock = await navigator.wakeLock?.request('screen');
    wakeLock?.addEventListener('release', () => wakeLock = null);
  } catch (err) {
    // Do nothing
  }
}

if (window.isSecureContext) {
  document.addEventListener('visibilitychange', requestWakeLock);
  requestWakeLock();
}
