/*
  Warnings:

  - You are about to drop the column `componentVariantId` on the `bill_of_materials` table. All the data in the column will be lost.
  - You are about to drop the column `parentVariantId` on the `bill_of_materials` table. All the data in the column will be lost.
  - You are about to drop the column `attributes` on the `product_variants` table. All the data in the column will be lost.
  - Added the required column `category` to the `bill_of_materials` table without a default value. This is not possible if the table is not empty.
  - Added the required column `componentName` to the `bill_of_materials` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unit` to the `bill_of_materials` table without a default value. This is not possible if the table is not empty.
  - Added the required column `variantId` to the `bill_of_materials` table without a default value. This is not possible if the table is not empty.
  - Added the required column `color` to the `product_variants` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `product_variants` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "bill_of_materials" DROP CONSTRAINT "bill_of_materials_componentVariantId_fkey";

-- DropForeignKey
ALTER TABLE "bill_of_materials" DROP CONSTRAINT "bill_of_materials_parentVariantId_fkey";

-- DropIndex
DROP INDEX "bill_of_materials_parentVariantId_componentVariantId_key";

-- AlterTable
ALTER TABLE "bill_of_materials" DROP COLUMN "componentVariantId",
DROP COLUMN "parentVariantId",
ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "componentName" TEXT NOT NULL,
ADD COLUMN     "unit" TEXT NOT NULL,
ADD COLUMN     "variantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "product_variants" DROP COLUMN "attributes",
ADD COLUMN     "color" TEXT NOT NULL,
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "size" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "bill_of_materials_variantId_idx" ON "bill_of_materials"("variantId");

-- AddForeignKey
ALTER TABLE "bill_of_materials" ADD CONSTRAINT "bill_of_materials_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
