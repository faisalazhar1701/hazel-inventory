-- CreateTable
CREATE TABLE "webhooks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "event" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "integration_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "integrationId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "payload" TEXT,
    "response" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "webhooks_event_isActive_idx" ON "webhooks"("event", "isActive");

-- CreateIndex
CREATE INDEX "integration_logs_integrationId_createdAt_idx" ON "integration_logs"("integrationId", "createdAt");

-- CreateIndex
CREATE INDEX "integration_logs_status_createdAt_idx" ON "integration_logs"("status", "createdAt");
