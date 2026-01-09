<?php

namespace App\Http\Controllers\Coach;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class NutritionDietTemplateEditController extends Controller
{
    public function __invoke(Request $request, int $diet_template)
    {
        $userId = $request->user()->id;

        $diet = DB::table('nutrition_diet_templates')
            ->where('id', $diet_template)
            ->where('user_id', $userId)
            ->first([
                'id',
                'name',
                'notes',
            ]);

        if (! $diet) {
            abort(404);
        }

        $slots = DB::table('nutrition_diet_template_slots as s')
            ->where('s.diet_template_id', $diet->id)
            ->orderBy('s.position')
            ->get([
                's.id',
                's.diet_template_id',
                's.label',
                's.position',
            ]);

        $slotIds = $slots->pluck('id')->all();

        $microCodes = [10120, 10260, 10300, 52100, 56100, 56200, 56310, 56400, 56500, 56700, 56600];

        $items = count($slotIds) > 0
            ? DB::table('nutrition_diet_template_slot_items as i')
                ->join('nutrition_diet_template_slots as s', 's.id', '=', 'i.diet_slot_id')
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
                ->whereIn('i.diet_slot_id', $slotIds)
                ->orderBy('s.position')
                ->orderBy('i.position')
                ->get([
                    'i.id',
                    'i.diet_slot_id',
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
                ])
            : collect();

        $itemsBySlot = $items->groupBy('diet_slot_id');

        $dayTotals = [
            'kcal' => (float) $items->sum('kcal'),
            'protein' => (float) $items->sum('protein'),
            'carbs' => (float) $items->sum('carbs'),
            'fat' => (float) $items->sum('fat'),
        ];

        $catalogMicros = count($slotIds) > 0
            ? DB::table('nutrition_diet_template_slot_items as i')
                ->join('nutrition_compositions as comp', function ($join) {
                    $join->on('comp.alim_code', '=', 'i.alim_code');
                })
                ->whereIn('i.diet_slot_id', $slotIds)
                ->where('i.source_type', 'catalog')
                ->whereIn('comp.const_code', $microCodes)
                ->groupBy('comp.const_code')
                ->select([
                    'comp.const_code',
                    DB::raw('sum((i.quantity_g / 100.0) * coalesce(comp.teneur, 0)) as total'),
                ])
            : null;

        $customMicros = count($slotIds) > 0
            ? DB::table('nutrition_diet_template_slot_items as i')
                ->join('nutrition_custom_food_compositions as comp', function ($join) {
                    $join->on('comp.custom_food_id', '=', 'i.custom_food_id');
                })
                ->whereIn('i.diet_slot_id', $slotIds)
                ->where('i.source_type', 'custom')
                ->whereIn('comp.const_code', $microCodes)
                ->groupBy('comp.const_code')
                ->select([
                    'comp.const_code',
                    DB::raw('sum((i.quantity_g / 100.0) * coalesce(comp.teneur, 0)) as total'),
                ])
            : null;

        $microRows = ($catalogMicros && $customMicros)
            ? DB::query()->fromSub($catalogMicros->unionAll($customMicros), 't')->groupBy('t.const_code')->get([
                't.const_code',
                DB::raw('sum(t.total) as total'),
            ])
            : collect();

        $dayMicros = [];
        foreach ($microCodes as $code) {
            $dayMicros[(string) $code] = 0.0;
        }

        foreach ($microRows as $r) {
            $dayMicros[(string) $r->const_code] = (float) $r->total;
        }

        $microMeta = DB::table('nutrition_constituents')
            ->whereIn('const_code', $microCodes)
            ->orderBy('const_code')
            ->get([
                'const_code',
                'name_fr',
                'infoods_code',
            ]);

        $slotsMapped = $slots->map(function ($s) use ($itemsBySlot) {
            $items = ($itemsBySlot->get($s->id, collect()))->values();

            return [
                'id' => $s->id,
                'label' => $s->label,
                'position' => $s->position,
                'items' => $items,
                'totals' => [
                    'kcal' => (float) $items->sum('kcal'),
                    'protein' => (float) $items->sum('protein'),
                    'carbs' => (float) $items->sum('carbs'),
                    'fat' => (float) $items->sum('fat'),
                ],
            ];
        })->values();

        $mealOptions = DB::table('nutrition_meal_templates as m')
            ->leftJoin('nutrition_meal_templates as p', 'p.id', '=', 'm.parent_meal_id')
            ->where('m.user_id', $userId)
            ->orderByRaw('m.parent_meal_id is not null')
            ->orderBy('m.parent_meal_id')
            ->orderBy('m.name')
            ->get([
                'm.id',
                'm.parent_meal_id',
                'm.name',
                DB::raw('p.name as parent_name'),
            ])
            ->map(function ($m) {
                $display = $m->name;
                if ($m->parent_meal_id && $m->parent_name) {
                    $display = $m->parent_name.' / '.$m->name;
                }

                return [
                    'id' => $m->id,
                    'parent_meal_id' => $m->parent_meal_id,
                    'name' => $m->name,
                    'display_name' => $display,
                ];
            })
            ->values();

        return Inertia::render('Coach/DietTemplateEdit', [
            'dietTemplate' => [
                'id' => $diet->id,
                'name' => $diet->name,
                'notes' => $diet->notes,
            ],
            'slots' => $slotsMapped,
            'totals' => $dayTotals,
            'micros' => [
                'meta' => $microMeta,
                'totals' => $dayMicros,
            ],
            'mealOptions' => $mealOptions,
        ]);
    }
}
