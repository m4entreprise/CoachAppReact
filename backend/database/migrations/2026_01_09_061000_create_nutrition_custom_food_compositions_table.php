<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nutrition_custom_food_compositions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('custom_food_id')->constrained('nutrition_custom_foods')->cascadeOnDelete();
            $table->unsignedInteger('const_code');
            $table->decimal('teneur', 10, 3)->nullable();
            $table->timestamps();

            $table->unique(['custom_food_id', 'const_code'], 'ncf_comp_uniq');
            $table->index(['const_code', 'custom_food_id'], 'ncf_comp_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nutrition_custom_food_compositions');
    }
};
