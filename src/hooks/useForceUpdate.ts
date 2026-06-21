import { useReducer } from 'react';

// Erzwingt ein Re-Render, nachdem wir die Settings direkt mutiert haben.
export function useForceUpdate(): () => void {
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);
  return forceUpdate;
}