import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const accessLogsTable = pgTable("access_logs", {
  id: serial("id").primaryKey(),
  licenseId: integer("license_id"),
  licenseKey: text("license_key"),
  scriptId: integer("script_id"),
  ip: text("ip"),
  hwid: text("hwid"),
  status: text("status").notNull(), // success | denied | expired | revoked | hwid_mismatch
  message: text("message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAccessLogSchema = createInsertSchema(accessLogsTable).omit({ id: true, createdAt: true });
export type InsertAccessLog = z.infer<typeof insertAccessLogSchema>;
export type AccessLog = typeof accessLogsTable.$inferSelect;
