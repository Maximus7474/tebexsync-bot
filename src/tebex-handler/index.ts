import axios from 'axios';
import Config from '../utils/config';
import { TebexPayment } from '../types';

import Logger from '../utils/logger';

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

    async verifyPurchase(transactionId: string): Promise<TebexPayment | null> {
        try {

            const response = await axios.get<TebexPayment>(`${this.TEBEX_API_BASE_URL}/payments/${transactionId}`, {
                headers: {
                    'X-Tebex-Secret': this.tebexSecret,
                    'Content-Type': 'application/json',
                },
                timeout: 5000,
            });

            const payment = response.data;

            if (payment) {
                // Temporary logging for testing purposes
                console.log(`Successfully retrieved purchase via Axios for Transaction ID: ${transactionId}`);
                console.log('--- Purchase Details ---');
                console.log(`  Customer: ${payment.player.name} (${payment.player.uuid})`);
                console.log(`  Amount: ${payment.amount} ${payment.currency.iso_4217}`);
                console.log(`  Status: ${payment.status}`);
                console.log('  Products Purchased:');
                payment.packages.forEach((product) => {
                    console.log(`    - ${product.name} (ID: ${product.id}), Quantity: ${product.quantity}`);
                });
                return payment;
            } else {
                this.logger.warn(`No purchase data received for Transaction ID: ${transactionId}`);
                return null;
            }
        } catch (error: any) { // eslint-disable-line
            if (axios.isAxiosError(error) && error.response) {
                if (error.response.status === 404) {
                    this.logger.warn(`Purchase with Transaction ID ${transactionId} not found (HTTP 404).`);
                } else if (error.response.status === 401) {
                    this.logger.error(`Authentication error (HTTP 401). Check your Tebex Secret Key.`);
                } else {
                    this.logger.error(`Tebex API error for Transaction ID ${transactionId}: HTTP ${error.response.status} - ${error.response.data?.error || error.response.statusText}`);
                }
                this.logger.error('Tebex API Error Response Data:', error.response.data);
            } else {
                this.logger.error(`Network or unexpected error retrieving purchase for Transaction ID ${transactionId}:`, error.message);
            }
            return null;
        }
    }
}

export default TebexApi.getInstance();
