import { createClient } from "@/lib/supabase/client";
import type { GetPropertiesParams, GetPropertiesResponse, Property } from "@/types/property.types";
import type { Unit, UnitStatus } from "@/types/db";

type PropertyStatusUnit = Pick<Unit, "property_id" | "listing_type" | "status">;
type EffectiveStatusUnit = Pick<Unit, "listing_type" | "status">;
type PropertyListingFilter = GetPropertiesParams["listingType"];

interface PropertyUnitSnapshot {
    units: EffectiveStatusUnit[];
    entireHomeUnit: EffectiveStatusUnit | undefined;
    roomUnits: EffectiveStatusUnit[];
    hasRooms: boolean;
    hasActiveRoom: boolean;
    hasLeasedRoom: boolean;
    hasPublicRoomUnit: boolean;
    unitStatuses: Set<UnitStatus>;
}

interface PropertyPublicVisibility {
    isVisible: boolean;
    isEntireHomeVisible: boolean;
    isRoomVisible: boolean;
}

function createPropertyUnitSnapshot(units: EffectiveStatusUnit[] | undefined): PropertyUnitSnapshot {
    const safeUnits = units ?? [];
    const entireHomeUnit = safeUnits.find((unit) => unit.listing_type === "entire_home");
    const roomUnits = safeUnits.filter((unit) => unit.listing_type === "room");

    return {
        units: safeUnits,
        entireHomeUnit,
        roomUnits,
        hasRooms: roomUnits.length > 0,
        hasActiveRoom: roomUnits.some((unit) => unit.status === "active"),
        hasLeasedRoom: roomUnits.some((unit) => unit.status === "leased"),
        hasPublicRoomUnit: roomUnits.some((unit) => unit.status !== "inactive"),
        unitStatuses: new Set<UnitStatus>(safeUnits.map((unit) => unit.status)),
    };
}

/**
 * Admin tabs are driven by unit statuses, with explicit exceptions for the active tab.
 */
function getPropertyStatuses(snapshot: PropertyUnitSnapshot): Set<UnitStatus> {
    const statuses = new Set<UnitStatus>();

    if (snapshot.unitStatuses.has("leased")) {
        statuses.add("leased");
    }

    if (snapshot.unitStatuses.has("inactive")) {
        statuses.add("inactive");
    }

    const canShowInActiveAdminTab =
        snapshot.hasActiveRoom && snapshot.entireHomeUnit?.status !== "leased";

    if (canShowInActiveAdminTab) {
        statuses.add("active");
    }

    return statuses;
}

/**
 * Public listing tabs share one visibility model.
 *
 * Rules:
 * - inactive units are hidden from users
 * - an entire-home unit in leased state hides the whole property
 * - when rooms exist, at least one active room is required for the property to be visible
 * - when any room is leased, the entire-home offering is hidden but room offerings remain visible
 */
function getPublicVisibility(snapshot: PropertyUnitSnapshot): PropertyPublicVisibility {
    if (snapshot.units.length === 0) {
        return {
            isVisible: false,
            isEntireHomeVisible: false,
            isRoomVisible: false,
        };
    }

    const isBlockedByLeasedEntireHome = snapshot.entireHomeUnit?.status === "leased";
    const isBlockedByRoomsWithoutActiveAvailability = snapshot.hasRooms && !snapshot.hasActiveRoom;

    if (isBlockedByLeasedEntireHome || isBlockedByRoomsWithoutActiveAvailability) {
        return {
            isVisible: false,
            isEntireHomeVisible: false,
            isRoomVisible: false,
        };
    }

    const isEntireHomeVisible =
        snapshot.entireHomeUnit?.status === "active" && !snapshot.hasLeasedRoom;
    const isRoomVisible = snapshot.hasPublicRoomUnit;

    return {
        isVisible: isEntireHomeVisible || isRoomVisible,
        isEntireHomeVisible,
        isRoomVisible,
    };
}

function shouldShowPropertyForPublicListing(
    snapshot: PropertyUnitSnapshot,
    listingType?: PropertyListingFilter
): boolean {
    const visibility = getPublicVisibility(snapshot);

    if (listingType === "entire_home") {
        return visibility.isEntireHomeVisible;
    }

    if (listingType === "room") {
        return visibility.isRoomVisible;
    }

    return visibility.isVisible;
}

function shapePublicUnits(
    units: Unit[] | undefined,
    snapshot: PropertyUnitSnapshot,
    listingType?: PropertyListingFilter
): Unit[] {
    const visibility = getPublicVisibility(snapshot);

    if (!visibility.isVisible) {
        return [];
    }

    let visibleUnits = (units ?? []).filter((unit) => unit.status !== "inactive");

    if (!visibility.isEntireHomeVisible) {
        visibleUnits = visibleUnits.filter((unit) => unit.listing_type !== "entire_home");
    }

    if (listingType === "entire_home") {
        visibleUnits = visibleUnits.filter((unit) => unit.listing_type === "entire_home");
    } else if (listingType === "room") {
        visibleUnits = visibleUnits.filter((unit) => unit.listing_type === "room");
    }

    return visibleUnits;
}

function sortUnits(units: Unit[] | undefined): Unit[] {
    return [...(units ?? [])].sort((a: Unit, b: Unit) => {
        if (a.listing_type !== b.listing_type) {
            return a.listing_type === "entire_home" ? -1 : 1;
        }

        const nameA = a.name || "";
        const nameB = b.name || "";
        return nameA.localeCompare(nameB, undefined, { numeric: true });
    });
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
 * Bulk fetch likes data for multiple units efficiently
 * Returns both user's liked status and total like counts in a single query
 */
async function getBulkUnitLikesData(
    unitIds: string[],
    userId?: string
): Promise<Map<string, { isLiked: boolean; likesCount: number }>> {
    if (!unitIds.length) {
        return new Map();
    }

    const supabase = createClient();
    const resultMap = new Map<string, { isLiked: boolean; likesCount: number }>();

    // Initialize all units with default values
    unitIds.forEach((id) => {
        resultMap.set(id, { isLiked: false, likesCount: 0 });
    });

    // Fetch user's likes if userId provided
    if (userId) {
        const { data: userLikes, error: userLikesError } = await supabase
            .from("unit_likes")
            .select("unit_id")
            .eq("user_id", userId)
            .in("unit_id", unitIds);

        if (userLikesError) {
            console.error("Error fetching user's unit likes:", userLikesError);
        } else {
            userLikes?.forEach((like) => {
                const existing = resultMap.get(like.unit_id);
                if (existing) {
                    existing.isLiked = true;
                }
            });
        }
    }

    // Fetch like counts for all units
    // Note: This requires a count query or aggregation from unit_likes table
    // For efficiency, we'll do this in a batch with a custom query
    const { data: likeCounts, error: countsError } = await supabase
        .from("unit_likes")
        .select("unit_id")
        .in("unit_id", unitIds);

    if (countsError) {
        console.error("Error fetching unit like counts:", countsError);
    } else {
        // Count occurrences of each unit_id
        const countMap = new Map<string, number>();
        likeCounts?.forEach((like) => {
            countMap.set(like.unit_id, (countMap.get(like.unit_id) || 0) + 1);
        });

        // Update result map with counts
        countMap.forEach((count, unitId) => {
            const existing = resultMap.get(unitId);
            if (existing) {
                existing.likesCount = count;
            }
        });
    }

    return resultMap;
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
    const propertySnapshotsByPropertyId = new Map(
        properties.map((prop) => [prop.id, createPropertyUnitSnapshot(allPropertyUnits.get(prop.id))])
    );
    const propertyStatusesByPropertyId = new Map(
        properties.map((prop) => [
            prop.id,
            getPropertyStatuses(propertySnapshotsByPropertyId.get(prop.id)!),
        ])
    );

    if (isAdmin && status) {
        properties = properties.filter((prop) =>
            propertyStatusesByPropertyId.get(prop.id)?.has(status)
        );
    }

    // For public listings, visibility is driven by the full property unit set,
    // not the unit subset that survived join filters.
    if (!isAdmin && isPublished) {
        properties = properties.filter((prop) =>
            shouldShowPropertyForPublicListing(propertySnapshotsByPropertyId.get(prop.id)!, listingType)
        );
    }

    if (!isAdmin) {
        properties = properties
            .map((prop) => ({
                ...prop,
                units: shapePublicUnits(
                    prop.units,
                    propertySnapshotsByPropertyId.get(prop.id)!,
                    listingType
                ),
            }))
            .filter((prop) => prop.units.length > 0);
    }

    // Sort units: entire_home first, then rooms by name
    properties = properties.map((prop) => ({
        ...prop,
        units: sortUnits(prop.units),
    }));

    // Bulk fetch likes data (both isLiked and likesCount) if userId is provided
    if (userId && properties.length > 0) {
        const allUnitIds = properties.flatMap(
            (prop) => prop.units?.map((unit: Unit) => unit.id) || []
        );
        const uniqueUnitIds = [...new Set(allUnitIds)];

        if (uniqueUnitIds.length > 0) {
            const likesData = await getBulkUnitLikesData(uniqueUnitIds, userId);

            properties = properties.map((prop) => ({
                ...prop,
                units:
                    prop.units?.map((unit: Unit) => {
                        const unitLikesData = likesData.get(unit.id) ?? { isLiked: false, likesCount: 0 };
                        return {
                            ...unit,
                            isLiked: unitLikesData.isLiked,
                            likesCount: unitLikesData.likesCount,
                        };
                    }) || [],
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
export async function getPropertyById(id: string, isAdmin = false, userId?: string): Promise<Property> {
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

    const propertySnapshot = createPropertyUnitSnapshot(property.units);

    if (!isAdmin && !getPublicVisibility(propertySnapshot).isVisible) {
        throw new Error("Property not found");
    }

    let units: Property["units"] = property.units ?? [];

    if (!isAdmin) {
        units = sortUnits(shapePublicUnits(units, propertySnapshot));
    } else {
        units = sortUnits(units);
    }

    // Fetch likes data if userId provided
    if (userId && units.length > 0) {
        const unitIds = units.map((unit) => unit.id);
        const likesData = await getBulkUnitLikesData(unitIds, userId);

        units = units.map((unit) => {
            const unitLikesData = likesData.get(unit.id) ?? { isLiked: false, likesCount: 0 };
            return {
                ...unit,
                isLiked: unitLikesData.isLiked,
                likesCount: unitLikesData.likesCount,
            };
        });
    }

    return {
        ...property,
        units,
    };
}
