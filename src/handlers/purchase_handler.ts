import { DiscordClient } from "@types";
import Database from "../utils/database";
import Logger from "../utils/logger";

const logger = new Logger('Purchase Manager');

class PurchaseManager {
  private static instance: PurchaseManager;
  private static discordClient: DiscordClient;
  private static clientReady: boolean = false;

  constructor() {}

  public static getInstance(): PurchaseManager {
    if (!PurchaseManager.instance) {
      PurchaseManager.instance = new PurchaseManager();
    }
    return PurchaseManager.instance;
  }

  public static setDiscordClient(client: DiscordClient) {
    this.discordClient = client;

    client.once('ready', () => {
      this.clientReady = true;
      logger.info('Discord client is ready (post-init)');
    });
  }

  public static async getCustomerId(discordId: string) {
    const customer = await Database.get<{id: number}>('SELECT `id` FROM `customers` WHERE `discord_id` = ?', [ discordId ]);

    if (customer) return customer.id;

    const id = await Database.insert(
      "INSERT INTO `customers` (`discord_id`) VALUES (?)",
      [discordId]
    );

    if (!id) throw new Error(`Unable to insert ${discordId} into customers database table.`);

    return id;
  }
}

export default PurchaseManager;
