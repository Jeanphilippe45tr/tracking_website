// -------------------------------------------------------------------
// LiveTrackingProvider — runs the simulation clock and exposes controls.
// -------------------------------------------------------------------
// One provider wraps the whole app. Whichever tab started the simulation
// becomes the "host" and advances the clock. Other tabs simply read the
// shared state through localStorage. If the host tab is closed, another
// open tab takes over after a short delay — so the simulation keeps
// moving while the Live Map is open.
//
// Controls used by the admin panel:
//   start({ trackNumber, shipmentId, origin, destination, speed })
//   pause()  resume()  stop()  reset()  setSpeed(n)
// -------------------------------------------------------------------

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  LIVE_STATUS,
  liveStore,
  buildRoute,
  statusLabelFor,
  useLiveTrackingStore,
  SIM_BASE_DURATION_MS,
} from "../lib/liveTracking";

const TICK_MS = 450;
// How long another tab waits before taking over from a silent host.
const HOST_TIMEOUT_MS = 1800;

const LiveTrackingContext = createContext(null);

const nowIso = () => new Date().toISOString();

export function LiveTrackingProvider({ children }) {
  const state = useLiveTrackingStore();
  // A stable id for this browser tab. Filled in the effect below (calling
  // Math.random or Date.now during render would make the component impure).
  const tabId = useRef("");

  useEffect(() => {
    tabId.current = `tab-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const timer = setInterval(() => {
      const current = liveStore.getSnapshot();
      if (current.status !== LIVE_STATUS.RUNNING) return;

      const now = Date.now();
      const last = Number(current.lastTick) || now;

      // Another tab is actively hosting the simulation.
      if (
        current.hostId &&
        current.hostId !== tabId.current &&
        now - last < HOST_TIMEOUT_MS
      ) {
        return;
      }

      const speed = Math.max(0.25, Number(current.speed) || 1);
      // Clamp the delta so a background-throttled tab does not make the
      // parcel jump from one end of the route to the other.
      const delta = Math.min(now - last, 2000);
      const progress = Math.min(
        1,
        (Number(current.progress) || 0) +
          delta / (SIM_BASE_DURATION_MS / speed)
      );
      const finished = progress >= 1;

      liveStore.set({
        ...current,
        progress,
        status: finished ? LIVE_STATUS.COMPLETED : LIVE_STATUS.RUNNING,
        statusLabel: statusLabelFor(progress),
        hostId: finished ? null : tabId.current,
        lastTick: now,
        updatedAt: nowIso(),
      });
    }, TICK_MS);

    return () => clearInterval(timer);
  }, []);

  const actions = useMemo(
    () => ({
      start({ trackNumber, shipmentId, origin, destination, speed }) {
        const route = buildRoute(origin, destination);
        const now = Date.now();
        liveStore.set({
          status: LIVE_STATUS.RUNNING,
          trackNumber: trackNumber || null,
          shipmentId: shipmentId ?? null,
          origin: origin || "",
          destination: destination || "",
          route,
          progress: 0,
          speed: Number(speed) || 2,
          statusLabel: statusLabelFor(0),
          startedAt: nowIso(),
          updatedAt: nowIso(),
          lastTick: now,
          hostId: tabId.current,
        });
      },

      pause() {
        const current = liveStore.getSnapshot();
        if (current.status !== LIVE_STATUS.RUNNING) return;
        liveStore.set({
          ...current,
          status: LIVE_STATUS.PAUSED,
          hostId: null,
          lastTick: Date.now(),
          updatedAt: nowIso(),
        });
      },

      resume() {
        const current = liveStore.getSnapshot();
        if (current.status !== LIVE_STATUS.PAUSED) return;
        liveStore.set({
          ...current,
          status: LIVE_STATUS.RUNNING,
          hostId: tabId.current,
          lastTick: Date.now(),
          updatedAt: nowIso(),
        });
      },

      stop() {
        const current = liveStore.getSnapshot();
        if (
          current.status !== LIVE_STATUS.RUNNING &&
          current.status !== LIVE_STATUS.PAUSED
        ) {
          return;
        }
        liveStore.set({
          ...current,
          status: LIVE_STATUS.STOPPED,
          hostId: null,
          lastTick: Date.now(),
          updatedAt: nowIso(),
        });
      },

      reset() {
        liveStore.reset();
      },

      setSpeed(speed) {
        const current = liveStore.getSnapshot();
        const next = Math.min(20, Math.max(0.5, Number(speed) || 1));
        liveStore.set({ ...current, speed: next });
      },
    }),
    []
  );

  const value = useMemo(() => ({ ...state, ...actions }), [state, actions]);

  return (
    <LiveTrackingContext.Provider value={value}>
      {children}
    </LiveTrackingContext.Provider>
  );
}

export function useLiveTracking() {
  const context = useContext(LiveTrackingContext);
  if (!context) {
    throw new Error("useLiveTracking must be used inside <LiveTrackingProvider>");
  }
  return context;
}
