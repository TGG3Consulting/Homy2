/*
  Warnings:

  - You are about to drop the `ViewingSlot` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ViewingSlot" DROP CONSTRAINT "ViewingSlot_booked_by_fkey";

-- DropForeignKey
ALTER TABLE "ViewingSlot" DROP CONSTRAINT "ViewingSlot_property_id_fkey";

-- DropTable
DROP TABLE "ViewingSlot";
