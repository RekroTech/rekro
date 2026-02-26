import { useMemo } from "react";
import { Icon } from "@/components/common";
import type { Property } from "@/types/property.types";
import type { Unit } from "@/types/db";
import { getPropertyTypeDisplay } from "./utils";

interface ApplicationConfirmProps {
    property: Property;
    selectedUnit: Unit;
}

export function ApplicationConfirm({
    property,
    selectedUnit,
}: ApplicationConfirmProps) {
    const propertyTypeDisplay = useMemo(
        () => getPropertyTypeDisplay(property, selectedUnit),
        [property, selectedUnit]
    );

    return (
        <div className="space-y-4 sm:space-y-6 py-4">
            {/* Success Icon and Message */}
            <div className="text-center space-y-4">
                <div className="flex justify-center">
                    <div className="w-8 h-8 sm:w-20 sm:h-20 bg-success-100 rounded-full flex items-center justify-center">
                        <Icon
                            name="check" 
                            className="w-12 h-12 text-success-600"
                            strokeWidth={3}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-text">
                        Application Submitted Successfully!
                    </h2>
                    <p className="text-text-muted text-lg">
                        Your application for <span className="font-semibold">{property.title}</span> has been received.
                    </p>
                </div>
            </div>

            {/* What Happens Next Section */}
            <div className="bg-surface-subtle border border-border rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold text-text flex items-center gap-2">
                    <Icon name="info" className="w-5 h-5 text-primary-600" />
                    What happens next?
                </h3>

                <div className="space-y-4">
                    <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold text-sm">
                            1
                        </div>
                        <div className="flex-1">
                            <h4 className="font-medium text-text mb-1">Application Review</h4>
                            <p className="text-sm text-text-muted">
                                Rekro will review your application and supporting documents.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold text-sm">
                            2
                        </div>
                        <div className="flex-1">
                            <h4 className="font-medium text-text mb-1">Response Notification</h4>
                            <p className="text-sm text-text-muted">
                                You&#39;ll receive an email notification about the status of your application within 24 hours.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold text-sm">
                            3
                        </div>
                        <div className="flex-1">
                            <h4 className="font-medium text-text mb-1">Next Steps</h4>
                            <p className="text-sm text-text-muted">
                                If approved, you&#39;ll receive instructions for signing the lease agreement and paying the bond to secure the property.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Application Details Card */}
            <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-text mb-4">Application Details</h3>

                <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-text-muted">Property</span>
                        <span className="font-medium text-text">{property.title}</span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-text-muted">Unit</span>
                        <span className="font-medium text-text">{selectedUnit.name}</span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-text-muted">Property Type</span>
                        <span className="font-medium text-text capitalize">{propertyTypeDisplay}</span>
                    </div>

                    <div className="flex justify-between items-center py-2">
                        <span className="text-text-muted">Status</span>
                        <span className="inline-flex items-center gap-1.5 font-medium text-warning-600">
                            <Icon name="calendar" className="w-4 h-4" />
                            Pending Review
                        </span>
                    </div>
                </div>
            </div>

            {/* Action Items */}
            <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-4">
                <div className="flex gap-3">
                    <Icon name="info" className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-2">
                        <h4 className="font-semibold text-text">Keep an eye on your email</h4>
                        <p className="text-sm text-text-muted">
                            We&#39;ll send you updates about your application status within 24 hours. Make sure to check your spam folder too.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

