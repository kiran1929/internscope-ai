
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';
import { getPgConnectionString } from './db-connection';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: pg.Pool | undefined;
};

let prisma: PrismaClient;
let pool: pg.Pool;

const connectionString = getPgConnectionString();

if (process.env.NODE_ENV === 'production') {
  pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
} else {
  if (!globalForPrisma.pool) {
    globalForPrisma.pool = new pg.Pool({ connectionString });
  }
  pool = globalForPrisma.pool;
  if (!globalForPrisma.prisma) {
    const adapter = new PrismaPg(pool);
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  prisma = globalForPrisma.prisma;
}

export { prisma, pool };
