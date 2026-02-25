import { InclusionType, Inclusions } from "@/types/property.types";

const INCLUSION_TYPES: readonly InclusionType[] = [
    "furniture",
    "bills",
    "cleaning",
    "carpark",
    "storage",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toNumber(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
        const n = Number(value);
        if (Number.isFinite(n)) return n;
    }
    return null;
}

export type InclusionsParseMode = "strict" | "coerce";

export interface ParseInclusionsOptions {
    /**
     * strict: invalid shapes cause an error
     * coerce: invalid shapes are dropped and defaults applied
     */
    mode?: InclusionsParseMode;
}

/**
 * Canonical inclusions shape:
 * Partial<Record<InclusionType, { selected: boolean; price: number }>>
 */
export function parseInclusions(input: unknown, options: ParseInclusionsOptions = {}): Inclusions {
    const mode = options.mode ?? "strict";

    if (input == null) return {};
    if (!isRecord(input)) {
        if (mode === "coerce") return {};
        throw new Error("Invalid inclusions: expected an object");
    }

    const result: Inclusions = {};

    for (const type of INCLUSION_TYPES) {
        const raw = (input as Record<string, unknown>)[type];
        if (raw == null) continue;

        if (!isRecord(raw)) {
            if (mode === "strict") throw new Error(`Invalid inclusions.${type}: expected an object`);
            continue;
        }

        const selectedRaw = raw.selected;
        const priceRaw = raw.price;

        const selected = typeof selectedRaw === "boolean" ? selectedRaw : null;
        const price = toNumber(priceRaw);

        if (selected === null || price === null) {
            if (mode === "strict") {
                throw new Error(
                    `Invalid inclusions.${type}: expected { selected: boolean; price: number }`
                );
            }
            // coerce mode: best effort
            result[type] = {
                selected: selected ?? false,
                price: price ?? 0,
            };
            continue;
        }

        result[type] = { selected, price };
    }

    return result;
}

