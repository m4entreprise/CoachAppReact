<?php

namespace App\Http\Controllers\Coach;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NutritionDietTemplateSlotController extends Controller
{
    public function store(Request $request, int $diet_template): RedirectResponse
    {
        $validated = $request->validate([
            'label' => ['required', 'string', 'max:255'],
            'meal_template_id' => ['nullable', 'integer'],
            'multiplier' => ['nullable', 'numeric', 'min:0.001'],
        ]);

        $userId = $request->user()->id;

        $diet = DB::table('nutrition_diet_templates')
            ->where('id', $diet_template)
            ->where('user_id', $userId)
            ->first(['id']);

        if (! $diet) {
            abort(404);
        }

        $mealTemplateId = $validated['meal_template_id'] ?? null;
        if ($mealTemplateId !== null) {
            $exists = DB::table('nutrition_meal_templates')
                ->where('id', $mealTemplateId)
                ->where('user_id', $userId)
                ->exists();

            if (! $exists) {
                abort(404);
            }
        }

        $maxPos = (int) (DB::table('nutrition_diet_template_slots')->where('diet_template_id', $diet_template)->max('position') ?? 0);

        DB::table('nutrition_diet_template_slots')->insert([
            'diet_template_id' => $diet_template,
            'label' => $validated['label'],
            'position' => $maxPos + 1,
            'meal_template_id' => $mealTemplateId,
            'multiplier' => $validated['multiplier'] ?? 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return back();
    }

    public function update(Request $request, int $diet_slot): RedirectResponse
    {
        $validated = $request->validate([
            'label' => ['required', 'string', 'max:255'],
            'meal_template_id' => ['nullable', 'integer'],
            'multiplier' => ['nullable', 'numeric', 'min:0.001'],
        ]);

        $userId = $request->user()->id;

        $slot = DB::table('nutrition_diet_template_slots as s')
            ->join('nutrition_diet_templates as d', 'd.id', '=', 's.diet_template_id')
            ->where('s.id', $diet_slot)
            ->where('d.user_id', $userId)
            ->first(['s.id']);

        if (! $slot) {
            abort(404);
        }

        $mealTemplateId = $validated['meal_template_id'] ?? null;
        if ($mealTemplateId !== null) {
            $exists = DB::table('nutrition_meal_templates')
                ->where('id', $mealTemplateId)
                ->where('user_id', $userId)
                ->exists();

            if (! $exists) {
                abort(404);
            }
        }

        DB::table('nutrition_diet_template_slots')
            ->where('id', $diet_slot)
            ->update([
                'label' => $validated['label'],
                'meal_template_id' => $mealTemplateId,
                'multiplier' => $validated['multiplier'] ?? 1,
                'updated_at' => now(),
            ]);

        return back();
    }

    public function destroy(Request $request, int $diet_slot): RedirectResponse
    {
        $userId = $request->user()->id;

        $slot = DB::table('nutrition_diet_template_slots as s')
            ->join('nutrition_diet_templates as d', 'd.id', '=', 's.diet_template_id')
            ->where('s.id', $diet_slot)
            ->where('d.user_id', $userId)
            ->first(['s.id']);

        if (! $slot) {
            abort(404);
        }

        DB::table('nutrition_diet_template_slots')->where('id', $diet_slot)->delete();

        return back();
    }

    public function reorder(Request $request, int $diet_template): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer'],
        ]);

        $userId = $request->user()->id;

        $diet = DB::table('nutrition_diet_templates')
            ->where('id', $diet_template)
            ->where('user_id', $userId)
            ->first(['id']);

        if (! $diet) {
            abort(404);
        }

        $ids = array_values(array_unique(array_map('intval', $validated['ids'])));

        $allIds = DB::table('nutrition_diet_template_slots')
            ->where('diet_template_id', $diet_template)
            ->pluck('id')
            ->map(fn ($v) => (int) $v)
            ->all();

        if (count($allIds) !== count($ids)) {
            abort(422);
        }

        $existingIds = DB::table('nutrition_diet_template_slots')
            ->where('diet_template_id', $diet_template)
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
                DB::table('nutrition_diet_template_slots')
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
