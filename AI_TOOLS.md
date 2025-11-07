# Outils d'IA pour ce projet

Ce projet est configuré pour fonctionner avec plusieurs outils d'IA en ligne de commande.

## 🤖 Outils supportés

### 1. Claude Code (Anthropic)
**Outil principal** utilisé pour le développement de ce projet.

**Installation :**
```bash
# Déjà installé si vous utilisez Claude Code
```

**Commandes disponibles :**
- `/agents-update` - Met à jour CLAUDE.md et AGENTS.md

**Configuration :**
- Dossier : `.claude/commands/`
- Format : Markdown avec frontmatter YAML

**Documentation :**
- [CLAUDE.md](./CLAUDE.md) - Architecture et patterns du projet
- [AGENTS.md](./AGENTS.md) - Conventions de code pour agents IA

---

### 2. Gemini CLI (Google)
Assistant IA de Google avec accès au code.

**Installation :**
```bash
npm install -g @google/generative-ai-cli
```

**Commandes disponibles :**
- `gemini run agents-update` - Met à jour la documentation

**Configuration :**
- Dossier : `.gemini/prompts/`
- Format : YAML
- Documentation : [.gemini/README.md](./.gemini/README.md)

**Utilisation :**
```bash
# Lister les prompts
gemini prompts list

# Exécuter agents-update
gemini run agents-update
```

---

### 3. Codex CLI (Anthropic)
Alternative CLI pour Claude.

**Installation :**
```bash
npm install -g @anthropic/codex-cli
```

**Commandes disponibles :**
- `codex agents-update` - Met à jour la documentation

**Configuration :**
- Dossier : `.codex/commands/`
- Format : Markdown
- Documentation : [.codex/README.md](./.codex/README.md)

**Utilisation :**
```bash
# Lister les commandes
codex commands

# Exécuter agents-update
codex agents-update
```

---

## 📋 Commande `agents-update`

Cette commande est disponible pour **les 3 outils** et fait exactement la même chose :

### Ce qu'elle fait

1. ✅ Lit CLAUDE.md et AGENTS.md actuels
2. 🔍 Analyse le projet complet :
   - Configuration (package.json, tsconfig.json, next.config.js)
   - Routes et pages
   - Contextes et état global
   - Services
   - Composants principaux
   - Configuration des bibliothèques
3. 🔄 Identifie les changements non documentés
4. 📝 Met à jour les deux fichiers
5. 📊 Fournit un résumé des modifications

### Quand l'utiliser

- ✅ Après avoir ajouté un nouveau contexte
- ✅ Après avoir créé un nouveau service
- ✅ Après avoir ajouté une nouvelle route/page
- ✅ Après des changements majeurs dans l'architecture
- ✅ Régulièrement pour garder la doc à jour

### Syntaxe selon l'outil

| Outil | Commande |
|-------|----------|
| **Claude Code** | `/agents-update` |
| **Gemini CLI** | `gemini run agents-update` |
| **Codex CLI** | `codex agents-update` |

---

## 🎯 Recommandations

### Pour le développement quotidien
Utilisez **Claude Code** - c'est l'outil principal du projet avec la meilleure intégration.

### Pour la documentation automatisée
N'importe quel outil fonctionne. Choisissez selon votre préférence :
- **Claude Code** : Interface conversationnelle
- **Gemini CLI** : Si vous préférez Google
- **Codex CLI** : Ligne de commande pure

### Pour les scripts CI/CD
**Gemini CLI** ou **Codex CLI** sont parfaits car ils peuvent être intégrés dans des scripts.

---

## 🔧 Structure des dossiers

```
portfolio/
├── .claude/          # Commandes Claude Code
│   ├── commands/
│   └── README.md
├── .gemini/          # Prompts Gemini CLI
│   ├── prompts/
│   └── README.md
├── .codex/           # Commandes Codex CLI
│   ├── commands/
│   └── README.md
├── CLAUDE.md         # Doc architecture (pour IA)
├── AGENTS.md         # Doc conventions (pour IA)
└── AI_TOOLS.md       # Ce fichier
```

---

## 📚 Documentation pour les IA

Les fichiers suivants sont **spécialement conçus pour les agents IA** :

### CLAUDE.md
- Architecture du projet
- Configuration Next.js
- Structure des routes
- Systèmes de thèmes
- Intégration Supabase
- Patterns de développement

### AGENTS.md
- Conventions de nommage
- Structure des fichiers
- Templates de code
- Workflows spécifiques
- Guidelines de styling
- Points d'attention

### README.md
- Guide de démarrage pour **humains**
- Installation et configuration
- Commandes disponibles
- Technologies utilisées

---

## 🚀 Premiers pas

1. **Installer votre outil préféré** (voir ci-dessus)
2. **Lire CLAUDE.md** pour comprendre l'architecture
3. **Lire AGENTS.md** pour les conventions
4. **Exécuter `/agents-update`** pour vérifier que tout est à jour

---

## 🆘 Support

- Pour Claude Code : [Documentation Claude Code](https://docs.claude.com/claude-code)
- Pour Gemini CLI : [Documentation Gemini](https://github.com/google/generative-ai-cli)
- Pour Codex CLI : [Documentation Codex](https://anthropic.com/codex)
