import { ContainerBuilder, MessageFlags, PermissionsBitField, SeparatorBuilder, SeparatorSpacingSize, SlashCommandBuilder, TextDisplayBuilder } from "discord.js";
import SlashCommand from "../../classes/slash_command";
import { prisma } from "../../utils/prisma";
import PurchaseManager from "../../handlers/purchase_handler";
import { GetUnixSecondsFromDate } from "../../utils/utils";

export default new SlashCommand({
  name: 'view-purchases',
  guildSpecific: true,
  slashcommand: new SlashCommandBuilder()
    .setName('view-purchase')
    .setDescription('View the purchases claimed by a user')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.KickMembers)
    .addUserOption(o =>
      o.setName('user')
        .setDescription('User you want to see their purchases')
        .setRequired(true)
    ),
  callback: async (logger, client, interaction) => {
    const user = interaction.options.getUser('user');

    if (!user) {
      interaction.reply({
        content: 'No user was provided',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply();

    const customerId = await PurchaseManager.getCustomerId(user.id, true);

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder({ type: 10, content: '# Claimed Transactions' })
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
      );

    if (customerId) {
      const purchases = await prisma.transactions.findMany({
        where: {
          customerId,
        },
        include: {
          transactionPackages: true,
        },
      });

      container
        .setAccentColor(1950208)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            purchases.map((e, i) => (`${i + 1}. ${e.tbxId} - <t:${GetUnixSecondsFromDate(e.createdAt)}:d>\n  * ${e.transactionPackages.map(e => `${e.package}`).join('\n  *')}`)).join('\n')
          ),
        );
    } else {
      container
        .setAccentColor(16711680)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`The user ${user.id} ( <@${user.id}> ) is not listed as having any purchases.`)
        );
    }

    await interaction.editReply({
      components: [
        container,
      ],
      flags: [MessageFlags.IsComponentsV2],
    })
  }
});
