-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'CASHIER';

-- AlterTable
ALTER TABLE "CourierProfile" ADD COLUMN     "bottleRate" DECIMAL(10,2) NOT NULL DEFAULT 1.60;

-- CreateTable
CREATE TABLE "DeliveryEntry" (
    "id" TEXT NOT NULL,
    "courierId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "bottles20" INTEGER NOT NULL,
    "rate" DECIMAL(10,2) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "cashierId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "courierId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "note" TEXT,
    "cashierId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeliveryEntry_date_idx" ON "DeliveryEntry"("date");

-- CreateIndex
CREATE INDEX "DeliveryEntry_courierId_idx" ON "DeliveryEntry"("courierId");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryEntry_courierId_date_key" ON "DeliveryEntry"("courierId", "date");

-- CreateIndex
CREATE INDEX "Payout_courierId_idx" ON "Payout"("courierId");

-- AddForeignKey
ALTER TABLE "DeliveryEntry" ADD CONSTRAINT "DeliveryEntry_courierId_fkey" FOREIGN KEY ("courierId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryEntry" ADD CONSTRAINT "DeliveryEntry_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_courierId_fkey" FOREIGN KEY ("courierId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
