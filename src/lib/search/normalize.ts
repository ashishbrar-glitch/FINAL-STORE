export function normalizeStr(str?: string | null): string {
  if (!str || typeof str !== 'string') return '';
  return str.trim().toLowerCase().replace(/[.,/#!$%\\^&\\*;:{}=\\-_~\\(\\)]/g, "").replace(/\\s{2,}/g, " ");
}
