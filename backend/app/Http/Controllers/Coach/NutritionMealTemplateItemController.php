<?php

namespace App\Http\Controllers\Coach;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NutritionMealTemplateItemController extends Controller
{
    public function store(Request $request, int $meal_template): RedirectResponse
    {
        $validated = $request->validate([
            'source_type' => ['required', 'in:catalog,custom'],
            'alim_code' => ['nullable', 'integer'],
            'custom_food_id' => ['nullable', 'integer'],
            'quantity_g' => ['required', 'numeric', 'min:0.001'],
        ]);

        $user = $request->user();

        $meal = DB::table('nutrition_meal_templates')
            ->where('id', $meal_template)
            ->where('user_id', $user->id)
            ->first(['id']);

        if (! $meal) {
            abort(404);
        }

        if ($validated['source_type'] === 'catalog') {
            $alimCode = $validated['alim_code'] ?? null;
            if (! $alimCode) {
                abort(422);
            }
            $exists = DB::table('nutrition_foods')->where('alim_code', $alimCode)->exists();
            if (! $exists) {
                abort(404);
            }
        }

        if ($validated['source_type'] === 'custom') {
            $customFoodId = $validated['custom_food_id'] ?? null;
            if (! $customFoodId) {
                abort(422);
            }
            $exists = DB::table('nutrition_custom_foods')->where('id', $customFoodId)->where('user_id', $user->id)->exists();
            if (! $exists) {
                abort(404);
            }
        }

        $maxPos = (int) (DB::table('nutrition_meal_template_items')->where('meal_template_id', $meal_template)->max('position') ?? 0);

        DB::table('nutrition_meal_template_items')->insert([
            'meal_template_id' => $meal_template,
            'source_type' => $validated['source_type'],
            'alim_code' => $validated['source_type'] === 'catalog' ? ($validated['alim_code'] ?? null) : null,
            'custom_food_id' => $validated['source_type'] === 'custom' ? ($validated['custom_food_id'] ?? null) : null,
            'quantity_g' => $validated['quantity_g'],
            'position' => $maxPos + 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return back();
    }

    public function update(Request $request, int $meal_item): RedirectResponse
    {
        $validated = $request->validate([
            'quantity_g' => ['required', 'numeric', 'min:0.001'],
        ]);

        $userId = $request->user()->id;

        $item = DB::table('nutrition_meal_template_items as i')
            ->join('nutrition_meal_templates as m', 'm.id', '=', 'i.meal_template_id')
            ->where('i.id', $meal_item)
            ->where('m.user_id', $userId)
            ->first(['i.id']);

        if (! $item) {
            abort(404);
        }

        DB::table('nutrition_meal_template_items')
            ->where('id', $meal_item)
            ->update([
                'quantity_g' => $validated['quantity_g'],
                'updated_at' => now(),
            ]);

        return back();
    }

    public function destroy(Request $request, int $meal_item): RedirectResponse
    {
        $userId = $request->user()->id;

        $item = DB::table('nutrition_meal_template_items as i')
            ->join('nutrition_meal_templates as m', 'm.id', '=', 'i.meal_template_id')
            ->where('i.id', $meal_item)
            ->where('m.user_id', $userId)
            ->first(['i.id']);

        if (! $item) {
            abort(404);
        }

        DB::table('nutrition_meal_template_items')->where('id', $meal_item)->delete();

        return back();
    }

    public function reorder(Request $request, int $meal_template): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer'],
        ]);

        $userId = $request->user()->id;

        $meal = DB::table('nutrition_meal_templates')
            ->where('id', $meal_template)
            ->where('user_id', $userId)
            ->first(['id']);

        if (! $meal) {
            abort(404);
        }

        $ids = array_values(array_unique(array_map('intval', $validated['ids'])));

        $allIds = DB::table('nutrition_meal_template_items')
            ->where('meal_template_id', $meal_template)
            ->pluck('id')
            ->map(fn ($v) => (int) $v)
            ->all();

        if (count($allIds) !== count($ids)) {
            abort(422);
        }

        $existingIds = DB::table('nutrition_meal_template_items')
            ->where('meal_template_id', $meal_template)
            ->whereIn('id', $ids)
            ->pluck('id')
            ->map(fn ($v) => (int) $v)
            ->all();

        sort($existingIds);
        $allIdsSorted = $allIds;
        sort($allIdsSorted);
        $idsSorted = $ids;
        sort($idsSorted);

        if ($existingIds !== $idsSorted || $allIdsSorted !== $idsSorted) {
            abort(422);
        }

        DB::transaction(function () use ($ids) {
            $pos = 1;
            foreach ($ids as $id) {
                DB::table('nutrition_meal_template_items')
                    ->where('id', $id)
                    ->update([
                        'position' => $pos,
                        'updated_at' => now(),
                    ]);
                $pos++;
            }
        });

        return back();
    }
}
