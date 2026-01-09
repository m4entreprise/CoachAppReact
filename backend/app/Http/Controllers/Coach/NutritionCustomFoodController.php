<?php

namespace App\Http\Controllers\Coach;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NutritionCustomFoodController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'kcal_100g' => ['nullable', 'numeric'],
            'protein_100g' => ['nullable', 'numeric'],
            'carbs_100g' => ['nullable', 'numeric'],
            'fat_100g' => ['nullable', 'numeric'],
        ]);

        $user = $request->user();

        DB::table('nutrition_custom_foods')->insert([
            'user_id' => $user->id,
            'name' => $validated['name'],
            'kcal_100g' => $validated['kcal_100g'] ?? null,
            'protein_100g' => $validated['protein_100g'] ?? null,
            'carbs_100g' => $validated['carbs_100g'] ?? null,
            'fat_100g' => $validated['fat_100g'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return back();
    }
}
