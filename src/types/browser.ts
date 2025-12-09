export interface ReUploadResponse {
  asset_id: number
  errors: null
}

export interface Asset {
  id: number
  name: string
}

export interface SearchResponse {
  items: Asset[]
}

export interface SSOResponseBody {
  url: string
}

export type CfxGrantedAsset = {
  asset: string;
  granted_at: Date;
  transferred_to: string | null;
  transferred_from: string | null;
}
