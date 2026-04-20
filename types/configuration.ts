export type ScreenVisibilityMap = Record<string, boolean>;

export interface ScreenConfiguration {
  screenVisibility: ScreenVisibilityMap;
  updatedAt?: string;
  updatedBy?: string;
}

