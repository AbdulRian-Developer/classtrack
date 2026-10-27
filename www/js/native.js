/* Thin layer over Capacitor plugins, with browser fallbacks for testing. */
(function () {
  const cap = window.Capacitor;
  const isNative = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  const plugin = (name) => (isNative && cap.registerPlugin ? cap.registerPlugin(name) : null);

  const Filesystem = plugin('Filesystem');
  const Share = plugin('Share');
  const App = plugin('App');
  const SystemBars = plugin('SystemBars');

  function blobToBase64(blob) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result).split(',')[1]);
      r.onerror = rej;
      r.readAsDataURL(blob);
    });
  }

  function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
  }

  const Native = {
    isNative,

    /** Share (or download, in a browser) a generated file. */
    async shareFile(blob, filename, title) {
      if (isNative && Filesystem && Share) {
        const data = await blobToBase64(blob);
        const res = await Filesystem.writeFile({ path: filename, data, directory: 'CACHE' });
        await Share.share({ title: title || filename, files: [res.uri], dialogTitle: 'Share report' });
        return 'shared';
      }
      try {
        const file = new File([blob], filename, { type: blob.type });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: title || filename });
          return 'shared';
        }
      } catch (e) { if (e && e.name === 'AbortError') return 'cancelled'; }
      download(blob, filename);
      return 'downloaded';
    },

    async shareText(text, title) {
      if (isNative && Share) {
        await Share.share({ title: title || 'Attendance', text, dialogTitle: 'Share attendance' });
        return 'shared';
      }
      try {
        if (navigator.share) { await navigator.share({ text, title }); return 'shared'; }
      } catch (e) { if (e && e.name === 'AbortError') return 'cancelled'; }
      try { await navigator.clipboard.writeText(text); return 'copied'; } catch (e) { return 'failed'; }
    },

    setBars(theme) {
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', theme === 'light' ? '#F3F6F9' : '#12151C');
      if (SystemBars) SystemBars.setStyle({ style: theme === 'light' ? 'LIGHT' : 'DARK' }).catch(() => {});
    },

    onBack(handler) {
      if (App) {
        App.addListener('backButton', () => { if (!handler()) App.exitApp(); });
      }
    },

    onPause(handler) {
      if (App) App.addListener('pause', handler);
      document.addEventListener('visibilitychange', () => { if (document.hidden) handler(); });
    },
  };

  window.Native = Native;
})();
