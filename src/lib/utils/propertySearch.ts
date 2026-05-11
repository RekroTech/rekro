import type { Unit } from "@/types/db";

type SearchScope = "all" | "location";

type SearchableUnit = Pick<Unit, "name" | "description">;

export interface SearchableProperty {
    description?: string | null;
    address?: unknown;
    location?: unknown;
    units?: SearchableUnit[] | SearchableUnit | null;
}

/** Full-name ↔ abbreviation map for Australian states/territories. */
const AU_STATE_ALIASES: Record<string, string> = {
    victoria: "vic",
    vic: "victoria",
    "new south wales": "nsw",
    nsw: "new south wales",
    queensland: "qld",
    qld: "queensland",
    "south australia": "sa",
    sa: "south australia",
    "western australia": "wa",
    wa: "western australia",
    tasmania: "tas",
    tas: "tasmania",
    "northern territory": "nt",
    nt: "northern territory",
    "australian capital territory": "act",
    act: "australian capital territory",
};

const STATE_ALIAS_KEYS = Object.keys(AU_STATE_ALIASES)
    .sort((a, b) => b.split(" ").length - a.split(" ").length);

function normalizeSearchValue(value: string): string {
    return value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function isSearchToken(token: string): boolean {
    return token.length >= 3 || token in AU_STATE_ALIASES || (/\d/.test(token) && token.length >= 2);
}

function uniqueTokens(tokens: string[]): string[] {
    return [...new Set(tokens.map(normalizeSearchValue).filter(isSearchToken))];
}

function asObject(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }

    return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
    if (typeof value === "string") {
        return value;
    }

    if (typeof value === "number") {
        return String(value);
    }

    return null;
}

function getAddressFragments(address: unknown, scope: SearchScope): string[] {
    const record = asObject(address);

    if (!record) {
        return [];
    }

    const fields = scope === "all"
        ? ["street", "suburb", "city", "state", "postcode", "country"]
        : ["suburb", "city", "state", "postcode", "country"];

    return fields
        .map((field) => asString(record[field]))
        .filter((value): value is string => !!value && value.trim() !== "");
}

function getLocationFragments(location: unknown): string[] {
    const record = asObject(location);

    if (!record) {
        return [];
    }

    return ["city", "state", "country", "postcode"]
        .map((field) => asString(record[field]))
        .filter((value): value is string => !!value && value.trim() !== "");
}

function getUnitFragments(units: SearchableProperty["units"]): string[] {
    if (!units) {
        return [];
    }

    const unitList = Array.isArray(units) ? units : [units];

    return unitList.flatMap((unit) => {
        if (!unit) {
            return [];
        }

        return [unit.name, unit.description].filter(
            (value): value is string => typeof value === "string" && value.trim() !== ""
        );
    });
}

export function buildPropertySearchTokenGroups(search: string, maxGroups = 15): string[][] {
    const normalized = normalizeSearchValue(search);

    if (!normalized) {
        return [];
    }

    const words = normalized.split(" ").filter(isSearchToken);
    const groups: string[][] = [];
    const seen = new Set<string>();

    for (let index = 0; index < words.length && groups.length < maxGroups;) {
        let matchedAliasKey: string | undefined;
        let matchedWordLength = 0;

        for (const aliasKey of STATE_ALIAS_KEYS) {
            const aliasWords = aliasKey.split(" ");
            const candidate = words.slice(index, index + aliasWords.length).join(" ");

            if (candidate === aliasKey) {
                matchedAliasKey = aliasKey;
                matchedWordLength = aliasWords.length;
                break;
            }
        }

        const primaryToken = matchedAliasKey ?? words[index];

        if (!primaryToken) {
            index += 1;
            continue;
        }

        const aliasToken = AU_STATE_ALIASES[primaryToken];
        const group = uniqueTokens(aliasToken ? [primaryToken, aliasToken] : [primaryToken]);
        const groupKey = group.join("|");

        if (group.length > 0 && !seen.has(groupKey)) {
            seen.add(groupKey);
            groups.push(group);
        }

        index += matchedWordLength || 1;
    }

    return groups;
}

export function buildPropertySearchText(
    property: SearchableProperty,
    scope: SearchScope = "all"
): string {
    return normalizeSearchValue(
        [
            scope === "all" ? property.description : null,
            ...getAddressFragments(property.address, scope),
            ...getLocationFragments(property.location),
            ...(scope === "all" ? getUnitFragments(property.units) : []),
        ]
            .filter((value): value is string => typeof value === "string" && value.trim() !== "")
            .join(" ")
    );
}

export function matchesPropertySearch(
    property: SearchableProperty,
    search: string | string[][],
    scope: SearchScope = "all"
): boolean {
    const tokenGroups = typeof search === "string"
        ? buildPropertySearchTokenGroups(search)
        : search;

    if (tokenGroups.length === 0) {
        return true;
    }

    const haystack = buildPropertySearchText(property, scope);

    if (!haystack) {
        return false;
    }

    return tokenGroups.every((group) =>
        group.some((token) => haystack.includes(normalizeSearchValue(token)))
    );
}
