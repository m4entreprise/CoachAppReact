<?php

namespace App\Http\Controllers\Coach;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NutritionMealTemplateController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'parent_meal_id' => ['nullable', 'integer'],
        ]);

        $user = $request->user();

        $parentMealId = $validated['parent_meal_id'] ?? null;
        if ($parentMealId !== null) {
            $exists = DB::table('nutrition_meal_templates')
                ->where('id', $parentMealId)
                ->where('user_id', $user->id)
                ->whereNull('parent_meal_id')
                ->exists();

            if (! $exists) {
                abort(404);
            }
        }

        DB::table('nutrition_meal_templates')->insert([
            'user_id' => $user->id,
            'parent_meal_id' => $parentMealId,
            'name' => $validated['name'],
            'notes' => $validated['notes'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return back();
    }

    public function update(Request $request, int $meal_template): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        $updated = DB::table('nutrition_meal_templates')
            ->where('id', $meal_template)
            ->where('user_id', $request->user()->id)
            ->update([
                'name' => $validated['name'],
                'notes' => $validated['notes'] ?? null,
                'updated_at' => now(),
            ]);

        if (! $updated) {
            abort(404);
        }

        return back();
    }

    public function destroy(Request $request, int $meal_template): RedirectResponse
    {
        $deleted = DB::table('nutrition_meal_templates')
            ->where('id', $meal_template)
            ->where('user_id', $request->user()->id)
            ->delete();

        if (! $deleted) {
            abort(404);
        }

        return back();
    }

    public function duplicateAsSubstitute(Request $request, int $meal_template): RedirectResponse
    {
        $user = $request->user();

        $parent = DB::table('nutrition_meal_templates')
            ->where('id', $meal_template)
            ->where('user_id', $user->id)
            ->whereNull('parent_meal_id')
            ->first(['id', 'name', 'notes']);

        if (! $parent) {
            abort(404);
        }

        DB::transaction(function () use ($parent, $user) {
            $newId = DB::table('nutrition_meal_templates')->insertGetId([
                'user_id' => $user->id,
                'parent_meal_id' => $parent->id,
                'name' => $parent->name.' (substitut)',
                'notes' => $parent->notes,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $items = DB::table('nutrition_meal_template_items')
                ->where('meal_template_id', $parent->id)
                ->orderBy('position')
                ->get([
                    'source_type',
                    'alim_code',
                    'custom_food_id',
                    'quantity_g',
                    'position',
                ]);

            if ($items->count() === 0) {
                return;
            }

            $rows = [];
            foreach ($items as $i) {
                $rows[] = [
                    'meal_template_id' => $newId,
                    'source_type' => $i->source_type,
                    'alim_code' => $i->alim_code,
                    'custom_food_id' => $i->custom_food_id,
                    'quantity_g' => $i->quantity_g,
                    'position' => $i->position,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            DB::table('nutrition_meal_template_items')->insert($rows);
        });

        return back();
    }
}
