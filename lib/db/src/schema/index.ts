import { boolean, date, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const equipmentCategoriesTable = pgTable("equipment_categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  description: text("description").notNull(),
  availableCount: integer("available_count").notNull().default(0),
  totalCount: integer("total_count").notNull().default(0),
});

export const equipmentTable = pgTable("equipment", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  categoryId: text("category_id").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  availableUnits: integer("available_units").notNull().default(0),
  totalUnits: integer("total_units").notNull().default(0),
  condition: text("condition").notNull().default("good"),
  image: text("image").notNull(),
  isPopular: boolean("is_popular").notNull().default(false),
});

export const labRoomsTable = pgTable("lab_rooms", {
  id: text("id").primaryKey(),
  building: text("building").notNull(),
  floor: text("floor").notNull(),
  name: text("name").notNull(),
  status: text("status").notNull().default("available"),
  capacity: integer("capacity").notNull(),
  description: text("description").notNull(),
});

export const loanRequestsTable = pgTable("loan_requests", {
  id: text("id").primaryKey(),
  equipmentId: text("equipment_id").notNull(),
  equipmentName: text("equipment_name").notNull(),
  studentName: text("student_name").notNull(),
  studentId: text("student_id").notNull(),
  quantity: integer("quantity").notNull(),
  purpose: text("purpose").notNull(),
  borrowDate: date("borrow_date", { mode: "string" }).notNull(),
  returnDate: date("return_date", { mode: "string" }).notNull(),
  status: text("status").notNull().default("submitted"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  decisionNote: text("decision_note"),
});

export const roomBookingsTable = pgTable("room_bookings", {
  id: text("id").primaryKey(),
  roomId: text("room_id").notNull(),
  roomName: text("room_name").notNull(),
  studentName: text("student_name").notNull(),
  studentId: text("student_id").notNull(),
  purpose: text("purpose").notNull(),
  date: date("date", { mode: "string" }).notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  attendees: integer("attendees").notNull(),
  status: text("status").notNull().default("submitted"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  decisionNote: text("decision_note"),
});

export const stockItemsTable = pgTable("stock_items", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  category: text("category").notNull(),
  quantity: integer("quantity").notNull(),
  unit: text("unit").notNull(),
  condition: text("condition").notNull(),
  lastUpdated: date("last_updated", { mode: "string" }).notNull(),
});

export const checklistItemsTable = pgTable("checklist_items", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  quantity: integer("quantity").notNull(),
  location: text("location").notNull(),
  condition: text("condition").notNull(),
});

export const notificationsTable = pgTable("notifications", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  isRead: boolean("is_read").notNull().default(false),
});

export const guidesTable = pgTable("guides", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  intro: text("intro").notNull(),
  steps: text("steps").array().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertEquipmentCategorySchema = createInsertSchema(equipmentCategoriesTable).omit({ id: true });
export const insertEquipmentSchema = createInsertSchema(equipmentTable).omit({ id: true });
export const insertLabRoomSchema = createInsertSchema(labRoomsTable).omit({ id: true });
export const insertLoanRequestSchema = createInsertSchema(loanRequestsTable).omit({ id: true });
export const insertRoomBookingSchema = createInsertSchema(roomBookingsTable).omit({ id: true });
export const insertStockItemSchema = createInsertSchema(stockItemsTable).omit({ id: true });
export const insertChecklistItemSchema = createInsertSchema(checklistItemsTable).omit({ id: true });
export const insertNotificationSchema = createInsertSchema(notificationsTable).omit({ id: true });
export const insertGuideSchema = createInsertSchema(guidesTable).omit({ id: true });

export type EquipmentCategory = typeof equipmentCategoriesTable.$inferSelect;
export type Equipment = typeof equipmentTable.$inferSelect;
export type LabRoom = typeof labRoomsTable.$inferSelect;
export type LoanRequest = typeof loanRequestsTable.$inferSelect;
export type RoomBooking = typeof roomBookingsTable.$inferSelect;
export type StockItem = typeof stockItemsTable.$inferSelect;
export type ChecklistItem = typeof checklistItemsTable.$inferSelect;
export type Notification = typeof notificationsTable.$inferSelect;
export type Guide = typeof guidesTable.$inferSelect;

export type InsertEquipmentCategory = z.infer<typeof insertEquipmentCategorySchema>;
export type InsertEquipment = z.infer<typeof insertEquipmentSchema>;
export type InsertLabRoom = z.infer<typeof insertLabRoomSchema>;
export type InsertLoanRequest = z.infer<typeof insertLoanRequestSchema>;
export type InsertRoomBooking = z.infer<typeof insertRoomBookingSchema>;
export type InsertStockItem = z.infer<typeof insertStockItemSchema>;
export type InsertChecklistItem = z.infer<typeof insertChecklistItemSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertGuide = z.infer<typeof insertGuideSchema>;