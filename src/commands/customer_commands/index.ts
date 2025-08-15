import SlashCommand from "../../classes/slash_command";
import add_developer from "./add_developer";
import claim_role from "./claim_role";
import remove_developer from "./remove_developer";
import view_developers from "./view_developers";

export default [
  claim_role,
  view_developers,
  add_developer,
  remove_developer,
] as SlashCommand[];
