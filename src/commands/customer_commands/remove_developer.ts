import { MessageFlags, SlashCommandBuilder } from "discord.js";
import SlashCommand from "../../classes/slash_command";
import settings_handler from "../../handlers/settings_handler";
import PurchaseManager from "../../handlers/purchase_handler";
import { prisma } from "../../utils/prisma";

export default new SlashCommand({
  name: 'remove-developer',
  guildSpecific: true,
  slashcommand: new SlashCommandBuilder()
    .setName('remove_developer')
    .setDescription('Remove a developer that is linked to your purchase.')
    .addUserOption(o =>
      o.setName('member')
      .setDescription('Member to remove the developer role from')
      .setRequired(true)
    ),
  callback: async (logger, client, interaction) => {
    const { user, guild, options } = interaction;

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
        customerId: customerId,
      },
      select: {
        discordId: true,
      },
    });

    if (currentDevs.length === 0) {
      interaction.reply({
        content: `You have no linked developers.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const developer = options.getUser('member', true);

    const listed = currentDevs.find(({ discordId }: { discordId: string }) => discordId === developer.id);

    if (!listed) {
      interaction.reply({
        content: `<@${developer.id}> is not listed as your developer.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await prisma.customerDevelopers.delete({
      where: {
        customerId_discordId: {
          customerId: customerId,
          discordId: developer.id,
        },
      },
    });

    const member = await guild.members.fetch({ user: developer, cache: false });

    if (member) {
      const customersDevRole = settings_handler.get('customers_dev_role') as string;
      await member.roles.remove(customersDevRole)
    }

    interaction.reply({
      content: `<@${developer.id}> has been removed from your developers.`,
      flags: MessageFlags.Ephemeral,
    });

    logger.success(`${developer.username} (${developer.id}) was removed as developer by ${user.username} (${user.id})`);
  }
});
