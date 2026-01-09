<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Coach\DashboardController as CoachDashboardController;
use App\Http\Controllers\Coach\LibraryController as CoachLibraryController;
use App\Http\Controllers\Coach\NutritionCustomFoodController as CoachNutritionCustomFoodController;
use App\Http\Controllers\Coach\NutritionFoodController as CoachNutritionFoodController;
use App\Http\Controllers\Coach\StudentsController as CoachStudentsController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware(['auth', 'coach'])->prefix('coach')->name('coach.')->group(function () {
    Route::get('/', CoachDashboardController::class)->name('dashboard');

    Route::get('/nutrition/foods/{alim_code}', CoachNutritionFoodController::class)->name('nutrition.food');
    Route::post('/nutrition/custom-foods', [CoachNutritionCustomFoodController::class, 'store'])->name('nutrition.custom-foods.store');
    Route::get('/settings', function () {
        return redirect()->route('profile.edit');
    })->name('settings');

    Route::get('/library', CoachLibraryController::class)->name('library');

    Route::get('/forms', function () {
        return Inertia::render('Coach/Forms');
    })->name('forms');

    Route::get('/finances', function () {
        return Inertia::render('Coach/Finances');
    })->name('finances');

    Route::get('/notifications', function () {
        return Inertia::render('Coach/Notifications');
    })->name('notifications');

    Route::get('/conversations', function () {
        return Inertia::render('Coach/Conversations');
    })->name('conversations');

    Route::get('/website', function () {
        return Inertia::render('Coach/Website');
    })->name('website');

    Route::get('/branding', function () {
        return Inertia::render('Coach/Branding');
    })->name('branding');
    Route::get('/clients', CoachStudentsController::class)->name('clients');

    Route::get('/checkins', function () {
        return Inertia::render('Coach/Checkins');
    })->name('checkins');

    Route::get('/community', function () {
        return Inertia::render('Coach/Community');
    })->name('community');

    Route::get('/plans', function () {
        return Inertia::render('Coach/Plans');
    })->name('plans');

    Route::get('/calendar', function () {
        return Inertia::render('Coach/Calendar');
    })->name('calendar');

    Route::get('/documents', function () {
        return Inertia::render('Coach/Documents');
    })->name('documents');

    Route::get('/notes', function () {
        return Inertia::render('Coach/Notes');
    })->name('notes');

    Route::get('/students', function () {
        return redirect()->route('coach.clients');
    })->name('students');
});

require __DIR__.'/auth.php';
