import SlashCommand from "../../classes/slash_command";
import add_developer from "./add_developer";
import add_ticket_participant from "./add_ticket_participant";
import claim_role from "./claim_role";
import remove_developer from "./remove_developer";
import view_developers from "./view_developers";
import transfer_purchases from "./transfer_purchases";

export default [
  claim_role,
  view_developers,
  add_developer,
  remove_developer,
  add_ticket_participant,
  transfer_purchases,
] as SlashCommand[];
