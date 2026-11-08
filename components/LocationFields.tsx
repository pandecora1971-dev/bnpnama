"use client";
import catalog from "@/lib/locations.json";
export type LocationValue = {
  division: string;
  district: string;
  upazila: string;
};
export default function LocationFields({
  value,
  onChange,
  required = false,
  prefix = "",
}: {
  value: LocationValue;
  onChange: (v: LocationValue) => void;
  required?: boolean;
  prefix?: string;
}) {
  const districts =
    catalog.find((d) => d.name === value.division)?.districts || [];
  const upazilas =
    districts.find((d) => d.name === value.district)?.upazilas || [];
  return (
    <>
      <label className={required ? "" : "filter-label"}>
        <span className={required ? "" : "sr-only"}>বিভাগ</span>
        <select
          name="division"
          aria-label={`${prefix}বিভাগ`}
          value={value.division}
          onChange={(e) =>
            onChange({ division: e.target.value, district: "", upazila: "" })
          }
          required={required}
        >
          <option value="">
            {required ? "বিভাগ নির্বাচন করুন" : "সব বিভাগ"}
          </option>
          {catalog.map((d) => (
            <option key={d.name}>{d.name}</option>
          ))}
        </select>
      </label>
      <label className={required ? "" : "filter-label"}>
        <span className={required ? "" : "sr-only"}>জেলা</span>
        <select
          name="district"
          aria-label={`${prefix}জেলা`}
          value={value.district}
          onChange={(e) =>
            onChange({ ...value, district: e.target.value, upazila: "" })
          }
          disabled={!value.division}
          required={required}
        >
          <option value="">
            {value.division
              ? required
                ? "জেলা নির্বাচন করুন"
                : "সব জেলা"
              : "আগে বিভাগ নির্বাচন করুন"}
          </option>
          {districts.map((d) => (
            <option key={d.name}>{d.name}</option>
          ))}
        </select>
      </label>
      <label className={required ? "" : "filter-label"}>
        <span className={required ? "" : "sr-only"}>উপজেলা/থানা</span>
        <select
          name="upazila"
          aria-label={`${prefix}উপজেলা/থানা`}
          value={value.upazila}
          onChange={(e) => onChange({ ...value, upazila: e.target.value })}
          disabled={!value.district}
          required={required}
        >
          <option value="">
            {value.district
              ? required
                ? "উপজেলা/থানা নির্বাচন করুন"
                : "সব উপজেলা/থানা"
              : "আগে জেলা নির্বাচন করুন"}
          </option>
          {upazilas.map((u) => (
            <option key={u}>{u}</option>
          ))}
        </select>
      </label>
    </>
  );
}
