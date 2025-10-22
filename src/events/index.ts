import EventHandler from "../classes/event_handler";
import command_handler from "./command_handler";
import ready from "./ready";
import tickets from "./tickets";
import transaction from "./transaction";

export default [
  ...tickets,
  transaction,
  command_handler,
  ready,
] as EventHandler[];
