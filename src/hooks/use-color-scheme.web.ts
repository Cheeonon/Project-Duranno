import { useEffect, useState } from 'react';
import type { ColorSchemeName } from 'react-native';

/**
 * Web color scheme — listen to `prefers-color-scheme` directly so toggles
 * update every themed surface. RN Web's hook can lag or miss changes.
 */
export function useColorScheme(): ColorSchemeName {
  const [scheme, setScheme] = useState<ColorSchemeName>('light');
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = () => {
      setScheme(media.matches ? 'dark' : 'light');
    };

    sync();
    setHasHydrated(true);
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  if (!hasHydrated) {
    return 'light';
  }

  return scheme;
}
