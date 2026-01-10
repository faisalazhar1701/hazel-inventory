-- CreateTable
CREATE TABLE "demand_forecasts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productVariantId" TEXT NOT NULL,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "forecastQuantity" INTEGER NOT NULL,
    "channel" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "demand_forecasts_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "replenishment_suggestions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productVariantId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "recommendedQuantity" INTEGER NOT NULL,
    "recommendedDate" DATETIME NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "replenishment_suggestions_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "replenishment_suggestions_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "demand_forecasts_productVariantId_idx" ON "demand_forecasts"("productVariantId");

-- CreateIndex
CREATE INDEX "demand_forecasts_periodStart_periodEnd_idx" ON "demand_forecasts"("periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "replenishment_suggestions_productVariantId_warehouseId_idx" ON "replenishment_suggestions"("productVariantId", "warehouseId");

-- CreateIndex
CREATE INDEX "replenishment_suggestions_recommendedDate_idx" ON "replenishment_suggestions"("recommendedDate");
