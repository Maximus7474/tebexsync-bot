import SlashCommand from "../classes/slash_command";
import admin_commands from "./admin_commands";
import customer_commands from "./customer_commands";
import staff_commands from "./staff_commands";

export default [
  ...customer_commands,
  ...staff_commands,
  ...admin_commands,
] as SlashCommand[];
