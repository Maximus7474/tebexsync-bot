export interface TebexCurrency {
    iso_4217: string;
    symbol: string;
}

// ToDo: complete with missing status types
export type TebexTransactionStatus = 'Complete' | string;

export interface TebexCustomer {
    id: number;
    name: string;
    uuid: string;
}

export interface TebexPackage {
    quantity: number;
    id: number;
    name: string;
}

export interface TebexPayment {
    id: number;
    amount: string;
    date: Date;
    gateway: object;
    status: TebexTransactionStatus;
    currency: TebexCurrency;
    email: string;
    player: TebexCustomer;
    packages: TebexPackage[];
    // ToDo determine format
    notes: any[]; // eslint-disable-line
    creator_code: string | null;
}