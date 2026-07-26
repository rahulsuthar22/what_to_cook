/*
  Warnings:

  - The primary key for the `admins` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `ingredients` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `category` on the `ingredients` table. All the data in the column will be lost.
  - You are about to drop the column `ingredient_name` on the `ingredients` table. All the data in the column will be lost.
  - The primary key for the `meal_plans` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `recipe_ingredients` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `quantity` column on the `recipe_ingredients` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `recipes` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `calories` on the `recipes` table. All the data in the column will be lost.
  - You are about to drop the column `carbs` on the `recipes` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `recipes` table. All the data in the column will be lost.
  - You are about to drop the column `cooking_time` on the `recipes` table. All the data in the column will be lost.
  - You are about to drop the column `difficulty_level` on the `recipes` table. All the data in the column will be lost.
  - You are about to drop the column `fat` on the `recipes` table. All the data in the column will be lost.
  - You are about to drop the column `fiber` on the `recipes` table. All the data in the column will be lost.
  - You are about to drop the column `instructions` on the `recipes` table. All the data in the column will be lost.
  - You are about to drop the column `protein` on the `recipes` table. All the data in the column will be lost.
  - You are about to drop the column `recipe_name` on the `recipes` table. All the data in the column will be lost.
  - You are about to drop the column `vitamins` on the `recipes` table. All the data in the column will be lost.
  - You are about to drop the column `dietary_preference` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `grocery_lists` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `recipe_comments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `recipe_likes` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name]` on the table `ingredients` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `ingredients` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,recipe_id,meal_date,meal_type]` on the table `meal_plans` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `recipes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `admins` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id` on the `admins` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `name` to the `ingredients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `ingredients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `ingredients` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id` on the `ingredients` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updated_at` to the `meal_plans` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id` on the `meal_plans` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `recipe_id` on the `meal_plans` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `meal_type` on the `meal_plans` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - The required column `id` was added to the `recipe_ingredients` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `updated_at` to the `recipe_ingredients` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `recipe_id` on the `recipe_ingredients` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `ingredient_id` on the `recipe_ingredients` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `name` to the `recipes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `recipes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `recipes` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id` on the `recipes` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updated_at` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RecipeStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RecipeDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "RecipeInteractionType" AS ENUM ('VIEW', 'CLICK', 'FAVOURITE', 'UNFAVOURITE', 'COOKED', 'SHARE', 'RATE');

-- CreateEnum
CREATE TYPE "InteractionSource" AS ENUM ('HOME', 'SEARCH', 'RECOMMENDATION', 'CATEGORY', 'CUISINE', 'FAVOURITES', 'MEAL_PLAN', 'TRENDING', 'OTHER');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK');

-- CreateEnum
CREATE TYPE "GroceryItemStatus" AS ENUM ('PENDING', 'PURCHASED', 'REMOVED');

-- DropForeignKey
ALTER TABLE "grocery_lists" DROP CONSTRAINT "grocery_lists_user_id_fkey";

-- DropForeignKey
ALTER TABLE "meal_plans" DROP CONSTRAINT "meal_plans_recipe_id_fkey";

-- DropForeignKey
ALTER TABLE "meal_plans" DROP CONSTRAINT "meal_plans_user_id_fkey";

-- DropForeignKey
ALTER TABLE "recipe_comments" DROP CONSTRAINT "recipe_comments_recipe_id_fkey";

-- DropForeignKey
ALTER TABLE "recipe_comments" DROP CONSTRAINT "recipe_comments_user_id_fkey";

-- DropForeignKey
ALTER TABLE "recipe_ingredients" DROP CONSTRAINT "recipe_ingredients_ingredient_id_fkey";

-- DropForeignKey
ALTER TABLE "recipe_ingredients" DROP CONSTRAINT "recipe_ingredients_recipe_id_fkey";

-- DropForeignKey
ALTER TABLE "recipe_likes" DROP CONSTRAINT "recipe_likes_recipe_id_fkey";

-- DropForeignKey
ALTER TABLE "recipe_likes" DROP CONSTRAINT "recipe_likes_user_id_fkey";

-- DropIndex
DROP INDEX "ingredients_ingredient_name_key";

-- DropIndex
DROP INDEX "recipes_recipe_name_key";

-- AlterTable
ALTER TABLE "admins" DROP CONSTRAINT "admins_pkey",
ADD COLUMN     "updated_at" TIMESTAMPTZ(3) NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "email" SET DATA TYPE VARCHAR(254),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3),
ADD CONSTRAINT "admins_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ingredients" DROP CONSTRAINT "ingredients_pkey",
DROP COLUMN "category",
DROP COLUMN "ingredient_name",
ADD COLUMN     "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "name" VARCHAR(150) NOT NULL,
ADD COLUMN     "slug" VARCHAR(180) NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMPTZ(3) NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "meal_plans" DROP CONSTRAINT "meal_plans_pkey",
ADD COLUMN     "servings" INTEGER,
ADD COLUMN     "updated_at" TIMESTAMPTZ(3) NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "recipe_id",
ADD COLUMN     "recipe_id" UUID NOT NULL,
DROP COLUMN "meal_type",
ADD COLUMN     "meal_type" "MealType" NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3),
ADD CONSTRAINT "meal_plans_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "recipe_ingredients" DROP CONSTRAINT "recipe_ingredients_pkey",
ADD COLUMN     "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id" UUID NOT NULL,
ADD COLUMN     "is_optional" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "preparation_note" VARCHAR(255),
ADD COLUMN     "sort_order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "unit_id" UUID,
ADD COLUMN     "updated_at" TIMESTAMPTZ(3) NOT NULL,
DROP COLUMN "recipe_id",
ADD COLUMN     "recipe_id" UUID NOT NULL,
DROP COLUMN "ingredient_id",
ADD COLUMN     "ingredient_id" UUID NOT NULL,
DROP COLUMN "quantity",
ADD COLUMN     "quantity" DECIMAL(10,3),
ADD CONSTRAINT "recipe_ingredients_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "recipes" DROP CONSTRAINT "recipes_pkey",
DROP COLUMN "calories",
DROP COLUMN "carbs",
DROP COLUMN "category",
DROP COLUMN "cooking_time",
DROP COLUMN "difficulty_level",
DROP COLUMN "fat",
DROP COLUMN "fiber",
DROP COLUMN "instructions",
DROP COLUMN "protein",
DROP COLUMN "recipe_name",
DROP COLUMN "vitamins",
ADD COLUMN     "cook_time_minutes" INTEGER,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "difficulty" "RecipeDifficulty",
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "name" VARCHAR(200) NOT NULL,
ADD COLUMN     "prep_time_minutes" INTEGER,
ADD COLUMN     "published_at" TIMESTAMPTZ(3),
ADD COLUMN     "servings" INTEGER,
ADD COLUMN     "slug" VARCHAR(250) NOT NULL,
ADD COLUMN     "status" "RecipeStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "updated_at" TIMESTAMPTZ(3) NOT NULL,
ADD COLUMN     "video_url" TEXT,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "image_url" SET DATA TYPE TEXT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3),
ADD CONSTRAINT "recipes_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "users" DROP COLUMN "dietary_preference",
ADD COLUMN     "updated_at" TIMESTAMPTZ(3) NOT NULL,
ALTER COLUMN "email" SET DATA TYPE VARCHAR(254),
ALTER COLUMN "avatar_url" SET DATA TYPE TEXT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3);

-- DropTable
DROP TABLE "grocery_lists";

-- DropTable
DROP TABLE "recipe_comments";

-- DropTable
DROP TABLE "recipe_likes";

-- CreateTable
CREATE TABLE "units" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "symbol" VARCHAR(20),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_steps" (
    "id" UUID NOT NULL,
    "recipe_id" UUID NOT NULL,
    "step_number" INTEGER NOT NULL,
    "instruction" TEXT NOT NULL,
    "duration_minutes" INTEGER,
    "image_url" TEXT,
    "video_url" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "recipe_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_nutrition" (
    "id" UUID NOT NULL,
    "recipe_id" UUID NOT NULL,
    "calories_kcal" DECIMAL(8,2),
    "protein_g" DECIMAL(8,2),
    "carbohydrates_g" DECIMAL(8,2),
    "fat_g" DECIMAL(8,2),
    "saturated_fat_g" DECIMAL(8,2),
    "fibre_g" DECIMAL(8,2),
    "sugar_g" DECIMAL(8,2),
    "sodium_mg" DECIMAL(8,2),

    CONSTRAINT "recipe_nutrition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_categories" (
    "recipe_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recipe_categories_pkey" PRIMARY KEY ("recipe_id","category_id")
);

-- CreateTable
CREATE TABLE "cuisines" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "cuisines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_cuisines" (
    "recipe_id" UUID NOT NULL,
    "cuisine_id" UUID NOT NULL,

    CONSTRAINT "recipe_cuisines_pkey" PRIMARY KEY ("recipe_id","cuisine_id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_tags" (
    "recipe_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "recipe_tags_pkey" PRIMARY KEY ("recipe_id","tag_id")
);

-- CreateTable
CREATE TABLE "diets" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "diets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_diets" (
    "recipe_id" UUID NOT NULL,
    "diet_id" UUID NOT NULL,

    CONSTRAINT "recipe_diets_pkey" PRIMARY KEY ("recipe_id","diet_id")
);

-- CreateTable
CREATE TABLE "user_diets" (
    "user_id" VARCHAR(128) NOT NULL,
    "diet_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_diets_pkey" PRIMARY KEY ("user_id","diet_id")
);

-- CreateTable
CREATE TABLE "allergens" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "allergens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredient_allergens" (
    "ingredient_id" UUID NOT NULL,
    "allergen_id" UUID NOT NULL,

    CONSTRAINT "ingredient_allergens_pkey" PRIMARY KEY ("ingredient_id","allergen_id")
);

-- CreateTable
CREATE TABLE "user_allergens" (
    "user_id" VARCHAR(128) NOT NULL,
    "allergen_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_allergens_pkey" PRIMARY KEY ("user_id","allergen_id")
);

-- CreateTable
CREATE TABLE "user_disliked_ingredients" (
    "user_id" VARCHAR(128) NOT NULL,
    "ingredient_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_disliked_ingredients_pkey" PRIMARY KEY ("user_id","ingredient_id")
);

-- CreateTable
CREATE TABLE "user_preferred_cuisines" (
    "user_id" VARCHAR(128) NOT NULL,
    "cuisine_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_preferred_cuisines_pkey" PRIMARY KEY ("user_id","cuisine_id")
);

-- CreateTable
CREATE TABLE "user_preferred_categories" (
    "user_id" VARCHAR(128) NOT NULL,
    "category_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_preferred_categories_pkey" PRIMARY KEY ("user_id","category_id")
);

-- CreateTable
CREATE TABLE "recipe_interactions" (
    "id" UUID NOT NULL,
    "user_id" VARCHAR(128) NOT NULL,
    "recipe_id" UUID NOT NULL,
    "type" "RecipeInteractionType" NOT NULL,
    "source" "InteractionSource",
    "session_id" VARCHAR(128),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recipe_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_favourites" (
    "user_id" VARCHAR(128) NOT NULL,
    "recipe_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recipe_favourites_pkey" PRIMARY KEY ("user_id","recipe_id")
);

-- CreateTable
CREATE TABLE "recipe_reviews" (
    "id" UUID NOT NULL,
    "user_id" VARCHAR(128) NOT NULL,
    "recipe_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "recipe_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grocery_list_items" (
    "id" UUID NOT NULL,
    "user_id" VARCHAR(128) NOT NULL,
    "ingredient_id" UUID,
    "unit_id" UUID,
    "custom_name" VARCHAR(150),
    "quantity" DECIMAL(10,3),
    "status" "GroceryItemStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "grocery_list_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "units_name_key" ON "units"("name");

-- CreateIndex
CREATE INDEX "recipe_steps_recipe_id_idx" ON "recipe_steps"("recipe_id");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_steps_recipe_id_step_number_key" ON "recipe_steps"("recipe_id", "step_number");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_nutrition_recipe_id_key" ON "recipe_nutrition"("recipe_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_is_active_idx" ON "categories"("is_active");

-- CreateIndex
CREATE INDEX "recipe_categories_category_id_idx" ON "recipe_categories"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "cuisines_name_key" ON "cuisines"("name");

-- CreateIndex
CREATE UNIQUE INDEX "cuisines_slug_key" ON "cuisines"("slug");

-- CreateIndex
CREATE INDEX "cuisines_is_active_idx" ON "cuisines"("is_active");

-- CreateIndex
CREATE INDEX "recipe_cuisines_cuisine_id_idx" ON "recipe_cuisines"("cuisine_id");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");

-- CreateIndex
CREATE INDEX "tags_is_active_idx" ON "tags"("is_active");

-- CreateIndex
CREATE INDEX "recipe_tags_tag_id_idx" ON "recipe_tags"("tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "diets_name_key" ON "diets"("name");

-- CreateIndex
CREATE UNIQUE INDEX "diets_slug_key" ON "diets"("slug");

-- CreateIndex
CREATE INDEX "diets_is_active_idx" ON "diets"("is_active");

-- CreateIndex
CREATE INDEX "recipe_diets_diet_id_idx" ON "recipe_diets"("diet_id");

-- CreateIndex
CREATE INDEX "user_diets_diet_id_idx" ON "user_diets"("diet_id");

-- CreateIndex
CREATE UNIQUE INDEX "allergens_name_key" ON "allergens"("name");

-- CreateIndex
CREATE UNIQUE INDEX "allergens_slug_key" ON "allergens"("slug");

-- CreateIndex
CREATE INDEX "ingredient_allergens_allergen_id_idx" ON "ingredient_allergens"("allergen_id");

-- CreateIndex
CREATE INDEX "user_allergens_allergen_id_idx" ON "user_allergens"("allergen_id");

-- CreateIndex
CREATE INDEX "user_disliked_ingredients_ingredient_id_idx" ON "user_disliked_ingredients"("ingredient_id");

-- CreateIndex
CREATE INDEX "user_preferred_cuisines_cuisine_id_idx" ON "user_preferred_cuisines"("cuisine_id");

-- CreateIndex
CREATE INDEX "user_preferred_categories_category_id_idx" ON "user_preferred_categories"("category_id");

-- CreateIndex
CREATE INDEX "recipe_interactions_user_id_created_at_idx" ON "recipe_interactions"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "recipe_interactions_recipe_id_type_idx" ON "recipe_interactions"("recipe_id", "type");

-- CreateIndex
CREATE INDEX "recipe_interactions_user_id_recipe_id_idx" ON "recipe_interactions"("user_id", "recipe_id");

-- CreateIndex
CREATE INDEX "recipe_interactions_type_created_at_idx" ON "recipe_interactions"("type", "created_at");

-- CreateIndex
CREATE INDEX "recipe_favourites_recipe_id_idx" ON "recipe_favourites"("recipe_id");

-- CreateIndex
CREATE INDEX "recipe_reviews_recipe_id_rating_idx" ON "recipe_reviews"("recipe_id", "rating");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_reviews_user_id_recipe_id_key" ON "recipe_reviews"("user_id", "recipe_id");

-- CreateIndex
CREATE INDEX "grocery_list_items_user_id_status_idx" ON "grocery_list_items"("user_id", "status");

-- CreateIndex
CREATE INDEX "grocery_list_items_ingredient_id_idx" ON "grocery_list_items"("ingredient_id");

-- CreateIndex
CREATE UNIQUE INDEX "ingredients_name_key" ON "ingredients"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ingredients_slug_key" ON "ingredients"("slug");

-- CreateIndex
CREATE INDEX "ingredients_name_idx" ON "ingredients"("name");

-- CreateIndex
CREATE INDEX "meal_plans_user_id_meal_date_idx" ON "meal_plans"("user_id", "meal_date");

-- CreateIndex
CREATE INDEX "meal_plans_recipe_id_idx" ON "meal_plans"("recipe_id");

-- CreateIndex
CREATE UNIQUE INDEX "meal_plans_user_id_recipe_id_meal_date_meal_type_key" ON "meal_plans"("user_id", "recipe_id", "meal_date", "meal_type");

-- CreateIndex
CREATE INDEX "recipe_ingredients_recipe_id_idx" ON "recipe_ingredients"("recipe_id");

-- CreateIndex
CREATE INDEX "recipe_ingredients_ingredient_id_idx" ON "recipe_ingredients"("ingredient_id");

-- CreateIndex
CREATE INDEX "recipe_ingredients_unit_id_idx" ON "recipe_ingredients"("unit_id");

-- CreateIndex
CREATE UNIQUE INDEX "recipes_slug_key" ON "recipes"("slug");

-- CreateIndex
CREATE INDEX "recipes_status_idx" ON "recipes"("status");

-- CreateIndex
CREATE INDEX "recipes_created_at_idx" ON "recipes"("created_at");

-- CreateIndex
CREATE INDEX "recipes_name_idx" ON "recipes"("name");

-- CreateIndex
CREATE INDEX "recipes_status_published_at_idx" ON "recipes"("status", "published_at");

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_steps" ADD CONSTRAINT "recipe_steps_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_nutrition" ADD CONSTRAINT "recipe_nutrition_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_categories" ADD CONSTRAINT "recipe_categories_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_categories" ADD CONSTRAINT "recipe_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_cuisines" ADD CONSTRAINT "recipe_cuisines_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_cuisines" ADD CONSTRAINT "recipe_cuisines_cuisine_id_fkey" FOREIGN KEY ("cuisine_id") REFERENCES "cuisines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_tags" ADD CONSTRAINT "recipe_tags_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_tags" ADD CONSTRAINT "recipe_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_diets" ADD CONSTRAINT "recipe_diets_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_diets" ADD CONSTRAINT "recipe_diets_diet_id_fkey" FOREIGN KEY ("diet_id") REFERENCES "diets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_diets" ADD CONSTRAINT "user_diets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_diets" ADD CONSTRAINT "user_diets_diet_id_fkey" FOREIGN KEY ("diet_id") REFERENCES "diets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_allergens" ADD CONSTRAINT "ingredient_allergens_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_allergens" ADD CONSTRAINT "ingredient_allergens_allergen_id_fkey" FOREIGN KEY ("allergen_id") REFERENCES "allergens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_allergens" ADD CONSTRAINT "user_allergens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_allergens" ADD CONSTRAINT "user_allergens_allergen_id_fkey" FOREIGN KEY ("allergen_id") REFERENCES "allergens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_disliked_ingredients" ADD CONSTRAINT "user_disliked_ingredients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_disliked_ingredients" ADD CONSTRAINT "user_disliked_ingredients_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferred_cuisines" ADD CONSTRAINT "user_preferred_cuisines_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferred_cuisines" ADD CONSTRAINT "user_preferred_cuisines_cuisine_id_fkey" FOREIGN KEY ("cuisine_id") REFERENCES "cuisines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferred_categories" ADD CONSTRAINT "user_preferred_categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferred_categories" ADD CONSTRAINT "user_preferred_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_interactions" ADD CONSTRAINT "recipe_interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_interactions" ADD CONSTRAINT "recipe_interactions_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_favourites" ADD CONSTRAINT "recipe_favourites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_favourites" ADD CONSTRAINT "recipe_favourites_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_reviews" ADD CONSTRAINT "recipe_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_reviews" ADD CONSTRAINT "recipe_reviews_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grocery_list_items" ADD CONSTRAINT "grocery_list_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grocery_list_items" ADD CONSTRAINT "grocery_list_items_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grocery_list_items" ADD CONSTRAINT "grocery_list_items_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
