import { GuildMember, MessageFlags, SlashCommandBuilder } from "discord.js";
import SlashCommand from "../../classes/slash_command";
import tebexHandler from "../../handlers/tebex_handler";
import SettingsManager from "../../handlers/settings_handler";
import PurchaseManager from "../../handlers/purchase_handler";
import { prisma } from "../../utils/prisma";

export default new SlashCommand({
  name: 'claim-role',
  guildSpecific: true,
  slashcommand: new SlashCommandBuilder()
    .setName('claim_role')
    .setDescription('Claim your customer role to access support channels.')
    .addStringOption(o =>
      o.setName('transactionid')
        .setDescription('Transaction ID provided by the purchase')
        .setRequired(true)
        .setMinLength(20)
        .setMaxLength(45)
    ),
  callback: async (logger, client, interaction) => {
    const { user, member, options, guild } = interaction;

    if (!guild || !member) {
      interaction.reply({
        content: "This command can only be used on a server.",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const transactionId = options.getString('transactionid', true);

    const purchaseLog = await prisma.transactions.findUnique({
      where: {
        tbxId: transactionId,
      },
      select: {
        customerId: true,
        refund: true,
        chargeback: true,
        customer: {
          select: {
            discordId: true,
          },
        },
      },
    });

    const flattenedPurchaseLog: {
      customer_id: number | null;
      discord_id: string | null;
      refund: 0 | 1;
      chargeback: 0 | 1;
    } | null = purchaseLog ? {
      customer_id: purchaseLog.customerId,
      discord_id: purchaseLog.customer?.discordId ?? null,
      refund: purchaseLog.refund as 0 | 1,
      chargeback: purchaseLog.chargeback as 0 | 1,
    } : null;

    let currentPurchaseLog = flattenedPurchaseLog;

    if (!currentPurchaseLog) {
      try {
        const rawPurchaseData = await tebexHandler.verifyPurchase(transactionId);

        if (!rawPurchaseData.success) {
          interaction.reply({
            content: 'The provided transaction ID is invalid.',
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        const customerId = await PurchaseManager.getCustomerId(user.id);

        const isRefund = rawPurchaseData.data.status === 'Refund';
        const isChargeback = rawPurchaseData.data.status === 'Chargeback';

        const newTransaction = await prisma.transactions.create({
          data: {
            tbxId: transactionId,
            customerId: customerId,
            purchaserName: rawPurchaseData.data.player.name,
            purchaserUuid: rawPurchaseData.data.player.uuid,
            refund: isRefund ? 1 : 0,
            chargeback: isChargeback ? 1 : 0,
          }
        });

        if (!newTransaction) {
          logger.error('Unable to insert purchase to database !');
          logger.error(`Claim role was executed by ${user.username} (${user.id}) with transaction id: ${transactionId} but failed to insert into database.`);

          interaction.reply({
            content: 'An error has occured.',
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        const packageNames = rawPurchaseData.data.packages.map((p: { name: string; id: number }) => p.name);

        const existingPackages = await prisma.transactionPackages.findMany({
          where: {
            tbxId: transactionId,
            package: {
              in: packageNames,
            },
          },
          select: {
            package: true,
          },
        });

        const existingPackageNames = new Set(existingPackages.map((p: { package: string }) => p.package));

        const packagesToCreate = packageNames
          .filter(packageName => !existingPackageNames.has(packageName))
          .map(packageName => ({
            tbxId: transactionId,
            package: packageName,
          }));

        if (packagesToCreate.length > 0) {
          await prisma.transactionPackages.createMany({
            data: packagesToCreate,
          });
        }

        currentPurchaseLog = {
          customer_id: customerId,
          discord_id: user.id,
          refund: isRefund ? 1 : 0,
          chargeback: isChargeback ? 1 : 0
        }
      } catch (err: any) { // eslint-disable-line
        logger.error('Unable to insert purchase to database !');
        logger.error(`Claim role was executed by ${user.username} (${user.id}) with transaction id: ${transactionId} but failed to insert into database.`);

        interaction.reply({
          content: 'An error has occured while checking your transaction ID.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
    }

    if (currentPurchaseLog.chargeback === 1 || currentPurchaseLog.refund === 1) {
      interaction.reply({
        content: `The purchase linked to this transaction id is not claimable, reason: \`a ${currentPurchaseLog.chargeback === 1 ? 'chargeback' : 'refund'} has been made\`.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (currentPurchaseLog.customer_id && currentPurchaseLog.discord_id !== user.id) {
      interaction.reply({
        content: 'The purchase linked to this transaction ID has already been claimed.\nIf you are related to the user, you can ask him to add you as his developer.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!currentPurchaseLog.customer_id) {
      let customer = await prisma.customers.findUnique({
        where: { discordId: user.id },
        select: { id: true },
      });

      if (!customer) {
        try {
          customer = await prisma.customers.create({
            data: { discordId: user.id },
            select: { id: true },
          });
        } catch (e) {
          logger.error('Unable to insert customer to database !', e);
          logger.error(`Claim role was executed by ${user.username} (${user.id}) with transaction id: ${transactionId} but failed to insert him into the customer channel.`);

          interaction.reply({
            content: 'An error has occured while checking your transaction ID.',
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
      }

      await prisma.transactions.update({
        where: { tbxId: transactionId },
        data: { customerId: customer.id }
      });
    }

    const customerRole = SettingsManager.get('customer_role') as string;

    const role = await guild.roles.fetch(customerRole);
    if (role) {
      await (member as GuildMember).roles.add(role, 'Purchase claimed');
    } else {
      logger.error(`Unable to grant customer role, role with ID ${customerRole} was not found.`);
      interaction.reply({
        content: `Unable to grant customer role, please notify server staff that the bot isn't setup properly.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    interaction.reply({
      content: 'Role claim accepted',
      flags: MessageFlags.Ephemeral,
    });

    logger.success(`Purchase: ${transactionId} was claimed by ${user.username} (id: ${user.id})`)
  },
})
