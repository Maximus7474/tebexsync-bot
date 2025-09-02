import { ContainerBuilder, MessageFlags, PermissionsBitField, SeparatorBuilder, SeparatorSpacingSize, SlashCommandBuilder, TextDisplayBuilder } from "discord.js";
import SlashCommand from "../../classes/slash_command";
import tebexHandler from "../../handlers/tebex_handler";
import Database from "../../utils/database";

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

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder({ type: 10, content: '# Transaction Verification' })
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
      );

    if (transactionDetails.success) {
      const { player, packages, email, date, amount, currency } = transactionDetails.data;

      const purchaseData = await Database.get<{
        purchaser_name: string;
        purchaser_uuid: string;
        discord_id: string;
      }>(
        `SELECT
          C.discord_id
        FROM transactions AS T
        LEFT JOIN customers AS C ON T.customer_id = C.id
        WHERE T.tbxid = ?`,
        [ transactionid ]
      );

      container
        .setAccentColor(1950208)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `* Customer: ${player.name} (${player.id})\n` +
            `* Email: ${email}\n` +
            `* Packages:\n` +
            packages.map(({ name, id }) => `  * ${name} (${id})`).join('\n') + '\n' +
            `* Amount: ${amount}${currency.symbol}`+
            (
              purchaseData
                ? `* Linked discord: <@${purchaseData.discord_id}`
                : '* Purchase is unclaimed'
            )
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
