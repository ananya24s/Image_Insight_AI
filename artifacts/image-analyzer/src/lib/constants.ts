export const CATEGORIES = {
  computer_hardware: "Computer / Hardware",
  mobile_device: "Mobile Device",
  general_electronics: "General Electronics",
  other: "Other"
} as const;

export type CategoryKey = keyof typeof CATEGORIES;
