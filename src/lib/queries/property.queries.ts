import { createClient } from "@/lib/supabase/client";
import type { GetPropertiesParams, GetPropertiesResponse, Property } from "@/types/property.types";
import type { Unit } from "@/types/db";

function hasActiveUnit(units: Unit[], listingType: "entire_home" | "room") {
    return units.some((unit) => unit.listing_type === listingType && unit.status === "active");
}

function shouldShowProperty(units: Unit[] | undefined): boolean {
    if (!units || units.length === 0) return false;

    const hasEntireHome = units.some((unit) => unit.listing_type === "entire_home");
    if (hasEntireHome) {
        // Entire-home listings are visible only while at least one entire-home unit is active.
        return hasActiveUnit(units, "entire_home");
    }

    // Room-only listings are visible when at least one room is active.
    return hasActiveUnit(units, "room");
}

/**
 * Direct Supabase queries for properties
 * Following Next.js 15 + Supabase best practices:
 * - Simple reads: Direct Supabase calls
 * - Complex mutations: Use API routes
 */

/** Full-name ↔ abbreviation map for Australian states/territories. */
const AU_STATE_ALIASES: Record<string, string> = {
    victoria: "VIC",
    vic: "Victoria",
    "new south wales": "NSW",
    nsw: "New South Wales",
    queensland: "QLD",
    qld: "Queensland",
    "south australia": "SA",
    sa: "South Australia",
    "western australia": "WA",
    wa: "Western Australia",
    tasmania: "TAS",
    tas: "Tasmania",
    "northern territory": "NT",
    nt: "Northern Territory",
    "australian capital territory": "ACT",
    act: "Australian Capital Territory",
};

/**
 * Tokenise a search string and expand Australian state names / abbreviations
 * so "Victoria" also matches rows where state = "VIC" (and vice-versa).
 */
function buildSearchTokens(search: string): string[] {
    const tokens = new Set<string>();

    // Word-level tokens (handles most cases)
    search
        .trim()
        .split(/[\s,]+/)
        .map((t) => t.replace(/"/g, "").trim())
        .filter((t) => t.length >= 3)
        .forEach((t) => tokens.add(t));

    // Comma-phrase tokens — catches multi-word states like "New South Wales"
    search
        .trim()
        .split(/,\s*/)
        .forEach((part) => {
            const p = part.trim().replace(/"/g, "");
            if (p.length >= 3) {
                const alias = AU_STATE_ALIASES[p.toLowerCase()];
                if (alias) tokens.add(alias);
            }
        });

    // Single-token state expansion (e.g. "Victoria" → "VIC", "NSW" → "New South Wales")
    [...tokens].forEach((t) => {
        const alias = AU_STATE_ALIASES[t.toLowerCase()];
        if (alias) tokens.add(alias);
    });

    return [...tokens].slice(0, 15);
}

/**
 * Bulk fetch likes for multiple units efficiently
 */
async function getBulkUnitLikes(unitIds: string[], userId: string): Promise<Set<string>> {
    if (!unitIds.length || !userId) {
        return new Set();
    }

    const supabase = createClient();

    const { data: likes, error } = await supabase
        .from("unit_likes")
        .select("unit_id")
        .eq("user_id", userId)
        .in("unit_id", unitIds);

    if (error) {
        console.error("Error fetching bulk unit likes:", error);
        return new Set();
    }

    return new Set(likes?.map((like) => like.unit_id) || []);
}

/**
 * Fetch properties with filtering and pagination
 * Direct Supabase call - no service layer needed
 */
export async function getProperties(
    params: GetPropertiesParams = {}
): Promise<GetPropertiesResponse> {
    const supabase = createClient();
    const {
        limit = 12,
        offset = 0,
        isPublished = true,
        isAdmin = false,
        userId,
        likedOnly = false,
        search,
        propertyType,
        minBedrooms,
        minBathrooms,
        minPrice,
        maxPrice,
        furnished,
        listingType,
        status,
    } = params;

    // Always fetch units with properties to avoid N+1 query problem
    const unitColumns =
        "id, listing_type, name, description, price, bond_amount, min_lease, max_lease, max_occupants, size_sqm, status, available_from, available_to, features";

    // Use inner join for filtering by liked properties, listing type, status, or price
    const needsInnerJoin = !!(
        listingType ||
        likedOnly ||
        (isAdmin && status) ||
        minPrice !== undefined ||
        maxPrice !== undefined
    );
    const selectQuery = needsInnerJoin
        ? `*, units!inner(${unitColumns})`
        : `*, units(${unitColumns})`;

    let query = supabase
        .from("properties")
        .select(selectQuery, { count: "exact" })
        .order("created_at", { ascending: false });

    // Filter by liked properties only
    if (likedOnly && userId) {
        const { data: likedUnits } = await supabase
            .from("unit_likes")
            .select("unit_id")
            .eq("user_id", userId);

        const likedUnitIds = likedUnits?.map((like) => like.unit_id) || [];

        if (likedUnitIds.length === 0) {
            return {
                data: [],
                nextOffset: null,
                hasMore: false,
            };
        }

        query = query.in("units.id", likedUnitIds);
    }

    // Filter by status (admin-only)
    if (isAdmin && status) {
        query = query.eq("units.status", status);
    }

    // Non-admin queries should never include inactive units.
    if (!isAdmin) {
        query = query.in("units.status", ["active", "leased"]);
    }

    // Apply filters
    if (isPublished !== undefined) {
        query = query.eq("is_published", isPublished);
    }

    if (propertyType) {
        query = query.eq("property_type", propertyType);
    }

    if (typeof minBedrooms === "number" && !isNaN(minBedrooms)) {
        query = query.gte("bedrooms", minBedrooms);
    }

    if (typeof minBathrooms === "number" && !isNaN(minBathrooms)) {
        query = query.gte("bathrooms", minBathrooms);
    }

    if (furnished === true) {
        query = query.eq("furnished", true);
    } else if (furnished === false) {
        query = query.eq("furnished", false);
    }

    if (listingType) {
        query = query.eq("units.listing_type", listingType);
    }

    if (typeof minPrice === "number" && !isNaN(minPrice)) {
        query = query.gte("units.price", minPrice);
    }

    if (typeof maxPrice === "number" && !isNaN(maxPrice)) {
        query = query.lte("units.price", maxPrice);
    }

    if (search && search.trim() !== "") {
        // Tokenise + expand state names/abbreviations so "Victoria" matches "VIC" etc.
        const tokens = buildSearchTokens(search);

        const fields = [
            "title",
            "description",
            "address->>street",
            "address->>city",
            "address->>state",
            "address->>suburb",
        ];

        const conditions = tokens.flatMap((token) => fields.map((f) => `${f}.ilike."%${token}%"`));

        if (conditions.length > 0) {
            query = query.or(conditions.join(","));
        }
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
        console.error("Error fetching properties:", error);
        throw new Error(error.message);
    }

    // Process the data to handle units properly
    let properties: Property[] = data ?? [];

    // Handle duplicate properties when using inner join
    if (needsInnerJoin && properties.length > 0) {
        const propertyMap = new Map<string, Property>();

        properties.forEach((prop: Property) => {
            if (!propertyMap.has(prop.id)) {
                const { units, ...propertyData } = prop;
                propertyMap.set(prop.id, {
                    ...propertyData,
                    units: Array.isArray(units) ? units : [units],
                } as Property);
            } else {
                const existingProp = propertyMap.get(prop.id)!;
                const newUnits = Array.isArray(prop.units) ? prop.units : [prop.units];
                existingProp.units.push(...newUnits);
            }
        });

        properties = Array.from(propertyMap.values());
    } else {
        properties = properties.map((prop) => ({
            ...prop,
            units: prop.units || [],
        }));
    }

    if (!isAdmin) {
        // Defense-in-depth: ensure inactive units are removed from the response shape.
        properties = properties
            .map((prop) => ({
                ...prop,
                units: (prop.units || []).filter((unit: Unit) => unit.status !== "inactive"),
            }))
            .filter((prop) => prop.units.length > 0);
    }

    // For public listings, apply visibility rules after unit-level filtering.
    if (!isAdmin && isPublished) {
        properties = properties.filter((prop) => shouldShowProperty(prop.units));
    }

    // Sort units: entire_home first, then rooms by name
    properties = properties.map((prop) => ({
        ...prop,
        units:
            prop.units?.sort((a: Unit, b: Unit) => {
                if (a.listing_type !== b.listing_type) {
                    return a.listing_type === "entire_home" ? -1 : 1;
                }
                const nameA = a.name || "";
                const nameB = b.name || "";
                return nameA.localeCompare(nameB, undefined, { numeric: true });
            }) || [],
    }));

    // Bulk fetch likes if userId is provided
    if (userId && properties.length > 0) {
        const allUnitIds = properties.flatMap(
            (prop) => prop.units?.map((unit: Unit) => unit.id) || []
        );

        if (allUnitIds.length > 0) {
            const likedUnitIds = await getBulkUnitLikes(allUnitIds, userId);

            properties = properties.map((prop) => ({
                ...prop,
                units:
                    prop.units?.map((unit: Unit) => ({
                        ...unit,
                        isLiked: likedUnitIds.has(unit.id),
                    })) || [],
            }));
        }
    }

    const total = count ?? 0;
    const nextOffset = offset + limit;
    const hasMore = nextOffset < total;

    return {
        data: properties,
        nextOffset: hasMore ? nextOffset : null,
        hasMore,
    };
}

/**
 * Get a single property by ID
 */
export async function getPropertyById(id: string, isAdmin = false): Promise<Property> {
    const supabase = createClient();

    let query = supabase
        .from("properties")
        .select(
            `
            *,
            units!inner (
                *
            )
        `
        )
        .eq("id", id)
        .order("listing_type", { referencedTable: "units", ascending: true })
        .order("name", { referencedTable: "units", ascending: true });

    if (!isAdmin) {
        // Non-admin views keep leased units visible as unavailable, but hide inactive units.
        query = query.in("units.status", ["active", "leased"]);
    }

    const { data: property, error } = await query.single();

    if (error) {
        console.error("Error fetching property:", error);
        throw new Error(error.message);
    }

    return property;
}
