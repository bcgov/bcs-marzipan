-- Drop the old unique constraint
ALTER TABLE "form_drafts" DROP CONSTRAINT "unique_user_form_entity";

-- Add foreign key constraint to user_id
ALTER TABLE "form_drafts" 
  ADD CONSTRAINT "form_drafts_user_id_fkey" 
  FOREIGN KEY ("user_id") 
  REFERENCES "system_users"("id");

-- Create partial unique index for NULL entity_id (new items)
CREATE UNIQUE INDEX "unique_user_form_null_entity" 
  ON "form_drafts" ("user_id", "form_type") 
  WHERE "entity_id" IS NULL;

-- Create partial unique index for NOT NULL entity_id (editing existing items)
CREATE UNIQUE INDEX "unique_user_form_entity" 
  ON "form_drafts" ("user_id", "form_type", "entity_id") 
  WHERE "entity_id" IS NOT NULL;
