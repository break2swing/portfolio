# Gemini CLI - Prompts personnalisés

Ce dossier contient des prompts personnalisés pour gemini-cli.

## Installation de gemini-cli

```bash
npm install -g @google/generative-ai-cli
```

## Utilisation

### Liste des prompts disponibles

```bash
gemini prompts list
```

### Exécuter un prompt

```bash
gemini run agents-update
```

## Prompts disponibles

### `agents-update`
Met à jour automatiquement CLAUDE.md et AGENTS.md après analyse du projet.

**Tags :** `project`, `documentation`, `maintenance`

**Utilisation :**
```bash
gemini run agents-update
```

Le prompt va :
1. Lire les fichiers CLAUDE.md et AGENTS.md actuels
2. Analyser toute l'architecture du projet
3. Identifier les changements non documentés
4. Mettre à jour les deux fichiers
5. Fournir un résumé des modifications

## Configuration

Les prompts sont stockés dans `.gemini/prompts/` au format YAML.

## Documentation

Pour plus d'informations sur gemini-cli :
- [Documentation officielle](https://github.com/google/generative-ai-cli)
