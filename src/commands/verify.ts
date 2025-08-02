import { ContainerBuilder, MessageFlags, PermissionsBitField, SectionBuilder, SeparatorBuilder, SeparatorSpacingSize, SlashCommandBuilder, TextDisplayBuilder, ThumbnailBuilder } from "discord.js";
import SlashCommand from "../classes/slash_command";
import tebexHandler from "../tebex_handler";

const formatDateFromString = (dateString: string) => {
  const date = new Date(dateString)
  return Math.floor(date.getTime() / 1000)
}

export default new SlashCommand({
  name: 'verify-transaction',
  guildSpecific: true,
  slashcommand: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Verify a transaction ID')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.KickMembers)
    .addStringOption(o =>
      o.setName('transactionid')
        .setDescription('Transaction id of the purchase')
        .setRequired(true)
    ),
  callback: async (logger, client, interaction) => {
    const transactionid = interaction.options.getString('transactionid');

    if (!transactionid) {
      interaction.reply({
        content: 'No transaction id was provided',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply();

    const transactionDetails = await tebexHandler.verifyPurchase(transactionid);

    const thumbnail = 'https://cdn-icons-png.freepik.com/256/16802/16802634.png';

    const container = new ContainerBuilder()
      .addSectionComponents(
        new SectionBuilder()
          .setThumbnailAccessory(
            new ThumbnailBuilder()
              .setURL(thumbnail)
          )
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent("# Transaction Verification"),
          ),
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
      );

    if (transactionDetails.success) {
      const { player, packages, email, date, amount, currency } = transactionDetails.data;

      container
        .setAccentColor(1950208)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `* Customer: ${player.name} (${player.id})\n` +
            `* Email: ${email}\n` +
            `* Packages:\n` +
            packages.map(({ name, id }) => `  * ${name} (${id})`).join('\n') + '\n' +
            `* Amount: ${amount}${currency.symbol}`
          ),
        )
        .addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `-# Payment processed at <t:${formatDateFromString(date)}>`
          ),
        );
    } else {
      container
        .setAccentColor(16711680)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(transactionDetails.error)
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
