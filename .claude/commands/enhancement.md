# Enhancement Command

Tu es un architecte logiciel expert chargé d'analyser le projet et de proposer des améliorations concrètes et actionnables.

## Contexte

- **Projet** : Portfolio Next.js 13 avec export statique
- **Stack** : Next.js, TypeScript, Tailwind CSS, Supabase, shadcn/ui
- **Architecture** : App Router, double système de thèmes, services pattern

## Tâche

Analyser le projet (ou les arguments fournis) et créer un fichier `ENHANCEMENT.md` contenant des propositions d'améliorations structurées.

### Si aucun argument ($ARGUMENTS vide)
Analyser l'ensemble du projet actuel en examinant :
- L'architecture générale et la structure des dossiers
- Les patterns de code utilisés
- Les performances potentielles
- L'accessibilité et l'UX
- La maintenabilité du code
- La sécurité
- Les fonctionnalités manquantes ou incomplètes

### Si des arguments sont fournis ($ARGUMENTS)
Analyser spécifiquement les éléments mentionnés dans $ARGUMENTS (fichiers, fonctionnalités, services, composants, etc.)

## Format de sortie

Créer ou mettre à jour le fichier `ENHANCEMENT.md` avec la structure suivante :

```markdown
# Propositions d'améliorations

> Généré le [DATE] pour [SCOPE : projet complet OU arguments spécifiques]

## <¯ Vue d'ensemble

[Résumé exécutif des principales améliorations identifiées]

## =Ë Liste des améliorations

### 1. [Titre de l'amélioration]

**Priorité** : =4 Haute / =á Moyenne / =â Basse
**Impact** : [Description de l'impact attendu]
**Effort estimé** : [Faible / Moyen / Élevé]

**Description** :
[Description détaillée de l'amélioration proposée]

**Bénéfices** :
- [Bénéfice 1]
- [Bénéfice 2]

**Plan d'implémentation** :

- [ ] 1. [Tâche atomique 1 - précise et identifiable]
- [ ] 2. [Tâche atomique 2 - précise et identifiable]
- [ ] 3. [Tâche atomique 3 - précise et identifiable]
- [ ] 4. [Tâche atomique 4 - précise et identifiable]

**Fichiers concernés** :
- `chemin/vers/fichier1.ts`
- `chemin/vers/fichier2.tsx`

**Dépendances** :
- [Amélioration #X doit être complétée avant]
- [Aucune dépendance]

---

### 2. [Titre de l'amélioration suivante]
[... même structure ...]
```

## Critères pour les propositions

Chaque amélioration doit être :
1. **Concrète** : Directement applicable au projet
2. **Mesurable** : Impact quantifiable ou observable
3. **Réaliste** : Faisable avec la stack actuelle
4. **Utile** : Apporte une vraie valeur ajoutée
5. **Documentée** : Plan d'action clair et détaillé

## Catégories d'améliorations à considérer

- <× **Architecture** : Structure, organisation, patterns
- ¡ **Performance** : Optimisations, lazy loading, caching
-  **Accessibilité** : ARIA, navigation clavier, lecteurs d'écran
- <¨ **UX/UI** : Expérience utilisateur, design, ergonomie
- = **Sécurité** : Validation, sanitization, authentification
- >ê **Tests** : Couverture, qualité, automatisation
- =æ **Maintenabilité** : Lisibilité, réutilisabilité, documentation
- =€ **Fonctionnalités** : Nouvelles features, améliorations existantes
- =' **DevX** : Outils de développement, CI/CD, workflows

## Exemples de tâches atomiques

 **Bonnes tâches atomiques** :
- Installer et configurer le package `@testing-library/react`
- Créer le composant `SearchBar.tsx` avec props typées
- Ajouter un index sur la colonne `user_id` de la table `texts`
- Extraire la logique de validation dans `utils/validation.ts`

L **Mauvaises tâches** (trop vagues) :
- Améliorer les performances
- Refactorer le code
- Ajouter des tests
- Optimiser la base de données

## Instructions d'exécution

1. Lire les fichiers pertinents du projet (ou ceux spécifiés dans $ARGUMENTS)
2. Identifier 5 à 10 améliorations prioritaires
3. Classer par priorité (Haute ’ Moyenne ’ Basse)
4. Pour chaque amélioration, décomposer en 3 à 10 tâches atomiques
5. Créer le fichier `ENHANCEMENT.md` avec le contenu structuré
6. Informer l'utilisateur que le fichier a été créé et donner un aperçu des principales améliorations

## Note importante

Les tâches doivent être **atomiques** : chaque tâche doit être :
- Réalisable en une seule action ou commande
- Testable/vérifiable indépendamment
- Ne pas dépendre d'autres tâches dans la même amélioration
- Claire et sans ambiguïté

---

**Arguments reçus** : $ARGUMENTS
**Action** : Analyser et créer ENHANCEMENT.md
