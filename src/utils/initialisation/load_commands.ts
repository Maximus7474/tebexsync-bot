import * as path from 'path';
import SlashCommand from '../../classes/slash_command';
import { DiscordClient } from '../../types';
import { getFilesFromDir } from '../utils';

import Logger from '../logger';
import { pathToFileURL } from 'url';
const logger = new Logger('LoadCommands');

export default (client: DiscordClient) => {
  const commands = getFilesFromDir(path.join(__dirname, '../../commands'));

  commands.forEach(async (file) => {
    const filePath = path.join(file);
    const fileUrl = pathToFileURL(filePath).href;

    try {
      const commandModule = await import(fileUrl);

      if (commandModule && commandModule.default) {
        const { default: command } = commandModule as { default: SlashCommand };

        const commandName = command.register().name;

        client.commands.set(commandName, command.execute.bind(command));

        if (command.hasAutocomplete()) {
          client.autocompleteCommands.set(commandName, command.executeAutocomplete.bind(command));
        }

        logger.success(`Loaded /${commandName}`);
      }
    } catch (error) {
      console.error(`Failed to load command ${file}:`, error);
    }
  })
}
