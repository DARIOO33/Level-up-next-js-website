import 'dotenv/config';
import { definePrismaConfig } from '@prisma/cli-engine';
import { defineConfig as ormConfig } from '@prisma/orm-mongo/config';

export default definePrismaConfig({
  orm: ormConfig({
    contract: './prisma/contract.prisma',
    db: {
      connection: process.env['DATABASE_URL'] ?? process.env['MONGO_URI'] ?? 'mongodb://127.0.0.1:27017/levelup',
    },
  }),
});
