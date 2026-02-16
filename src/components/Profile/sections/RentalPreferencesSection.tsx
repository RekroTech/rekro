"use client";

import { Input, Checkbox } from "@/components/common";
import type { RentalPreferencesFormState } from "../types";

interface RentalPreferencesSectionProps {
  data: Partial<RentalPreferencesFormState>;
  onChange: (data: Partial<RentalPreferencesFormState>) => void;
}

export function RentalPreferencesSection({ data, onChange }: RentalPreferencesSectionProps) {
  const handleChange = (field: keyof RentalPreferencesFormState, value: unknown) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Preferred Locality"
          value={data.preferred_locality || ""}
          onChange={(e) => {
            handleChange("preferred_locality", e.target.value || null);
          }}
          placeholder="e.g., Clayton, Melbourne"
        />

        <Input
          label="Max budget (per week)"
          type="number"
          value={data.max_budget_per_week?.toString() || ""}
          onChange={(e) =>
            handleChange(
              "max_budget_per_week",
              e.target.value ? parseInt(e.target.value) : null
            )
          }
          placeholder="e.g., 500"
          prefix="$"
        />
      </div>

      <div className="space-y-3">
        <Checkbox
          label="I have pets"
          checked={Boolean(data.has_pets)}
          onChange={(e) => handleChange("has_pets", e.target.checked)}
        />

        <Checkbox
          label="I am a smoker"
          checked={Boolean(data.smoker)}
          onChange={(e) => handleChange("smoker", e.target.checked)}
        />
      </div>
    </div>
  );
}
