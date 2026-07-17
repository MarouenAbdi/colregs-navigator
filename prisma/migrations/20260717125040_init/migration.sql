-- CreateTable
CREATE TABLE "Scenario" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vesselAPosX" DOUBLE PRECISION NOT NULL,
    "vesselAPosY" DOUBLE PRECISION NOT NULL,
    "vesselAHeading" DOUBLE PRECISION NOT NULL,
    "vesselASpeed" DOUBLE PRECISION NOT NULL,
    "vesselAType" TEXT NOT NULL,
    "vesselBPosX" DOUBLE PRECISION NOT NULL,
    "vesselBPosY" DOUBLE PRECISION NOT NULL,
    "vesselBHeading" DOUBLE PRECISION NOT NULL,
    "vesselBSpeed" DOUBLE PRECISION NOT NULL,
    "vesselBType" TEXT NOT NULL,
    "isCurated" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER,
    "rationale" TEXT,

    CONSTRAINT "Scenario_pkey" PRIMARY KEY ("id")
);
