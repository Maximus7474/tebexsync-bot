import { AutocompleteInteraction, ChatInputCommandInteraction } from "discord.js";
import { DiscordClient, SlashCommandBuilders, SlashCommandOptions } from "../types";

import Logger from "../utils/logger";
import { magenta } from "../utils/console_colours";

/**
 * Represents a Slash Command for a Discord bot.
 * This class encapsulates the data and behavior required to define, register, and execute a slash command.
 */
export default class SlashCommand {

  private logger: Logger;
  private guildSpecific: boolean = false;
  private commandData: SlashCommandBuilders;
  private callback: (logger: Logger, client: DiscordClient, interaction: ChatInputCommandInteraction) => Promise<void>;
  private setup?: (logger: Logger, client: DiscordClient) => Promise<void>;
  private autocomplete?: (logger: Logger, client: DiscordClient, interaction: AutocompleteInteraction) => Promise<void>;

  /**
   * Creates a new SlashCommand instance.
   *
   * @param options - An object containing the configuration for the slash command.
   * @param options.name - The name of the slash command.
   * @param options.guildSpecific - (Optional) Whether the command is specific to a guild. Defaults to false.
   * @param options.slashcommand - The SlashCommandBuilder instance containing the command's data.
   * @param options.callback - The function to execute when the command is invoked.
   * @param options.setup - (Optional) A setup function to initialize the command.
   * @param options.autocomplete - (Optional) An autocomplete function for the command's options.
   */
  constructor({ name, guildSpecific = false, slashcommand, callback, setup, autocomplete }: SlashCommandOptions) {
    this.logger = new Logger(`${magenta('CMD')}:${name}`);
    this.guildSpecific = guildSpecific;
    this.commandData = slashcommand;
    this.callback = callback;
    this.setup = setup;
    this.autocomplete = autocomplete;
  }

  /**
   * Determines whether the slash command is specific to a guild.
   *
   * @returns {boolean} `true` if the command is guild-specific, otherwise `false`.
   */
  isGuildSpecific(): boolean {
    return this.guildSpecific;
  }

  /**
   * Specifies if command has an autocomplete callback.
   *
   * @returns {boolean} `true` if the command has an autocomplete callback, otherwise `false`.
   */
  hasAutocomplete(): boolean {
    return this.autocomplete !== undefined;
  }

  /**
   * Registers the slash command by returning its command data.
   *
   * @returns The data representing the slash command.
   */
  register(): SlashCommandBuilders {
    return this.commandData;
  }

  /**
   * Initializes the slash command by invoking the `setup` method if it is defined.
   *
   * @param client - The Discord client instance used to initialize the command.
   */
  initialize(client: DiscordClient): void {
    if (!this.setup) return;
    try {
      this.setup(this.logger, client);
    } catch (error) {
      this.logger.error('Error during setup:', error);
    }
  }

  /**
   * Executes the slash command by invoking the associated callback function.
   *
   * @param client - The Discord client instance.
   * @param interaction - The interaction object representing the slash command invocation.
   *
   * @remarks
   * If no callback function is defined, an error is logged and the method returns early.
   */
  execute(client: DiscordClient, interaction: ChatInputCommandInteraction): void {
    if (!this.callback) {
      this.logger.error('No callback function exists !');
      return;
    }
    this.callback(this.logger, client, interaction);
  }

  executeAutocomplete(client: DiscordClient, interaction: AutocompleteInteraction): void {
    if (!this.autocomplete) {
      this.logger.error('No autocomplete function exists !');
      return;
    }
    this.autocomplete(this.logger, client, interaction);
  }
}
