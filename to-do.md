# To-Do — MVP Local (Élève only)

Objectif : livrer une application **mobile-first**, utilisable **hors-ligne**, avec un **frontend complet côté élève** (sans backend coach pour le moment).

---

## 0) Décisions (à trancher maintenant)
- [ ] **Scope MVP élève** : l’élève suit un programme *déjà fourni localement* (mock/seed), et log ses données.
- [ ] **Source of truth** : tout est **local** (AsyncStorage + fichiers + éventuellement SQLite plus tard).
- [ ] **Sync plus tard** : toutes les données doivent être modélisées de façon à pouvoir être synchronisées (ids stables, dates ISO, structure “entries”).

---

## 1) Fondations app (structure + conventions)
- [ ] **Organisation des données locales**
  - [ ] Centraliser les clés de stockage (ex: `lib/storageKeys.ts`).
  - [ ] Standardiser les types (ex: `lib/types.ts` ou par domaine).
  - [ ] Choisir un format d’ID (déjà: `${Date.now()}_${random}`) et s’y tenir.
- [ ] **Ergonomie navigation**
  - [ ] Vérifier la cohérence des modals Expo Router (header hidden, SafeArea, bouton fermer).
  - [ ] Ajouter une convention : tous les écrans “édition” en modal.
- [ ] **Gestion d’erreurs UX**
  - [ ] Toast/Snackbar global pour erreurs (permission refusée, validation, etc.).
  - [ ] États loading/empty systématiques sur chaque écran.

---

## 2) Profil & Suivi (déjà en partie) — compléter MVP
### 2.1 Infos perso
- [x] Édition des infos perso (modal).
- [x] Photo de profil (picker + persistance).
- [ ] Ajouter champs utiles MVP (optionnel):
  - [ ] date de naissance / âge
  - [ ] sexe
  - [ ] niveau
  - [ ] objectif principal (liste)

### 2.2 Mesures & poids
- [x] Historique poids + mensurations.
- [x] Graph poids.
- [ ] Améliorations MVP:
  - [ ] Édition des mensurations “par défaut” (quelles mesures actives) (optionnel).
  - [ ] Export local (CSV/JSON) (optionnel).

### 2.3 Évolutions photo (face/profil/dos)
- [x] Ajout/édition/suppression d’une évolution photo.
- [ ] Vue dédiée “Galerie” : afficher l’historique complet (pas seulement 3 dernières).
- [ ] Mode comparaison (V1.5): avant/après côte-à-côte.
- [ ] Ghost overlay (V1.5): aide à reprendre la même pose.

---

## 3) Entraînement (élève)
### 3.1 Programme et navigation
- [x] Écran programme / jours / séance (présent).
- [ ] Clarifier le modèle local:
  - [ ] Définir un “cycle” local (semaine, jours, séances) dans `constants/` ou `lib/seed/`.
  - [ ] Ajouter un système de statut local: `Planned / Done / Rest`.

### 3.2 Lecture des exercices
- [ ] Bibliothèque d’exercices (MVP local)
  - [ ] Base locale minimaliste (50–200 exercices) : nom, muscles, équipement, média.
  - [ ] Recherche + filtres simples.
- [ ] Média exercice
  - [ ] Démo vidéo locale / distante stable.
  - [ ] Cache local des médias (optionnel MVP).

### 3.3 Logging pendant la séance
- [x] Saisie poids/reps + timer.
- [x] Résumé fin de séance.
- [ ] Compléments MVP:
  - [ ] Pré-remplissage avec dernière perf (déjà partiel via `setState`): rendre visible “dernier poids/reps”.
  - [ ] Ajouter RPE/RIR par série (optionnel MVP).
  - [ ] Ajout de notes par exercice/séance.

### 3.4 Historique entraînement
- [ ] Écran “Historique” des séances terminées.
  - [ ] Détail d’une séance passée.
  - [ ] KPI: volume, durée, séries.

---

## 4) Suppléments (élève)
Actuel : affichage mock en checklist.
- [ ] Stockage local “protocole suppléments” (remplacer mock)
  - [ ] CRUD local : suppléments, dosage, timing (matin/pre-workout/soir), fréquence.
- [ ] Checklist quotidienne
  - [ ] Possibilité de cocher “pris” + timestamp.
  - [ ] Historique “compliance” (au moins par jour).
- [ ] Notifications (V1.5)
  - [ ] Rappel matin/soir.
  - [ ] Rappel post-workout contextuel.

---

## 5) Nutrition (élève) — MVP local
Comme tu veux un MVP local, éviter l’API MyFitnessPal pour l’instant.

- [ ] Écran “Nutrition” / “Journal”
  - [ ] Journal photo (repas) : photo + note + tags (petit dej / dej / diner / snack).
  - [ ] Option macros manuels (calories/prot/gluc/lip) (optionnel).
- [ ] Historique et feedback
  - [ ] Timeline des repas.
  - [ ] Stat du jour (nb de repas / macros si activé).

---

## 6) Bilans / Check-ins (élève) — MVP local
- [ ] Écran “Check-in” hebdo
  - [ ] Formulaire fixe MVP (sans builder coach):
    - [ ] sommeil (1–10)
    - [ ] stress (1–10)
    - [ ] énergie (1–10)
    - [ ] adhérence nutrition (1–10)
    - [ ] douleurs (texte)
    - [ ] photos (optionnel, peut réutiliser évolutions)
  - [ ] Enregistrement local + historique des check-ins.

(V1.5)
- [ ] Logique conditionnelle.
- [ ] Scheduling automatique (autoflow).

---

## 7) Offline-first (MVP local)
- [x] Données profil/mesures/photos persistées localement.
- [ ] Sécuriser la persistance “app-wide”
  - [ ] Migrer les données “workout logs” vers un stockage local persistant (si pas déjà).
  - [ ] Gestion des versions (ex: `*_v1`, `*_v2`) + migrations légères.
- [ ] Gestion stockage média
  - [x] Copier images sélectionnées dans le dossier app.
  - [ ] Nettoyage : quand on supprime une entrée, supprimer les fichiers associés (déjà fait pour progress, à vérifier partout).

---

## 8) UX / UI polishing (MVP)
- [ ] Cohérence UI (Paper)
  - [ ] Cartes, paddings, titres homogènes.
  - [ ] Boutons primaires cohérents.
- [ ] États vides élégants
  - [ ] Profil / progress photos / nutrition journal / check-ins.
- [ ] Accessibilité
  - [ ] textes, contrastes, tailles.

---

## 9) QA / Qualité / Release (MVP)
- [ ] Lint OK (actuellement ✅, à maintenir).
- [ ] Tests manuels “parcours élève”
  - [ ] onboarding local (premier lancement)
  - [ ] faire une séance complète + résumé + historique
  - [ ] ajouter poids + graph
  - [ ] ajouter photos progrès + éditer + supprimer
  - [ ] journal nutrition photo
  - [ ] check-in hebdo
- [ ] Gestion permissions
  - [ ] galerie refusée → UX correcte
  - [ ] caméra (si ajoutée) refusée → UX correcte
- [ ] Build device
  - [ ] Android
  - [ ] iOS (si prévu)

---

# Roadmap (Now / Next / Later)

## NOW (priorité MVP)
- [ ] Nutrition journal photo
- [ ] Check-ins hebdo (form fixe)
- [ ] Suppléments persistés + checklist + compliance
- [ ] Historique entraînement
- [ ] Galerie “évolutions photo” complète

## NEXT (V1.5)
- [ ] Offline workout média cache + robustesse
- [ ] Notifications suppléments
- [ ] Comparaison photo + ghost overlay
- [ ] RPE/RIR

## LATER (post-MVP / backend coach)
- [ ] Auth + rôles coach/élève
- [ ] CRM coach + onboarding
- [ ] Builder coach (programmes, suppléments, check-ins)
- [ ] Chat multimédia
- [ ] Paiements Stripe
