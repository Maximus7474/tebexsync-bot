import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const defaultSettings = [
    { name: 'customer_role', dataType: 'role_id', value: 'role_id' },
    { name: 'customers_dev_role', dataType: 'role_id', value: 'role_id' },
    { name: 'payment_log_channel', dataType: 'channel_id', value: 'channel_id' },
    { name: 'notifying_discord_id', dataType: 'user_id', value: 'user_id' },
    { name: 'max_developers', dataType: 'number', value: '2' },
  ];

  for (const setting of defaultSettings) {
    await prisma.settings.upsert({
      where: { name: setting.name },
      update: {},
      create: setting,
    });
  }

  console.log('Default settings seeded successfully.');
}

main()
.catch(e => {
  console.error(e);
})
.finally(async () => {
  await prisma.$disconnect();
});
