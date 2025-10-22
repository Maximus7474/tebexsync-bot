import { DiscordClient } from "@types";
import Database from "../utils/database";
import Logger from "../utils/logger";
import env from "../utils/config";
import SettingsManager from "../handlers/settings_handler";
import { prisma } from "../utils/prisma";

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

  /**
   * Get or create an internal customer id for a discord user id
   *
   * @param discordId user's discord id
   * @param skipCreate should skip id creation (default: false)
   * @returns
   */
  public static async getCustomerId(discordId: string, skipCreate: true): Promise<null | number>;
  public static async getCustomerId(discordId: string): Promise<number>;
  public static async getCustomerId(discordId: string, skipCreate: boolean = false): Promise<null | number> {
    const customer = await prisma.customers.findUnique({
      where: {
        discordId,
      },
      select: {
        id: true,
      },
    });

    if (customer) return customer.id;

    if (skipCreate) return null;

    const createdCustomer = await prisma.customers.create({
      data: {
        discordId,
      },
      select: {
        id: true,
      }
    });

    if (!createdCustomer) throw new Error(`Unable to insert ${discordId} into customers database table.`);

    return createdCustomer.id;
  }

  /**
   * Checks if a customer has valid / active purchases, if not tries to remove his customer role
   * along with any developers linked to his id. If no entries, active or not, deletes his entry.
   *
   * @param customerid
   * @returns {boolean} has valid purchases
   */
  public static async checkCustomerPurchases(customerid: number): Promise<boolean> {
    const customer = await prisma.customers.findUnique({
      where: {
        id: customerid,
      },
      select: {
        id: true,
        discordId: true,
      },
    })

    if (!customer) {
      logger.warn('checkCustomerPurchases received an inexistant customer id:', customerid, '- exiting...');
      return false;
    }

    const purchases = await Database.all<{ id: number; refund: 0 | 1, chargeback: 0 | 1 }>(
      'SELECT `id`, `refund`, `chargeback` FROM `transactions` WHERE `customer` = ?',
      [ customer.id ],
    );

    let hasActivePurchases;
    if (purchases.length === 0) {
      hasActivePurchases = false;

      await Database.execute('DELETE FROM `customers` WHERE `id` = ?', [ customer.id ]);

    } else {
      const activePurchases = purchases.filter(({ chargeback, refund }) => (chargeback !== 1 && refund !== 1) );

      hasActivePurchases = activePurchases.length > 0;
    }

    if (hasActivePurchases) return true;

    const guild = await this.discordClient.guilds.fetch(env.MAIN_GUILD_ID);

    if (!guild) throw new Error('MAIN_GUILD_ID did not produce a valid guild object !');

    const customerUser = await guild.members.fetch(customer.discordId);

    if (customerUser) {
      const customerRole = SettingsManager.get('customer_role') as string;

      customerUser.roles.remove(customerRole)
      .catch(err => {
        logger.error(
          'Unable to remove customer role from',
          customer.discordId,
          'err:', err
        );
      });
    }

    // const developers = await Database.all<{ id: number; discord_id: string; }>(
    //   'SELECT `id`, `discord_id` FROM `customer_developers` WHERE `customer_id` = ?',
    //   [ customer.id ]
    // );

    const developers = await prisma.customerDevelopers.findMany({
      where: {
        customerId: customer.id,
      },
    });

    if (developers.length > 0) {
      const customersDevRole = SettingsManager.get('customers_dev_role') as string;

      for (const { discordId } of developers) {
        const developerUser = await guild.members.fetch(discordId);

        if (developerUser) {
          await developerUser.roles.remove(customersDevRole)
          .catch(err => {
            logger.error(
              'Unable to remove customers developer role from',
              discordId,
              'err:', err
            );
          });
        }
      }
    }

    await prisma.customerDevelopers.deleteMany({ where: { customerId: customer.id }});

    logger.info(`Customer (${customer.id}) no longer has any active purchases`)

    return false;
  }
}

export default PurchaseManager;
