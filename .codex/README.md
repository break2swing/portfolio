# Codex CLI - Commandes personnalisées

Ce dossier contient des commandes personnalisées pour codex.

## Installation de codex

```bash
npm install -g @anthropic/codex-cli
```

## Utilisation

### Liste des commandes disponibles

```bash
codex commands
```

### Exécuter une commande

```bash
codex agents-update
```

## Commandes disponibles

### `agents-update`
Met à jour automatiquement CLAUDE.md et AGENTS.md après analyse du projet.

**Tags :** `project`, `documentation`, `maintenance`

**Utilisation :**
```bash
codex agents-update
```

La commande va :
1. ✅ Lire les fichiers CLAUDE.md et AGENTS.md actuels
2. 🔍 Analyser toute l'architecture du projet (routes, contextes, services)
3. 🔄 Identifier les changements non documentés
4. 📝 Mettre à jour les deux fichiers avec les nouvelles informations
5. 📊 Fournir un résumé détaillé des modifications

**Exemple de sortie :**
```
## Changements identifiés
- ✅ Nouveau contexte : AuthContext
- ✅ Nouveau service : authService
- ✅ Route ajoutée : /parametres

## Modifications appliquées
CLAUDE.md : 3 sections mises à jour
AGENTS.md : 2 sections ajoutées
```

## Configuration

Les commandes sont stockées dans `.codex/commands/` au format Markdown.

Chaque commande doit avoir :
- Un titre (`# nom-commande`)
- Une description
- Des tags
- Des instructions détaillées pour l'IA

## Documentation

Pour plus d'informations sur codex :
- [Documentation officielle](https://anthropic.com/codex)
