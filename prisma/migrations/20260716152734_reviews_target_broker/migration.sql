/*
  Warnings:

  - You are about to drop the column `property_id` on the `reviews` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[agent_id,user_id]` on the table `reviews` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `agent_id` to the `reviews` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_property_id_fkey";

-- DropIndex
DROP INDEX "reviews_property_id_idx";

-- DropIndex
DROP INDEX "reviews_property_id_user_id_key";

-- AlterTable
ALTER TABLE "reviews" DROP COLUMN "property_id",
ADD COLUMN     "agent_id" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "reviews_agent_id_idx" ON "reviews"("agent_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_agent_id_user_id_key" ON "reviews"("agent_id", "user_id");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
