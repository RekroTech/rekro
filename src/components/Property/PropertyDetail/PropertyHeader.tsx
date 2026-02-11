import { Property } from "@/types/db";
import { Icon } from "@/components/common";
import { getLocalityString } from "@/lib/utils/locationPrivacy";

interface PropertyHeaderProps {
    property: Property;
}

export function PropertyHeader({ property }: PropertyHeaderProps) {
    const { title, property_type, bedrooms, bathrooms, car_spaces, furnished, address } = property;

    const addressText = address ? getLocalityString(address) : "Location not specified";

    return (
        <div className="mb-2 sm:mb-4">
            {(property_type || furnished !== null) && (
                <div className=" flex items-center justify-between">
                    <div className="min-w-0">
                        {property_type && (
                            <div className="text-xs font-semibold uppercase tracking-wide text-primary-600 sm:text-sm">
                                {property_type}
                            </div>
                        )}
                    </div>

                    {/* Furnishing badge (same row as property type) */}
                    <div className="flex-shrink-0">
                        {furnished ? (
                            <div className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2 py-1 text-green-800 sm:px-2.5">
                                <Icon name="check" className="h-4 w-4" />
                                <span className="text-xs font-semibold">Furnished</span>
                            </div>
                        ) : (
                            <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-slate-700 sm:px-2.5">
                                <Icon name="x" className="h-4 w-4" />
                                <span className="text-xs font-semibold">Unfurnished</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="">
                <h1 className="min-w-0 flex-1 text-2xl font-bold leading-tight text-text sm:text-3xl sm:leading-tight md:text-4xl">
                    {title}
                </h1>
            </div>

            <p className="mb-2 flex min-w-0 items-start gap-2 text-sm leading-snug text-text-muted sm:mb-4 sm:text-base">
                <Icon
                    name="location"
                    className="mt-0.5 h-4 w-4 flex-shrink-0 sm:mt-0.5 sm:h-5 sm:w-5"
                />
                <span className="min-w-0 break-words">{addressText}</span>
            </p>

            {/* Property Features */}
            <div className="flex flex-wrap items-center gap-x-4 text-text-muted sm:gap-x-6">
                {bedrooms !== null && bedrooms !== undefined && (
                    <div className="flex items-center gap-2">
                        <Icon name="bed" className="h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5" />
                        <span className="text-sm font-semibold sm:text-base">
                            {bedrooms} Bed{bedrooms !== 1 ? "s" : ""}
                        </span>
                    </div>
                )}

                {bathrooms !== null && bathrooms !== undefined && (
                    <div className="flex items-center gap-2">
                        <Icon name="bath" className="h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5" />
                        <span className="text-sm font-semibold sm:text-base">
                            {bathrooms} Bath{bathrooms !== 1 ? "s" : ""}
                        </span>
                    </div>
                )}

                {car_spaces !== null && car_spaces !== undefined && car_spaces > 0 && (
                    <div className="flex items-center gap-2">
                        <Icon name="car" className="h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5" />
                        <span className="text-sm font-semibold sm:text-base">
                            {car_spaces} Car{car_spaces !== 1 ? "s" : ""}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
