// -------------------------------------------------------------------
// LiveTrackingProvider — runs the simulation clock (mock) or exposes
// API controls (real). One provider wraps the whole app.
// -------------------------------------------------------------------
// In mock mode: whichever tab started the simulation becomes the "host"
// and advances the clock. Other tabs read the shared state through
// localStorage. If the host tab is closed, another open tab takes over.
// In real mode: the server runs the simulation; we just call API endpoints
// and poll for state updates.
// -------------------------------------------------------------------

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { USE_MOCK } from "../api/client";
import {
  LIVE_STATUS,
  liveStore,
  buildRoute,
  statusLabelFor,
  useLiveTrackingStore,
  SIM_BASE_DURATION_MS,
  liveStoreImpl,
} from "../lib/liveTracking";

const TICK_MS = 450;
const HOST_TIMEOUT_MS = 1800;

const LiveTrackingContext = createContext(null);

const nowIso = () => new Date().toISOString();

export function LiveTrackingProvider({ children }) {
  const state = useLiveTrackingStore();
  const tabId = useRef("");

  // Mock mode: run the local simulation timer
  useEffect(() => {
    if (!USE_MOCK) return;

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
      const delta = Math.min(now - last, 2000);
      const progress = Math.min(
        1,
        (Number(current.progress) || 0) + delta / (SIM_BASE_DURATION_MS / speed)
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
      async start({ trackNumber, shipmentId, origin, destination, speed }) {
        const route = buildRoute(origin, destination);
        const now = Date.now();
        if (USE_MOCK) {
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
        } else {
          await liveStoreImpl.start({
            trackNumber,
            shipmentId,
            origin,
            destination,
            speed: Number(speed) || 2,
          });
        }
      },

      async pause() {
        if (USE_MOCK) {
          const current = liveStore.getSnapshot();
          if (current.status !== LIVE_STATUS.RUNNING) return;
          liveStore.set({
            ...current,
            status: LIVE_STATUS.PAUSED,
            hostId: null,
            lastTick: Date.now(),
            updatedAt: nowIso(),
          });
        } else {
          await liveStoreImpl.pause();
        }
      },

      async resume() {
        if (USE_MOCK) {
          const current = liveStore.getSnapshot();
          if (current.status !== LIVE_STATUS.PAUSED) return;
          liveStore.set({
            ...current,
            status: LIVE_STATUS.RUNNING,
            hostId: tabId.current,
            lastTick: Date.now(),
            updatedAt: nowIso(),
          });
        } else {
          await liveStoreImpl.resume();
        }
      },

      async stop() {
        if (USE_MOCK) {
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
        } else {
          await liveStoreImpl.stop();
        }
      },

      async reset() {
        if (USE_MOCK) {
          liveStore.reset();
        } else {
          await liveStoreImpl.reset();
        }
      },

      async setSpeed(speed) {
        if (USE_MOCK) {
          const current = liveStore.getSnapshot();
          const next = Math.min(20, Math.max(0.5, Number(speed) || 1));
          liveStore.set({ ...current, speed: next });
        } else {
          await liveStoreImpl.setSpeed(speed);
        }
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