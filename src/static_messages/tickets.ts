import { ActionRowBuilder, ButtonBuilder, EmbedBuilder, MessageFlags, StringSelectMenuBuilder, TextChannel } from "discord.js";
import StaticMessage from "../classes/static_messages";
import Ticket from "../handlers/ticket_handler";

export default new StaticMessage({
  name: 'TICKET-OPENER',
  customIds: ['open-ticket'],
  setup: async (logger, client) => {
    const channelId = '1330192103246139514'; // Replace with your channel ID
    const channel = await client.channels.fetch(channelId) as TextChannel | null;

    if (!channel || !channel.isTextBased()) {
      logger.error('Channel not found or is not a text-based channel.');
      return;
    }

    const categories = await Ticket.getCategories();

    const embed = new EmbedBuilder()
      .setTitle('📌 Tickets')
      .setDescription('Select the type of ticket to open.')
      .setColor(0x00AEFF);

    const stringOptions = categories.length
      ? categories.map(({ id, name, description }) => ({
          default: false,
          label: name,
          description,
          value: id.toString(),
        }))
      : [{
        default: true,
        label: 'No available categories',
        description: 'Tell the server owners to configure it.',
        value: '-1',
      }];

    const button = new StringSelectMenuBuilder()
      .setCustomId('open-ticket')
      .setOptions(...stringOptions);

    const row = new ActionRowBuilder()
      .addComponents(button) as ActionRowBuilder<ButtonBuilder>;

    const messages = await channel.messages.fetch({ limit: 10, cache: false });

    const clientId = client.user!.id;

    const clientMessages = messages.filter(msg => msg.author.id === clientId).values();
    const lastMessage = clientMessages.next().value;

    if (!lastMessage) {
      await channel.send({ embeds: [embed], components: [row] });
    } else {
      await lastMessage.edit({ embeds: [embed], components: [row] });
    }

    logger.info('Static message setup complete.');
  },
  callback: async (logger, client, interaction) => {
    if (!interaction.isStringSelectMenu()) return;

    const category = parseInt(interaction.values[0]);

    if (isNaN(category)) {
      await interaction.reply({ content: 'Invalid selection', flags: MessageFlags.Ephemeral });
      return;
    }

    Ticket.createNewTicket(client, interaction, category);
  }
});
