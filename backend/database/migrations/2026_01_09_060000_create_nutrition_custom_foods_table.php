<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nutrition_custom_foods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->string('name');

            $table->decimal('kcal_100g', 10, 3)->nullable();
            $table->decimal('protein_100g', 10, 3)->nullable();
            $table->decimal('carbs_100g', 10, 3)->nullable();
            $table->decimal('fat_100g', 10, 3)->nullable();

            $table->timestamps();

            $table->index(['user_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nutrition_custom_foods');
    }
};
