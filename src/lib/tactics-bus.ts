type TacticsListener = (payload: unknown) => void;

const globalForBus = globalThis as typeof globalThis & {
  __tacticsBus?: Map<string, Set<TacticsListener>>;
};

const bus = (globalForBus.__tacticsBus ??= new Map<string, Set<TacticsListener>>());

export function subscribeTactics(teamId: string, fn: TacticsListener): () => void {
  let set = bus.get(teamId);
  if (!set) {
    set = new Set();
    bus.set(teamId, set);
  }
  set.add(fn);
  return () => {
    const current = bus.get(teamId);
    if (!current) return;
    current.delete(fn);
    if (current.size === 0) bus.delete(teamId);
  };
}

export function publishTactics(teamId: string, payload: unknown): void {
  const set = bus.get(teamId);
  if (!set) return;
  for (const fn of set) {
    try {
      fn(payload);
    } catch {
      set.delete(fn);
    }
  }
}
