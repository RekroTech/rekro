/**
 * Deep clone utility for plain JSON-ish data (objects/arrays/primitives/null).
 * We keep this local to avoid pulling a dependency.
 */
export function deepClone<T>(value: T): T {
    // structuredClone is available in modern browsers; fall back for older envs.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sc = (globalThis as any).structuredClone as ((v: T) => T) | undefined;
    if (typeof sc === "function") return sc(value);
    return JSON.parse(JSON.stringify(value)) as T;
}