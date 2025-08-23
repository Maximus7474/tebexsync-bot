export interface RawTebexPurchasePayload {
  action: "purchase" | "chargeback" | "refund";
  username: string;
  price: string;
  transaction: string;
  packageName: string;
  time: string;
  date: string;
  email: string;
  purchaserName: string;
  purchaserUuid: string;
  server: string;
  discordId: string;
}

export interface TebexPurchasePayload extends Omit<RawTebexPurchasePayload, 'discordId'> {
  timestamp: number;
  discordId: string | null;
}
