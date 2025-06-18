import { Events } from "discord.js";
import EventHandler from "../classes/event_handler";

export default new EventHandler({
  name: 'READY',
  eventName: Events.ClientReady,
  type: "on",
  callback: (logger, client) => {
    logger.success(`Booted up and logged in as @${client.user?.username}#${client.user?.discriminator}`)
  }
});
