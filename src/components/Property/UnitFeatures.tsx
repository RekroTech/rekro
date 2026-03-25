import {
	BedsideTableIcon,
	ChairIcon,
	DeskIcon,
	DrawersIcon,
	Icon,
	WardrobeIcon,
} from "@/components/common";
import type { LucideIcon } from "lucide-react";
import type { SvgIcon } from "@/components/common";
import {
	Bath,
	Bed,
	BedDouble,
	Building2,
	Check,
	Lamp,
	Utensils,
} from "lucide-react";

interface UnitFeaturesProps {
	features: string[] | null;
}

const UNIT_FEATURE_ICON_MAP: Record<string, LucideIcon | SvgIcon> = {
	"Single Bed": Bed,
	"Double Bed": BedDouble,
	"Queen Bed": BedDouble,
	"Bed Side Table": BedsideTableIcon,
	Lamp: Lamp,
	Chair: ChairIcon,
	Desk: DeskIcon,
	Wardrobe: WardrobeIcon,
	Drawers: DrawersIcon,
	Kitchenette: Utensils,
	Ensuite: Bath,
	Balcony: Building2,
} as const;

function getUnitFeatureIcon(feature: string): LucideIcon | SvgIcon {
	return UNIT_FEATURE_ICON_MAP[feature] || Check;
}

export function UnitFeatures({ features }: UnitFeaturesProps) {
	if (!features || features.length === 0) {
		return null;
	}

	return (
		<div className="space-y-6 sm:space-y-8">
			<div>
				<div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
					{features.map((feature: string, index: number) => (
						<div key={index} className="flex items-center gap-2 sm:gap-3 text-text group">
							<div className="text-primary-600 group-hover:text-primary-700 transition-colors flex-shrink-0">
								<Icon icon={getUnitFeatureIcon(feature)} size={16} />
							</div>
							<span className="text-xs sm:text-sm md:text-base leading-snug">
								{feature}
							</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

