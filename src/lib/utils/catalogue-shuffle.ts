/**
 * Seeded pseudo-random number generator (FNV-1a hash based).
 * Returns a function that generates reproducible floats in [0, 1).
 */
export function seededRng(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.codePointAt(i) ?? 0;
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13;
    h ^= h >> 17;
    h ^= h << 5;
    return (h >>> 0) / 0x100000000;
  };
}

/**
 * Interleaves items by creator and product, then shuffles the result
 * using a seeded RNG for reproducible ordering.
 */
export function shuffleInterleaved<T extends { productId: string; product: { creatorId: string } }>(
  items: T[],
  rngSeed: string
): T[] {
  const rand = seededRng(rngSeed);
  const fyShuffle = <U,>(arr: U[]): U[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      const tmp = a[i] as U;
      a[i] = a[j] as U;
      a[j] = tmp;
    }
    return a;
  };

  const creatorMap = new Map<string, Map<string, T[]>>();
  for (const item of items) {
    const cId = item.product.creatorId;
    const pId = item.productId;
    if (!creatorMap.has(cId)) creatorMap.set(cId, new Map());
    const productMap = creatorMap.get(cId)!;
    const g = productMap.get(pId) ?? [];
    g.push(item);
    productMap.set(pId, g);
  }

  const interleavedPerCreator: T[][] = fyShuffle(
    [...creatorMap.values()].map((productMap) => {
      const shuffledGroups = fyShuffle(
        [...productMap.values()].map((g) => fyShuffle(g))
      );
      const result: T[] = [];
      const maxLen = Math.max(...shuffledGroups.map((g) => g.length));
      for (let i = 0; i < maxLen; i++) {
        for (const group of shuffledGroups) {
          if (i < group.length) result.push(group[i] as T);
        }
      }
      return result;
    })
  );

  const finalResult: T[] = [];
  const maxLen = Math.max(...interleavedPerCreator.map((g) => g.length), 0);
  for (let i = 0; i < maxLen; i++) {
    for (const group of interleavedPerCreator) {
      if (i < group.length) finalResult.push(group[i] as T);
    }
  }
  return finalResult;
}
