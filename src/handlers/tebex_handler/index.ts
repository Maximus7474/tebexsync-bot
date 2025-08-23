import Config from '../../utils/config';
import Logger from '../../utils/logger';
import { TebexAPIError, TebexPayment, TebexPurchasePayload, RawTebexPurchasePayload } from '../../types';
import { GetUtcTimestamp } from '../../utils/utils';

import verify_purchase from './verify_purchase';

class TebexApi {
  private static instance: TebexApi;
  private tebexSecret: string;
  private TEBEX_API_BASE_URL = 'https://plugin.tebex.io';
  private logger = new Logger('TEBEX-API');

  private constructor() {
    if (!Config.TEBEX_SECRET) {
      throw new Error('Tebex Secret Key is missing. Cannot initialize TebexApi.');
    }
    this.tebexSecret = Config.TEBEX_SECRET;
  }

  public static getInstance(): TebexApi {
    if (!TebexApi.instance) {
      TebexApi.instance = new TebexApi();
    }
    return TebexApi.instance;
  }

  async verifyPurchase(transactionId: string): Promise<{ success: true, data: TebexPayment } | TebexAPIError> {
    return await verify_purchase(this.logger, this.TEBEX_API_BASE_URL, this.tebexSecret, transactionId);
  }

  parsePurchaseJson(json: string): TebexPurchasePayload | null {
    let purchaseData: RawTebexPurchasePayload | null;

    try {
      purchaseData = JSON.parse(json);
    } catch (err) { // eslint-disable-line @typescript-eslint/no-unused-vars
      return null;
    }

    if (!purchaseData || !(
      purchaseData.action && purchaseData.packageName && purchaseData.transaction
    )) {
      return null;
    }

    const processedData = purchaseData as TebexPurchasePayload;

    if (processedData.discordId && !processedData.discordId.trim()) {
      processedData.discordId = null;
    }

    if (!processedData.timestamp) {
      processedData.timestamp = GetUtcTimestamp(processedData.time, processedData.date);
    }

    return processedData;
  }
}

export default TebexApi.getInstance();
