-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "agent_id" UUID NOT NULL,
    "client_id" UUID,
    "property_id" UUID,
    "client_name" VARCHAR(200),
    "client_email" VARCHAR(255),
    "client_phone" VARCHAR(50),
    "interest" TEXT,
    "budget" INTEGER,
    "stage" VARCHAR(20) NOT NULL DEFAULT 'new',
    "source" VARCHAR(30),
    "notes" TEXT,
    "last_contact_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "agent_id" UUID NOT NULL,
    "client_id" UUID,
    "property_id" UUID,
    "lead_id" UUID,
    "title" VARCHAR(255),
    "client_name" VARCHAR(200),
    "stage" VARCHAR(20) NOT NULL DEFAULT 'negotiation',
    "status" VARCHAR(20) NOT NULL DEFAULT 'open',
    "value" INTEGER,
    "notes" TEXT,
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leads_agent_id_stage_idx" ON "leads"("agent_id", "stage");

-- CreateIndex
CREATE INDEX "leads_agent_id_last_contact_at_idx" ON "leads"("agent_id", "last_contact_at");

-- CreateIndex
CREATE INDEX "deals_agent_id_status_idx" ON "deals"("agent_id", "status");

-- CreateIndex
CREATE INDEX "deals_agent_id_stage_idx" ON "deals"("agent_id", "stage");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
