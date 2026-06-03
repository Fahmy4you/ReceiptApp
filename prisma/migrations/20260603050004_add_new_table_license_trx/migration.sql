-- CreateEnum
CREATE TYPE "METHODEPAYMENT" AS ENUM ('qris', 'gopay', 'shopeepay', 'bca', 'bri', 'bni', 'mandiri');

-- CreateEnum
CREATE TYPE "BILLINGCYCLE" AS ENUM ('monthly', 'yearly');

-- CreateTable
CREATE TABLE "license_transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "license_id" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "billing_cycle" "BILLINGCYCLE" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "payment_method" "METHODEPAYMENT" NOT NULL,
    "payment_code" TEXT,
    "expired_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "license_transactions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "license_transactions" ADD CONSTRAINT "license_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "license_transactions" ADD CONSTRAINT "license_transactions_license_id_fkey" FOREIGN KEY ("license_id") REFERENCES "license"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
