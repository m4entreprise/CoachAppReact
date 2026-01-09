<?php

namespace App\Http\Controllers\Coach;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class NutritionFoodController extends Controller
{
    public function __invoke(int $alim_code): JsonResponse
    {
        $food = DB::table('nutrition_foods')
            ->where('alim_code', $alim_code)
            ->first([
                'alim_code',
                'name_fr',
                'name_en',
                'name_sci',
                'alim_grp_code',
                'alim_ssgrp_code',
                'alim_ssssgrp_code',
                'facteur_jones',
            ]);

        if (! $food) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $group = DB::table('nutrition_groups')
            ->where('alim_grp_code', $food->alim_grp_code)
            ->where('alim_ssgrp_code', $food->alim_ssgrp_code)
            ->where('alim_ssssgrp_code', $food->alim_ssssgrp_code)
            ->first([
                'alim_grp_name_fr',
                'alim_ssgrp_name_fr',
                'alim_ssssgrp_name_fr',
            ]);

        $compositions = DB::table('nutrition_compositions as c')
            ->join('nutrition_constituents as k', 'k.const_code', '=', 'c.const_code')
            ->leftJoin('nutrition_sources as s', 's.source_code', '=', 'c.source_code')
            ->where('c.alim_code', $alim_code)
            ->orderBy('k.name_fr')
            ->get([
                'c.const_code',
                'k.name_fr as const_name_fr',
                'k.name_en as const_name_en',
                'k.infoods_code as infoods_code',
                'c.teneur',
                'c.min',
                'c.max',
                'c.code_confiance',
                'c.source_code',
                's.ref_citation',
            ]);

        return response()->json([
            'food' => $food,
            'group' => $group,
            'compositions' => $compositions,
        ]);
    }
}
