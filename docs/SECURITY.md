# Documentation Sécurité

Ce document décrit toutes les mesures de sécurité implémentées dans le portfolio Next.js et les bonnes pratiques à suivre.

## Vue d'ensemble

Le portfolio implémente plusieurs couches de sécurité pour protéger contre les vulnérabilités courantes :

- **Validation des données** : Validation Zod côté client et contraintes CHECK côté serveur
- **Sanitization** : DOMPurify pour le contenu Markdown
- **RLS Supabase** : Row Level Security avec vérification d'ownership
- **Validation des fichiers** : Magic bytes pour détecter les falsifications de type MIME
- **Validation des URLs** : Vérification des protocoles et domaines autorisés
- **Headers de sécurité HTTP** : Protection contre les attaques courantes
- **Rate limiting** : Limitation des appels API côté client

## Headers de sécurité HTTP

**Important** : Avec `output: 'export'` (export statique), Next.js ne permet pas de configurer les headers dans `next.config.js`. Les headers doivent être configurés au niveau du serveur web ou de la plateforme d'hébergement.

### Configuration pour Netlify

Un fichier `public/_headers` est fourni avec la configuration des headers. Netlify l'utilisera automatiquement lors du déploiement.

### Configuration pour Vercel

Créez un fichier `vercel.json` à la racine du projet :

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://*.supabase.in; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests"
        }
      ]
    }
  ]
}
```

### Configuration pour Nginx

Ajoutez dans votre configuration Nginx :

```nginx
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://*.supabase.in; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests" always;
```

### Configuration pour Apache

Ajoutez dans votre fichier `.htaccess` :

```apache
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "DENY"
  Header set X-XSS-Protection "1; mode=block"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
  Header set Permissions-Policy "camera=(), microphone=(), geolocation=()"
  Header set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://*.supabase.in; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests"
</IfModule>
```

Les headers de sécurité incluent :

### X-Content-Type-Options: nosniff
Empêche le navigateur de deviner le type MIME d'un fichier, réduisant les risques d'exécution de scripts malveillants.

### X-Frame-Options: DENY
Empêche l'embedding de la page dans des iframes, protégeant contre les attaques de clickjacking.

### X-XSS-Protection: 1; mode=block
Active la protection XSS intégrée du navigateur (obsolète mais toujours utile pour les anciens navigateurs).

### Referrer-Policy: strict-origin-when-cross-origin
Contrôle les informations de referrer envoyées avec les requêtes, protégeant la vie privée.

### Permissions-Policy: camera=(), microphone=(), geolocation=()
Désactive les APIs sensibles (caméra, microphone, géolocalisation) pour réduire la surface d'attaque.

### Content-Security-Policy (CSP)
Politique de sécurité du contenu qui restreint les ressources pouvant être chargées :

- `default-src 'self'` : Par défaut, seules les ressources du même domaine sont autorisées
- `script-src 'self' 'unsafe-eval' 'unsafe-inline'` : Scripts autorisés (unsafe-inline nécessaire pour Next.js)
- `style-src 'self' 'unsafe-inline'` : Styles autorisés (unsafe-inline nécessaire pour Tailwind)
- `img-src 'self' data: https:` : Images autorisées depuis le même domaine, data URIs, et HTTPS
- `connect-src 'self' https://*.supabase.co https://*.supabase.in` : Connexions autorisées vers Supabase
- `frame-src 'none'` : Aucun iframe autorisé
- `object-src 'none'` : Aucun objet embed autorisé
- `base-uri 'self'` : Base URI restreinte au même domaine
- `form-action 'self'` : Formulaires ne peuvent soumettre qu'au même domaine
- `frame-ancestors 'none'` : Aucun embedding de la page
- `upgrade-insecure-requests` : Force HTTPS pour toutes les requêtes

**Note** : Pour un export statique Next.js, les headers doivent être configurés au niveau du serveur web (Nginx, Apache, etc.) ou de la plateforme d'hébergement (Netlify, Vercel).

## Processus d'audit des dépendances

### Audit automatique

Exécutez régulièrement l'audit des dépendances :

```bash
npm audit
```

Pour vérifier uniquement les vulnérabilités modérées et critiques :

```bash
npm audit --audit-level=moderate
```

### Correction automatique

Pour corriger automatiquement les vulnérabilités :

```bash
npm audit fix
```

### Fréquence recommandée

- **Hebdomadaire** : Audit complet des dépendances
- **Avant chaque déploiement** : Vérification des vulnérabilités critiques
- **Après chaque installation** : Vérification des nouvelles dépendances

### Configuration Dependabot (GitHub)

Pour activer les alertes automatiques sur GitHub, créez `.github/dependabot.yml` :

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

## Validation des fichiers

### Magic Bytes

La validation des fichiers utilise les magic bytes (signatures de fichiers) pour détecter les falsifications de type MIME.

**Formats supportés** :
- Images : JPEG, PNG, WebP, GIF
- Vidéos : MP4, WebM
- Audio : MPEG (MP3), WAV

**Implémentation** : `lib/fileValidation.ts`

**Utilisation** :
```typescript
import { validateFileByCategory } from '@/lib/fileValidation';

const validation = await validateFileByCategory(file, 'images');
if (!validation.valid) {
  console.error(validation.error);
}
```

## Validation des URLs

### Règles de validation

Les URLs sont validées selon les critères suivants :

1. **Format valide** : Doit être une URL valide
2. **Protocole HTTPS** : Seules les URLs HTTPS sont autorisées (sauf localhost en développement)
3. **Domaine autorisé** : Seuls les domaines Supabase Storage sont autorisés
4. **Protocoles dangereux bloqués** : `javascript:`, `data:`, `vbscript:`, `file:`, `about:`

**Implémentation** : `lib/urlValidation.ts`

**Utilisation** :
```typescript
import { validateMediaUrl } from '@/lib/urlValidation';

const validation = validateMediaUrl(url, 'image_url');
if (!validation.valid) {
  console.error(validation.error);
}
```

## Contraintes base de données

### Contraintes CHECK

Des contraintes CHECK sont définies au niveau PostgreSQL pour :

- **Longueurs maximales** : Titres ≤ 200 caractères, contenus ≤ 50000 caractères
- **Formats** : Slugs en kebab-case, couleurs hex (#RRGGBB)
- **URLs** : Format HTTPS valide
- **Valeurs numériques** : Durées positives

**Migration** : `supabase/migrations/20250111_add_security_constraints.sql`

## Row Level Security (RLS)

### Policies RLS

Toutes les tables ont des policies RLS activées :

- **SELECT** : Lecture publique pour les ressources publiées
- **INSERT** : Création réservée aux utilisateurs authentifiés avec vérification d'ownership
- **UPDATE** : Modification réservée au propriétaire (`user_id = auth.uid()`)
- **DELETE** : Suppression réservée au propriétaire (`user_id = auth.uid()`)

**Tables protégées** :
- `photos` : Vérification d'ownership pour UPDATE/DELETE
- `music_tracks` : Vérification d'ownership pour UPDATE/DELETE
- `videos` : Vérification d'ownership pour UPDATE/DELETE
- `texts` : Vérification d'ownership pour UPDATE/DELETE

## Rate Limiting côté client

### Implémentation

Le rate limiting côté client limite les appels API pour prévenir les abus :

- **Create** : 10 requêtes par minute
- **Update** : 20 requêtes par minute

**Implémentation** : `lib/rateLimiter.ts`

**Note** : Le rate limiting réel doit être implémenté côté serveur (Supabase) pour une protection complète.

## Bonnes pratiques pour les développeurs

### 1. Validation des données

- Toujours valider les données côté client avec Zod
- Les contraintes base de données fournissent une protection supplémentaire
- Ne jamais faire confiance aux données côté client

### 2. Sanitization

- Toujours sanitizer le contenu Markdown avec DOMPurify avant affichage
- Ne jamais afficher du contenu utilisateur sans sanitization

### 3. Uploads de fichiers

- Toujours valider les fichiers avec magic bytes
- Limiter la taille des fichiers
- Valider le type MIME réel, pas seulement l'extension

### 4. URLs

- Toujours valider les URLs avant stockage
- Ne jamais permettre les protocoles dangereux (`javascript:`, `data:`, etc.)
- Restreindre aux domaines autorisés uniquement

### 5. Authentification

- Toujours vérifier l'authentification avant les opérations sensibles
- Utiliser RLS Supabase pour la protection côté serveur
- Vérifier l'ownership des ressources avant modification/suppression

### 6. Dépendances

- Auditer régulièrement les dépendances
- Mettre à jour rapidement les vulnérabilités critiques
- Éviter les dépendances non maintenues

## Procédure de réponse aux incidents

### 1. Détection

- Surveiller les logs d'erreur
- Surveiller les métriques de performance
- Surveiller les alertes de sécurité

### 2. Évaluation

- Évaluer la gravité de l'incident
- Identifier les systèmes affectés
- Déterminer l'étendue de l'impact

### 3. Réponse

- Isoler les systèmes affectés si nécessaire
- Corriger la vulnérabilité
- Notifier les parties prenantes

### 4. Post-mortem

- Analyser la cause racine
- Documenter les leçons apprises
- Mettre à jour les procédures de sécurité

## Ressources supplémentaires

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [Supabase Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

