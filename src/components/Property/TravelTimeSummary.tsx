"use client";

import { useEffect, useRef, useState } from "react";
import { Car, Footprints } from "lucide-react";
import { loadGoogleMapsScript } from "@/lib/utils/googleMaps";
import { calculateDistance } from "@/lib/utils/geospatial";
import { Icon, Skeleton } from "@/components/common";

// ── Types ──────────────────────────────────────────────────────────────────

type CategoryId = (typeof CATEGORIES)[number]["id"];

interface TravelRow {
    id: CategoryId;
    destinationName: string | null;
    drivingMins: number | null;
    walkingMins: number | null;
    status: "loading" | "done" | "not_found";
}

export interface TravelTimeSummaryProps {
    latitude: number;
    longitude: number;
}

// ── Category config ────────────────────────────────────────────────────────

const CATEGORIES = [
    { id: "train",    label: "Train Station",  color: "#1976D2", letter: "T" },
    { id: "shopping", label: "Shopping Centre", color: "#F57C00", letter: "S" },
    { id: "cbd",      label: "Central CBD",    color: "#7B1FA2", letter: "C" },
] as const;

// ── Australian CBD locations (static — no API calls needed) ────────────────

const AU_CBDS = [
    { name: "Sydney CBD",      lat: -33.8688, lng: 151.2093 },
    { name: "Melbourne CBD",   lat: -37.8136, lng: 144.9631 },
    { name: "Brisbane CBD",    lat: -27.4698, lng: 153.0251 },
    { name: "Perth CBD",       lat: -31.9505, lng: 115.8605 },
    { name: "Adelaide CBD",    lat: -34.9285, lng: 138.6007 },
    { name: "Canberra CBD",    lat: -35.2809, lng: 149.1300 },
    { name: "Hobart CBD",      lat: -42.8821, lng: 147.3272 },
    { name: "Darwin CBD",      lat: -12.4634, lng: 130.8456 },
    { name: "Gold Coast CBD",  lat: -28.0167, lng: 153.4000 },
    { name: "Newcastle CBD",   lat: -32.9283, lng: 151.7817 },
    { name: "Wollongong CBD",  lat: -34.4278, lng: 150.8931 },
    { name: "Geelong CBD",     lat: -38.1499, lng: 144.3617 },
    { name: "Sunshine Coast CBD", lat: -26.6500, lng: 153.0667 },
] as const;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Driving estimate: straight-line × 1.3 routing factor at 40 km/h avg city speed. */
function estimateDriveMins(distKm: number): number {
    return Math.max(1, Math.round((distKm * 1.3 * 60) / 40));
}

/** Walking estimate: straight-line × 1.3 routing factor at 5 km/h avg walk speed. */
function estimateWalkMins(distKm: number): number {
    return Math.max(1, Math.round((distKm * 1.3 * 60) / 5));
}

/** Find the nearest Australian CBD from the static lookup table. */
function findNearestCBD(lat: number, lng: number): { name: string; lat: number; lng: number; distKm: number } {
    let best: (typeof AU_CBDS)[number] = AU_CBDS[0];
    let bestDist = Infinity;
    for (const cbd of AU_CBDS) {
        const d = calculateDistance(lat, lng, cbd.lat, cbd.lng);
        if (d < bestDist) {
            bestDist = d;
            best = cbd;
        }
    }
    return { name: best.name, lat: best.lat, lng: best.lng, distKm: bestDist };
}

// ── Session cache (avoids re-fetching on modal re-open / re-render) ───────

const CACHE_PREFIX = "rekro_travel_v2_";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function cacheKey(lat: number, lng: number): string {
    return `${CACHE_PREFIX}${lat.toFixed(4)}_${lng.toFixed(4)}`;
}

function getCached(lat: number, lng: number): TravelRow[] | null {
    try {
        const raw = sessionStorage.getItem(cacheKey(lat, lng));
        if (!raw) return null;
        const { rows, ts } = JSON.parse(raw) as { rows: TravelRow[]; ts: number };
        if (Date.now() - ts > CACHE_TTL_MS) return null;
        return rows;
    } catch {
        return null;
    }
}

function setCache(lat: number, lng: number, rows: TravelRow[]): void {
    try {
        sessionStorage.setItem(cacheKey(lat, lng), JSON.stringify({ rows, ts: Date.now() }));
    } catch { /* storage full — ignore */ }
}

// ── Places nearbySearch wrapper ────────────────────────────────────────────

/**
 * Searches for places matching ANY of the given types within the radius,
 * deduplicates by place_id, optionally filters, then returns the single
 * result that is physically closest to the origin (straight-line distance).
 *
 * This fixes two bugs in the previous single-type implementation:
 *  1. Google Places sorts by *prominence*, not distance — first result ≠ nearest.
 *  2. Australian rail stations are tagged inconsistently across transit sub-types;
 *     searching all relevant types in parallel ensures nothing is missed.
 */
async function findNearestOfTypes(
    service: google.maps.places.PlacesService,
    originLat: number,
    originLng: number,
    types: string[],
    radius: number,
    /**
     * Mirrors MapView's `maxResults` per category — the filter and slice are applied
     * inside each nearbySearch callback so the candidate pool is IDENTICAL to what
     * MapView actually pins on the map.  We then pick the nearest from that pool.
     */
    maxPerType: number,
    filter?: (p: google.maps.places.PlaceResult) => boolean,
    /** Optional keyword forwarded to nearbySearch — mirrors MapView's POI_CATEGORIES keyword field. */
    keyword?: string,
): Promise<{ name: string; lat: number; lng: number } | null> {
    const location = new google.maps.LatLng(originLat, originLng);

    // One nearbySearch per type in parallel — mirrors MapView's inner `for (const type of category.types)` loop.
    const searches = types.map(
        (type) =>
            new Promise<google.maps.places.PlaceResult[]>((resolve) => {
                service.nearbySearch(
                    { location, radius, type, ...(keyword ? { keyword } : {}) },
                    (results, status) => {
                        if (status !== google.maps.places.PlacesServiceStatus.OK || !results?.length) {
                            resolve([]);
                            return;
                        }
                        // Mirror MapView exactly:
                        //   1. apply resultFilter
                        //   2. slice(0, maxResults)   ← this is what MapView pins; we must match it
                        const filtered = filter ? results.filter(filter) : results;
                        resolve(filtered.slice(0, maxPerType));
                    },
                );
            }),
    );

    const allResults = (await Promise.all(searches)).flat();

    // Deduplicate by place_id — mirrors MapView's `seenPlaceIds` set
    const seen = new Set<string>();
    const pool = allResults.filter((p) => {
        if (!p.place_id || seen.has(p.place_id)) return false;
        seen.add(p.place_id);
        return true;
    });

    if (!pool.length) return null;

    // From the same set MapView shows, pick the one physically closest to the property
    const sorted = pool
        .filter((p) => p.geometry?.location)
        .map((p) => {
            const loc = p.geometry!.location!;
            return {
                place: p,
                dist: calculateDistance(originLat, originLng, loc.lat(), loc.lng()),
            };
        })
        .sort((a, b) => a.dist - b.dist);

    if (!sorted.length) return null;
    const best = sorted[0]?.place;
    if (!best) return null;
    const loc = best.geometry!.location!;
    return { name: best.name ?? "Unknown", lat: loc.lat(), lng: loc.lng() };
}

// ── Build a result row from a resolved destination ─────────────────────────

function buildRow(
    id: CategoryId,
    originLat: number,
    originLng: number,
    dest: { name: string; lat: number; lng: number } | null,
): TravelRow {
    if (!dest) {
        return { id, destinationName: null, drivingMins: null, walkingMins: null, status: "not_found" };
    }
    const distKm = calculateDistance(originLat, originLng, dest.lat, dest.lng);
    const walkMins = estimateWalkMins(distKm);
    return {
        id,
        destinationName: dest.name,
        drivingMins: estimateDriveMins(distKm),
        walkingMins: walkMins <= 20 ? walkMins : null,
        status: "done",
    };
}

// ── Loading row factory ────────────────────────────────────────────────────

function loadingRows(): TravelRow[] {
    return CATEGORIES.map((c) => ({
        id: c.id,
        destinationName: null,
        drivingMins: null,
        walkingMins: null,
        status: "loading" as const,
    }));
}

// ── Component ──────────────────────────────────────────────────────────────

export function TravelTimeSummary({ latitude, longitude }: TravelTimeSummaryProps) {
    // Initialise from session cache if available — zero API calls on repeat views
    const [rows, setRows] = useState<TravelRow[]>(() => getCached(latitude, longitude) ?? loadingRows());
    const cancelledRef = useRef(false);

    useEffect(() => {
        cancelledRef.current = false;

        // Already resolved (from cache or a previous effect run for same coords)
        if (rows.every((r) => r.status !== "loading")) return;


        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) return;

        loadGoogleMapsScript(apiKey)
            .then(async () => {
                if (cancelledRef.current) return;

                const attrDiv = document.createElement("div");
                const service = new google.maps.places.PlacesService(attrDiv);

                // ② CBD — resolved from static lookup (0 API calls)
                const cbd = findNearestCBD(latitude, longitude);
                const cbdRow = buildRow("cbd", latitude, longitude, {
                    name: cbd.name,
                    lat: cbd.lat,
                    lng: cbd.lng,
                });

                // ③ Train + Shopping — exact mirror of MapView POI_CATEGORIES:
                //    • same types, radius, keyword, resultFilter
                //    • same maxResults cap applied per type before deduplication
                //    → TravelTimeSummary can only ever show a place that is also pinned on the map.
                //    From that identical candidate pool we then pick the nearest by straight-line distance.
                const [trainDest, shoppingDest] = await Promise.all([
                    // MapView: types:["subway_station","train_station"], radius:2000, maxResults:6, no filter
                    findNearestOfTypes(
                        service, latitude, longitude,
                        ["subway_station", "train_station"],
                        2000,
                        6,
                    ),
                    // MapView: types:["shopping_mall"], radius:4000, maxResults:5,
                    //          keyword:"shopping centre...", resultFilter:isShoppingCentre
                    findNearestOfTypes(
                        service, latitude, longitude,
                        ["shopping_mall"],
                        4000,
                        5,
                        (p) => (p.types ?? []).includes("shopping_mall"),
                        "shopping centre shopping mall westfield plaza",
                    ),
                ]);

                if (cancelledRef.current) return;

                const newRows: TravelRow[] = [
                    buildRow("train", latitude, longitude, trainDest),
                    buildRow("shopping", latitude, longitude, shoppingDest),
                    cbdRow,
                ];

                setRows(newRows);
                setCache(latitude, longitude, newRows);
            })
            .catch(() => {
                if (!cancelledRef.current) {
                    setRows((prev) => prev.map((r) => ({ ...r, status: "not_found" as const })));
                }
            });

        return () => {
            cancelledRef.current = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- rows is read once as a guard, not a reactive dependency
    }, [latitude, longitude]);

    return (
        <div className="rounded-lg border border-border bg-surface-subtle p-3">
            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                Commute estimates
            </p>
            <div className="space-y-2">
                {rows.map((row) => {
                    const cat = CATEGORIES.find((c) => c.id === row.id)!;

                    return (
                        <div key={row.id} className="flex items-center gap-3">
                            {/* Category badge — matches the map POI legend */}
                            <span
                                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold text-white ring-2 ring-white/20 shadow-sm"
                                style={{ background: cat.color }}
                            >
                                {cat.letter}
                            </span>

                            <div className="min-w-0 flex-1">
                                {row.status === "loading" ? (
                                    <div className="space-y-1.5">
                                        <Skeleton className="h-3 w-36" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                ) : row.status === "not_found" ? (
                                    <>
                                        <p className="text-sm font-medium text-text">{cat.label}</p>
                                        <p className="text-xs text-text-muted/60">None found nearby</p>
                                    </>
                                ) : (
                                    <>
                                        <p className="truncate text-sm font-medium text-text">
                                            {row.destinationName ?? cat.label}
                                        </p>
                                        <div className="mt-0.5 flex items-center gap-3">
                                            {row.drivingMins != null && (
                                                <span className="flex items-center gap-1 text-xs text-text-muted">
                                                    <Icon icon={Car} size={13} className="shrink-0 text-text-muted" />
                                                    {row.drivingMins} min
                                                </span>
                                            )}
                                            {row.walkingMins != null && (
                                                <span className="flex items-center gap-1 text-xs text-text-muted">
                                                    <Icon icon={Footprints} size={13} className="shrink-0 text-text-muted" />
                                                    {row.walkingMins} min
                                                </span>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            <span className="shrink-0 text-xs text-text-muted">{cat.label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
