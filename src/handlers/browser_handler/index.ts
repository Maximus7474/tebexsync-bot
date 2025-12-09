import { CfxPortalSearch } from "./class";

const INSTANCE_TIMEOUT_MS = 10 * 60_000; // 10 minutes
let instance: CfxPortalSearch | null = null;
let timeout: NodeJS.Timeout | null = null;

async function clearInstance() {
  if (!instance) return;

  await instance.closeInstance();

  instance = null;
  timeout = null;
}

async function getInstance(): Promise<CfxPortalSearch> {
  if (instance) {
    clearTimeout(timeout!);
    setTimeout(clearInstance, INSTANCE_TIMEOUT_MS);
    return instance;
  }

  instance = await CfxPortalSearch.init();
  timeout = setTimeout(clearInstance, INSTANCE_TIMEOUT_MS);

  return instance;
}

export async function GetCfxUserAssetGrants(username: string) {
  const instance = await getInstance();

  return await instance.getUserAssets(username);
}
