-- AlterTable
ALTER TABLE "PropertyListing" ADD COLUMN     "deposit_months" INTEGER,
ADD COLUMN     "minimum_lease_months" INTEGER,
ADD COLUMN     "utilities_estimate" DOUBLE PRECISION;
