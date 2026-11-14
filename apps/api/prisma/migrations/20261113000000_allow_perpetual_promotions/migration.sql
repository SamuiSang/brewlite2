-- Preserve legacy vouchers with no expiry; existing dates and rows remain unchanged.
ALTER TABLE "Promotion" ALTER COLUMN "expiresAt" DROP NOT NULL;
