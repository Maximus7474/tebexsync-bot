import { DiscordClient, TebexAPIError, TebexPayment, TicketCategory, TicketCategoryData } from "@types";
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
import Tebex from "./tebex_handler";
import Logger from "../utils/logger";
import env from "../utils/config";
import { FormatDateForDB, tbxIdRegex } from "../utils/utils";
import { prisma } from "../utils/prisma";

const logger = new Logger('ticket-handler');

class Ticket {
  private static ActiveTickets: Map<string, Ticket> = new Map();

  static async reloadTickets(client: DiscordClient) {
    const applicationUser = client.user!;
    const tickets = await prisma.tickets.findMany({
      where: {
        closedAt: null,
      }
    });

    for (let idx = 0; idx < tickets.length; idx++) {
      const ticketData = tickets[idx];

      try {
        const channel = await client.channels.fetch(ticketData.channelId) as TextChannel | null;

        if (!channel) throw new Error('No channel was found.')

        const ticket = new Ticket(channel, ticketData.id);
        this.ActiveTickets.set(channel.id, ticket);
      } catch (err) {
        logger.warn(`Ticket ${ticketData.id} was closed manually (${(err as Error).message}), closing in database.`);

        const date = FormatDateForDB();
        await prisma.tickets.update({
          where: {
            id: ticketData.id,
          },
          data: {
            closedAt: date,
          }
        });

        const closureEmbed = new EmbedBuilder()
          .setTitle('Ticket closed');

        await prisma.ticketMessages.create({
          data: {
            ticket: ticketData.id,
            authorId: applicationUser.id,
            displayName: applicationUser.displayName,
            avatar: applicationUser.avatarURL({ forceStatic: true, extension: 'webp', size: 128 }),
            content: `<EMBED:${JSON.stringify(closureEmbed.toJSON())}>`,
          }
        });
      }
    }

    logger.success(`Reloaded ${this.ActiveTickets.size} tickets from database`);
  }

  static async getCategories(): Promise<TicketCategory[]> {
    const categories = await prisma.ticketCategories.findMany();
    return categories;
  }

  static async getCategoryData({ id, name }: { id?: number | null; name?: string | null }): Promise<TicketCategoryData | null> {
    if (id === null && name === null) {
      throw new Error('No id or name was specified!');
    }

    const categoryData = await prisma.ticketCategories.findUnique({
      where: {
        id: id ?? undefined,
        name: name ?? undefined,
      },
      include: {
        fields: true,
      },
    });

    return categoryData as TicketCategoryData | null;
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

    if (categoryData.requireTbxId) {
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

    await modalInteraction.deferReply({ flags: MessageFlags.Ephemeral });

    const formattedResponses = modal.components
      .filter((component): component is ActionRowBuilder<TextInputBuilder> =>
        component instanceof ActionRowBuilder && component.components.length > 0
      )
      .map(component => {
        const label = component.components[0].data.label as string;
        const id = component.components[0].data.custom_id as string;

        const fieldData = responseData.get(id)!;
        const response = 'value' in fieldData ? fieldData.value : '';

        return {
          label, response, id
        };
      })
      .filter((e) => !!(e.label && e.response && e.id));

    let purchase: { success: true; data: TebexPayment; } | TebexAPIError;
    if (categoryData.requireTbxId) {
      const tbxid = formattedResponses.find((item) => item.id === 'tbxid')?.response;

      if (!tbxid) {
        modalInteraction.editReply({
          content: `This ticket requires a **valid** transaction id for a purchase.`
        });
        return;
      }

      purchase = await Tebex.verifyPurchase(tbxid);

      if (!purchase.success) {
        modalInteraction.editReply({
          content: `This ticket requires a **valid** transaction id for a purchase.`
        });

        return;
      }
    }

    const categoryChannel = await client.channels.fetch(categoryData.categoryId) as CategoryChannel | null;

    if (!categoryChannel) {
      logger.error(`Unable to find category channel (${categoryData.categoryId}) for category: ${categoryData.name} !`);

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

    const fields: APIEmbedField[] = formattedResponses.map(({ label, response }) => {
      let value = response, name = label;
      if (tbxIdRegex.test(response) && purchase.success) {
        name = 'Purchase Info';
        value = `* Transaction ID: ${response}\n`+
                `* Status: ${purchase.data.status}\n`+
                `* Packages: ${purchase.data.packages.map(e => e.name).join(', ')}`;
      }

      return {
        name,
        value,
        inline: false,
      }
    });

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

    const dbTicket = await prisma.tickets.create({
      data: {
        category: categoryData.id,
        ticketName: channel.name,
        channelId: channel.id,
        userId: user.id,
        userUsername: user.username,
        userDisplayName: user.displayName,
      }
    });

    if (!dbTicket) throw new Error('Unable to insert ticket data into database ! (unknown error)');

    const ticket = new Ticket(
      channel,
      dbTicket.id,
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

    await modalInteraction.deferReply({ flags: MessageFlags.Ephemeral });

    const success = await ticket.closeTicket(interaction.user, closureReason);

    if (success) {
      this.ActiveTickets.delete(channelId);
    }

    await modalInteraction.deleteReply();

    const dbUser = await prisma.tickets.findUnique({
      select: {
        userId: true,
      },
      where: {
        id: ticket.ticketId,
      }
    });

    if (!dbUser || dbUser.userId === modalInteraction.user.id) return;

    const closureEmbed = new EmbedBuilder()
      .setAuthor(modalInteraction.guild ? { name: modalInteraction.guild.name } : null)
      .setTitle('Your ticket closed')
      .setThumbnail(modalInteraction.guild?.iconURL({ size: 256, extension: 'webp' }) ?? null)
      .setDescription(
        closureReason
          ? `Closure reason:\n> ${closureReason}`
          : 'Ticket considered as resolved.'
      );

    try {
      const user = await modalInteraction.guild?.members.fetch(dbUser.userId);

      if (!user) throw new Error(`${dbUser.userId} was not found`);

      await user.send({
        embeds: [closureEmbed],
      })
    } catch (err) {
      logger.error(`Unable to send closure notification to user: ${(err as Error).message}`);
    }
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
      content += `${content.length > 0 ? '\n\n' : ''}${embeds.join('\n')}`;
    }

    const { author } = message;

    await prisma.ticketMessages.create({
      data: {
        ticket: this.ticketId,
        authorId: author.id,
        displayName: author.displayName,
        avatar: author.avatarURL({ forceStatic: true, extension: 'webp', size: 128 }),
        content: content,
      }
    });
  }

  async addTicketParticipant(addedUser: User, userWhoAddedTheOtherUserNiceVariableName: User) {
    try {
      await prisma.ticketMembers.upsert({
        where: {
          ticket_userId: {
            ticket: this.ticketId,
            userId: addedUser.id,
          },
        },
        update: {
          removed: 0,
          addedBy: userWhoAddedTheOtherUserNiceVariableName.id,
          addedAt: new Date(),
        },
        create: {
          ticket: this.ticketId,
          userId: addedUser.id,
          addedBy: userWhoAddedTheOtherUserNiceVariableName.id,
        },
      });

      await this.channel.permissionOverwrites.create(addedUser, {
        ViewChannel: true,
      });

      const embed = new EmbedBuilder()
        .setAuthor({
          name: userWhoAddedTheOtherUserNiceVariableName.username,
          iconURL: userWhoAddedTheOtherUserNiceVariableName.avatarURL({
            forceStatic: true,
            extension: 'webp',
            size: 128
          }) ?? undefined
        })
        .setTitle('New ticket participant')
        .setDescription(`<@${addedUser.id}> was added to the ticket`);

      this.channel.send({
        embeds: [embed]
      });

      return true;
    } catch (err) {
      logger.error(`Unable to add ${addedUser.id} to ticket (${this.ticketId} - ${this.channel.id}):`, (err as Error).message);
      return false;
    }
  }

  async removeTicketParticipant(userId: string, userDoingTheActionOfRemovingOtherUser: User) {
    try {
      await prisma.ticketMembers.update({
        where: {
          ticket_userId: {
            ticket: this.ticketId,
            userId: userId,
          },
        },
        data: {
          removed: 1,
        },
      });

      await this.channel.permissionOverwrites.delete(
        userId,
        `Removed from ticket by ${userDoingTheActionOfRemovingOtherUser.username} (${userDoingTheActionOfRemovingOtherUser.id})`
      );

      return true;
    } catch (err) {
      logger.error(`Unable to remove ${userId} from ticket (${this.ticketId} - ${this.channel.id}):`, (err as Error).message);
      return false;
    }
  }

  async closeTicket(user: User, reason: string | undefined) {
    logger.info(`Ticket ${this.ticketId} closed by ${user.username}, reason: ${reason ?? 'N/A'}`);

    try {
      await prisma.tickets.update({
        where: {
          id: this.ticketId,
        },
        data: {
          closedAt: new Date(),
        },
      });

      const closureEmbed = new EmbedBuilder()
        .setTitle('Ticket closed')
        .setDescription(
          reason
            ? `Closure reason:\n> ${reason}`
            : 'No reason provided.'
        );

      await prisma.ticketMessages.create({
        data: {
          ticket: this.ticketId,
          authorId: user.id,
          displayName: user.displayName,
          avatar: user.avatarURL({ forceStatic: true, extension: 'webp', size: 128 }) ?? '',
          content: `<EMBED:${JSON.stringify(closureEmbed.toJSON())}>`,
        },
      });

      setTimeout(() => {
        this.channel.delete(`Ticket closed by ${user.username}${reason ? `: ${reason}` : ''}`)
          .catch((err: Error) => logger.error(`An error occurred (${err.message}) when deleting the ticket ${this.ticketId} channel ${this.channel.id}`));
      }, 500);

      return true;
    } catch (err) {
      logger.error(`Unable to close ticket ${this.ticketId}:`, (err as Error).message);
      return false;
    }
  }
}

export default Ticket;
