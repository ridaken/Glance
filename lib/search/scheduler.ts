/**
 * Run work over `items` in time-sliced chunks so the main thread stays
 * responsive on very large documents. Calls `onChunk` after each slice and
 * `onDone` at the end. Returns a cancel function.
 */
export function runChunked<T>(
  items: T[],
  process: (item: T, index: number) => void,
  opts: { onChunk?: () => void; onDone?: () => void; sliceMs?: number } = {},
): () => void {
  const sliceMs = opts.sliceMs ?? 8;
  let i = 0;
  let cancelled = false;
  let handle: number | undefined;

  const schedule =
    typeof requestIdleCallback !== 'undefined'
      ? (cb: () => void) => requestIdleCallback(() => cb(), { timeout: 50 })
      : (cb: () => void) => setTimeout(cb, 0) as unknown as number;
  const cancel =
    typeof cancelIdleCallback !== 'undefined'
      ? (h: number) => cancelIdleCallback(h)
      : (h: number) => clearTimeout(h);

  const tick = () => {
    if (cancelled) return;
    const deadline = performance.now() + sliceMs;
    while (i < items.length && performance.now() < deadline) {
      process(items[i], i);
      i++;
    }
    if (i < items.length) {
      opts.onChunk?.();
      handle = schedule(tick) as number;
    } else {
      opts.onDone?.();
    }
  };

  handle = schedule(tick) as number;

  return () => {
    cancelled = true;
    if (handle !== undefined) cancel(handle);
  };
}
