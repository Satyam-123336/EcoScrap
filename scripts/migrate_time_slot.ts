import { db } from './server/db';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    await db.execute(sql`ALTER TABLE pickup_requests ADD COLUMN pickup_time_slot TEXT NOT NULL DEFAULT 'Not Specified'`);
    console.log("Column added successfully");
  } catch (e) {
    console.error("Error adding column:", e);
  }
  process.exit(0);
}

main();
