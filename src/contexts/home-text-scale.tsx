import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'duranno.textScaleIndex';
const TEXT_SCALE_STEPS = [0.85, 0.92, 1, 1.08, 1.16] as const;
const DEFAULT_SCALE_INDEX = 2;

type HomeTextScaleContextValue = {
  scale: number;
  scaleLabel: string;
  canDecrease: boolean;
  canIncrease: boolean;
  decrease: () => void;
  increase: () => void;
  scaled: (size: number) => number;
};

const HomeTextScaleContext = createContext<HomeTextScaleContextValue | null>(null);

function clampScaleIndex(index: number) {
  return Math.min(TEXT_SCALE_STEPS.length - 1, Math.max(0, Math.round(index)));
}

export function HomeTextScaleProvider({ children }: { children: ReactNode }) {
  const [scaleIndex, setScaleIndex] = useState(DEFAULT_SCALE_INDEX);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (cancelled || raw == null) {
          return;
        }

        const parsed = Number.parseInt(raw, 10);
        if (!Number.isNaN(parsed)) {
          setScaleIndex(clampScaleIndex(parsed));
        }
      } finally {
        if (!cancelled) {
          setHydrated(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    void AsyncStorage.setItem(STORAGE_KEY, String(scaleIndex));
  }, [hydrated, scaleIndex]);

  const scale = TEXT_SCALE_STEPS[scaleIndex];

  const decrease = useCallback(() => {
    setScaleIndex((current) => Math.max(0, current - 1));
  }, []);

  const increase = useCallback(() => {
    setScaleIndex((current) => Math.min(TEXT_SCALE_STEPS.length - 1, current + 1));
  }, []);

  const value = useMemo(
    () => ({
      scale,
      scaleLabel: `${Math.round(scale * 100)}%`,
      canDecrease: scaleIndex > 0,
      canIncrease: scaleIndex < TEXT_SCALE_STEPS.length - 1,
      decrease,
      increase,
      scaled: (size: number) => Math.round(size * scale),
    }),
    [decrease, increase, scale, scaleIndex],
  );

  return <HomeTextScaleContext.Provider value={value}>{children}</HomeTextScaleContext.Provider>;
}

export function useHomeTextScale() {
  const context = useContext(HomeTextScaleContext);

  if (!context) {
    return {
      scale: 1,
      scaleLabel: '100%',
      canDecrease: false,
      canIncrease: false,
      decrease: () => {},
      increase: () => {},
      scaled: (size: number) => size,
    };
  }

  return context;
}

export function scaleTextStyle<T extends { fontSize?: number; lineHeight?: number }>(
  style: T | undefined,
  scaled: (size: number) => number,
): T | undefined {
  if (!style) {
    return style;
  }

  const next = { ...style };

  if (typeof next.fontSize === 'number') {
    next.fontSize = scaled(next.fontSize);
  }

  if (typeof next.lineHeight === 'number') {
    next.lineHeight = scaled(next.lineHeight);
  }

  return next;
}
