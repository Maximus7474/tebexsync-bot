import { ButtonInteraction, Events } from "discord.js";
import EventHandler from "../../classes/event_handler";
import Ticket from "../../handlers/ticket_handler";

export default new EventHandler({
  name: 'CLOSE-TICKET',
  eventName: Events.InteractionCreate,
  type: "on",
  callback: async (logger, client, interaction: ButtonInteraction) => {
    const { channelId, customId } = interaction;

    if (customId !== 'close-ticket') return;

    Ticket.closeTicket(channelId, interaction);
  }
});
