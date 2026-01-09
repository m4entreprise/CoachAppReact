<?php

namespace App\Http\Controllers\Coach;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NutritionDietTemplateController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        DB::table('nutrition_diet_templates')->insert([
            'user_id' => $request->user()->id,
            'name' => $validated['name'],
            'notes' => $validated['notes'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return back();
    }

    public function update(Request $request, int $diet_template): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        $updated = DB::table('nutrition_diet_templates')
            ->where('id', $diet_template)
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

    public function destroy(Request $request, int $diet_template): RedirectResponse
    {
        $deleted = DB::table('nutrition_diet_templates')
            ->where('id', $diet_template)
            ->where('user_id', $request->user()->id)
            ->delete();

        if (! $deleted) {
            abort(404);
        }

        return back();
    }
}
