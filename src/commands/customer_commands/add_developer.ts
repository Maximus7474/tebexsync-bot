import { MessageFlags, SlashCommandBuilder } from "discord.js";
import SlashCommand from "../../classes/slash_command";
import Database from "../../utils/database";
import settings_handler from "../../handlers/settings_handler";
import PurchaseManager from "../../handlers/purchase_handler";

export default new SlashCommand({
  name: 'add-developer',
  guildSpecific: true,
  slashcommand: new SlashCommandBuilder()
    .setName('adddeveloper')
    .setDescription('Add a developer to also gain access to support channels.')
    .addUserOption(o =>
      o.setName('member')
      .setDescription('Member to add the developer role')
      .setRequired(true)
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

    const customerId = await PurchaseManager.getCustomerId(user.id);

    const hasPurchases = await PurchaseManager.checkCustomerPurchases(customerId);

    if (!hasPurchases) {
      interaction.reply({
        content: 'No linked or active purchases',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const currentDevs = await Database.all<{discord_id: string}>(
      'SELECT `discord_id` AS `count` FROM `customer_developers` WHERE `customer_id` = ?',
      [customerId]
    );

    if (currentDevs.length >= (settings_handler.get('max_developers') as number)) {
      interaction.reply({
        content: `You've already added the maximum amount of developers for your purchase.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const developerId = options.getUser('member', true);
    const developer = await guild.members.fetch({ user: developerId, cache: false });

    if (!developer) {
      interaction.reply({
        content: `<@${developerId.id}> was not found on the server.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const devRoleId = settings_handler.get('customers_dev_role') as string;
    const role = await guild.roles.fetch(devRoleId);

    const alreadyListed = currentDevs.find(({ discord_id }) => discord_id === developer.id)
    if (alreadyListed && developer.roles.cache.has(devRoleId)) {
      interaction.reply({
        content: `<@${developer.id}> is already added as your developer`,
        flags: MessageFlags.Ephemeral,
      });

      return;
    } else if (alreadyListed && role) {
      await developer.roles.add(role, 'Added as previously owned');

      interaction.reply({
        content: `The role has been added back to <@${developer.id}>.`,
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    if (role) {
      await developer.roles.add(role, 'Added as developer for purchase');
    } else {
      logger.error(`Unable to grant customer's developer role, role with ID ${devRoleId} was not found.`);
      interaction.reply({
        content: `Unable to grant customer's developer role, please notify server staff that the bot isn't setup properly.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    interaction.reply({
      content: `Customer's developer role was granted to: <@${developer.id}>`,
      flags: MessageFlags.Ephemeral,
    });

    logger.success(`${developer.user.username} (${developer.id}) was added as developer by ${user.username} (${user.id})`);
  }
});
