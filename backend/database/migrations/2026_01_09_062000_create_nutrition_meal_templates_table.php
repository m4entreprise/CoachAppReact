<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nutrition_meal_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('parent_meal_id')->nullable()->constrained('nutrition_meal_templates')->cascadeOnDelete();

            $table->string('name');
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index(['user_id', 'parent_meal_id']);
            $table->index(['user_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nutrition_meal_templates');
    }
};
