<?php

namespace App\Http\Controllers\Coach;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class NutritionMealTemplateEditController extends Controller
{
    public function __invoke(Request $request, int $meal_template)
    {
        $userId = $request->user()->id;

        $meal = DB::table('nutrition_meal_templates')
            ->where('id', $meal_template)
            ->where('user_id', $userId)
            ->first([
                'id',
                'parent_meal_id',
                'name',
                'notes',
            ]);

        if (! $meal) {
            abort(404);
        }

        $items = DB::table('nutrition_meal_template_items as i')
            ->leftJoin('nutrition_foods as f', 'f.alim_code', '=', 'i.alim_code')
            ->leftJoin('nutrition_custom_foods as cf', 'cf.id', '=', 'i.custom_food_id')
            ->leftJoin('nutrition_compositions as kcal', function ($join) {
                $join->on('kcal.alim_code', '=', 'i.alim_code')
                    ->where('kcal.const_code', '=', 328);
            })
            ->leftJoin('nutrition_compositions as prot', function ($join) {
                $join->on('prot.alim_code', '=', 'i.alim_code')
                    ->where('prot.const_code', '=', 25000);
            })
            ->leftJoin('nutrition_compositions as carb', function ($join) {
                $join->on('carb.alim_code', '=', 'i.alim_code')
                    ->where('carb.const_code', '=', 31000);
            })
            ->leftJoin('nutrition_compositions as fat', function ($join) {
                $join->on('fat.alim_code', '=', 'i.alim_code')
                    ->where('fat.const_code', '=', 32000);
            })
            ->where('i.meal_template_id', $meal->id)
            ->orderBy('i.position')
            ->get([
                'i.id',
                'i.source_type',
                'i.alim_code',
                'i.custom_food_id',
                'i.quantity_g',
                'i.position',
                DB::raw('coalesce(cf.name, f.name_fr) as name'),
                DB::raw('coalesce(cf.kcal_100g, kcal.teneur, 0) as kcal_100g'),
                DB::raw('coalesce(cf.protein_100g, prot.teneur, 0) as protein_100g'),
                DB::raw('coalesce(cf.carbs_100g, carb.teneur, 0) as carbs_100g'),
                DB::raw('coalesce(cf.fat_100g, fat.teneur, 0) as fat_100g'),
                DB::raw('((i.quantity_g / 100.0) * coalesce(cf.kcal_100g, kcal.teneur, 0)) as kcal'),
                DB::raw('((i.quantity_g / 100.0) * coalesce(cf.protein_100g, prot.teneur, 0)) as protein'),
                DB::raw('((i.quantity_g / 100.0) * coalesce(cf.carbs_100g, carb.teneur, 0)) as carbs'),
                DB::raw('((i.quantity_g / 100.0) * coalesce(cf.fat_100g, fat.teneur, 0)) as fat'),
            ]);

        $totals = [
            'kcal' => (float) $items->sum('kcal'),
            'protein' => (float) $items->sum('protein'),
            'carbs' => (float) $items->sum('carbs'),
            'fat' => (float) $items->sum('fat'),
        ];

        return Inertia::render('Coach/MealTemplateEdit', [
            'meal' => [
                'id' => $meal->id,
                'parent_meal_id' => $meal->parent_meal_id,
                'name' => $meal->name,
                'notes' => $meal->notes,
            ],
            'items' => $items,
            'totals' => $totals,
        ]);
    }
}
