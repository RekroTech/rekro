import { Property } from "@/types/db";
import { Icon } from "@/components/common";

interface PropertyHeaderProps {
    property: Property;
}

export function PropertyHeader({ property }: PropertyHeaderProps) {
    const { title, property_type, bedrooms, bathrooms, car_spaces, furnished, address } = property;

    const addressText =
        address !== null
            ? Object.values(address).filter(Boolean).join(", ")
            : "Location not specified";

    return (
        <div className="mb-6">
            {property_type && (
                <div className="text-sm font-semibold text-primary-600 uppercase mb-2">
                    {property_type}
                </div>
            )}

            <div className="flex items-start justify-between gap-4 mb-3">
                <h1 className="text-3xl md:text-4xl font-bold text-text flex-1">{title}</h1>
            </div>

            <p className="text-lg text-text-muted flex items-center gap-2 mb-4">
                <Icon name="location" className="w-5 h-5" />
                {addressText}
            </p>

            {/* Property Features */}
            <div className="flex flex-wrap items-center gap-4 md:gap-6 text-text-muted">
                {bedrooms !== null && bedrooms !== undefined && (
                    <div className="flex items-center gap-2">
                        <Icon name="bed" className="w-5 h-5 md:w-6 md:h-6" />
                        <span className="text-base md:text-lg font-semibold">
                            {bedrooms} Bed{bedrooms !== 1 ? "s" : ""}
                        </span>
                    </div>
                )}

                {bathrooms !== null && bathrooms !== undefined && (
                    <div className="flex items-center gap-2">
                        <Icon name="bath" className="w-5 h-5 md:w-6 md:h-6" />
                        <span className="text-base md:text-lg font-semibold">
                            {bathrooms} Bath{bathrooms !== 1 ? "s" : ""}
                        </span>
                    </div>
                )}

                {car_spaces !== null && car_spaces !== undefined && car_spaces > 0 && (
                    <div className="flex items-center gap-2">
                        <Icon name="car" className="w-5 h-5 md:w-6 md:h-6" />
                        <span className="text-base md:text-lg font-semibold">
                            {car_spaces} Car{car_spaces !== 1 ? "s" : ""}
                        </span>
                    </div>
                )}

                {furnished && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-full border border-green-300">
                        <Icon name="check" className="w-5 h-5" />
                        <span className="text-sm md:text-base font-bold">Furnished</span>
                    </div>
                )}
            </div>
        </div>
    );
}
