import { ContainerBuilder, MessageFlags, PermissionsBitField, SeparatorBuilder, SeparatorSpacingSize, SlashCommandBuilder, TextDisplayBuilder } from "discord.js";
import SlashCommand from "../../classes/slash_command";
import tebexHandler from "../../handlers/tebex_handler";
import { prisma } from "../../utils/prisma";

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

      const purchaseData = await prisma.transactions.findUnique({
        where: {
          tbxId: transactionid,
        },
        include: {
          customer: true,
        }
      })

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
              purchaseData && purchaseData.customer?.discordId
                ? `* Linked discord: <@${purchaseData.customer.discordId}>`
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
