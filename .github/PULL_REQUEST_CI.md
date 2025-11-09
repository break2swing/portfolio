## 🚀 Ajout de la configuration CI/CD

### Description

Cette PR ajoute la configuration CI/CD complète pour le projet avec GitHub Actions.

### Changements apportés

- ✅ **Workflow CI** (`.github/workflows/ci.yml`)
  - Vérification automatique du linting avec ESLint
  - Vérification des types TypeScript
  - Build automatique du projet Next.js
  - Upload des artifacts de build pour inspection

- ✅ **Workflow de déploiement** (`.github/workflows/deploy.yml`)
  - Déploiement automatique sur GitHub Pages lors des push sur `main`
  - Support optionnel pour Vercel (commenté, prêt à activer)

### Type de changement

- [x] 🔧 Configuration CI/CD

### Checklist

- [x] Les workflows sont correctement configurés
- [x] Les secrets GitHub doivent être configurés manuellement (voir instructions ci-dessous)
- [x] La documentation est incluse dans cette PR

### Configuration requise

⚠️ **Action requise avant merge** : Configurer les secrets GitHub suivants dans Settings → Secrets and variables → Actions :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Tests

- [x] Les workflows ont été testés localement (syntaxe YAML validée)
- [x] La configuration est compatible avec Next.js 13 et l'export statique

### Informations supplémentaires

- Les workflows se déclencheront automatiquement sur les branches `main` et `develop`
- Le workflow de déploiement ne s'exécute que sur `main`
- Les artifacts de build sont conservés pendant 7 jours
- Le cache npm est activé pour accélérer les builds

### Prochaines étapes après merge

1. Configurer les secrets GitHub (voir section "Configuration requise")
2. Activer GitHub Pages dans les paramètres du dépôt (si utilisation de GitHub Pages)
3. Faire un test push sur `main` pour vérifier le fonctionnement

