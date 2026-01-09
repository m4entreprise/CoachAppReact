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

        return Inertia::render('Coach/Library', [
            'foods' => $foods,
            'categoryOptions' => $categoryOptions,
            'customFoods' => $customFoods,
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
