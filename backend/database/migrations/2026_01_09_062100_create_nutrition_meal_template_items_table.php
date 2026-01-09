<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nutrition_meal_template_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meal_template_id')->constrained('nutrition_meal_templates')->cascadeOnDelete();

            $table->string('source_type');
            $table->unsignedInteger('alim_code')->nullable();
            $table->foreignId('custom_food_id')->nullable()->constrained('nutrition_custom_foods')->nullOnDelete();

            $table->decimal('quantity_g', 10, 3);
            $table->unsignedInteger('position')->default(0);

            $table->timestamps();

            $table->index(['meal_template_id', 'position']);
            $table->index(['alim_code']);
            $table->index(['custom_food_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nutrition_meal_template_items');
    }
};
