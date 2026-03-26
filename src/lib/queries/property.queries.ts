import { createClient } from "@/lib/supabase/client";
import type { GetPropertiesParams, GetPropertiesResponse, Property } from "@/types/property.types";
import type { Unit, UnitStatus } from "@/types/db";

type PropertyStatusUnit = Pick<Unit, "property_id" | "listing_type" | "status">;
type EffectiveStatusUnit = Pick<Unit, "listing_type" | "status">;

/**
 * Derives all admin-tab statuses a property belongs to from its units.
 *
 * Rule summary:
 * - entire_home leased   -> leased only
 * - entire_home inactive -> inactive only
 * - entire_home active   -> room states can make the property appear in
 *   multiple admin tabs, following the product rules.
 *
 * Room-only properties appear in every tab represented by at least one room.
 */
function getPropertyStatuses(units: EffectiveStatusUnit[] | undefined): Set<UnitStatus> {
    if (!units || units.length === 0) return new Set();

    const entireHomeUnit = units.find((u) => u.listing_type === "entire_home");
    if (entireHomeUnit) {
        if (entireHomeUnit.status === "leased") {
            return new Set(["leased"]);
        }

        if (entireHomeUnit.status === "inactive") {
            return new Set(["inactive"]);
        }

        const rooms = units.filter((u) => u.listing_type === "room");
        const hasActiveRoom = rooms.some((u) => u.status === "active");
        const hasLeasedRoom = rooms.some((u) => u.status === "leased");
        const hasInactiveRoom = rooms.some((u) => u.status === "inactive");
        const statuses = new Set<UnitStatus>();

        if (rooms.length === 0 || hasActiveRoom || (hasInactiveRoom && !hasLeasedRoom)) {
            statuses.add("active");
        }

        if (hasLeasedRoom) {
            statuses.add("leased");
        }

        if (hasInactiveRoom) {
            statuses.add("inactive");
        }

        return statuses;
    }

    const statuses = new Set<UnitStatus>();

    if (units.some((u) => u.status === "active")) {
        statuses.add("active");
    }

    if (units.some((u) => u.status === "leased")) {
        statuses.add("leased");
    }

    if (units.some((u) => u.status === "inactive")) {
        statuses.add("inactive");
    }

    return statuses;
}

/**
 * A property is visible to public users only when it has an active property state.
 */
function shouldShowProperty(units: Unit[] | undefined): boolean {
    return getPropertyStatuses(units).has("active");
}

function sortUnits(units: Unit[] | undefined): Unit[] {
    return (
        units?.sort((a: Unit, b: Unit) => {
            if (a.listing_type !== b.listing_type) {
                return a.listing_type === "entire_home" ? -1 : 1;
            }

            const nameA = a.name || "";
            const nameB = b.name || "";
            return nameA.localeCompare(nameB, undefined, { numeric: true });
        }) || []
    );
}

async function getPropertyUnitsByPropertyIds(
    propertyIds: string[]
): Promise<Map<string, PropertyStatusUnit[]>> {
    if (!propertyIds.length) {
        return new Map();
    }

    const supabase = createClient();
    const { data, error } = await supabase
        .from("units")
        .select("property_id, listing_type, status")
        .in("property_id", propertyIds);

    if (error) {
        console.error("Error fetching property units:", error);
        throw new Error(error.message);
    }

    return (data || []).reduce((map, unit) => {
        const existingUnits = map.get(unit.property_id) || [];
        existingUnits.push(unit as PropertyStatusUnit);
        map.set(unit.property_id, existingUnits);
        return map;
    }, new Map<string, PropertyStatusUnit[]>());
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

    // Use inner join only for filters that must constrain the joined units.
    const needsInnerJoin = !!(
        listingType ||
        likedOnly ||
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

    const allPropertyUnits = await getPropertyUnitsByPropertyIds(properties.map((prop) => prop.id));
    const propertyStatusesByPropertyId = new Map(
        properties.map((prop) => [prop.id, getPropertyStatuses(allPropertyUnits.get(prop.id))])
    );

    if (isAdmin && status) {
        properties = properties.filter((prop) =>
            propertyStatusesByPropertyId.get(prop.id)?.has(status)
        );
    }

    // For public listings, visibility is driven by the full property unit set,
    // not the unit subset that survived join filters.
    if (!isAdmin && isPublished) {
        properties = properties.filter(
            (prop) => propertyStatusesByPropertyId.get(prop.id)?.has("active")
        );
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

    // Sort units: entire_home first, then rooms by name
    properties = properties.map((prop) => ({
        ...prop,
        units: sortUnits(prop.units),
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

    const query = supabase
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

    const { data: property, error } = await query.single();

    if (error) {
        console.error("Error fetching property:", error);
        throw new Error(error.message);
    }

    if (!isAdmin && !shouldShowProperty(property.units)) {
        throw new Error("Property not found");
    }

    if (!isAdmin) {
        return {
            ...property,
            units: sortUnits(property.units.filter((unit: Unit) => unit.status !== "inactive")),
        };
    }

    return {
        ...property,
        units: sortUnits(property.units),
    };
}
