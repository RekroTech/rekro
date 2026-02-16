"use client";

import { Icon } from "@/components/common";
import type { ShareableProfile } from "@/types/user.types";

interface ProfileCardProps {
  profile: ShareableProfile;
  showShareButton?: boolean;
  onShare?: () => void;
}

/**
 * Shareable profile card showing user's key information
 * Can be shared with landlords when applying for properties
 */
export function ProfileCard({ profile, showShareButton = false, onShare }: ProfileCardProps) {
  const completionColor =
    profile.completionPercentage >= 75 ? "text-green-600" :
    profile.completionPercentage >= 50 ? "text-yellow-600" :
    "text-red-600";

  const completionBgColor =
    profile.completionPercentage >= 75 ? "bg-green-100" :
    profile.completionPercentage >= 50 ? "bg-yellow-100" :
    "bg-red-100";

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 max-w-md relative">
      {/* Edit button (top right) */}
      {showShareButton && (
        <button
          onClick={onShare}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Share profile"
        >
          <Icon name="share" className="w-5 h-5 text-gray-600" />
        </button>
      )}

      {/* Profile Picture */}
      <div className="flex items-start gap-4 mb-4">
        <div className="relative">
          {profile.imageUrl ? (
            <img
              src={profile.imageUrl}
              alt={profile.fullName}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center">
              <Icon name="profile" className="w-10 h-10 text-gray-600" />
            </div>
          )}

          {/* Completion badge */}
          <div className={`absolute -bottom-1 -right-1 ${completionBgColor} ${completionColor} rounded-full px-2 py-1 text-xs font-bold shadow-sm`}>
            {profile.completionPercentage}%
          </div>
        </div>

        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">{profile.fullName}</h2>
          {profile.username && (
            <p className="text-sm text-gray-600">@{profile.username}</p>
          )}
          <div className="mt-1 px-3 py-1 bg-green-800 text-white text-xs font-medium rounded-full inline-block">
            English
          </div>
        </div>
      </div>

      {/* Email */}
      <div className="mb-4">
        <p className="text-sm text-gray-700">{profile.email}</p>
      </div>

      {/* Rental Preference Info */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        {profile.currentLocation && (
          <div className="flex items-start gap-2">
            <Icon name="map" className="w-4 h-4 text-gray-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">Current locality:</p>
              <p className="text-sm font-medium text-gray-900">{profile.currentLocation}</p>
            </div>
          </div>
        )}

        {profile.targetLocation && (
          <div className="flex items-start gap-2">
            <Icon name="navigation" className="w-4 h-4 text-gray-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">Preferred locality:</p>
              <p className="text-sm font-medium text-gray-900">{profile.targetLocation}</p>
            </div>
          </div>
        )}

        {profile.budget && (
          <div className="flex items-start gap-2">
            <Icon name="dollar" className="w-4 h-4 text-gray-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">Max budget:</p>
              <p className="text-sm font-medium text-gray-900">${profile.budget}/week</p>
            </div>
          </div>
        )}
      </div>

      {/* Profile Completion */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Complete Your Application</span>
          <span className={`text-sm font-bold ${completionColor}`}>
            {profile.completionPercentage}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              profile.completionPercentage >= 75 ? "bg-green-600" :
              profile.completionPercentage >= 50 ? "bg-yellow-600" :
              "bg-red-600"
            }`}
            style={{ width: `${profile.completionPercentage}%` }}
          />
        </div>
        {profile.completionPercentage < 100 && (
          <p className="text-xs text-gray-500 mt-2">
            Please complete all fields before applying.
          </p>
        )}
      </div>
    </div>
  );
}
