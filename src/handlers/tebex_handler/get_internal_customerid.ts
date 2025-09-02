import Database from "../../utils/database";

export default async (discordId: string): Promise<number> => {
  const customer = await Database.get<{id: number}>('SELECT `id` FROM `customers` WHERE `discord_id` = ?', [ discordId ]);

  if (customer) return customer.id;

  const id = await Database.insert(
    "INSERT INTO `customers` (`discord_id`) VALUES (?)",
    [discordId]
  );

  if (!id) throw new Error(`Unable to insert ${discordId} into customers database table.`);

  return id;
}
