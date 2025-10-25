import { MessageFlags, SlashCommandBuilder } from "discord.js";
import SlashCommand from "../../classes/slash_command";
import settings_handler from "../../handlers/settings_handler";
import PurchaseManager from "../../handlers/purchase_handler";
import { prisma } from "../../utils/prisma";

export default new SlashCommand({
  name: 'view-developers',
  guildSpecific: true,
  slashcommand: new SlashCommandBuilder()
    .setName('viewdevelopers')
    .setDescription('Add a developer to also gain access to support channels.'),
  callback: async (logger, client, interaction) => {
    const { user, guild } = interaction;

    if (!guild) {
      interaction.reply({
        content: "This command can only be used on a server.",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const customerId = await PurchaseManager.getCustomerId(user.id, true);

    const hasPurchases = customerId ? await PurchaseManager.checkCustomerPurchases(customerId) : false;

    if (!hasPurchases || !customerId) {
      interaction.reply({
        content: 'No linked or active purchases',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const currentDevs = await prisma.customerDevelopers.findMany({
      where: {
        customerId,
      }
    });

    if (currentDevs.length === 0) {
      interaction.reply({
        content: `You have no linked developers.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    interaction.reply({
      content: `Current developers linked (${currentDevs.length}/${settings_handler.get('max_developers')}):\n` + currentDevs
        .map(({ discordId }: { discordId: string }, idx: number) => `${idx + 1}. <@${discordId}>`)
        .join('\n'),
      flags: MessageFlags.Ephemeral,
    });
  }
});
