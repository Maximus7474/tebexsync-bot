export interface RawTebexWebhookPayload {
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

export interface TebexRefundChargebackPayload {
  action: "refund" | "chargeback";
  username: string;
  transaction: string;
  packageName: string;
}

export interface TebexPurchasePayload extends Omit<RawTebexWebhookPayload, 'discordId'> {
  timestamp: number;
  discordId: string | null;
}

export type TebexWebhookJsonPayload = TebexRefundChargebackPayload | TebexPurchasePayload;
