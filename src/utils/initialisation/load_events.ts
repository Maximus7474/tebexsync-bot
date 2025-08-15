import { DiscordClient } from '../../types';
import events from '../../events';

import Logger from '../logger';
const logger = new Logger('LoadEvents');

export default (client: DiscordClient) => {
  events.forEach(async (event) => {
    try {
      const eventData = event.register();

      if (eventData.type === 'once') {
        client.once(eventData.event, (...args) => event.call(client, ...args));
      } else {
        client.on(eventData.event, (...args) => event.call(client, ...args));
      }

      logger.info(`Loaded ${eventData.name} for event: ${eventData.event}`)
    } catch (error) {
      console.error(`Failed to load event: ${event.register().name}\n`, error);
    }
  })
};
