<?php

namespace App\Http\Controllers\Coach;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class LibraryController extends Controller
{
    public function __invoke(Request $request)
    {
        $section = (string) $request->query('section', '');
        $q = trim((string) $request->query('q', ''));

        $grp = trim((string) $request->query('grp', ''));
        $ssgrp = trim((string) $request->query('ssgrp', ''));
        $ssssgrp = trim((string) $request->query('ssssgrp', ''));

        $foods = null;
        $categoryOptions = null;
        $customFoods = null;
        $mealTemplates = null;
        $dietTemplates = null;

        // MVP: for now, "Mes aliments" uses the imported food catalogue.
        if ($section === 'foods-mine') {
            $customFoods = DB::table('nutrition_custom_foods')
                ->where('user_id', $request->user()->id)
                ->orderBy('name')
                ->get([
                    'id',
                    'name',
                    'kcal_100g',
                    'protein_100g',
                    'carbs_100g',
                    'fat_100g',
                ]);

            $categoryOptions = [
                'groups' => DB::table('nutrition_groups')
                    ->select('alim_grp_code', 'alim_grp_name_fr')
                    ->distinct()
                    ->orderBy('alim_grp_code')
                    ->get(),
                'subgroups' => $grp !== ''
                    ? DB::table('nutrition_groups')
                        ->select('alim_ssgrp_code', 'alim_ssgrp_name_fr')
                        ->where('alim_grp_code', $grp)
                        ->distinct()
                        ->orderBy('alim_ssgrp_code')
                        ->get()
                    : collect(),
                'subsubgroups' => ($grp !== '' && $ssgrp !== '')
                    ? DB::table('nutrition_groups')
                        ->select('alim_ssssgrp_code', 'alim_ssssgrp_name_fr')
                        ->where('alim_grp_code', $grp)
                        ->where('alim_ssgrp_code', $ssgrp)
                        ->distinct()
                        ->orderBy('alim_ssssgrp_code')
                        ->get()
                    : collect(),
            ];

            $foodsQuery = DB::table('nutrition_foods as f')
                ->select([
                    'f.alim_code',
                    'f.name_fr',
                    'f.alim_grp_code',
                    'f.alim_ssgrp_code',
                    'f.alim_ssssgrp_code',
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
                ]);

            if ($q !== '') {
                $foodsQuery->where('f.name_fr', 'like', '%'.$q.'%');
            }

            if ($grp !== '') {
                $foodsQuery->where('f.alim_grp_code', $grp);
            }
            if ($ssgrp !== '') {
                $foodsQuery->where('f.alim_ssgrp_code', $ssgrp);
            }
            if ($ssssgrp !== '') {
                $foodsQuery->where('f.alim_ssssgrp_code', $ssssgrp);
            }

            $foods = $foodsQuery
                ->orderBy('f.name_fr')
                ->paginate(25)
                ->withQueryString();
        }

        if ($section === 'meals-favorites') {
            $userId = $request->user()->id;

            $meals = DB::table('nutrition_meal_templates')
                ->where('user_id', $userId)
                ->orderByRaw('parent_meal_id is not null')
                ->orderBy('parent_meal_id')
                ->orderBy('name')
                ->get([
                    'id',
                    'parent_meal_id',
                    'name',
                    'notes',
                ]);

            $mealIds = $meals->pluck('id')->all();

            $totalsRows = count($mealIds) > 0
                ? DB::table('nutrition_meal_template_items as i')
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
                    ->whereIn('i.meal_template_id', $mealIds)
                    ->groupBy('i.meal_template_id')
                    ->get([
                        'i.meal_template_id',
                        DB::raw('sum((i.quantity_g / 100.0) * coalesce(cf.kcal_100g, kcal.teneur, 0)) as kcal'),
                        DB::raw('sum((i.quantity_g / 100.0) * coalesce(cf.protein_100g, prot.teneur, 0)) as protein'),
                        DB::raw('sum((i.quantity_g / 100.0) * coalesce(cf.carbs_100g, carb.teneur, 0)) as carbs'),
                        DB::raw('sum((i.quantity_g / 100.0) * coalesce(cf.fat_100g, fat.teneur, 0)) as fat'),
                    ])
                : collect();

            $totalsByMeal = $totalsRows->mapWithKeys(function ($r) {
                return [
                    (string) $r->meal_template_id => [
                        'kcal' => $r->kcal,
                        'protein' => $r->protein,
                        'carbs' => $r->carbs,
                        'fat' => $r->fat,
                    ],
                ];
            });

            $getTotals = function ($mealId) use ($totalsByMeal) {
                $id = (string) $mealId;
                if (isset($totalsByMeal[$id])) {
                    return $totalsByMeal[$id];
                }

                return [
                    'kcal' => 0,
                    'protein' => 0,
                    'carbs' => 0,
                    'fat' => 0,
                ];
            };
            $byParent = $meals->groupBy(function ($m) {
                return $m->parent_meal_id ? (string) $m->parent_meal_id : '_root';
            });

            $roots = $byParent->get('_root', collect());

            $mealTemplates = $roots->map(function ($m) use ($byParent, $getTotals) {
                $subs = $byParent->get((string) $m->id, collect());

                return [
                    'id' => $m->id,
                    'name' => $m->name,
                    'notes' => $m->notes,
                    'totals' => $getTotals($m->id),
                    'substitutes' => $subs->map(function ($s) use ($getTotals) {
                        return [
                            'id' => $s->id,
                            'name' => $s->name,
                            'notes' => $s->notes,
                            'totals' => $getTotals($s->id),
                        ];
                    })->values(),
                ];
            })->values();
        }

        if ($section === 'diet-templates') {
            $userId = $request->user()->id;

            $diets = DB::table('nutrition_diet_templates')
                ->where('user_id', $userId)
                ->orderBy('name')
                ->get([
                    'id',
                    'name',
                    'notes',
                ]);

            $dietIds = $diets->pluck('id')->all();

            $slots = count($dietIds) > 0
                ? DB::table('nutrition_diet_template_slots')
                    ->whereIn('diet_template_id', $dietIds)
                    ->orderBy('position')
                    ->get([
                        'id',
                        'diet_template_id',
                        'label',
                        'position',
                        'meal_template_id',
                        'multiplier',
                    ])
                : collect();

            $slotsByDiet = $slots->groupBy('diet_template_id');

            $macroTotalsByDiet = [];
            if (count($dietIds) > 0) {
                $totalsRows = DB::table('nutrition_diet_template_slot_items as i')
                    ->join('nutrition_diet_template_slots as s', 's.id', '=', 'i.diet_slot_id')
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
                    ->whereIn('s.diet_template_id', $dietIds)
                    ->groupBy('s.diet_template_id')
                    ->get([
                        's.diet_template_id',
                        DB::raw('sum((i.quantity_g / 100.0) * coalesce(cf.kcal_100g, kcal.teneur, 0)) as kcal'),
                        DB::raw('sum((i.quantity_g / 100.0) * coalesce(cf.protein_100g, prot.teneur, 0)) as protein'),
                        DB::raw('sum((i.quantity_g / 100.0) * coalesce(cf.carbs_100g, carb.teneur, 0)) as carbs'),
                        DB::raw('sum((i.quantity_g / 100.0) * coalesce(cf.fat_100g, fat.teneur, 0)) as fat'),
                    ]);

                foreach ($totalsRows as $r) {
                    $macroTotalsByDiet[(string) $r->diet_template_id] = [
                        'kcal' => (float) $r->kcal,
                        'protein' => (float) $r->protein,
                        'carbs' => (float) $r->carbs,
                        'fat' => (float) $r->fat,
                    ];
                }
            }

            $dietTemplates = $diets->map(function ($d) use ($slotsByDiet, $macroTotalsByDiet) {
                $s = $slotsByDiet->get($d->id, collect());

                $totals = $macroTotalsByDiet[(string) $d->id] ?? [
                    'kcal' => 0.0,
                    'protein' => 0.0,
                    'carbs' => 0.0,
                    'fat' => 0.0,
                ];

                return [
                    'id' => $d->id,
                    'name' => $d->name,
                    'notes' => $d->notes,
                    'slots_count' => $s->count(),
                    'totals' => $totals,
                ];
            })->values();
        }

        return Inertia::render('Coach/Library', [
            'foods' => $foods,
            'categoryOptions' => $categoryOptions,
            'customFoods' => $customFoods,
            'mealTemplates' => $mealTemplates,
            'dietTemplates' => $dietTemplates,
            'filters' => [
                'section' => $section,
                'q' => $q,
                'grp' => $grp,
                'ssgrp' => $ssgrp,
                'ssssgrp' => $ssssgrp,
            ],
        ]);
    }
}
