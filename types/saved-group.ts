export interface SavedGroup {
  /**
   * Unique identifier.
   */
  id: string;

  /**
   * User-friendly group name.
   */
  name: string;

  /**
   * Contact IDs belonging to this group.
   */
  contactIds: string[];

  /**
   * Unix timestamp (milliseconds).
   */
  createdAt: number;
}