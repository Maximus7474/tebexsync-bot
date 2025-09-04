import EventHandler from "../../classes/event_handler";
import closeTicket from "./close-ticket";
import ticketMessage from "./ticket-message";

export default [
  closeTicket,
  ticketMessage,
] as EventHandler[];
