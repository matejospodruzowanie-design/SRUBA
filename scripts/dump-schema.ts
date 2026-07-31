import { prisma } from "../lib/db";

async function main() {
  const tables = await prisma.$queryRawUnsafe(
    `SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE '_prisma%' AND name NOT LIKE 'sqlite_%' ORDER BY name`
  );
  for (const row of tables as Array<{ name: string; sql: string }>) {
    console.log(row.sql + ";");
  }

  // Also dump INSERT statements for seed data
  for (const row of tables as Array<{ name: string }>) {
    const data = await prisma.$queryRawUnsafe(`SELECT * FROM "${row.name}"`);
    const records = data as Record<string, unknown>[];
    for (const rec of records) {
      const columns = Object.keys(rec);
      const values = Object.values(rec).map((v) => {
        if (v === null) return "NULL";
        if (typeof v === "string") return `'${v.replace(/'/g, "''")}'`;
        if (typeof v === "boolean") return v ? "1" : "0";
        if (v instanceof Date) return `'${v.toISOString()}'`;
        return String(v);
      });
      console.log(
        `INSERT INTO "${row.name}" (${columns.map((c) => `"${c}"`).join(", ")}) VALUES (${values.join(", ")});`
      );
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
