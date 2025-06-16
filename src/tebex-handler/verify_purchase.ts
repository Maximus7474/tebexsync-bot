import axios from "axios";
import { TebexPayment } from "../types";
import type Logger from "../utils/logger";

export default async (logger: Logger, url: string, secret: string, transactionId: string): Promise<TebexPayment | null> => {
    try {
        const response = await axios.get<TebexPayment>(`${url}/payments/${transactionId}`, {
            headers: {
                'X-Tebex-Secret': secret,
                'Content-Type': 'application/json',
            },
            timeout: 5000,
        });

        const payment = response.data;

        if (payment) {
            return payment;
        } else {
            logger.warn(`No purchase data received for Transaction ID: ${transactionId}`);
            return null;
        }
    } catch (error: any) { // eslint-disable-line
        if (axios.isAxiosError(error) && error.response) {
            if (error.response.status === 404) {
                logger.warn(`Purchase with Transaction ID ${transactionId} not found (HTTP 404).`);
            } else if (error.response.status === 401) {
                logger.error(`Authentication error (HTTP 401). Check your Tebex Secret Key.`);
            } else {
                logger.error(`Tebex API error for Transaction ID ${transactionId}: HTTP ${error.response.status} - ${error.response.data?.error || error.response.statusText}`);
            }
        } else {
            logger.error(`Network or unexpected error retrieving purchase for Transaction ID ${transactionId}:`, error.message);
        }
        return null;
    }
}