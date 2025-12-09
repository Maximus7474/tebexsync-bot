import { MessageFlags, SlashCommandBuilder } from "discord.js";
import SlashCommand from "../../classes/slash_command";
import settings_handler from "../../handlers/settings_handler";
import PurchaseManager from "../../handlers/purchase_handler";
import { prisma } from "../../utils/prisma";

export default new SlashCommand({
  name: 'transfer-purchase',
  guildSpecific: true,
  slashcommand: new SlashCommandBuilder()
    .setName('transfer_purchase')
    .setDescription('Transfer one of your purchases to a new account.')
    .addUserOption(o =>
      o.setName('member')
      .setDescription('Account that receives the purchase')
      .setRequired(true)
    )
    .addStringOption(o =>
      o.setName('purchase')
      .setDescription('Purchase to transfer')
      .setRequired(true)
      .setAutocomplete(true)
    ),
  callback: async (logger, client, interaction) => {
    const { user, options, guild } = interaction;

    if (!guild) {
      interaction.reply({
        content: "This command can only be used on a server.",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const tbxid = options.getString('purchase', true);
    const newOwner = options.getUser('member', true);

    const customerId = await PurchaseManager.getCustomerId(user.id, true);

    if (!customerId) {
      interaction.reply({
        content: "You don't have any claimed purchases",
        flags: [ MessageFlags.Ephemeral ],
      });
      return;
    }

    const purchase = await prisma.transactions.findUnique({
      select: {
        id: true,
        chargeback: true,
        refund: true,
      },
      where: {
        tbxId: tbxid,
        customerId: customerId,
      },
    });

    if (!purchase) {
      interaction.reply({
        content: `No purchase was found for: ${tbxid}\nMake sure it's a suggested input, otherwise it's unclaimed.`,
        flags: [ MessageFlags.Ephemeral ],
      });
      return;
    }

    if (purchase.chargeback === 1 || purchase.refund === 1) {
      interaction.reply({
        content: `This purchase was ${purchase.chargeback === 1 ? 'chargebacked' : 'refunded'}, it can not be transferred.`,
        flags: [ MessageFlags.Ephemeral ],
      });
      return;
    }

    const newCustomerId = await PurchaseManager.getCustomerId(newOwner.id);

    await prisma.transactions.update({
      where: {
        tbxId: tbxid,
      },
      data: {
        customerId: newCustomerId,
      },
    });

    await PurchaseManager.checkCustomerPurchases(customerId);

    const customerRole = settings_handler.get('customer_role') as string;

    const role = await guild.roles.fetch(customerRole);

    const newCustomer = await guild.members.fetch(newOwner.id);
    if (newCustomer) {
      if (role) {
        await newCustomer.roles.add(role, 'Purchase transferred');
        logger.success(`Added customer role to ${newCustomer.user.username} (${newCustomer.id}) being transferred from ${user.username} (${user.id}).`);
      } else {
        logger.error('Unable to find customer role to add to new customer !');
      }
    }

    interaction.reply({
      content: `The purchase (${tbxid}) was transferred to <@${newOwner.id}>`,
      flags: MessageFlags.Ephemeral,
    });
  },
  autocomplete: async (logger, client, interaction) => {
    const focusedOption = interaction.options.getFocused(true);

    const transactions = await prisma.transactions.findMany({
      select: {
        transactionPackages: {
          select: {
            package: true,
          }
        },
        tbxId: true,
      },
      where: {
        customer: {
          discordId: interaction.user.id,
        },
        OR: [
          { tbxId: { contains: focusedOption.value } },
          {
            transactionPackages: {
              some: {
                package: { contains: focusedOption.value },
              },
            },
          },
        ],
      },
    });

    await interaction.respond(
      transactions.map(({ tbxId, transactionPackages }: { tbxId: string; transactionPackages: { package: string }[] }) => ({ name: `${tbxId}: ${transactionPackages.map((e: { package: string }) => e.package).join(', ')}`, value: tbxId }))
    );
  },
});
