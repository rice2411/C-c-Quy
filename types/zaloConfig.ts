export interface ZaloGroupConfig {
  /** Stable client id for list edits */
  id: string;
  name: string;
  /** Zalo group id used by the messaging API (manually entered) */
  zaloGroupId: string;
  memberUids: string[];
}

export interface ZaloGroupsConfiguration {
  groups: ZaloGroupConfig[];
  updatedAt?: string;
  updatedBy?: string | null;
}
