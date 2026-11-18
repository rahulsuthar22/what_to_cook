-- CreateEnum
CREATE TYPE "IngredientRole" AS ENUM ('MAIN', 'SECONDARY', 'FLAVORING', 'GARNISH', 'PANTRY_STAPLE', 'OPTIONAL');

-- CreateTable
CREATE TABLE "ingredient_categories" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ingredient_categories_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "ingredients" ADD COLUMN "description" TEXT,
ADD COLUMN "image_url" TEXT,
ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "category_id" UUID;

-- CreateTable
CREATE TABLE "ingredient_aliases" (
    "id" UUID NOT NULL,
    "ingredient_id" UUID NOT NULL,
    "alias" VARCHAR(150) NOT NULL,
    "alias_normalized" VARCHAR(150) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ingredient_aliases_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "recipe_ingredients" ADD COLUMN "role" "IngredientRole";

-- CreateTable
CREATE TABLE "user_pantry_items" (
    "id" UUID NOT NULL,
    "user_id" VARCHAR(128) NOT NULL,
    "ingredient_id" UUID NOT NULL,
    "quantity" DECIMAL(10,3),
    "unit_id" UUID,
    "expiry_date" DATE,
    "notes" VARCHAR(500),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "user_pantry_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ingredient_categories_name_key" ON "ingredient_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ingredient_categories_slug_key" ON "ingredient_categories"("slug");

-- CreateIndex
CREATE INDEX "ingredient_categories_is_active_idx" ON "ingredient_categories"("is_active");

-- CreateIndex
CREATE INDEX "ingredients_is_active_idx" ON "ingredients"("is_active");

-- CreateIndex
CREATE INDEX "ingredients_category_id_idx" ON "ingredients"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "ingredient_aliases_alias_normalized_key" ON "ingredient_aliases"("alias_normalized");

-- CreateIndex
CREATE INDEX "ingredient_aliases_ingredient_id_idx" ON "ingredient_aliases"("ingredient_id");

-- CreateIndex
CREATE INDEX "ingredient_aliases_alias_normalized_idx" ON "ingredient_aliases"("alias_normalized");

-- CreateIndex
CREATE UNIQUE INDEX "user_pantry_items_user_id_ingredient_id_key" ON "user_pantry_items"("user_id", "ingredient_id");

-- CreateIndex
CREATE INDEX "user_pantry_items_user_id_idx" ON "user_pantry_items"("user_id");

-- CreateIndex
CREATE INDEX "user_pantry_items_ingredient_id_idx" ON "user_pantry_items"("ingredient_id");

-- AddForeignKey
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "ingredient_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_aliases" ADD CONSTRAINT "ingredient_aliases_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_pantry_items" ADD CONSTRAINT "user_pantry_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_pantry_items" ADD CONSTRAINT "user_pantry_items_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_pantry_items" ADD CONSTRAINT "user_pantry_items_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
