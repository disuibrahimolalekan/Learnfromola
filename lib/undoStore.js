// Temporary client-side storage for "Undo delete" — survives navigating
// between admin pages (e.g. delete a module, land back on the list, still
// see the Undo toast) but clears itself after 30 seconds or a tab close.
const KEY = "admin-pending-undo";

export function setPendingUndo(data) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...data, expiresAt: Date.now() + 30000 }));
  } catch (e) {
    console.error("Failed to store undo state:", e);
  }
}

export function getPendingUndo() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.expiresAt < Date.now()) {
      sessionStorage.removeItem(KEY);
      return null;
    }
    return data;
  } catch (e) {
    return null;
  }
}

export function clearPendingUndo() {
  try {
    sessionStorage.removeItem(KEY);
  } catch (e) {
    // ignore
  }
}
