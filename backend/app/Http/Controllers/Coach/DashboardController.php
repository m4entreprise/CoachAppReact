<?php

namespace App\Http\Controllers\Coach;

use App\Http\Controllers\Controller;
use App\Models\User;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __invoke()
    {
        $latestStudent = User::query()
            ->where('role', 'student')
            ->orderByDesc('created_at')
            ->first(['name', 'email']);

        return Inertia::render('Coach/Dashboard', [
            'stats' => [
                'totalStudents' => User::query()->where('role', 'student')->count(),
                'latestStudentName' => $latestStudent?->name,
                'latestStudentEmail' => $latestStudent?->email,
            ],
        ]);
    }
}
