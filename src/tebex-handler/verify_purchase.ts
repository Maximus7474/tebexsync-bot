import axios from "axios";
import { TebexAPIError, TebexPayment } from "../types";
import type Logger from "../utils/logger";

export default async (logger: Logger, url: string, secret: string, transactionId: string): Promise<{success: true, data: TebexPayment} | TebexAPIError> => {
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
            return { success: true, data: payment };
        } else {
            logger.warn(`No purchase data received for Transaction ID: ${transactionId}`);
            return { success: false, error: `No purchases found for Transaction ID: ${transactionId}`};
        }
    } catch (error: any) { // eslint-disable-line
        if (axios.isAxiosError(error) && error.response) {
            if (error.response.status === 404) {
                logger.warn(`Purchase with Transaction ID ${transactionId} not found (HTTP 404).`);
                return { success: false, error: `Purchase with Transaction ID ${transactionId} not found.` };
            } else if (error.response.status === 401) {
                logger.error(`Authentication error (HTTP 401). Check your Tebex Secret Key.`);
                return { success: false, error: `Authentication error: Check your Tebex Secret Key.` };
            } else {
                const errorMessage = error.response.data?.error || error.response.statusText || `Unknown Tebex API error (HTTP ${error.response.status})`;
                logger.error(`Tebex API error for Transaction ID ${transactionId}: HTTP ${error.response.status} - ${errorMessage}`);
                return { success: false, error: errorMessage };
            }
        } else {
            const errorMessage = `Network or unexpected error retrieving purchase for Transaction ID ${transactionId}: ${error.message}`;
            logger.error(errorMessage, error.message);
            return { success: false, error: errorMessage };
        }
    }
}
