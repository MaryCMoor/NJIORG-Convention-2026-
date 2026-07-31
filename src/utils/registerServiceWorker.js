export const registerServiceWorker = () => {
  if (!('serviceWorker' in navigator)) return;
  if (!window.isSecureContext) return;

  window.addEventListener('load', () => {
    const basePath = import.meta.env.BASE_URL || '/';
    const swUrl = `${basePath}sw.js`;

    navigator.serviceWorker.register(swUrl, { scope: basePath })
      .catch((error) => {
        console.warn('Service worker registration failed:', error);
      });
  });
};
