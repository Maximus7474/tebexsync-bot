import Config from '../utils/config';
import verify_purchase from './verify_purchase';
import Logger from '../utils/logger';
import { TebexAPIError, TebexPayment } from '../types';


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
}

export default TebexApi.getInstance();
