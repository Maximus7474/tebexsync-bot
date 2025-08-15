export interface TebexCurrency {
  iso_4217: string;
  symbol: string;
}

export type TebexTransactionStatus = 'Complete' | 'Refund' | 'Chargeback';

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
  date: string;
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

export interface TebexAPIError {
  success: false;
  error: string;
}
