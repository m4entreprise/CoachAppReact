<?php

namespace App\Http\Controllers\Coach;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class NutritionDietTemplateSlotItemController extends Controller
{
    public function store(Request $request, int $diet_slot): RedirectResponse
    {
        $userId = $request->user()->id;

        $validated = $request->validate([
            'source_type' => ['required', 'in:catalog,custom'],
            'alim_code' => [
                'nullable',
                'integer',
                'required_if:source_type,catalog',
                Rule::exists('nutrition_foods', 'alim_code'),
            ],
            'custom_food_id' => [
                'nullable',
                'integer',
                'required_if:source_type,custom',
                Rule::exists('nutrition_custom_foods', 'id')->where(fn ($q) => $q->where('user_id', $userId)),
            ],
            'quantity_g' => ['required', 'numeric', 'min:0.001'],
        ]);

        $slot = DB::table('nutrition_diet_template_slots as s')
            ->join('nutrition_diet_templates as d', 'd.id', '=', 's.diet_template_id')
            ->where('s.id', $diet_slot)
            ->where('d.user_id', $userId)
            ->first(['s.id']);

        if (! $slot) {
            abort(404);
        }

        $maxPos = (int) (DB::table('nutrition_diet_template_slot_items')->where('diet_slot_id', $diet_slot)->max('position') ?? 0);

        DB::table('nutrition_diet_template_slot_items')->insert([
            'diet_slot_id' => $diet_slot,
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

    public function update(Request $request, int $diet_slot_item): RedirectResponse
    {
        $validated = $request->validate([
            'quantity_g' => ['required', 'numeric', 'min:0.001'],
        ]);

        $userId = $request->user()->id;

        $item = DB::table('nutrition_diet_template_slot_items as i')
            ->join('nutrition_diet_template_slots as s', 's.id', '=', 'i.diet_slot_id')
            ->join('nutrition_diet_templates as d', 'd.id', '=', 's.diet_template_id')
            ->where('i.id', $diet_slot_item)
            ->where('d.user_id', $userId)
            ->first(['i.id']);

        if (! $item) {
            abort(404);
        }

        DB::table('nutrition_diet_template_slot_items')
            ->where('id', $diet_slot_item)
            ->update([
                'quantity_g' => $validated['quantity_g'],
                'updated_at' => now(),
            ]);

        return back();
    }

    public function destroy(Request $request, int $diet_slot_item): RedirectResponse
    {
        $userId = $request->user()->id;

        $item = DB::table('nutrition_diet_template_slot_items as i')
            ->join('nutrition_diet_template_slots as s', 's.id', '=', 'i.diet_slot_id')
            ->join('nutrition_diet_templates as d', 'd.id', '=', 's.diet_template_id')
            ->where('i.id', $diet_slot_item)
            ->where('d.user_id', $userId)
            ->first(['i.id']);

        if (! $item) {
            abort(404);
        }

        DB::table('nutrition_diet_template_slot_items')->where('id', $diet_slot_item)->delete();

        return back();
    }

    public function reorder(Request $request, int $diet_slot): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer'],
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

        $ids = array_values(array_unique(array_map('intval', $validated['ids'])));

        $allIds = DB::table('nutrition_diet_template_slot_items')
            ->where('diet_slot_id', $diet_slot)
            ->pluck('id')
            ->map(fn ($v) => (int) $v)
            ->all();

        if (count($allIds) !== count($ids)) {
            abort(422);
        }

        $existingIds = DB::table('nutrition_diet_template_slot_items')
            ->where('diet_slot_id', $diet_slot)
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
                DB::table('nutrition_diet_template_slot_items')
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

    public function importMeal(Request $request, int $diet_slot): RedirectResponse
    {
        $validated = $request->validate([
            'meal_template_id' => ['required', 'integer'],
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

        $meal = DB::table('nutrition_meal_templates')
            ->where('id', $validated['meal_template_id'])
            ->where('user_id', $userId)
            ->first(['id']);

        if (! $meal) {
            abort(404);
        }

        $items = DB::table('nutrition_meal_template_items')
            ->where('meal_template_id', $meal->id)
            ->orderBy('position')
            ->get([
                'source_type',
                'alim_code',
                'custom_food_id',
                'quantity_g',
            ]);

        DB::transaction(function () use ($diet_slot, $items) {
            DB::table('nutrition_diet_template_slot_items')->where('diet_slot_id', $diet_slot)->delete();

            $rows = [];
            $pos = 1;
            foreach ($items as $i) {
                $rows[] = [
                    'diet_slot_id' => $diet_slot,
                    'source_type' => $i->source_type,
                    'alim_code' => $i->alim_code,
                    'custom_food_id' => $i->custom_food_id,
                    'quantity_g' => $i->quantity_g,
                    'position' => $pos,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
                $pos++;
            }

            if (count($rows) > 0) {
                DB::table('nutrition_diet_template_slot_items')->insert($rows);
            }
        });

        return back();
    }
}
