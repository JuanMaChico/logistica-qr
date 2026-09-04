-- DropForeignKey
ALTER TABLE "equipment_logs" DROP CONSTRAINT "equipment_logs_event_id_fkey";

-- AlterTable
ALTER TABLE "equipment_logs" ALTER COLUMN "event_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "equipment_logs" ADD CONSTRAINT "equipment_logs_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
