// -------------------------------------------------------------------
// LiveTrackingProvider — shares every live delivery with every visitor.
// -------------------------------------------------------------------
// Real mode (VITE_USE_MOCK=false): the runs live in the backend, so a
// customer on a phone sees exactly what the admin sees. The provider
// polls GET /api/live and the admin actions call the matching endpoints.
//
// Mock mode (VITE_USE_MOCK=true): a localStorage array of runs keeps the
// demo working without a server.
//
// Controls used by the admin panel (all take the run id):
//   start({ trackNumber, shipmentId, origin, destination, transportMode, ... })
//   pause(id)  resume(id)  stop(id)  remove(id)  setTransport(id, mode)
//   reset()
// -------------------------------------------------------------------

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as liveApi from "../api/live";
import { USE_MOCK } from "../api/client";
import {
  DEFAULT_TRANSPORT_MODE,
  LIVE_STATUS,
  buildRoute,
  distanceKmBetween,
  durationMsFor,
  durationMsOf,
  liveStore,
  normalizeRun,
  statusLabelFor,
  transportModeById,
  useLiveTrackingStore,
} from "../lib/liveTracking";

const TICK_MS = 450;
// How long another tab waits before taking over from a silent host.
const HOST_TIMEOUT_MS = 1800;
// How often a visitor asks the backend for the parcels' positions.
const POLL_MS = 1200;

const LiveTrackingContext = createContext(null);

const nowIso = () => new Date().toISOString();

const normalizeMode = (value) => transportModeById(value).id;

// Compare the raw backend runs so paused/idle polls do not trigger an
// unnecessary React render.
function sameRuns(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
    return false;
  }
  return a.every((run, index) => {
    const other = b[index];
    return (
      run.id === other.id &&
      run.status === other.status &&
      run.trackNumber === other.trackNumber &&
      run.transportMode === other.transportMode &&
      run.durationMs === other.durationMs &&
      Math.abs((run.progress || 0) - (other.progress || 0)) < 0.0001 &&
      run.courier?.id === other.courier?.id
    );
  });
}

function makeMockRun(payload, currentRuns) {
  const trackNumber = String(payload.trackNumber || "").trim();
  const duplicate = currentRuns.find(
    (run) =>
      run.trackNumber &&
      run.trackNumber.toLowerCase() === trackNumber.toLowerCase() &&
      (run.status === LIVE_STATUS.RUNNING || run.status === LIVE_STATUS.PAUSED)
  );
  if (duplicate) {
    const error = new Error("This shipment is already on the live map.");
    error.status = 409;
    throw error;
  }

  const id = Math.max(0, ...currentRuns.map((run) => Number(run.id) || 0)) + 1;

  const mode = normalizeMode(payload.transportMode || DEFAULT_TRANSPORT_MODE);
  const speedKmh = transportModeById(mode).speedKmh;
  const route = buildRoute(
    payload.origin,
    payload.destination,
    [payload.originLat, payload.originLng],
    [payload.destinationLat, payload.destinationLng]
  );
  const distanceKm = distanceKmBetween(
    route[0],
    route[route.length - 1]
  );

  return {
    id,
    status: LIVE_STATUS.RUNNING,
    statusLabel: statusLabelFor(0),
    trackNumber: trackNumber || null,
    shipmentId: payload.shipmentId ?? null,
    shipmentStatus: payload.shipmentStatus || "In transit",
    origin: payload.origin || "",
    destination: payload.destination || "",
    originLat: payload.originLat ?? null,
    originLng: payload.originLng ?? null,
    destinationLat: payload.destinationLat ?? null,
    destinationLng: payload.destinationLng ?? null,
    progress: 0,
    transportMode: mode,
    speedKmh,
    speed: speedKmh,
    distanceKm,
    durationMs: durationMsFor(distanceKm, speedKmh),
    courier: payload.courier || null,
    startedAt: nowIso(),
    updatedAt: nowIso(),
  };
}

export function LiveTrackingProvider({ children }) {
  const mockState = useLiveTrackingStore();
  const [remoteRuns, setRemoteRuns] = useState([]);
  const [serverTime, setServerTime] = useState(null);
  const [online, setOnline] = useState(true);
  // A stable id for this browser tab (mock mode host election).
  const tabId = useRef("");
  // Skip a poll response that could overwrite a just-sent admin action.
  const busyRef = useRef(false);

  // -------------------- Mock mode: local simulation --------------------
  useEffect(() => {
    if (!USE_MOCK) return undefined;

    tabId.current = `tab-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const timer = setInterval(() => {
      const current = liveStore.getSnapshot();
      const active = (current.runs || []).some(
        (run) => run.status === LIVE_STATUS.RUNNING
      );
      if (!active) return;

      const now = Date.now();
      const last = Number(current.lastTick) || now;

      // Only one tab advances the shared simulation. Other tabs read the
      // progress written to localStorage by the host.
      if (
        current.hostId &&
        current.hostId !== tabId.current &&
        now - last < HOST_TIMEOUT_MS
      ) {
        return;
      }

      const delta = Math.min(now - last, 2000);
      let stillRunning = false;

      const runs = current.runs.map((run) => {
        if (run.status !== LIVE_STATUS.RUNNING) return run;

        const duration = durationMsOf(run);
        const progress = Math.min(
          1,
          (Number(run.progress) || 0) + delta / duration
        );
        const finished = progress >= 1;
        if (!finished) stillRunning = true;

        return {
          ...run,
          progress,
          status: finished ? LIVE_STATUS.COMPLETED : LIVE_STATUS.RUNNING,
          statusLabel: statusLabelFor(progress),
          updatedAt: nowIso(),
        };
      });

      liveStore.set({
        ...current,
        runs,
        hostId: stillRunning ? tabId.current : null,
        lastTick: now,
      });
    }, TICK_MS);

    return () => clearInterval(timer);
  }, []);

  // -------------------- Real mode: poll the backend --------------------
  useEffect(() => {
    if (USE_MOCK) return undefined;

    let active = true;

    const load = async () => {
      // Do not poll in a hidden tab; progress is computed by the server,
      // so catching up when the tab becomes visible is enough.
      if (busyRef.current || document.hidden) return;
      try {
        const data = await liveApi.getLiveState();
        if (!active) return;
        const nextRuns = Array.isArray(data?.runs) ? data.runs : [];
        setRemoteRuns((previous) =>
          sameRuns(previous, nextRuns) ? previous : nextRuns
        );
        setServerTime(data?.serverTime || Date.now());
        setOnline(true);
      } catch {
        if (active) setOnline(false);
      }
    };

    load();
    const timer = setInterval(load, POLL_MS);
    const onVisibilityChange = () => {
      if (!document.hidden) load();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      active = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const refresh = useCallback(async () => {
    const data = await liveApi.getLiveState();
    const nextRuns = Array.isArray(data?.runs) ? data.runs : [];
    setRemoteRuns(nextRuns);
    setServerTime(data?.serverTime || Date.now());
    setOnline(true);
  }, []);

  // Real actions always reload every run afterwards: one request that
  // keeps all open admin tabs and visitors in sync.
  const runRealAction = useCallback(
    async (action) => {
      busyRef.current = true;
      try {
        await action();
        await refresh();
        return true;
      } catch (error) {
        if (error?.response?.status === 409) {
          // Someone else changed this run; refresh what is possible.
          try {
            await refresh();
          } catch {
            /* keep the API error below */
          }
        }
        throw error;
      } finally {
        busyRef.current = false;
      }
    },
    [refresh]
  );

  const realActions = useMemo(
    () => ({
      start(payload) {
        return runRealAction(() => liveApi.startLive(payload));
      },
      pause(id) {
        return runRealAction(() => liveApi.pauseLive(id));
      },
      resume(id) {
        return runRealAction(() => liveApi.resumeLive(id));
      },
      stop(id) {
        return runRealAction(() => liveApi.stopLive(id));
      },
      remove(id) {
        return runRealAction(() => liveApi.removeLive(id));
      },
      reset() {
        return runRealAction(() => liveApi.resetLiveState());
      },
      setTransport(id, mode) {
        return runRealAction(() =>
          liveApi.setLiveTransport(id, normalizeMode(mode))
        );
      },
    }),
    [runRealAction]
  );

  const mockActions = useMemo(
    () => ({
      async start(payload) {
        const current = liveStore.getSnapshot();
        const run = makeMockRun(payload, current.runs || []);
        liveStore.set({
          ...current,
          runs: [...(current.runs || []), run],
          hostId: tabId.current,
          lastTick: Date.now(),
        });
        return true;
      },

      async pause(id) {
        const current = liveStore.getSnapshot();
        liveStore.set({
          ...current,
          runs: (current.runs || []).map((run) =>
            run.id === Number(id) && run.status === LIVE_STATUS.RUNNING
              ? {
                  ...run,
                  status: LIVE_STATUS.PAUSED,
                  statusLabel: statusLabelFor(run.progress),
                  updatedAt: nowIso(),
                }
              : run
          ),
          hostId: null,
          lastTick: Date.now(),
        });
      },

      async resume(id) {
        const current = liveStore.getSnapshot();
        liveStore.set({
          ...current,
          runs: (current.runs || []).map((run) =>
            run.id === Number(id) && run.status === LIVE_STATUS.PAUSED
              ? {
                  ...run,
                  status: LIVE_STATUS.RUNNING,
                  updatedAt: nowIso(),
                }
              : run
          ),
          hostId: tabId.current,
          lastTick: Date.now(),
        });
      },

      async stop(id) {
        const current = liveStore.getSnapshot();
        liveStore.set({
          ...current,
          runs: (current.runs || []).map((run) =>
            run.id === Number(id) &&
            (run.status === LIVE_STATUS.RUNNING ||
              run.status === LIVE_STATUS.PAUSED)
              ? {
                  ...run,
                  status: LIVE_STATUS.STOPPED,
                  statusLabel: "Stopped",
                  updatedAt: nowIso(),
                }
              : run
          ),
          hostId: null,
          lastTick: Date.now(),
        });
      },

      async remove(id) {
        const current = liveStore.getSnapshot();
        liveStore.set({
          ...current,
          runs: (current.runs || []).filter((run) => run.id !== Number(id)),
        });
      },

      async reset() {
        liveStore.reset();
      },

      async setTransport(id, mode) {
        const current = liveStore.getSnapshot();
        const nextMode = normalizeMode(mode);
        const speedKmh = transportModeById(nextMode).speedKmh;
        liveStore.set({
          ...current,
          runs: (current.runs || []).map((run) =>
            run.id === Number(id)
              ? {
                  ...run,
                  transportMode: nextMode,
                  speedKmh,
                  speed: speedKmh,
                  durationMs: durationMsFor(
                    Number(run.distanceKm) || 0,
                    speedKmh
                  ),
                  updatedAt: nowIso(),
                }
              : run
          ),
        });
      },
    }),
    []
  );

  const runs = useMemo(() => {
    const source = USE_MOCK ? mockState.runs || [] : remoteRuns;
    return source.map((run, index) => normalizeRun(run, index));
  }, [mockState.runs, remoteRuns]);

  // A page tracking one parcel wants its newest active run. Completed or
  // stopped runs are kept as a fallback so the map still shows the result.
  const getRunForTracking = useCallback(
    (trackNumber) => {
      const wanted = String(trackNumber || "").toLowerCase();
      if (!wanted) return null;
      const matches = runs.filter(
        (run) => String(run.trackNumber || "").toLowerCase() === wanted
      );
      return (
        matches.find((run) => run.status === LIVE_STATUS.RUNNING) ||
        matches.find((run) => run.status === LIVE_STATUS.PAUSED) ||
        matches[0] ||
        null
      );
    },
    [runs]
  );

  const actions = USE_MOCK ? mockActions : realActions;

  const value = useMemo(
    () => ({
      runs,
      online: USE_MOCK ? true : online,
      serverTime: USE_MOCK ? mockState.lastTick || null : serverTime,
      getRunForTracking,
      ...actions,
    }),
    [runs, online, serverTime, mockState.lastTick, getRunForTracking, actions]
  );

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
