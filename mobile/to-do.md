# To-Do — MVP Local (Élève only)

Objectif : livrer une application **mobile-first**, utilisable **hors-ligne**, avec un **frontend complet côté élève** (sans backend coach pour le moment).

Choix (ordre de réalisation) : commencer par **Historique entraînement + persistance des workout logs**.

Pourquoi : c’est le cœur de la valeur côté élève (faire une séance -> retrouver ses perfs), et ça pose les bases “offline-first” pour tout le reste.

---

## 0) Décisions (à trancher maintenant)
- [x] **Scope MVP élève** : l’élève suit un programme *déjà fourni localement* (mock/seed), et log ses données.
- [x] **Source of truth** : tout est **local** (AsyncStorage + fichiers + éventuellement SQLite plus tard).
- [x] **Sync plus tard** : toutes les données doivent être modélisées de façon à pouvoir être synchronisées (ids stables, dates ISO, structure “entries”).

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
- [x] Vue dédiée “Galerie” : afficher l’historique complet (pas seulement 3 dernières).
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
- [x] Écran “Historique” des séances terminées.
  - [x] Détail d’une séance passée.
  - [x] KPI: volume, durée, séries.

---

## 4) Suppléments (élève)
Actuel : affichage mock en checklist.
- [x] Stockage local “protocole suppléments” (remplacer mock)
  - [x] CRUD local : suppléments, dosage, timing (matin/pre-workout/soir), fréquence.
- [x] Checklist quotidienne
  - [x] Possibilité de cocher “pris” + timestamp.
  - [x] Historique “compliance” (au moins par jour).
- [ ] Notifications (V1.5)
  - [ ] Rappel matin/soir.
  - [ ] Rappel post-workout contextuel.

---

## 5) Nutrition (élève) — MVP local
Comme tu veux un MVP local, éviter l’API MyFitnessPal pour l’instant.

- [x] Écran “Nutrition” / “Journal”
  - [x] Journal photo (repas) : photo + note + tags (petit dej / dej / diner / snack).
  - [ ] Option macros manuels (calories/prot/gluc/lip) (optionnel).
- [x] Historique et feedback
  - [x] Timeline des repas.
  - [x] Stat du jour (nb de repas / macros si activé).

---

## 6) Bilans / Check-ins (élève) — MVP local
- [x] Écran “Check-in” hebdo
  - [x] Formulaire fixe MVP (sans builder coach):
    - [x] sommeil (1–10)
    - [x] stress (1–10)
    - [x] énergie (1–10)
    - [x] adhérence nutrition (1–10)
    - [x] douleurs (texte)
    - [ ] photos (optionnel, peut réutiliser évolutions)
  - [x] Enregistrement local + historique des check-ins.

(V1.5)
- [ ] Logique conditionnelle.
- [ ] Scheduling automatique (autoflow).

---

## 7) Offline-first (MVP local)
- [x] Données profil/mesures/photos persistées localement.
- [x] Sécuriser la persistance “app-wide”
  - [x] Migrer les données “workout logs” vers un stockage local persistant (si pas déjà).
  - [x] Gestion des versions (ex: `*_v1`, `*_v2`) + migrations légères.
- [x] Gestion stockage média
  - [x] Copier images sélectionnées dans le dossier app.
  - [x] Nettoyage : quand on supprime une entrée, supprimer les fichiers associés (déjà fait pour progress, à vérifier partout).

---

## 8) UX / UI polishing (MVP)
- [x] Cohérence UI (Paper)
  - [x] Cartes, paddings, titres homogènes.
  - [x] Boutons primaires cohérents.
- [x] États vides élégants
  - [x] Profil / progress photos / nutrition journal / check-ins.
- [ ] Accessibilité
  - [ ] textes, contrastes, tailles.

---

## 9) QA / Qualité / Release (MVP)
- [x] Lint OK (actuellement ✅, à maintenir).
- [ ] Tests manuels “parcours élève”
  - [ ] onboarding local (premier lancement)
  - [x] faire une séance complète + résumé + historique
  - [x] ajouter poids + graph
  - [x] ajouter photos progrès + éditer + supprimer
  - [x] journal nutrition photo
  - [x] check-in hebdo
- [ ] Gestion permissions
  - [x] galerie refusée → UX correcte
  - [ ] caméra (si ajoutée) refusée → UX correcte
- [ ] Build device
  - [ ] Android
  - [ ] iOS (si prévu)

---

# Roadmap (Now / Next / Later)

## NOW (priorité MVP)

- [x] Refonte "Aujourd'hui" (dashboard moderne, icônes Lucide, quick actions)
- [x] Améliorer "Training" (design moderne, icônes Lucide, hiérarchie + CTA)
- [ ] Améliorer "Nutrition" (design moderne, icônes Lucide, hiérarchie + CTA)
- [ ] Améliorer "Profil" (design moderne, quick actions, cartes premium)
- [ ] Supprimer "Explorer" de la navbar du bas

### Sprint 1 — Entraînement : historique + persistance (START HERE)
- [x] Persistance des “workout logs” (storage local, versionné)
- [x] Écran “Historique” des séances terminées
- [x] Détail d’une séance passée
- [x] KPI simples (volume/durée/séries)

**Definition of Done (Sprint 1)**
- [x] Je fais une séance -> je quitte l’app -> je reviens -> la séance est toujours dans l’historique.
- [x] Je peux ouvrir une séance passée et voir les charges/reps/notes.
- [x] Aucun écran vide “cassé” : empty state propre.

### Sprint 2 — Nutrition : journal photo
- [x] Écran “Nutrition / Journal”
- [x] Ajout d’un repas (photo + note + tags)
- [x] Timeline + stats du jour (minimales)

**Definition of Done (Sprint 2)**
- [x] J’ajoute 3 repas avec photos -> je relance l’app -> tout est conservé.
- [x] Permissions galerie refusées -> UX non bloquante.

### Sprint 3 — Suppléments : protocole + compliance
- [x] Remplacer `MOCK_DATA` par un protocole persisté localement
- [x] Checklist quotidienne + timestamp
- [x] Historique compliance (par jour)

**Definition of Done (Sprint 3)**
- [x] Je coche/décoche une prise -> c’est conservé.
- [x] Je change de jour (ou simulation) -> l’historique reste consultable.

### Sprint 4 — Check-ins : bilan hebdo (form fixe)
- [x] Écran check-in (sommeil/stress/énergie/adhérence/douleurs)
- [x] Enregistrement local + historique

**Definition of Done (Sprint 4)**
- [x] Je remplis 2 check-ins à des dates différentes -> historique lisible.

### Sprint 5 — Photos : galerie évolutions complète
- [x] Vue “Galerie” : historique complet (pas seulement 3 dernières)
- [x] Navigation vers édition depuis la galerie

**Definition of Done (Sprint 5)**
- [x] Je peux parcourir toutes mes entrées photo, éditer/supprimer sans fichiers orphelins visibles.

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
