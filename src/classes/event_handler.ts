import { ClientEvents } from "discord.js";
import { DiscordClient, EventHandlerOptions } from "../types";

import Logger from "../utils/logger";
import { magenta } from "../utils/console_colours";
import { EventHandlerCallback, EventHandlerSetup } from "../types";

/**
 * Represents an event handler for a Discord client.
 * This class is used to define and manage events, including their setup and execution.
 */
export default class EventHandler {

  private logger: Logger;
  private name: string;
  private eventName: keyof ClientEvents;
  private type: "on" | "once";
  private setup?: EventHandlerSetup;
  private callback: EventHandlerCallback;

  /**
   * Constructs an instance of the event handler.
   *
   * @param options - An object containing the configuration for the event handler.
   * @param options.name - The name of the event handler.
   * @param options.eventName - The name of the event from the `ClientEvents` that this handler listens to.
   * @param options.type - Specifies whether the event handler should use "on" or "once" for the event listener.
   * @param options.callback - The function to be executed when the event is triggered. Receives a logger, the Discord client, and additional event arguments.
   * @param options.setup - (Optional) A function to perform setup logic. Receives a logger and the Discord client.
   */
  constructor({ name, eventName, type, callback, setup }: EventHandlerOptions) {
    this.logger = new Logger(`${magenta('EVT')}:${name}`);
    this.name = name;
    this.eventName = eventName;
    this.type = type;
    this.callback = callback;
    this.setup = setup;
  }

  /**
   * Registers the event handler by returning an object containing
   * the handler's name, event name, and type.
   *
   * @returns An object with the following properties:
   * - `name`: The name of the event handler.
   * - `event`: The name of the event this handler is associated with.
   * - `type`: The type of the event handler.
   */
  register(): { name: string, event: keyof ClientEvents, type: "on" | "once" } {
    return {
      name: this.name,
      event: this.eventName,
      type: this.type,
    }
  }

  /**
   * Initializes the event handler by executing the optional setup logic, if defined.
   *
   * @param client - The Discord client instance used for the setup process.
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
   * Invokes the callback function associated with the event, passing the provided arguments.
   * Logs an error if no callback is defined for the event.
   *
   * @param client - The Discord client instance.
   * @param args - Additional arguments to be passed to the callback function.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  call(client: DiscordClient, ...args: any[]): void {
    if (!this.callback) {
      this.logger.error('No Callback is defined for the event !');
      return;
    }
    this.callback(this.logger, client, ...args);
  }
}
