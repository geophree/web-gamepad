// stop device from sleeping
let wakeLock = null;
const requestWakeLock = async () => {
  if (wakeLock !== null || document.visibilityState !== 'visible') {
    return;
  }
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => wakeLock = null);
  } catch (err) {
    console.log(err);
  }
}
document.addEventListener('visibilitychange', requestWakeLock);
requestWakeLock();
