import { Events } from "discord.js";
import EventHandler from "../classes/event_handler";
import Ticket from "../handlers/ticket_handler";

export default new EventHandler({
  name: 'READY',
  eventName: Events.ClientReady,
  type: "once",
  callback: async (logger, client) => {
    await client.application?.fetch();

    Ticket.reloadTickets(client);

    logger.success(`Booted up and logged in as @${client.user?.username}#${client.user?.discriminator}`)
  }
});
