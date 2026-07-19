export interface Contact {
  /**
   * Unique identifier.
   */
  id: string;

  /**
   * User-friendly contact name.
   */
  name: string;

  /**
   * EVM wallet address.
   */
  address: `0x${string}`;

  /**
   * Unix timestamp (milliseconds).
   */
  createdAt: number;
}