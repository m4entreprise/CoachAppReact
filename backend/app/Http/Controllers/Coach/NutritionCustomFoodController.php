<?php

namespace App\Http\Controllers\Coach;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NutritionCustomFoodController extends Controller
{
    private const MICRO_CONST_CODES = [
        10120, // Mg
        10260, // Fe
        10300, // Zn
        52100, // Vit D
        56100, // B1
        56200, // B2
        56310, // B3
        56400, // B5
        56500, // B6
        56700, // B9
        56600, // B12
    ];

    private function computeKcal($protein, $carbs, $fat): ?float
    {
        $p = $protein === null || $protein === '' ? null : (float) $protein;
        $c = $carbs === null || $carbs === '' ? null : (float) $carbs;
        $f = $fat === null || $fat === '' ? null : (float) $fat;

        if ($p === null && $c === null && $f === null) {
            return null;
        }

        return ($p ?? 0.0) * 4.0 + ($c ?? 0.0) * 4.0 + ($f ?? 0.0) * 9.0;
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'protein_100g' => ['nullable', 'numeric'],
            'carbs_100g' => ['nullable', 'numeric'],
            'fat_100g' => ['nullable', 'numeric'],
            'micros' => ['nullable', 'array'],
            'micros.*' => ['nullable', 'numeric'],
        ]);

        $user = $request->user();

        $kcal = $this->computeKcal(
            $validated['protein_100g'] ?? null,
            $validated['carbs_100g'] ?? null,
            $validated['fat_100g'] ?? null,
        );

        DB::transaction(function () use ($validated, $user, $kcal) {
            $customFoodId = DB::table('nutrition_custom_foods')->insertGetId([
                'user_id' => $user->id,
                'name' => $validated['name'],
                'kcal_100g' => $kcal,
                'protein_100g' => $validated['protein_100g'] ?? null,
                'carbs_100g' => $validated['carbs_100g'] ?? null,
                'fat_100g' => $validated['fat_100g'] ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $micros = $validated['micros'] ?? [];
            $rows = [];
            foreach (self::MICRO_CONST_CODES as $code) {
                $key = (string) $code;
                if (! array_key_exists($key, $micros)) {
                    continue;
                }
                $value = $micros[$key];
                if ($value === null || $value === '') {
                    continue;
                }

                $rows[] = [
                    'custom_food_id' => $customFoodId,
                    'const_code' => $code,
                    'teneur' => $value,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            if (count($rows) > 0) {
                DB::table('nutrition_custom_food_compositions')->insert($rows);
            }
        });

        return back();
    }

    public function show(Request $request, int $custom_food): JsonResponse
    {
        $food = DB::table('nutrition_custom_foods')
            ->where('id', $custom_food)
            ->where('user_id', $request->user()->id)
            ->first([
                'id',
                'name',
                'kcal_100g',
                'protein_100g',
                'carbs_100g',
                'fat_100g',
            ]);

        if (! $food) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $comps = DB::table('nutrition_custom_food_compositions')
            ->where('custom_food_id', $custom_food)
            ->whereIn('const_code', self::MICRO_CONST_CODES)
            ->get(['const_code', 'teneur']);

        $micros = [];
        foreach ($comps as $c) {
            $micros[(string) $c->const_code] = $c->teneur;
        }

        return response()->json([
            'food' => $food,
            'micros' => $micros,
        ]);
    }

    public function update(Request $request, int $custom_food): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'protein_100g' => ['nullable', 'numeric'],
            'carbs_100g' => ['nullable', 'numeric'],
            'fat_100g' => ['nullable', 'numeric'],
            'micros' => ['nullable', 'array'],
            'micros.*' => ['nullable', 'numeric'],
        ]);

        $food = DB::table('nutrition_custom_foods')
            ->where('id', $custom_food)
            ->where('user_id', $request->user()->id)
            ->first(['id']);

        if (! $food) {
            abort(404);
        }

        $kcal = $this->computeKcal(
            $validated['protein_100g'] ?? null,
            $validated['carbs_100g'] ?? null,
            $validated['fat_100g'] ?? null,
        );

        DB::transaction(function () use ($validated, $custom_food, $kcal) {
            DB::table('nutrition_custom_foods')
                ->where('id', $custom_food)
                ->update([
                    'name' => $validated['name'],
                    'kcal_100g' => $kcal,
                    'protein_100g' => $validated['protein_100g'] ?? null,
                    'carbs_100g' => $validated['carbs_100g'] ?? null,
                    'fat_100g' => $validated['fat_100g'] ?? null,
                    'updated_at' => now(),
                ]);

            DB::table('nutrition_custom_food_compositions')
                ->where('custom_food_id', $custom_food)
                ->whereIn('const_code', self::MICRO_CONST_CODES)
                ->delete();

            $micros = $validated['micros'] ?? [];
            $rows = [];
            foreach (self::MICRO_CONST_CODES as $code) {
                $key = (string) $code;
                if (! array_key_exists($key, $micros)) {
                    continue;
                }
                $value = $micros[$key];
                if ($value === null || $value === '') {
                    continue;
                }
                $rows[] = [
                    'custom_food_id' => $custom_food,
                    'const_code' => $code,
                    'teneur' => $value,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
            if (count($rows) > 0) {
                DB::table('nutrition_custom_food_compositions')->insert($rows);
            }
        });

        return back();
    }

    public function destroy(Request $request, int $custom_food): RedirectResponse
    {
        $deleted = DB::table('nutrition_custom_foods')
            ->where('id', $custom_food)
            ->where('user_id', $request->user()->id)
            ->delete();

        if (! $deleted) {
            abort(404);
        }

        return back();
    }
}
