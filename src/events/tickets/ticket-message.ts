import { Events, Message } from "discord.js";
import EventHandler from "../../classes/event_handler";
import Ticket from "../../handlers/ticket_handler";

export default new EventHandler({
  name: 'TICKET-MESSAGE',
  eventName: Events.MessageCreate,
  type: "on",
  callback: async (logger, client, message: Message) => {
    if (!message.inGuild()) return;

    const ticket = Ticket.getTicket(message.channelId);

    if (!ticket) return;

    ticket.handleNewMessage(message);
  }
});
