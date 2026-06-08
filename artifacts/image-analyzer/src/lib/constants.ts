export const CATEGORIES = {
  electronics: "Electronics",
  furniture: "Furniture",
  vehicles: "Vehicles",
  food: "Food",
  documents: "Documents",
  people_portraits: "People / Portraits",
  nature_outdoors: "Nature / Outdoors",
  other: "Other",
} as const;

export type CategoryKey = keyof typeof CATEGORIES;
