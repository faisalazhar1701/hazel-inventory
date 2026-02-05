-- DropUniqueIndex
DROP INDEX IF EXISTS "products_sku_key";

-- AlterTable
ALTER TABLE "products" DROP COLUMN IF EXISTS "sku";
