<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('nutrition_foods', function (Blueprint $table) {
            $table->unsignedInteger('alim_code')->primary();
            $table->string('name_fr');
            $table->string('name_en')->nullable();
            $table->string('name_sci')->nullable();

            $table->string('alim_grp_code', 2)->nullable();
            $table->string('alim_ssgrp_code', 4)->nullable();
            $table->string('alim_ssssgrp_code', 6)->nullable();

            $table->decimal('facteur_jones', 8, 3)->nullable();
            $table->timestamps();

            $table->index('alim_grp_code');
            $table->index('alim_ssgrp_code');
            $table->index('alim_ssssgrp_code');
            $table->index('name_fr');
        });

        Schema::create('nutrition_groups', function (Blueprint $table) {
            $table->id();

            $table->string('alim_grp_code', 2);
            $table->string('alim_grp_name_fr');
            $table->string('alim_grp_name_en')->nullable();

            $table->string('alim_ssgrp_code', 4);
            $table->string('alim_ssgrp_name_fr');
            $table->string('alim_ssgrp_name_en')->nullable();

            $table->string('alim_ssssgrp_code', 6);
            $table->string('alim_ssssgrp_name_fr');
            $table->string('alim_ssssgrp_name_en')->nullable();

            $table->timestamps();

            $table->unique(['alim_grp_code', 'alim_ssgrp_code', 'alim_ssssgrp_code'], 'nutr_groups_codes_unique');
            $table->index('alim_grp_code');
            $table->index('alim_ssgrp_code');
            $table->index('alim_ssssgrp_code');
        });

        Schema::create('nutrition_constituents', function (Blueprint $table) {
            $table->unsignedInteger('const_code')->primary();
            $table->string('name_fr');
            $table->string('name_en')->nullable();
            $table->string('infoods_code')->nullable();
            $table->timestamps();

            $table->index('infoods_code');
            $table->index('name_fr');
        });

        Schema::create('nutrition_sources', function (Blueprint $table) {
            $table->unsignedInteger('source_code')->primary();
            $table->text('ref_citation')->nullable();
            $table->timestamps();
        });

        Schema::create('nutrition_compositions', function (Blueprint $table) {
            $table->unsignedInteger('alim_code');
            $table->unsignedInteger('const_code');

            $table->decimal('teneur', 14, 6)->nullable();
            $table->decimal('min', 14, 6)->nullable();
            $table->decimal('max', 14, 6)->nullable();

            $table->char('code_confiance', 1)->nullable();
            $table->unsignedInteger('source_code')->nullable();

            $table->timestamps();

            $table->unique(['alim_code', 'const_code'], 'nutr_comp_alim_const_unique');
            $table->index('alim_code');
            $table->index('const_code');
            $table->index('source_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('nutrition_compositions');
        Schema::dropIfExists('nutrition_sources');
        Schema::dropIfExists('nutrition_constituents');
        Schema::dropIfExists('nutrition_groups');
        Schema::dropIfExists('nutrition_foods');
    }
};
