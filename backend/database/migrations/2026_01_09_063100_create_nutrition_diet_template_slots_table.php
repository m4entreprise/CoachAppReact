<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nutrition_diet_template_slots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('diet_template_id')->constrained('nutrition_diet_templates')->cascadeOnDelete();

            $table->string('label');
            $table->unsignedInteger('position')->default(0);

            $table->foreignId('meal_template_id')->nullable()->constrained('nutrition_meal_templates')->nullOnDelete();

            $table->decimal('multiplier', 10, 3)->default(1);

            $table->timestamps();

            $table->index(['diet_template_id', 'position']);
            $table->index(['meal_template_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nutrition_diet_template_slots');
    }
};
