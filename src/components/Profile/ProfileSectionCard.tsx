"use client";

import { ReactNode } from "react";
import { Icon } from "@/components/common";
import type { IconName } from "@/components/common";

interface ProfileSectionCardProps {
  title: string;
  description?: string;
  icon?: IconName;
  completed: boolean;
  completionPercentage: number;
  required?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  children: ReactNode;
}

/**
 * Collapsible section card for profile sections
 */
export function ProfileSectionCard({
  title,
  description,
  icon = "document",
  completed,
  completionPercentage,
  required = false,
  isExpanded = true,
  onToggle,
  children,
}: ProfileSectionCardProps) {
  const statusColor =
    completed ? "text-green-600" :
    completionPercentage >= 50 ? "text-yellow-600" :
    "text-gray-400";

  const statusBgColor =
    completed ? "bg-green-50 border-green-200" :
    completionPercentage >= 50 ? "bg-yellow-50 border-yellow-200" :
    "bg-gray-50 border-gray-200";

  return (
    <div className={`rounded-xl border-2 overflow-hidden transition-all ${statusBgColor}`}>
      {/* Section Header */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/50 transition-colors"
        type="button"
      >
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-lg ${completed ? "bg-green-100" : "bg-white"}`}>
            <Icon name={icon} className={`w-5 h-5 ${statusColor}`} />
          </div>

          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              {required && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                  Required
                </span>
              )}
            </div>
            {description && (
              <p className="text-sm text-gray-600 mt-0.5">{description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Completion Badge */}
          <div className="flex items-center gap-2">
            {completed ? (
              <div className="flex items-center gap-1 text-green-600">
                <Icon name="check-circle" className="w-5 h-5" />
                <span className="text-sm font-medium">Complete</span>
              </div>
            ) : (
              <div className={`flex items-center gap-1 ${statusColor}`}>
                <span className="text-sm font-medium">{completionPercentage}%</span>
              </div>
            )}
          </div>

          {/* Expand/Collapse Icon */}
          <Icon
            name={isExpanded ? "chevron-up" : "chevron-down"}
            className="w-5 h-5 text-gray-400"
          />
        </div>
      </button>

      {/* Section Content */}
      {isExpanded && (
        <div className="px-6 py-4 bg-white border-t border-gray-200">
          {children}
        </div>
      )}
    </div>
  );
}

