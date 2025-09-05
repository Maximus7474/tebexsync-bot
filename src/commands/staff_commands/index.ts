import SlashCommand from "../../classes/slash_command";
import removeTicketParticipant from "./remove_ticket_participant";
import verify from "./verify";

export default [
  verify,
  removeTicketParticipant,
] as SlashCommand[];
