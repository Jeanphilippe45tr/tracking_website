// -------------------------------------------------------------------
// SettingsProvider — global site settings (brand + contact details).
// -------------------------------------------------------------------
// The admin manages these values from the Settings page (PATCH
// /api/settings); every public page reads them from here instead of
// from static code. Values are cached in localStorage so the site
// renders with the right brand before the fetch completes.
// -------------------------------------------------------------------

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import {
  getSiteSettings,
  updateSiteSettings,
  DEFAULT_SETTINGS,
} from "../api/settings";
import { BRAND as BRAND_FALLBACK } from "../data/site";

const CACHE_KEY = "swifttrack.site.settings.v1";

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Same shape as the old BRAND export, so pages text-replace cleanly.
function toBrand(settings) {
  const digits = String(settings.whatsappNumber || "").replace(/\D/g, "");
  return {
    ...BRAND_FALLBACK,
    name: settings.brandName,
    email: settings.supportEmail,
    phone: settings.supportPhone,
    phoneHref: String(settings.supportPhone).replace(/[^\d+]/g, ""),
    whatsapp: settings.whatsappNumber?.startsWith("+")
      ? settings.whatsappNumber
      : `+${digits}`,
    chatWelcome: settings.chatWelcome,
  };
}

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => readCache() || DEFAULT_SETTINGS);

  // Load the live values on boot; fall back to the defaults on error.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getSiteSettings();
        if (active) {
          setSettings(data);
          localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        }
      } catch {
        /* keep the cached/default values */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const updateBrand = useCallback(async (patch) => {
    const data = await updateSiteSettings(patch);
    setSettings(data);
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    return data;
  }, []);

  const brand = useMemo(() => toBrand(settings), [settings]);

  const value = useMemo(
    () => ({ settings, brand, updateBrand }),
    [settings, brand, updateBrand]
  );

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSiteSettings must be used inside <SettingsProvider>");
  }
  return context;
}

// Convenience hook for pages that only need the brand/contact object
// (formerly the static BRAND import).
export function useBrand() {
  return useSiteSettings().brand;
}
