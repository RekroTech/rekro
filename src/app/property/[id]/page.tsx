"use client";

import React, {
    useState,
    useMemo,
    useEffect,
    Suspense,
    useCallback,
    useLayoutEffect,
} from "react";
import clsx from "clsx";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ProfileCompletionProvider } from "@/contexts";
import { getPropertyFileUrls } from "@/lib/services";
import { useProperty, useProfile } from "@/lib/hooks";
import { useMediaQuery } from "@/hooks";
import { Button, BackButton, PropertyDetailSkeleton } from "@/components/common";
import {
    PropertyHeader,
    UnitsSelector,
    ImageGallery,
    ImageGalleryMobile,
    PropertyAmenities,
    UnitFeatures,
    PropertySidebar,
    LikedUsersCarousal,
    DiscoverabilityPrompt,
    PropertyErrorBoundary,
    TravelTimeSummary,
} from "@/components/Property";
import { updateRoomRentsOnOccupancySelection } from "@/lib/utils/pricing";

export default function PropertyDetailPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const propertyId = params.id as string;
    const isDesktop = useMediaQuery("(min-width: 1024px)");
    const { data: userProfile } = useProfile();

    const { data: property, isLoading, error } = useProperty(propertyId);

    const [selectedUnitId, setSelectedUnitId] = useState<string>(
        () => searchParams.get("unit") ?? ""
    );
    const [unitOccupancies, setUnitOccupancies] = useState<Record<string, number>>({});
    // Default selected tab is "about"
    const [activeContentTab, setActiveContentTab] = useState<"about" | "amenities" | "features">("about");
    const [underlineStyle, setUnderlineStyle] = useState<{ width: number; left: number }>({ width: 0, left: 0 });
    const [underlineReady, setUnderlineReady] = useState(false);
    const tabListRef = React.useRef<HTMLDivElement>(null);

    const contentTabs = useMemo(
        () => [
            { id: "about" as const, label: "About" },
            { id: "amenities" as const, label: "Amenities" },
            { id: "features" as const, label: "Features" },
        ],
        []
    );

    const recalculateUnderline = useCallback(() => {
        const root = tabListRef.current;
        if (!root) return;

        const activeButton = root.querySelector(
            `[role="tab"][aria-selected="true"]`
        ) as HTMLElement | null;
        if (!activeButton) return;

        // offsetLeft is relative to the offsetParent (the tablist container)
        // which is what we want because the underline is absolutely positioned in it.
        setUnderlineStyle({
            width: activeButton.offsetWidth,
            left: activeButton.offsetLeft,
        });
        setUnderlineReady(true);
    }, []);

    // Measure underline at layout-time to avoid a visible "jump" after paint.
    useLayoutEffect(() => {
        recalculateUnderline();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeContentTab]);

    // Keep underline aligned if the tab sizes/positions change (resize, font load, etc.)
    useEffect(() => {
        // 1) ResizeObserver (best for element size changes)
        const el = tabListRef.current;
        let ro: ResizeObserver | undefined;
        if (el && typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(() => recalculateUnderline());
            ro.observe(el);
        }

        // 2) Window resize (covers layout shifts not caught by RO in some cases)
        const onResize = () => recalculateUnderline();
        window.addEventListener("resize", onResize);

        // 3) Font loading can change text metrics after initial layout
        const fontSet = (document as Document & { fonts?: FontFaceSet }).fonts;
        if (fontSet?.ready) {
            fontSet.ready.then(() => recalculateUnderline()).catch(() => {
                /* ignore */
            });
        }

        return () => {
            window.removeEventListener("resize", onResize);
            ro?.disconnect();
        };
    }, [recalculateUnderline]);

    const handleContentTabKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {
            const currentIndex = contentTabs.findIndex((tab) => tab.id === activeContentTab);
            if (currentIndex === -1) return;

            let nextIndex = currentIndex;
            if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % contentTabs.length;
            if (event.key === "ArrowLeft")
                nextIndex = (currentIndex - 1 + contentTabs.length) % contentTabs.length;
            if (event.key === "Home") nextIndex = 0;
            if (event.key === "End") nextIndex = contentTabs.length - 1;

            if (nextIndex !== currentIndex) {
                event.preventDefault();
                const nextTab = contentTabs[nextIndex]!;
                setActiveContentTab(nextTab.id);
            }
        },
        [activeContentTab, contentTabs]
    );

    // Initialize selectedUnitId when units are available (must be before early returns)
    useEffect(() => {
        if (property?.units && property.units.length > 0 && !selectedUnitId) {
            const unitFromQuery = searchParams.get("unit");
            const unitExists = unitFromQuery && property.units.some((u) => u.id === unitFromQuery);
            const defaultUnit = unitExists ? unitFromQuery : property.units[0]!.id;
            setSelectedUnitId(defaultUnit);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [property?.units, propertyId]); // selectedUnitId intentionally excluded to prevent infinite loop

    const handleUnitSelect = useCallback(
        (unitId: string) => {
            setSelectedUnitId(unitId);
            const current = new URLSearchParams(Array.from(searchParams.entries()));
            current.set("unit", unitId);
            router.replace(`?${current.toString()}`, { scroll: false });
        },
        [router, searchParams]
    );

    // Calculate dynamic pricing for all rooms based on current occupancy selections
    // Only apply dynamic pricing when dual occupancy is actually selected
    const dynamicPricing = useMemo(() => {
        if (!property?.units || property.units.length <= 1) {
            return undefined; // No dynamic pricing for single unit or entire home
        }

        const isRoomListing = property.units.some((u) => u.listing_type === "room");
        if (!isRoomListing) return undefined;

        // Check if any ROOM unit has dual occupancy selected (exclude entire_home)
        const hasAnyDualOccupancy = property.units.some(
            (unit) => unit.listing_type === "room" && unitOccupancies[unit.id] === 2
        );

        // Only calculate dynamic pricing if dual occupancy is selected somewhere
        if (!hasAnyDualOccupancy) {
            return undefined; // Use default unit.price values
        }

        // Only include room type units in the calculation
        const rooms = property.units
            .filter((u) => u.listing_type === "room")
            .map((unit) => ({
                id: unit.id,
                maxCapacity: unit.max_occupants || 1,
                selectedOccupancy: unitOccupancies[unit.id] || 1,
            }));

        const result = updateRoomRentsOnOccupancySelection(
            property.price || 0,
            rooms,
            property.furnished || false
        );

        return result.roomRentsById;
    }, [property, unitOccupancies]);

    // Early returns for loading/error states - AFTER all hooks
    if (isLoading) {
        return <PropertyDetailSkeleton />;
    }

    if (error || !property) {
        return (
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Property Not Found</h1>
                    <p className="text-text-muted mb-6">
                        The property you&apos;re looking for doesn&apos;t exist or has been removed.
                    </p>
                    <Button variant="primary" onClick={() => router.push("/")}>
                        Back to Properties
                    </Button>
                </div>
            </div>
        );
    }

    // Defensive: properties must have at least one unit for this page
    if (!property.units || property.units.length === 0) {
        return (
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">No units available</h1>
                    <p className="text-text-muted mb-6">
                        This property doesn&apos;t have any rentable units configured.
                    </p>
                    <Button variant="primary" onClick={() => router.push("/")}>
                        Back to Properties
                    </Button>
                </div>
            </div>
        );
    }

    // After all checks, property and units are guaranteed to exist
    const units = property.units;
    const selectedUnit = units.find((unit) => unit.id === selectedUnitId) ?? units[0]!;
    const hasAmenities = Boolean(property.amenities && property.amenities.length > 0);
    const hasFeatures = Boolean(selectedUnit.features && selectedUnit.features.length > 0);

    // Convert storage paths to URLs
    const propertyMedia =
        property.images && property.images.length > 0
            ? getPropertyFileUrls(property.images, propertyId)
            : ["/window.svg"];

    return (
        <PropertyErrorBoundary>
            <ProfileCompletionProvider>
                <main className="mx-auto max-w-7xl px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6 lg:px-8 lg:py-8 overflow-x-hidden">
                    {/* Back Button */}
                    <BackButton className="mb-4 sm:mb-6" />

                    {/* Property Header */}
                    <PropertyHeader property={property} selectedUnit={selectedUnit} />

                    {/* Main Grid: Image Gallery + Content (stacked on mobile, 2/3 on desktop) + Sidebar (1/3 on desktop) */}
                    <div className="grid gap-4 sm:gap-6 mb-8 lg:grid-cols-3">
                        {/* Image Gallery & Content - Full width on mobile, 2/3 on desktop */}
                        <div className="lg:col-span-2 min-w-0">
                            {/* Mobile Image Gallery - Embla Carousel */}
                            <div className="md:hidden aspect-video rounded-lg overflow-hidden mb-2 sm:mb-4">
                                <ImageGalleryMobile images={propertyMedia} />
                            </div>

                            {/* Desktop Image Gallery */}
                            <div className="hidden md:block">
                                <ImageGallery images={propertyMedia} />
                            </div>

                            {/* Units Section */}
                            {units.length > 1 && (
                                <UnitsSelector
                                    units={units}
                                    selectedUnitId={selectedUnitId}
                                    onUnitSelect={handleUnitSelect}
                                    dynamicPricing={dynamicPricing}
                                />
                            )}

                            {/* Sidebar on mobile - Show after units, before description */}
                            {!isDesktop && (
                                <div className="mt-4">
                                    <PropertySidebar
                                        selectedUnit={selectedUnit}
                                        property={property}
                                        dynamicPricing={dynamicPricing}
                                        onUnitOccupancyChange={(unitId, occupancy) =>
                                            setUnitOccupancies((prev) => ({
                                                ...prev,
                                                [unitId]: occupancy,
                                            }))
                                        }
                                    />
                                </div>
                            )}

                            {/* Content */}
                            <div className="px-2 sm:px-0 space-y-6 sm:space-y-8 mt-6 sm:mt-8">
                                <div>
                                    <div
                                        ref={tabListRef}
                                        role="tablist"
                                        aria-label="Property content sections"
                                        onKeyDown={handleContentTabKeyDown}
                                        className="mb-5 sm:mb-6 flex items-end gap-5 sm:gap-7 relative"
                                    >
                                        {/* Sliding underline indicator - Material UI style */}
                                        <div
                                                    className={clsx(
                                                        "absolute bottom-0 h-0.5 bg-primary-600 ease-in-out",
                                                        // Hide until we have a measured position/width to prevent a flash at 0px.
                                                        underlineReady ? "opacity-100" : "opacity-0",
                                                        // Use transform-based transitions where possible for smoother animation.
                                                        // Note: left/width are still set via inline style; transition-all keeps it smooth.
                                                        "transition-all duration-300"
                                                    )}
                                            style={{
                                                width: `${underlineStyle.width}px`,
                                                left: `${underlineStyle.left}px`,
                                                willChange: "width, left",
                                            }}
                                            aria-hidden="true"
                                        />

                                        {contentTabs.map((tab) => {
                                            const isActive = activeContentTab === tab.id;
                                            return (
                                                <button
                                                    key={tab.id}
                                                    type="button"
                                                    id={`property-content-tab-${tab.id}`}
                                                    role="tab"
                                                    aria-selected={isActive}
                                                    aria-controls={`property-content-panel-${tab.id}`}
                                                    tabIndex={isActive ? 0 : -1}
                                                    onClick={() => setActiveContentTab(tab.id)}
                                                    className={clsx(
                                                        "px-0.5 py-1.5 text-sm sm:text-xl font-semibold transition-colors relative z-10",
                                                        isActive
                                                            ? "text-text"
                                                            : "text-text-muted hover:text-text"
                                                    )}
                                                >
                                                    {tab.label}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {activeContentTab === "about" && (
                                        <section
                                            id="property-content-panel-about"
                                            role="tabpanel"
                                            aria-labelledby="property-content-tab-about"
                                        >
                                            <p className="text-sm sm:text-base text-text-muted leading-relaxed whitespace-pre-line">
                                                {property.description || "No description available."}
                                            </p>
                                            {property.latitude != null && property.longitude != null && (
                                                <div className="mt-4">
                                                    <TravelTimeSummary
                                                        latitude={Number(property.latitude)}
                                                        longitude={Number(property.longitude)}
                                                    />
                                                </div>
                                            )}
                                        </section>
                                    )}

                                    {activeContentTab === "amenities" && (
                                        <section
                                            id="property-content-panel-amenities"
                                            role="tabpanel"
                                            aria-labelledby="property-content-tab-amenities"
                                        >
                                            {hasAmenities ? (
                                                <PropertyAmenities amenities={property.amenities} />
                                            ) : (
                                                <p className="text-sm sm:text-base text-text-muted">
                                                    No amenities listed for this property yet.
                                                </p>
                                            )}
                                        </section>
                                    )}

                                    {activeContentTab === "features" && (
                                        <section
                                            id="property-content-panel-features"
                                            role="tabpanel"
                                            aria-labelledby="property-content-tab-features"
                                        >
                                            {hasFeatures ? (
                                                <UnitFeatures features={selectedUnit.features} />
                                            ) : (
                                                <p className="text-sm sm:text-base text-text-muted">
                                                    No unit features listed yet.
                                                </p>
                                            )}
                                        </section>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar - Desktop only */}
                        {isDesktop && (
                            <div className="col-span-1 min-w-0">
                                <PropertySidebar
                                    selectedUnit={selectedUnit}
                                    property={property}
                                    dynamicPricing={dynamicPricing}
                                    onUnitOccupancyChange={(unitId, occupancy) =>
                                        setUnitOccupancies((prev) => ({
                                            ...prev,
                                            [unitId]: occupancy,
                                        }))
                                    }
                                />
                            </div>
                        )}
                    </div>

                    {/* Users Who Liked Carousel - Only visible for authenticated users */}
                    {userProfile &&
                        (userProfile.discoverable ? (
                            <Suspense
                                fallback={
                                    <div className="h-32 animate-pulse bg-surface-subtle rounded-lg" />
                                }
                            >
                                <div className="my-4 sm:my-12">
                                    <LikedUsersCarousal propertyId={propertyId} />
                                </div>
                            </Suspense>
                        ) : (
                            <DiscoverabilityPrompt />
                        ))}
                </main>
            </ProfileCompletionProvider>
        </PropertyErrorBoundary>
    );
}
