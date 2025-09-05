import { EmbedBuilder, MessageFlags, PermissionsBitField, SlashCommandBuilder, TextChannel } from "discord.js";
import SlashCommand from "../../classes/slash_command";
import Ticket from "../../handlers/ticket_handler";

export default new SlashCommand({
  name: 'ticket-participant',
  guildSpecific: true,
  slashcommand: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove a user to the ticket.')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.KickMembers)
    .addUserOption(o =>
      o.setName('user')
      .setDescription('Remove to add to the ticket')
      .setRequired(true)
    ),
  callback: async (logger, client, interaction) => {
    const { user, guild, channelId } = interaction;

    if (!guild) {
      interaction.reply({
        content: "This command can only be used on a server.",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const ticket = Ticket.getTicket(channelId);

    if (!ticket) {
      interaction.reply({
        content: "This command can only be in a ticket.",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const removedUser = interaction.options.getUser('user', true);

    try {
      const success = await ticket.removeTicketParticipant(removedUser.id, user);

      interaction.reply({
        content: success
          ? `<@${removedUser.id}> was removed from the ticket.`
          : `Unable to remove <@${removedUser.id}> from the ticket.`,
        flags: MessageFlags.Ephemeral,
      });

      const embed = new EmbedBuilder()
        .setTitle('User removed from ticket')
        .setDescription(`<@${removedUser.id}> was removed from the ticket.`);

      await (interaction.channel as TextChannel).send({
        embeds: [embed]
      });
    } catch (err) {
      interaction.reply({
        content: `Unable to remove <@${removedUser.id}> from the ticket (${(err as Error).message}).`,
        flags: MessageFlags.Ephemeral,
      });
    }
  }
});
