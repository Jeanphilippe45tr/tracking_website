// -------------------------------------------------------------------
// persistentStore — a tiny localStorage-backed store.
// -------------------------------------------------------------------
// The demo runs without a backend, but the admin settings, the live
// simulation and the chat inbox all need to survive a page refresh and
// stay in sync between browser tabs (for example the admin dashboard in
// one tab and the public live map in another).
//
// This helper gives each feature:
//   - getSnapshot()  -> current value (stable reference, for React)
//   - subscribe(fn)  -> called on every change (same tab + other tabs)
//   - set(next)      -> write and notify
//   - reset()        -> restore the initial value
//
// Components read from it with useSyncExternalStore, which is exactly
// what React recommends for external stores like this one.
// -------------------------------------------------------------------

const clone = (value) => JSON.parse(JSON.stringify(value));

export function createPersistentStore(key, initialValue) {
  // `initialValue` can be a value or a function returning a fresh value.
  const materialize = () => {
    const value =
      typeof initialValue === "function" ? initialValue() : initialValue;
    return clone(value);
  };

  function read() {
    if (typeof window === "undefined") return materialize();
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return materialize();
      const parsed = JSON.parse(raw);
      // Only accept plain objects/arrays — anything else means the data
      // was corrupted and we simply start from the seed again.
      if (parsed && typeof parsed === "object") return parsed;
      return materialize();
    } catch {
      return materialize();
    }
  }

  let cache = read();
  const listeners = new Set();

  function emit() {
    listeners.forEach((listener) => listener());
  }

  function set(next) {
    const value = typeof next === "function" ? next(cache) : next;
    if (!value || value === cache) return;
    cache = value;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage can be full or disabled (private mode). The in-memory
      // cache still works for the current session, so we ignore this.
    }
    emit();
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  // Other tabs write to the same key. The "storage" event is fired only
  // in the tabs that did NOT make the change, which keeps us in sync.
  if (typeof window !== "undefined") {
    window.addEventListener("storage", (event) => {
      if (event.key !== key) return;
      cache = read();
      emit();
    });
  }

  return {
    key,
    getSnapshot: () => cache,
    subscribe,
    set,
    reset: () => {
      cache = materialize();
      try {
        window.localStorage.removeItem(key);
      } catch {
        // ignore
      }
      emit();
    },
  };
}
