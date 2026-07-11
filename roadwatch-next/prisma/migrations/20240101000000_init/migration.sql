-- CreateTable
CREATE TABLE "complaints" (
    "id" TEXT NOT NULL,
    "issue_type" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "image_url" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "address" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "complaints_pkey" PRIMARY KEY ("id")
);
