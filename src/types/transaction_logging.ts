export interface TebexPurchaseWebhookPayload {
  action: "purchase"|"chargeback"|"refund";
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
