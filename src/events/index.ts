import EventHandler from "../classes/event_handler";
import command_handler from "./command_handler";
import logging from "./logging";
import ready from "./ready";

export default [
  logging,
  command_handler,
  ready,
] as EventHandler[];
