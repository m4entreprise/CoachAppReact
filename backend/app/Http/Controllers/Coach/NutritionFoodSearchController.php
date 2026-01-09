<?php

namespace App\Http\Controllers\Coach;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NutritionFoodSearchController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $q = trim((string) $request->query('q', ''));
        if ($q === '') {
            return response()->json(['catalog' => [], 'custom' => []]);
        }

        $catalog = DB::table('nutrition_foods as f')
            ->select([
                'f.alim_code',
                'f.name_fr',
            ])
            ->leftJoin('nutrition_compositions as kcal', function ($join) {
                $join->on('kcal.alim_code', '=', 'f.alim_code')
                    ->where('kcal.const_code', '=', 328);
            })
            ->leftJoin('nutrition_compositions as prot', function ($join) {
                $join->on('prot.alim_code', '=', 'f.alim_code')
                    ->where('prot.const_code', '=', 25000);
            })
            ->leftJoin('nutrition_compositions as carb', function ($join) {
                $join->on('carb.alim_code', '=', 'f.alim_code')
                    ->where('carb.const_code', '=', 31000);
            })
            ->leftJoin('nutrition_compositions as fat', function ($join) {
                $join->on('fat.alim_code', '=', 'f.alim_code')
                    ->where('fat.const_code', '=', 32000);
            })
            ->addSelect([
                DB::raw('kcal.teneur as kcal_100g'),
                DB::raw('prot.teneur as protein_100g'),
                DB::raw('carb.teneur as carbs_100g'),
                DB::raw('fat.teneur as fat_100g'),
            ])
            ->where('f.name_fr', 'like', '%'.$q.'%')
            ->orderBy('f.name_fr')
            ->limit(20)
            ->get();

        $custom = DB::table('nutrition_custom_foods')
            ->where('user_id', $request->user()->id)
            ->where('name', 'like', '%'.$q.'%')
            ->orderBy('name')
            ->limit(20)
            ->get([
                'id',
                'name',
                'kcal_100g',
                'protein_100g',
                'carbs_100g',
                'fat_100g',
            ]);

        return response()->json([
            'catalog' => $catalog,
            'custom' => $custom,
        ]);
    }
}
