export interface TebexPurchaseWebhookPayload {
  action: "purchase"|"chargeback"|"refund";
  webstore: string;
  username: string;
  price: string;
  paymentId: string;
  transactionId: string;
  packageName: string;
  time: string;
  date: string;
  email: string;
  purchaserName: string;
  purchaserUuid: string;
  server: string;
  packages: string;
  discordId: string;
}
