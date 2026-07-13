-- CreateTable
CREATE TABLE "WarehouseReport" (
    "id" TEXT NOT NULL,
    "courierId" TEXT NOT NULL,
    "cashierId" TEXT NOT NULL,
    "fullTaken" INTEGER NOT NULL,
    "emptyReturned" INTEGER NOT NULL,
    "fullReturned" INTEGER NOT NULL DEFAULT 0,
    "waterPrice" DECIMAL(10,2) NOT NULL,
    "bottlePrice" DECIMAL(10,2) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WarehouseReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WarehouseReport_courierId_idx" ON "WarehouseReport"("courierId");

-- CreateIndex
CREATE INDEX "WarehouseReport_createdAt_idx" ON "WarehouseReport"("createdAt");

-- AddForeignKey
ALTER TABLE "WarehouseReport" ADD CONSTRAINT "WarehouseReport_courierId_fkey" FOREIGN KEY ("courierId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseReport" ADD CONSTRAINT "WarehouseReport_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
