import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, TextChannel } from "discord.js";
import StaticMessage from "../classes/static_messages";

export default new StaticMessage({
    name: 'EXAMPLE',
    customIds: ['test_button'],
    setup: async (logger, client) => {
        const channelId = 'your-channel-id-here'; // Replace with your channel ID
        const channel = await client.channels.fetch(channelId) as TextChannel | null;

        if (!channel || !channel.isTextBased()) {
            logger.error('Channel not found or is not a text-based channel.');
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle('📌 Static Message')
            .setDescription('This is a static embed with a button.')
            .setColor(0x00AEFF);

        const button = new ButtonBuilder()
            .setCustomId('test_button')
            .setLabel('Click Me')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder()
            .addComponents(button) as ActionRowBuilder<ButtonBuilder>;

        await channel.send({ embeds: [embed], components: [row] });

        logger.info('Static message setup complete.');
    },
    callback: async (logger, client, interaction) => {
        await interaction.reply({ content: 'This is an example static message!', ephemeral: true });
        logger.info('Static message sent.');
    }
});