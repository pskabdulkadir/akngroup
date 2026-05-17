export function safeDownloadUrl(url: string, filename?: string) {
  try {
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    if (filename) link.download = filename;
    const parent = document.body || document.documentElement || document.head;
    if (!parent) {
      // Fallback: open in new tab
      window.open(url, '_blank');
      return;
    }
    parent.appendChild(link);
    link.click();
    parent.removeChild(link);
  } catch (e) {
    console.warn('safeDownloadUrl error', e);
    try { window.open(url, '_blank'); } catch (err) { console.warn('fallback window.open failed', err); }
  }
}

export function safeDownloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  try {
    safeDownloadUrl(url, filename);
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}
