declare module "safe-memory-cache" {
  export interface SafeMemoryCacheOptions {
    /**
     * Maximum number of items to store in cache. When cache length is close to the limit, oldest
     * items are removed to make more room.
     */
    limit: number;

    /**
     * Time in miliseconds within which an element should no longer be in cache if it was not
     * accessed. Actual time is approximate and will be less or equal `maxTTL`.
     */
    maxTTL?: number;

    /**
     * Overrides the number of buckets used internally.
     * @default 2
     */
    buckets?: number;

    /**
     * Calls the function with a storage bucket that's been removed.
     */
    cleanupListener?: (removedBucket: Map<string, unknown>) => void;

    /**
     * Keep items longer than the maxTTL if they are used.
     */
    retainUsed?: boolean;
  }

  export interface SafeMemoryCache<Value> {
    set(key: string, value: Value): Value;
    get(key: string): Value | undefined;
    clear(): void;
  }

  export function safeMemoryCache<Value>(
    options: SafeMemoryCacheOptions,
  ): SafeMemoryCache<Value>;
}
