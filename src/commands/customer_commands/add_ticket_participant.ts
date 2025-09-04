import { MessageFlags, SlashCommandBuilder } from "discord.js";
import SlashCommand from "../../classes/slash_command";
import Ticket from "../../handlers/ticket_handler";

export default new SlashCommand({
  name: 'ticket-participant',
  guildSpecific: true,
  slashcommand: new SlashCommandBuilder()
    .setName('add')
    .setDescription('Add a user to the ticket.')
    .addUserOption(o =>
      o.setName('user')
      .setDescription('User to add to the ticket')
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

    const addedUser = interaction.options.getUser('user', true);

    try {
      await guild.members.fetch({ user: addedUser, cache: false });

      const success = await ticket.addTicketParticipant(addedUser, user);

      interaction.reply({
        content: success
          ? `<@${addedUser.id}> was added to the ticket.`
          : `Unable to add <@${addedUser.id}> to the ticket, is he on the server or already in the ticket ?`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (err) {
      interaction.reply({
        content: `Unable to add <@${addedUser.id}> to the ticket (${(err as Error).message}).`,
        flags: MessageFlags.Ephemeral,
      });
    }
  }
});
