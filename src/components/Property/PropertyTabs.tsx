"use client";

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { PropertyAmenities } from "./PropertyAmenities";
import { UnitFeatures } from "./UnitFeatures";
import { TravelTimeSummary } from "./TravelTimeSummary";

type ContentTab = "about" | "amenities" | "features";

interface PropertyTabsProps {
	description: string | null;
	amenities: string[] | null;
	features: string[] | null;
	latitude: number | null;
	longitude: number | null;
}

export function PropertyTabs({
	description,
	amenities,
	features,
	latitude,
	longitude,
}: PropertyTabsProps) {
	const [activeContentTab, setActiveContentTab] = useState<ContentTab>("about");
	const [underlineStyle, setUnderlineStyle] = useState<{ width: number; left: number }>({
		width: 0,
		left: 0,
	});
	const [underlineReady, setUnderlineReady] = useState(false);
	const tabListRef = React.useRef<HTMLDivElement>(null);

	const hasAmenities = Boolean(amenities && amenities.length > 0);
	const hasFeatures = Boolean(features && features.length > 0);

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

		setUnderlineStyle({
			width: activeButton.offsetWidth,
			left: activeButton.offsetLeft,
		});
		setUnderlineReady(true);
	}, []);

	useLayoutEffect(() => {
		recalculateUnderline();
	}, [activeContentTab, recalculateUnderline]);

	useEffect(() => {
		const el = tabListRef.current;
		let ro: ResizeObserver | undefined;
		if (el && typeof ResizeObserver !== "undefined") {
			ro = new ResizeObserver(() => recalculateUnderline());
			ro.observe(el);
		}

		const onResize = () => recalculateUnderline();
		window.addEventListener("resize", onResize);

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
			if (event.key === "ArrowLeft") {
				nextIndex = (currentIndex - 1 + contentTabs.length) % contentTabs.length;
			}
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

	return (
		<div>
			<div
				ref={tabListRef}
				role="tablist"
				aria-label="Property content sections"
				onKeyDown={handleContentTabKeyDown}
				className="mb-5 sm:mb-6 flex items-end gap-5 sm:gap-7 relative"
			>
				<div
					className={clsx(
						"absolute bottom-0 h-0.5 bg-primary-600 ease-in-out",
						underlineReady ? "opacity-100" : "opacity-0",
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
					const showFallbackUnderline = isActive && !underlineReady;
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
								showFallbackUnderline && "border-b-2 border-primary-600",
								isActive ? "text-text" : "text-text-muted hover:text-text"
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
						{description || "No description available."}
					</p>
					{latitude != null && longitude != null && (
						<div className="mt-4">
							<TravelTimeSummary latitude={Number(latitude)} longitude={Number(longitude)} />
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
						<PropertyAmenities amenities={amenities} />
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
						<UnitFeatures features={features} />
					) : (
						<p className="text-sm sm:text-base text-text-muted">
							No unit features listed yet.
						</p>
					)}
				</section>
			)}
		</div>
	);
}

