export type SupplementTiming = 'Matin' | 'Soir' | 'Pre-Workout';

export interface Supplement {
  id: string;
  nom: string;
  dosage: string;
  description: string;
  timing: SupplementTiming;
  isTaken: boolean;
}

export type WorkoutStatus = 'Todo' | 'Done';

export interface WorkoutSession {
  id: string;
  titre: string;
  duree: number;
  image_url: string;
  status: WorkoutStatus;
}

export interface WorkoutSetPlan {
  id: string;
  reps_cibles: number;
}

export interface WorkoutExercise {
  id: string;
  nom: string;
  repos_secondes: number;
  media_url: string;
  series: WorkoutSetPlan[];
}

export interface WorkoutDetailedSession {
  id: string;
  titre: string;
  exercices: WorkoutExercise[];
}

export type Weekday =
  | 'Lundi'
  | 'Mardi'
  | 'Mercredi'
  | 'Jeudi'
  | 'Vendredi'
  | 'Samedi'
  | 'Dimanche';

export type ProgramDayStatus = 'Planned' | 'Rest' | 'Done';

export interface WeeklyProgramDay {
  id: string;
  jour: Weekday;
  status: ProgramDayStatus;
  titre: string;
  focus: string;
  duree?: number;
  image_url?: string;
  detailed_session_id?: string;
}

export interface WeeklyProgram {
  semaine_label: string;
  jours: WeeklyProgramDay[];
}

export interface UserDashboard {
  nom_eleve: string;
  streak_jours: number;
  poids_actuel: number;
}

export const MOCK_DATA: {
  dashboard: UserDashboard;
  workoutSession: WorkoutSession;
  workoutDetailedSession: WorkoutDetailedSession;
  workoutDetailedSessions: WorkoutDetailedSession[];
  weeklyProgram: WeeklyProgram;
  supplements: Supplement[];
} = {
  dashboard: {
    nom_eleve: 'Jean',
    streak_jours: 3,
    poids_actuel: 78.4,
  },
  workoutSession: {
    id: 'ws_1',
    titre: 'Leg Day',
    duree: 65,
    image_url:
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=60',
    status: 'Todo',
  },
  workoutDetailedSession: {
    id: 'wds_1',
    titre: 'Leg Day',
    exercices: [
      {
        id: 'ex_1',
        nom: 'Squat',
        repos_secondes: 90,
        media_url: 'https://www.youtube.com/watch?v=SW_C1A-rejs',
        series: [
          { id: 'ex_1_set_1', reps_cibles: 8 },
          { id: 'ex_1_set_2', reps_cibles: 8 },
          { id: 'ex_1_set_3', reps_cibles: 8 },
          { id: 'ex_1_set_4', reps_cibles: 8 },
        ],
      },
      {
        id: 'ex_2',
        nom: 'Leg Extension',
        repos_secondes: 75,
        media_url: 'https://www.youtube.com/watch?v=YyvSfVjQeL0',
        series: [
          { id: 'ex_2_set_1', reps_cibles: 12 },
          { id: 'ex_2_set_2', reps_cibles: 12 },
          { id: 'ex_2_set_3', reps_cibles: 12 },
        ],
      },
    ],
  },
  workoutDetailedSessions: [
    {
      id: 'wds_leg',
      titre: 'Leg Day',
      exercices: [
        {
          id: 'ex_leg_1',
          nom: 'Squat',
          repos_secondes: 90,
          media_url: 'https://www.youtube.com/watch?v=SW_C1A-rejs',
          series: [
            { id: 'ex_leg_1_set_1', reps_cibles: 8 },
            { id: 'ex_leg_1_set_2', reps_cibles: 8 },
            { id: 'ex_leg_1_set_3', reps_cibles: 8 },
            { id: 'ex_leg_1_set_4', reps_cibles: 8 },
          ],
        },
        {
          id: 'ex_leg_2',
          nom: 'Leg Extension',
          repos_secondes: 75,
          media_url: 'https://www.youtube.com/watch?v=YyvSfVjQeL0',
          series: [
            { id: 'ex_leg_2_set_1', reps_cibles: 12 },
            { id: 'ex_leg_2_set_2', reps_cibles: 12 },
            { id: 'ex_leg_2_set_3', reps_cibles: 12 },
          ],
        },
      ],
    },
    {
      id: 'wds_upper_strength',
      titre: 'Upper Strength',
      exercices: [
        {
          id: 'ex_us_1',
          nom: 'Bench Press',
          repos_secondes: 120,
          media_url: 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
          series: [
            { id: 'ex_us_1_set_1', reps_cibles: 6 },
            { id: 'ex_us_1_set_2', reps_cibles: 6 },
            { id: 'ex_us_1_set_3', reps_cibles: 6 },
          ],
        },
        {
          id: 'ex_us_2',
          nom: 'Row (Machine)',
          repos_secondes: 90,
          media_url: 'https://www.youtube.com/watch?v=GZbfZ033f74',
          series: [
            { id: 'ex_us_2_set_1', reps_cibles: 10 },
            { id: 'ex_us_2_set_2', reps_cibles: 10 },
            { id: 'ex_us_2_set_3', reps_cibles: 10 },
          ],
        },
      ],
    },
    {
      id: 'wds_pull_hypertrophy',
      titre: 'Pull Hypertrophy',
      exercices: [
        {
          id: 'ex_ph_1',
          nom: 'Lat Pulldown',
          repos_secondes: 75,
          media_url: 'https://www.youtube.com/watch?v=CAwf7n6Luuc',
          series: [
            { id: 'ex_ph_1_set_1', reps_cibles: 12 },
            { id: 'ex_ph_1_set_2', reps_cibles: 12 },
            { id: 'ex_ph_1_set_3', reps_cibles: 12 },
          ],
        },
        {
          id: 'ex_ph_2',
          nom: 'Biceps Curl (DB)',
          repos_secondes: 60,
          media_url: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo',
          series: [
            { id: 'ex_ph_2_set_1', reps_cibles: 12 },
            { id: 'ex_ph_2_set_2', reps_cibles: 12 },
            { id: 'ex_ph_2_set_3', reps_cibles: 12 },
          ],
        },
      ],
    },
    {
      id: 'wds_push_hypertrophy',
      titre: 'Push Hypertrophy',
      exercices: [
        {
          id: 'ex_pu_1',
          nom: 'Incline DB Press',
          repos_secondes: 90,
          media_url: 'https://www.youtube.com/watch?v=8iPEnn-ltC8',
          series: [
            { id: 'ex_pu_1_set_1', reps_cibles: 10 },
            { id: 'ex_pu_1_set_2', reps_cibles: 10 },
            { id: 'ex_pu_1_set_3', reps_cibles: 10 },
          ],
        },
        {
          id: 'ex_pu_2',
          nom: 'Triceps Rope Pushdown',
          repos_secondes: 60,
          media_url: 'https://www.youtube.com/watch?v=2-LAMcpzODU',
          series: [
            { id: 'ex_pu_2_set_1', reps_cibles: 12 },
            { id: 'ex_pu_2_set_2', reps_cibles: 12 },
            { id: 'ex_pu_2_set_3', reps_cibles: 12 },
          ],
        },
      ],
    },
    {
      id: 'wds_conditioning',
      titre: 'Conditioning',
      exercices: [
        {
          id: 'ex_co_1',
          nom: 'Bike (Zone 2)',
          repos_secondes: 60,
          media_url: 'https://www.youtube.com/watch?v=DX0j9Xw4p5s',
          series: [
            { id: 'ex_co_1_set_1', reps_cibles: 12 },
            { id: 'ex_co_1_set_2', reps_cibles: 12 },
          ],
        },
        {
          id: 'ex_co_2',
          nom: 'Plank',
          repos_secondes: 45,
          media_url: 'https://www.youtube.com/watch?v=pSHjTRCQxIw',
          series: [
            { id: 'ex_co_2_set_1', reps_cibles: 45 },
            { id: 'ex_co_2_set_2', reps_cibles: 45 },
            { id: 'ex_co_2_set_3', reps_cibles: 45 },
          ],
        },
      ],
    },
  ],
  weeklyProgram: {
    semaine_label: 'Semaine 1',
    jours: [
      {
        id: 'day_1',
        jour: 'Lundi',
        status: 'Done',
        titre: 'Upper Strength',
        focus: 'Pectoraux • Dos • Épaules',
        duree: 60,
        image_url:
          'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=60',
        detailed_session_id: 'wds_upper_strength',
      },
      {
        id: 'day_2',
        jour: 'Mardi',
        status: 'Planned',
        titre: 'Leg Day',
        focus: 'Quadriceps • Fessiers • Ischios',
        duree: 65,
        image_url:
          'https://images.unsplash.com/photo-1599058918144-1ffabb6ab9a0?auto=format&fit=crop&w=1200&q=60',
        detailed_session_id: 'wds_leg',
      },
      {
        id: 'day_3',
        jour: 'Mercredi',
        status: 'Rest',
        titre: 'Récupération',
        focus: 'Mobilité • Marche • Hydratation',
      },
      {
        id: 'day_4',
        jour: 'Jeudi',
        status: 'Planned',
        titre: 'Pull Hypertrophy',
        focus: 'Dos • Biceps • Gainage',
        duree: 55,
        image_url:
          'https://images.unsplash.com/photo-1517964603305-7211ab29d5f8?auto=format&fit=crop&w=1200&q=60',
        detailed_session_id: 'wds_pull_hypertrophy',
      },
      {
        id: 'day_5',
        jour: 'Vendredi',
        status: 'Planned',
        titre: 'Push Hypertrophy',
        focus: 'Pecs • Triceps • Épaules',
        duree: 50,
        image_url:
          'https://images.unsplash.com/photo-1599058917212-d750089bc07d?auto=format&fit=crop&w=1200&q=60',
        detailed_session_id: 'wds_push_hypertrophy',
      },
      {
        id: 'day_6',
        jour: 'Samedi',
        status: 'Planned',
        titre: 'Conditioning',
        focus: 'Cardio • Abdos • Zone 2',
        duree: 40,
        image_url:
          'https://images.unsplash.com/photo-1526401485004-2fa806b5e1f5?auto=format&fit=crop&w=1200&q=60',
        detailed_session_id: 'wds_conditioning',
      },
      {
        id: 'day_7',
        jour: 'Dimanche',
        status: 'Rest',
        titre: 'Repos complet',
        focus: 'Sommeil • Étirements légers',
      },
    ],
  },
  supplements: [
    {
      id: 'supp_1',
      nom: 'Whey',
      dosage: '30g',
      description:
        "Apport protéique rapide pour soutenir la récupération et atteindre ton quota journalier. À prendre avec un repas ou après l'entraînement si besoin.",
      timing: 'Matin',
      isTaken: false,
    },
    {
      id: 'supp_2',
      nom: 'Créatine',
      dosage: '5g',
      description:
        "Améliore la performance sur les efforts courts et répétés (force/volume). Prise quotidienne, hydratation recommandée.",
      timing: 'Pre-Workout',
      isTaken: false,
    },
    {
      id: 'supp_3',
      nom: 'Magnésium',
      dosage: '300mg',
      description:
        "Soutient le système nerveux et la récupération. Peut aider à limiter les crampes et améliorer la qualité du sommeil.",
      timing: 'Soir',
      isTaken: false,
    },
  ],
};
