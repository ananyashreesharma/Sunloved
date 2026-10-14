/**
 * Messages people sent from "Talk to me", newest first. Mark one handled once you've replied.
 *   npx ts-node --transpile-only prisma/read-feedback.ts            (unhandled)
 *   npx ts-node --transpile-only prisma/read-feedback.ts --all
 *   npx ts-node --transpile-only prisma/read-feedback.ts --handled <id>
 */
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const i = process.argv.indexOf('--handled');
  if (i !== -1) {
    await prisma.feedbackMessage.update({ where: { id: process.argv[i + 1] }, data: { handledAt: new Date() } });
    console.log('Marked handled.');
  } else {
    const rows = await prisma.feedbackMessage.findMany({ where: process.argv.includes('--all') ? {} : { handledAt: null }, orderBy: { createdAt: 'desc' }, take: 100 });
    for (const r of rows) {
      console.log(`\n${r.createdAt.toISOString().slice(0, 16).replace('T', ' ')}  ${r.platform ?? '?'} · ${r.country ?? '?'}  ${r.replyTo ? `reply to ${r.replyTo}` : '(no reply address)'}  [${r.id}]`);
      console.log(`  ${r.message.replace(/\n/g, '\n  ')}`);
    }
    console.log(`\n${rows.length} message(s).`);
  }
  await prisma.$disconnect();
}

if (require.main === module) main();
