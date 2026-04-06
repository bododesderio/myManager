-- CreateTable
CREATE TABLE "whatsapp_contacts" (
    "id" TEXT NOT NULL,
    "list_id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "opted_in" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "whatsapp_contacts_list_id_idx" ON "whatsapp_contacts"("list_id");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_contacts_list_id_phone_key" ON "whatsapp_contacts"("list_id", "phone");

-- AddForeignKey
ALTER TABLE "whatsapp_contacts" ADD CONSTRAINT "whatsapp_contacts_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "whatsapp_contact_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
