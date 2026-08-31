import { Router, type IRouter, type NextFunction, type Request, type Response } from "express";
import { getAuth } from "@clerk/express";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  checklistItemsTable,
  equipmentCategoriesTable,
  equipmentTable,
  guidesTable,
  labRoomsTable,
  loanRequestsTable,
  notificationsTable,
  roomBookingsTable,
  stockItemsTable,
} from "@workspace/db";
import {
  CreateLoanRequestBody,
  CreateLoanRequestResponse,
  CreateRoomBookingBody,
  CreateRoomBookingResponse,
  DecideLoanRequestBody,
  DecideLoanRequestParams,
  DecideLoanRequestResponse,
  DecideRoomBookingBody,
  DecideRoomBookingParams,
  DecideRoomBookingResponse,
  DashboardSummary,
  GetDashboardQueryParams,
  GetDashboardResponse,
  GetEquipmentParams,
  GetEquipmentResponse,
  GetGuideResponse,
  Guide,
  HandoverLoanRequestParams,
  HandoverLoanRequestResponse,
  ListCategoriesResponse,
  ListChecklistQueryParams,
  ListChecklistResponse,
  ListEquipmentQueryParams,
  ListEquipmentResponse,
  ListLoanRequestsQueryParams,
  ListLoanRequestsResponse,
  ListNotificationsResponse,
  ListRoomBookingsQueryParams,
  ListRoomBookingsResponse,
  ListRoomsResponse,
  ListStockQueryParams,
  ListStockResponse,
  MarkNotificationReadParams,
  MarkNotificationReadResponse,
  ReturnLoanRequestParams,
  ReturnLoanRequestResponse,
  UpdateGuideBody,
  UpdateGuideResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = getAuth(req);
  const userId = auth?.sessionClaims?.userId || auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

const seedPromise = seedLab();

function calendarDate(value: Date | string): string {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value;
}

async function seedLab(): Promise<void> {
  const [existing] = await db.select({ id: equipmentTable.id }).from(equipmentTable).limit(1);
  if (existing) return;

  await db.insert(equipmentCategoriesTable).values([
    { id: "nursing", name: "Nursing Skills & KDK", shortName: "Nursing Skills", description: "Peralatan keterampilan dasar keperawatan dan KDK.", availableCount: 18, totalCount: 22 },
    { id: "emergency", name: "Emergency & Critical Care", shortName: "Emergency", description: "Peralatan simulasi kegawatdaruratan dan perawatan kritis.", availableCount: 11, totalCount: 14 },
    { id: "maternity", name: "Maternitas & Anak", shortName: "Maternitas", description: "Simulator dan alat pembelajaran maternitas serta keperawatan anak.", availableCount: 9, totalCount: 12 },
    { id: "diagnostic", name: "Diagnostic & Vital Signs", shortName: "Diagnostic", description: "Alat pemeriksaan tanda vital dan diagnostik dasar.", availableCount: 27, totalCount: 31 },
  ]);

  await db.insert(equipmentTable).values([
    { id: "eq-iv-arm", name: "Manikin IV Arm", categoryId: "nursing", description: "Lengan manikin untuk latihan pemasangan infus perifer dan pengambilan darah.", location: "Lemari A1 · Lab KMB", availableUnits: 5, totalUnits: 6, condition: "good", image: "iv-arm", isPopular: true },
    { id: "eq-infusion-pump", name: "Infusion Pump", categoryId: "nursing", description: "Pompa infus digital untuk latihan pengaturan kecepatan dan monitoring terapi cairan.", location: "Lemari A2 · Lab KMB", availableUnits: 4, totalUnits: 5, condition: "good", image: "infusion-pump", isPopular: true },
    { id: "eq-cpr", name: "Simulator CPR Dewasa", categoryId: "emergency", description: "Manikin dewasa dengan feedback kompresi untuk simulasi bantuan hidup dasar.", location: "Ruang Simulasi · Gedung B", availableUnits: 3, totalUnits: 4, condition: "good", image: "cpr", isPopular: true },
    { id: "eq-suction", name: "Suction Pump", categoryId: "emergency", description: "Alat suction portable untuk latihan airway management.", location: "Lemari C1 · Lab Gawat Darurat", availableUnits: 2, totalUnits: 3, condition: "maintenance", image: "suction", isPopular: false },
    { id: "eq-noelle", name: "Simulator Persalinan NOELLE", categoryId: "maternity", description: "Simulator persalinan lengkap untuk latihan asuhan persalinan normal.", location: "Lab Kespro · Gedung B", availableUnits: 2, totalUnits: 2, condition: "good", image: "noelle", isPopular: true },
    { id: "eq-doppler", name: "Doppler Denyut Jantung Janin", categoryId: "maternity", description: "Doppler fetal portable untuk latihan pemeriksaan denyut jantung janin.", location: "Lemari M1 · Lab ANC", availableUnits: 3, totalUnits: 4, condition: "good", image: "doppler", isPopular: false },
    { id: "eq-stethoscope", name: "Stetoskop Littmann Classic III", categoryId: "diagnostic", description: "Stetoskop untuk auskultasi jantung, paru, dan tekanan darah.", location: "Lemari D1 · Lab Gerontic", availableUnits: 12, totalUnits: 14, condition: "good", image: "stethoscope", isPopular: true },
    { id: "eq-ekg", name: "EKG 12-lead", categoryId: "diagnostic", description: "Elektrokardiograf 12 lead untuk latihan pemeriksaan dan interpretasi dasar.", location: "Lemari D2 · Lab KMB", availableUnits: 2, totalUnits: 3, condition: "good", image: "ekg", isPopular: false },
  ]);

  await db.insert(labRoomsTable).values([
    { id: "room-gerontic", building: "B", floor: "1", name: "Lab Gerontic", status: "available", capacity: 24, description: "Lab keperawatan gerontik dan latihan pemeriksaan lansia." },
    { id: "room-komunitas", building: "B", floor: "1", name: "Lab Komunitas", status: "available", capacity: 24, description: "Ruang praktik keperawatan komunitas." },
    { id: "room-jiwa", building: "B", floor: "1", name: "Lab Jiwa", status: "occupied", capacity: 20, description: "Lab simulasi komunikasi terapeutik dan keperawatan jiwa." },
    { id: "room-keluarga", building: "B", floor: "1", name: "Lab Keluarga", status: "available", capacity: 20, description: "Ruang praktik keperawatan keluarga." },
    { id: "room-bayi", building: "B", floor: "2 (atas Perpustakaan)", name: "Lab Bayi", status: "available", capacity: 18, description: "Lab keperawatan bayi dan neonatus." },
    { id: "room-inc", building: "B", floor: "2 (atas Perpustakaan)", name: "Lab INC", status: "closed", capacity: 18, description: "Ruang praktik intensive nursing care." },
    { id: "room-kespro", building: "B", floor: "2 (atas Gino)", name: "Lab Kespro", status: "available", capacity: 22, description: "Lab kesehatan reproduksi." },
    { id: "room-pnc", building: "B", floor: "2 (atas Gino)", name: "Lab PNC", status: "available", capacity: 22, description: "Lab post natal care." },
    { id: "room-anc", building: "B", floor: "2 (atas Gino)", name: "Lab ANC", status: "available", capacity: 22, description: "Lab antenatal care." },
    { id: "room-kmb", building: "B", floor: "3", name: "Lab KMB", status: "available", capacity: 30, description: "Lab keperawatan medikal bedah." },
    { id: "room-gawat", building: "B", floor: "3", name: "Lab Gawat Darurat", status: "occupied", capacity: 28, description: "Lab simulasi kegawatdaruratan." },
    { id: "room-simulasi", building: "B", floor: "3 (Kelas)", name: "Ruang Simulasi", status: "available", capacity: 40, description: "Ruang simulasi terpadu." },
    { id: "room-anak", building: "B", floor: "3 (Kelas)", name: "Lab Anak", status: "available", capacity: 24, description: "Lab keperawatan anak." },
    { id: "room-keterampilan", building: "B", floor: "4", name: "Lab Keterampilan Dasar", status: "available", capacity: 36, description: "Lab keterampilan dasar keperawatan." },
    { id: "room-osce", building: "A", floor: "2", name: "Lab OSCE", status: "available", capacity: 48, description: "Ruang ujian dan simulasi OSCE." },
  ]);

  await db.insert(stockItemsTable).values([
    { id: "stock-gloves", name: "Sarung tangan medis", type: "consumable", category: "Alat pelindung diri", quantity: 480, unit: "pasang", condition: "good", lastUpdated: "2026-08-28" },
    { id: "stock-syringe", name: "Spuit 3 ml", type: "consumable", category: "Injeksi", quantity: 86, unit: "pcs", condition: "low", lastUpdated: "2026-08-28" },
    { id: "stock-mask", name: "Masker medis", type: "consumable", category: "Alat pelindung diri", quantity: 320, unit: "pcs", condition: "good", lastUpdated: "2026-08-27" },
    { id: "stock-iv-stand", name: "Tiang infus", type: "equipment", category: "Nursing Skills", quantity: 14, unit: "unit", condition: "good", lastUpdated: "2026-08-26" },
    { id: "stock-mannequin-adult", name: "Manikin dewasa", type: "mannequin", category: "Emergency", quantity: 7, unit: "unit", condition: "good", lastUpdated: "2026-08-25" },
    { id: "stock-mannequin-baby", name: "Manikin bayi", type: "mannequin", category: "Maternitas", quantity: 3, unit: "unit", condition: "maintenance", lastUpdated: "2026-08-21" },
  ]);

  await db.insert(checklistItemsTable).values([
    { id: "check-iv-arm", name: "Manikin IV Arm", category: "Nursing Skills", quantity: 6, location: "Lemari A1 · Lab KMB", condition: "good" },
    { id: "check-infusion-pump", name: "Infusion Pump", category: "Nursing Skills", quantity: 5, location: "Lemari A2 · Lab KMB", condition: "good" },
    { id: "check-cpr", name: "Simulator CPR Dewasa", category: "Emergency", quantity: 4, location: "Ruang Simulasi", condition: "good" },
    { id: "check-noelle", name: "Simulator Persalinan NOELLE", category: "Maternitas", quantity: 2, location: "Lab Kespro", condition: "good" },
    { id: "check-stethoscope", name: "Stetoskop Littmann Classic III", category: "Diagnostic", quantity: 14, location: "Lemari D1 · Lab Gerontic", condition: "good" },
    { id: "check-ekg", name: "EKG 12-lead", category: "Diagnostic", quantity: 3, location: "Lemari D2 · Lab KMB", condition: "good" },
  ]);

  await db.insert(loanRequestsTable).values([
    { id: "loan-1001", equipmentId: "eq-iv-arm", equipmentName: "Manikin IV Arm", studentName: "Nadia Putri", studentId: "2024010108", quantity: 1, purpose: "Praktik pemasangan infus", borrowDate: "2026-09-02", returnDate: "2026-09-02", status: "submitted", decisionNote: null },
    { id: "loan-1002", equipmentId: "eq-stethoscope", equipmentName: "Stetoskop Littmann Classic III", studentName: "Raka Mahendra", studentId: "2024010042", quantity: 2, purpose: "Praktik pemeriksaan tanda vital", borrowDate: "2026-09-01", returnDate: "2026-09-01", status: "approved", decisionNote: "Silakan ambil di meja laboran." },
    { id: "loan-1003", equipmentId: "eq-cpr", equipmentName: "Simulator CPR Dewasa", studentName: "Alya Pratama", studentId: "2024010017", quantity: 1, purpose: "Latihan bantuan hidup dasar", borrowDate: "2026-08-29", returnDate: "2026-08-29", status: "returned", decisionNote: "Dikembalikan dalam kondisi baik." },
  ]);

  await db.insert(roomBookingsTable).values([
    { id: "booking-2001", roomId: "room-kmb", roomName: "Lab KMB", studentName: "Alya Pratama", studentId: "2024010017", purpose: "Latihan pemeriksaan fisik", date: "2026-09-04", startTime: "09:00", endTime: "11:00", attendees: 8, status: "scheduled", decisionNote: "Booking dikonfirmasi." },
    { id: "booking-2002", roomId: "room-osce", roomName: "Lab OSCE", studentName: "Nadia Putri", studentId: "2024010108", purpose: "Persiapan skill station", date: "2026-09-05", startTime: "13:00", endTime: "15:00", attendees: 12, status: "submitted", decisionNote: null },
  ]);

  await db.insert(notificationsTable).values([
    { id: "notif-1", title: "Peminjaman disetujui", message: "Peminjaman Stetoskop Littmann kamu sudah disetujui.", type: "approval", isRead: false },
    { id: "notif-2", title: "Booking ruangan terjadwal", message: "Lab KMB siap digunakan pada 4 September 2026.", type: "reminder", isRead: false },
    { id: "notif-3", title: "Pengembalian tercatat", message: "Terima kasih, alat dikembalikan dalam kondisi baik.", type: "system", isRead: true },
  ]);

  await db.insert(guidesTable).values({
    id: "main",
    title: "Panduan Peminjaman",
    intro: "Ajukan kebutuhan alat atau ruangan dengan data yang lengkap. Laboran akan memeriksa ketersediaan dan memberi keputusan sebelum jadwal kamu dimulai.",
    steps: [
      "Pilih alat atau ruangan yang ingin digunakan.",
      "Isi tujuan, tanggal, dan detail kebutuhan dengan benar.",
      "Tunggu persetujuan laboran melalui notifikasi.",
      "Ambil alat di meja laboran dan lakukan serah-terima manual.",
      "Kembalikan alat sesuai batas waktu dan kondisi semula.",
    ],
  });
}

const toEquipment = (row: typeof equipmentTable.$inferSelect, categoryName: string) => ({
  id: row.id, name: row.name, category: categoryName, categoryId: row.categoryId, description: row.description, location: row.location,
  availableUnits: row.availableUnits, totalUnits: row.totalUnits, condition: row.condition, image: row.image, isPopular: row.isPopular,
});

router.get("/dashboard", async (req, res): Promise<void> => {
  await seedPromise;
  const params = GetDashboardQueryParams.parse(req.query);
  const role = params.role ?? "student";
  const [equipment, loans, bookings, notifications] = await Promise.all([
    db.select().from(equipmentTable),
    db.select().from(loanRequestsTable).orderBy(desc(loanRequestsTable.submittedAt)),
    db.select().from(roomBookingsTable).orderBy(desc(roomBookingsTable.submittedAt)),
    db.select().from(notificationsTable).orderBy(desc(notificationsTable.createdAt)),
  ]);
  const submittedLoans = loans.filter((loan) => loan.status === "submitted").length;
  const submittedBookings = bookings.filter((booking) => booking.status === "submitted").length;
  const available = equipment.reduce((sum, item) => sum + item.availableUnits, 0);
  const response = role === "laboran"
    ? {
        role, greeting: "Selamat pagi, Laboran", stats: [
          { label: "Menunggu persetujuan", value: String(submittedLoans + submittedBookings), detail: `${submittedLoans} alat · ${submittedBookings} ruangan`, tone: "red" as const },
          { label: "Alat tersedia", value: String(available), detail: "dari seluruh katalog", tone: "blue" as const },
          { label: "Ruangan aktif", value: String(bookings.filter((booking) => booking.status === "scheduled").length + 12), detail: "jadwal minggu ini", tone: "green" as const },
          { label: "Belum dibaca", value: String(notifications.filter((item) => !item.isRead).length), detail: "notifikasi masuk", tone: "amber" as const },
        ],
        recentActivity: [
          ...loans.slice(0, 2).map((item) => ({ id: item.id, title: item.status === "submitted" ? "Pengajuan baru masuk" : "Status peminjaman berubah", description: `${item.studentName} · ${item.equipmentName}`, time: "Hari ini", type: "loan" as const })),
          ...bookings.slice(0, 1).map((item) => ({ id: item.id, title: "Booking ruangan menunggu", description: `${item.studentName} · ${item.roomName}`, time: "Kemarin", type: "room" as const })),
        ],
        labStatus: "operational", labStatusDetail: "12 dari 15 ruangan siap digunakan",
      }
    : {
        role, greeting: "Selamat pagi, Alya", stats: [
          { label: "Pengajuan aktif", value: String(loans.filter((loan) => ["submitted", "approved", "borrowed"].includes(loan.status)).length), detail: "peminjaman alat", tone: "blue" as const },
          { label: "Booking terjadwal", value: String(bookings.filter((booking) => ["approved", "scheduled"].includes(booking.status)).length), detail: "ruangan lab", tone: "green" as const },
          { label: "Alat tersedia", value: String(available), detail: "siap dipinjam", tone: "amber" as const },
          { label: "Notifikasi baru", value: String(notifications.filter((item) => !item.isRead).length), detail: "perlu kamu lihat", tone: "red" as const },
        ],
        recentActivity: [
          { id: "activity-1", title: "Peminjaman disetujui", description: "Stetoskop Littmann Classic III", time: "2 jam lalu", type: "loan" as const },
          { id: "activity-2", title: "Booking terjadwal", description: "Lab KMB · 4 Sep, 09:00", time: "Kemarin", type: "room" as const },
          { id: "activity-3", title: "Daftar tilik diperbarui", description: "6 item baru tersedia di katalog", time: "3 hari lalu", type: "system" as const },
        ],
        labStatus: "operational", labStatusDetail: "12 dari 15 ruangan siap digunakan",
      };
  res.json(GetDashboardResponse.parse(response));
});

router.get("/categories", async (_req, res): Promise<void> => {
  await seedPromise;
  const rows = await db.select().from(equipmentCategoriesTable);
  res.json(ListCategoriesResponse.parse(rows));
});

router.get("/equipment", async (req, res): Promise<void> => {
  await seedPromise;
  const params = ListEquipmentQueryParams.parse(req.query);
  const categories = await db.select().from(equipmentCategoriesTable);
  const conditions = [];
  if (params.category) conditions.push(eq(equipmentTable.categoryId, params.category));
  if (params.search) conditions.push(or(ilike(equipmentTable.name, `%${params.search}%`), ilike(equipmentTable.description, `%${params.search}%`)));
  if (params.availability === "available") conditions.push(or(eq(equipmentTable.condition, "good"), eq(equipmentTable.condition, "maintenance")));
  if (params.availability === "maintenance") conditions.push(eq(equipmentTable.condition, "maintenance"));
  const rows = await db.select().from(equipmentTable).where(conditions.length ? and(...conditions) : undefined);
  const categoryMap = new Map(categories.map((category) => [category.id, category.name]));
  res.json(ListEquipmentResponse.parse(rows.map((row) => toEquipment(row, categoryMap.get(row.categoryId) ?? row.categoryId))));
});

router.get("/equipment/:equipmentId", async (req, res): Promise<void> => {
  await seedPromise;
  const params = GetEquipmentParams.parse(req.params);
  const [row] = await db.select().from(equipmentTable).where(eq(equipmentTable.id, params.equipmentId));
  if (!row) { res.status(404).json({ error: "Equipment not found" }); return; }
  const [category] = await db.select().from(equipmentCategoriesTable).where(eq(equipmentCategoriesTable.id, row.categoryId));
  res.json(GetEquipmentResponse.parse(toEquipment(row, category?.name ?? row.categoryId)));
});

router.get("/loan-requests", async (req, res): Promise<void> => {
  await seedPromise;
  const params = ListLoanRequestsQueryParams.parse(req.query);
  const rows = await db.select().from(loanRequestsTable).orderBy(desc(loanRequestsTable.submittedAt));
  const filtered = rows.filter((row) => params.status && params.status !== "all" ? row.status === params.status : true);
  res.json(ListLoanRequestsResponse.parse(filtered));
});

router.post("/loan-requests", requireAuth, async (req, res): Promise<void> => {
  await seedPromise;
  const parsed = CreateLoanRequestBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [equipment] = await db.select().from(equipmentTable).where(eq(equipmentTable.id, parsed.data.equipmentId));
  if (!equipment) { res.status(404).json({ error: "Equipment not found" }); return; }
  const id = `loan-${Date.now()}`;
  const [row] = await db.insert(loanRequestsTable).values({
    id, ...parsed.data, equipmentId: equipment.id, equipmentName: equipment.name, studentName: "Alya Pratama", studentId: "2024010017",
    borrowDate: calendarDate(parsed.data.borrowDate), returnDate: calendarDate(parsed.data.returnDate), status: "submitted",
  }).returning();
  res.status(201).json(CreateLoanRequestResponse.parse(row));
});

router.patch("/loan-requests/:requestId/decision", requireAuth, async (req, res): Promise<void> => {
  await seedPromise;
  const params = DecideLoanRequestParams.parse(req.params);
  const body = DecideLoanRequestBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }
  const [row] = await db.update(loanRequestsTable).set({ status: body.data.decision, decisionNote: body.data.note ?? null }).where(eq(loanRequestsTable.id, params.requestId)).returning();
  if (!row) { res.status(404).json({ error: "Loan request not found" }); return; }
  res.json(DecideLoanRequestResponse.parse(row));
});

router.patch("/loan-requests/:requestId/handover", requireAuth, async (req, res): Promise<void> => {
  await seedPromise;
  const params = HandoverLoanRequestParams.parse(req.params);
  const [row] = await db.update(loanRequestsTable).set({ status: "borrowed" }).where(eq(loanRequestsTable.id, params.requestId)).returning();
  if (!row) { res.status(404).json({ error: "Loan request not found" }); return; }
  res.json(HandoverLoanRequestResponse.parse(row));
});

router.patch("/loan-requests/:requestId/return", requireAuth, async (req, res): Promise<void> => {
  await seedPromise;
  const params = ReturnLoanRequestParams.parse(req.params);
  const [row] = await db.update(loanRequestsTable).set({ status: "returned" }).where(eq(loanRequestsTable.id, params.requestId)).returning();
  if (!row) { res.status(404).json({ error: "Loan request not found" }); return; }
  res.json(ReturnLoanRequestResponse.parse(row));
});

router.get("/rooms", async (_req, res): Promise<void> => {
  await seedPromise;
  const rows = await db.select().from(labRoomsTable);
  res.json(ListRoomsResponse.parse(rows));
});

router.get("/room-bookings", async (req, res): Promise<void> => {
  await seedPromise;
  const params = ListRoomBookingsQueryParams.parse(req.query);
  const rows = await db.select().from(roomBookingsTable).orderBy(desc(roomBookingsTable.submittedAt));
  const filtered = rows.filter((row) => params.status && params.status !== "all" ? row.status === params.status : true);
  res.json(ListRoomBookingsResponse.parse(filtered));
});

router.post("/room-bookings", requireAuth, async (req, res): Promise<void> => {
  await seedPromise;
  const parsed = CreateRoomBookingBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [room] = await db.select().from(labRoomsTable).where(eq(labRoomsTable.id, parsed.data.roomId));
  if (!room) { res.status(404).json({ error: "Room not found" }); return; }
  const [row] = await db.insert(roomBookingsTable).values({
    id: `booking-${Date.now()}`, ...parsed.data, roomId: room.id, roomName: room.name, studentName: "Alya Pratama", studentId: "2024010017",
    date: calendarDate(parsed.data.date), status: "submitted",
  }).returning();
  res.status(201).json(CreateRoomBookingResponse.parse(row));
});

router.patch("/room-bookings/:bookingId/decision", requireAuth, async (req, res): Promise<void> => {
  await seedPromise;
  const params = DecideRoomBookingParams.parse(req.params);
  const body = DecideRoomBookingBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }
  const [row] = await db.update(roomBookingsTable).set({ status: body.data.decision === "approved" ? "scheduled" : "rejected", decisionNote: body.data.note ?? null }).where(eq(roomBookingsTable.id, params.bookingId)).returning();
  if (!row) { res.status(404).json({ error: "Room booking not found" }); return; }
  res.json(DecideRoomBookingResponse.parse(row));
});

router.get("/stock", async (req, res): Promise<void> => {
  await seedPromise;
  const params = ListStockQueryParams.parse(req.query);
  const rows = await db.select().from(stockItemsTable);
  const filtered = rows.filter((row) => (!params.type || row.type === params.type) && (!params.search || row.name.toLowerCase().includes(params.search.toLowerCase())));
  res.json(ListStockResponse.parse(filtered));
});

router.get("/checklist", async (req, res): Promise<void> => {
  await seedPromise;
  const params = ListChecklistQueryParams.parse(req.query);
  const rows = await db.select().from(checklistItemsTable);
  const filtered = params.search ? rows.filter((row) => row.name.toLowerCase().includes(params.search!.toLowerCase())) : rows;
  res.json(ListChecklistResponse.parse(filtered));
});

router.get("/notifications", async (_req, res): Promise<void> => {
  await seedPromise;
  const rows = await db.select().from(notificationsTable).orderBy(desc(notificationsTable.createdAt));
  res.json(ListNotificationsResponse.parse(rows));
});

router.patch("/notifications/:notificationId/read", requireAuth, async (req, res): Promise<void> => {
  await seedPromise;
  const params = MarkNotificationReadParams.parse(req.params);
  const [row] = await db.update(notificationsTable).set({ isRead: true }).where(eq(notificationsTable.id, params.notificationId)).returning();
  if (!row) { res.status(404).json({ error: "Notification not found" }); return; }
  res.json(MarkNotificationReadResponse.parse(row));
});

router.get("/guide", async (_req, res): Promise<void> => {
  await seedPromise;
  const [row] = await db.select().from(guidesTable).where(eq(guidesTable.id, "main"));
  res.json(GetGuideResponse.parse(row));
});

router.patch("/guide", requireAuth, async (req, res): Promise<void> => {
  await seedPromise;
  const body = UpdateGuideBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }
  const [row] = await db.update(guidesTable).set({ ...body.data, updatedAt: new Date() }).where(eq(guidesTable.id, "main")).returning();
  res.json(UpdateGuideResponse.parse(row));
});

export default router;