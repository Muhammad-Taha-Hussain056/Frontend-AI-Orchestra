const resets = new Set<() => void>();
/** Every user-specific Zustand store registers its reset here; logout calls resetAllStores(). */
export const registerStoreReset = (fn: () => void) => { resets.add(fn); };
export const resetAllStores = () => resets.forEach((fn) => fn());
