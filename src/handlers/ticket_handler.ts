import { DatabaseTicket, DiscordClient, TicketCategory, TicketCategoryData, TicketCategoryField } from "@types";
import {
  ActionRowBuilder,
  APIEmbedField,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  CategoryChannel,
  ChannelType,
  ChatInputCommandInteraction,
  CommandInteraction,
  EmbedBuilder,
  Message,
  MessageFlags,
  ModalBuilder,
  ModalSubmitInteraction,
  PermissionFlagsBits,
  StringSelectMenuInteraction,
  TextChannel,
  TextInputBuilder,
  TextInputStyle,
  User,
} from "discord.js";
import Database from "../utils/database";
import Tebex from "./tebex_handler";
import Logger from "../utils/logger";
import env from "../utils/config";
import { FormatDateForDB } from "../utils/utils";

const logger = new Logger('ticket-handler');

class Ticket {
  private static ActiveTickets: Map<string, Ticket> = new Map();

  static async reloadTickets(client: DiscordClient) {
    const applicationUser = client.user!;
    const tickets = await Database.all<DatabaseTicket>('SELECT * FROM `tickets` WHERE `closed_at` IS NULL');

    for (let idx = 0; idx < tickets.length; idx++) {
      const ticketData = tickets[idx];

      try {
        const channel = await client.channels.fetch(ticketData.channel_id) as TextChannel | null;

        if (!channel) throw new Error('No channel was found.')

        const ticket = new Ticket(channel, ticketData.id);
        this.ActiveTickets.set(channel.id, ticket);
      } catch (err) {
        logger.warn(`Ticket ${ticketData.id} was closed manually (${(err as Error).message}), closing in database.`);

        const date = FormatDateForDB();
        await Database.execute('UPDATE `tickets` SET `closed_at` = ? WHERE `id` = ?', [ date, ticketData.id ])

        const closureEmbed = new EmbedBuilder()
          .setTitle('Ticket closed');

        await Database.insert(
          'INSERT INTO ticket_messages (ticket, author_id, display_name, avatar, content) VALUES (?, ?, ?, ?, ?)',
          [
            ticketData.id,
            applicationUser.id,
            applicationUser.displayName,
            applicationUser.avatarURL({ forceStatic: true, extension: 'webp', size: 128 }),
            `<EMBED:${JSON.stringify(closureEmbed.toJSON())}>`,
          ]
        );
      }
    }

    logger.success(`Reloaded ${this.ActiveTickets.size} tickets from database`);
  }

  static async getCategories(): Promise<TicketCategory[]> {
    return await Database.all<TicketCategory>('SELECT * FROM `ticket_categories`');
  }

  static async getCategoryData({ id, name }: { id?: number | null; name?: string | null }): Promise<TicketCategoryData | null> {
    const whereStatement = id !== null
      ? 'WHERE id = ?'
      : name !== null
        ? 'WHERE name = ?'
        : null;

    const queryParams = id !== null
      ? [ id ]
      : name !== null
        ? [ name ]
        : null;

    if (!whereStatement || !queryParams) throw new Error('No id or name was specified !');

    const categoryData = await Database.get<TicketCategory>(
      `SELECT
        id,
        name,
        description,
        emoji,
        category_id,
        require_tbxid
      FROM ticket_categories
      ${whereStatement}`,
      queryParams
    );

    if (!categoryData) return null;

    const categoryFields = await Database.all<TicketCategoryField>(
      `SELECT
        id,
        label,
        placeholder,
        required,
        short_field,
        min_length,
        max_length
      FROM ticket_category_fields
      WHERE category = ?`,
      [ categoryData.id ]
    );

    return {
      ...categoryData,
      fields: categoryFields,
    };
  }

  static async createNewTicket(
    client: DiscordClient,
    interaction: ButtonInteraction | CommandInteraction | StringSelectMenuInteraction,
    category_id: number
  ) {
    const categoryData = await this.getCategoryData({ id: category_id});

    if (!categoryData) {
      return interaction.reply({
        content: 'Invalid Data',
        flags: MessageFlags.Ephemeral,
      });
    }

    const { user } = interaction;
    const guild = await client.guilds.fetch(env.MAIN_GUILD_ID);

    if (!guild) throw new Error(`No guild was found ! Make sure the environment variable MAIN_GUILD_ID is set to a valid guild ID !`);

    const modalInteractionId = `collector-openticket-${categoryData.id}-${user.id}`;

    const modal = new ModalBuilder()
      .setCustomId(modalInteractionId)
      .setTitle(`Ticket: ${categoryData.name}`);

    if (categoryData.require_tbxid) {
      const textInput = new TextInputBuilder()
        .setCustomId(`tbxid`)
        .setLabel('Transaction ID')
        .setPlaceholder('tbx-000a0000a00000-aaa0aa')
        .setRequired(true)
        .setStyle(TextInputStyle.Short)
        .setMinLength(25)
        .setMaxLength(40);

      const actionRow = new ActionRowBuilder<TextInputBuilder>()
        .addComponents(textInput);

      modal.addComponents(actionRow);
    }

    const fieldComponents = categoryData.fields.map((field) => {
      const textInput = new TextInputBuilder()
        .setCustomId(`${field.id}`)
        .setLabel(field.label)
        .setRequired(field.required === 1)
        .setStyle(field.short_field === 1 ? TextInputStyle.Short : TextInputStyle.Paragraph);

      if (field.placeholder) {
        textInput.setPlaceholder(field.placeholder);
      }
      if (field.min_length) {
        textInput.setMinLength(field.min_length);
      }
      if (field.max_length) {
        textInput.setMaxLength(field.max_length);
      }

      // Wrap the text input in an action row.
      return new ActionRowBuilder<TextInputBuilder>()
        .addComponents(textInput);
    });

    modal.addComponents(...fieldComponents);

    await interaction.showModal(modal);

    const filter = (modalInteraction: ModalSubmitInteraction) => (
          modalInteraction.customId === modalInteractionId
      &&  modalInteraction.user.id === interaction.user.id
    );

    let responseData, modalInteraction;
    try {
      modalInteraction = await interaction.awaitModalSubmit({ filter, time: 60_000 });

      responseData = modalInteraction.fields.fields;
    } catch {
      modalInteraction?.reply({
        content: `Ticket opening cancelled`,
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    modalInteraction.deferReply({ flags: MessageFlags.Ephemeral });

    const formattedResponses = modal.components
      .map(component => {
        const label = component.components[0].data.label as string;
        const id = component.components[0].data.custom_id as string;

        const response = responseData.get(id)!.value;

        return {
          label, response, id
        };
      })
      .filter((e) => !!(e.label && e.response && e.id));

    if (categoryData.require_tbxid) {
      const tbxid = formattedResponses.find((item) => item.id === 'tbxid')?.response;

      if (!tbxid) {
        modalInteraction.editReply({
          content: `This ticket requires a **valid** transaction id for a purchase.`
        });
        return;
      }

      const purchase = await Tebex.verifyPurchase(tbxid);

      if (!purchase.success) {
        modalInteraction.editReply({
          content: `This ticket requires a **valid** transaction id for a purchase.`
        });

        return;
      }
    }

    const categoryChannel = await client.channels.fetch(categoryData.category_id) as CategoryChannel | null;

    if (!categoryChannel) {
      logger.error(`Unable to find category channel (${categoryData.category_id}) for category: ${categoryData.name} !`);

      modalInteraction.editReply({
        content: `Unable to open a ticket, please inform the developers that no category was found.`
      });

      return;
    }

    const channel = await guild.channels.create({
      name: user.username,
      parent: categoryChannel,
      reason: `Ticket opened by ${user.username} under category: ${categoryData.name}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [{
        id: user.id,
        allow: [ PermissionFlagsBits.ViewChannel ],
      }],
    });


    modalInteraction.editReply({
      content: `Your ticket has been opened: ${channel.url}.`
    });

    const fields: APIEmbedField[] = formattedResponses.map(({ label, response }) => ({
      name: label,
      value: response,
      inline: false,
    }));

    const embed = new EmbedBuilder()
      .setTitle(`${categoryData.name} ticket - ${user.displayName}`)
      .setDescription("> :warning: Failure to follow ticket guidelines and required information **can** lead to the ticket getting closed.")
      .setFields(...fields);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`close-ticket`)
        .setLabel('Close Ticket')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🔒')
    ) as ActionRowBuilder<ButtonBuilder>;

    const ticketId = await Database.insert(
      'INSERT INTO `tickets` (category, ticket_name, channel_id, user_id, user_username, user_display_name) VALUES (?, ?, ?, ?, ?, ?)',
      [ categoryData.id, channel.name, channel.id, user.id, user.username, user.displayName ]
    );

    if (!ticketId) throw new Error('Unable to insert ticket data into database ! (unknown error)');

    const ticket = new Ticket(
      channel,
      ticketId,
    );

    this.ActiveTickets.set(ticket.channel.id, ticket);

    await channel.send({
      content: `<@${user.id}>`,
      embeds: [embed],
      components: [row],
    });
  }

  static async updateMessages(message: Message) {
    const { channelId } = message;

    const ticket = this.ActiveTickets.get(channelId);

    if (!ticket) return;

    ticket.handleNewMessage(message);
  }

  static getTicket(channelId: string) {
    return this.ActiveTickets.get(channelId) ?? null
  }

  static async closeTicket(channelId: string, interaction: ChatInputCommandInteraction | ButtonInteraction) {
    const ticket = this.getTicket(channelId);

    if (!ticket) {
      interaction.reply({
        content: `This channel is not an active ticket.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const modalInteractionId = `collector-closeticket-${channelId}`;

    const modal = new ModalBuilder()
      .setCustomId(modalInteractionId)
      .setTitle(`Closing ticket: ${ticket.channel.name}`);

    const textInput = new TextInputBuilder()
      .setCustomId(`closure-reason-${channelId}`)
      .setLabel('Closure reason:')
      .setRequired(false)
      .setStyle(TextInputStyle.Paragraph);

    const actionRow = new ActionRowBuilder<TextInputBuilder>()
      .addComponents(textInput);

    modal.addComponents(actionRow);

    await interaction.showModal(modal);

    const filter = (modalInteraction: ModalSubmitInteraction) => (
          modalInteraction.customId === modalInteractionId
      &&  modalInteraction.user.id === interaction.user.id
    );

    let closureReason, modalInteraction;
    try {
      modalInteraction = await interaction.awaitModalSubmit({ filter, time: 60_000 });

      closureReason = modalInteraction.fields.getTextInputValue(`closure-reason-${channelId}`);
    } catch (err) {
      logger.error((err as Error).message);

      modalInteraction?.reply({
        content: `Closure cancelled`,
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    const success = await ticket.closeTicket(interaction.user, closureReason);

    if (success) {
      this.ActiveTickets.delete(channelId);
    }

    modalInteraction.reply({
      content: success ? 'Ticket closed' : 'Failed to close',
      flags: MessageFlags.Ephemeral,
    });
  }

  ticketId: number;
  channel: TextChannel;

  constructor (
    channel: TextChannel,
    ticketId: number,
  ) {
    this.channel = channel;
    this.ticketId = ticketId;
  }

  async handleNewMessage(message: Message) {
    let content = message.content;

    if (message.embeds.length > 0) {
      const embeds = [];
      for (let idx = 0; idx < message.embeds.length; idx++) {
        embeds[idx] = `<EMBED:${JSON.stringify(message.embeds[idx].toJSON())}>\n`;
      }
      content += `\n\n${embeds.join('\n')}`;
    }

    await Database.insert(
      'INSERT INTO ticket_messages VALUES (ticket, author_id, display_name, avatar, content) VALUES (?, ?, ?, ?, ?)',
      [
        this.ticketId,
        message.author.id,
        message.author.displayName,
        message.author.avatarURL({ forceStatic: true, extension: 'webp', size: 128 }),
        content,
      ]
    );
  }

  async addTicketParticipant(addedUser: User, userWhoAddedTheOtherUserNiceVariableName: User) {
    try {
      this.channel.permissionOverwrites.create(addedUser, {
        ViewChannel: true,
      });

      const embed = new EmbedBuilder()
        .setTitle('New ticket participant')
        .setDescription(`<@${addedUser.id}> was added to the ticket by <@${userWhoAddedTheOtherUserNiceVariableName.id}>`)

      this.channel.send({
        embeds: [embed]
      });

      return true;
    } catch (err) {
      logger.error(`Unable to add ${addedUser.id} to ticket (${this.ticketId} - ${this.channel.id}):`, (err as Error).message);
      return false;
    }
  }

  async closeTicket(user: User, reason: string | undefined) {
    logger.info(`Ticket ${this.ticketId} closed by ${user.username}, reason: ${reason ?? 'N/A'}`);

    const date = FormatDateForDB();
    await Database.execute('UPDATE `tickets` SET `closed_at` = ? WHERE `id` = ?', [ date, this.ticketId ]);

    const closureEmbed = new EmbedBuilder()
      .setTitle('Ticket closed')
      .setDescription(
        reason
          ? `Closure reason:\n> ${reason}`
          : 'No reason provided.'
      );

    await Database.insert(
      'INSERT INTO ticket_messages (ticket, author_id, display_name, avatar, content) VALUES (?, ?, ?, ?, ?)',
      [
        this.ticketId,
        user.id,
        user.displayName,
        user.avatarURL({ forceStatic: true, extension: 'webp', size: 128 }),
        `<EMBED:${JSON.stringify(closureEmbed.toJSON())}>`,
      ]
    );

    await this.channel.delete(`Ticket closed by ${user.username}${reason ? `: ${reason}` : ''}`);

    return true;
  }
}

export default Ticket;
