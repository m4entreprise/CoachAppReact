<?php

namespace App\Http\Controllers\Coach;

use App\Http\Controllers\Controller;
use App\Models\User;
use Inertia\Inertia;

class StudentsController extends Controller
{
    public function __invoke()
    {
        $students = User::query()
            ->where('role', 'student')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role']);

        return Inertia::render('Coach/Clients', [
            'students' => $students,
        ]);
    }
}
