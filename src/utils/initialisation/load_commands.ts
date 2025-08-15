import { DiscordClient } from '../../types';

import Logger from '../logger';
const logger = new Logger('LoadCommands');

import commands from '../../commands';

export default (client: DiscordClient) => {
  commands.forEach(async (command) => {
    try {
      const commandName = command.register().name;

      client.commands.set(commandName, command.execute.bind(command));

      if (command.hasAutocomplete()) {
        client.autocompleteCommands.set(commandName, command.executeAutocomplete.bind(command));
      }

      logger.info(`Loaded /${commandName}`);
    } catch (error) {
      console.error(`Failed to load command ${command.register().name}:`, error);
    }
  })
}

