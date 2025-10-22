export interface TicketCategory {
  name: string;
  id: number;
  description: string | null;
  emoji: string | null;
  categoryId: string;
  requireTbxId: number;
}

export interface TicketCategoryField {
  id: number;
  label: string;
  placeholder: string;
  required: 1 | 0;
  short_field: 1 | 0;
  min_length: 1 | 0 | null;
  max_length: 1 | 0 | null;
}

export interface TicketCategoryData extends TicketCategory {
  fields: TicketCategoryField[];
}

export interface DatabaseTicket {
  id: number;
  category: number;
  ticket_name: string;
  channel_id: string;

  user_id: string;
  user_username: string;
  user_display_name: string;

  opened_at: string;
  closed_at: string | null;
}
