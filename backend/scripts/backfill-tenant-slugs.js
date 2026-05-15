// Backfill missing tenant slugs from name. Idempotent.
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "tenant";
}

async function main() {
  const tenants = await prisma.tenant.findMany({ where: { slug: null } });
  console.log(`Found ${tenants.length} tenants without slug`);
  for (const t of tenants) {
    let base = slugify(t.name), candidate = base, n = 1;
    while (await prisma.tenant.findFirst({ where: { slug: candidate, NOT: { id: t.id } } })) {
      candidate = `${base}-${++n}`;
    }
    await prisma.tenant.update({ where: { id: t.id }, data: { slug: candidate } });
    console.log(`  ${t.name}  →  ${candidate}`);
  }
  console.log("Done.");
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
