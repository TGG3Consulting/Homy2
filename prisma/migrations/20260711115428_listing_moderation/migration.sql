-- AlterTable
ALTER TABLE "PropertyListing" ADD COLUMN     "address" TEXT,
ADD COLUMN     "deal_type" TEXT,
ADD COLUMN     "district" TEXT,
ADD COLUMN     "floor" INTEGER,
ADD COLUMN     "neighborhood" TEXT,
ADD COLUMN     "published_property_id" UUID,
ADD COLUMN     "title" TEXT;
