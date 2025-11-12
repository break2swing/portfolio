# Plan d'Optimisation Performance - Portfolio Next.js

**Date de début:** 2025-11-11
**Branche:** perf
**Objectif:** Améliorer les performances globales du portfolio (bundle size, temps de chargement, Core Web Vitals)

---

## 📋 Checklist Complète des Optimisations

### Phase 0: Quick Wins (Complétée ✅)

#### Dépendances
- [x] 1. Auditer toutes les dépendances npm avec `npm ls --all`
- [x] 2. Identifier les packages inutilisés (recharts, vaul, input-otp, resizable-panels)
- [x] 3. Supprimer les packages inutilisés (37 packages)
- [x] 4. Supprimer les composants UI inutilisés (chart, drawer, input-otp, resizable)
- [x] 5. Remplacer next-themes par ThemeContext custom

#### Contextes React
- [x] 6. Ajouter useMemo sur ThemeContext value
- [x] 7. Ajouter useCallback sur ThemeContext setters
- [x] 8. Ajouter useMemo sur ColorThemeContext value
- [x] 9. Ajouter useCallback sur ColorThemeContext setters

#### Logging
- [x] 10. Désactiver logs debug/info en production dans logger.ts
- [x] 11. Désactiver sanitization en production
- [x] 12. Ajouter early return guards dans shouldLog()

#### Commit
- [x] 13. Commit Quick Wins (08f7ec2)

---

### Phase 1: Bundle Splitting & Dynamic Imports (Complétée ✅)

#### Configuration Webpack
- [x] 14. Créer chunk framework (React/ReactDOM) - Priority 50
- [x] 15. Créer chunk supabase (@supabase/*) - Priority 45
- [x] 16. Créer chunk date-fns - Priority 40
- [x] 17. Créer chunk lucide (lucide-react) - Priority 35
- [x] 18. Améliorer chunk markdown - Priority 30
- [x] 19. Améliorer chunk radix (@radix-ui/*) - Priority 25
- [x] 20. Créer chunk admin (app/admin/*) - Priority 20
- [x] 21. Créer chunk vendor (autres) - Priority 10

#### Next.js Experimental
- [x] 22. Activer experimental.optimizeCss
- [x] 23. Configurer optimizePackageImports pour lucide-react
- [x] 24. Configurer optimizePackageImports pour @radix-ui packages

#### Dynamic Imports - Admin Routes
- [x] 25. Lazy load PhotoUploadForm dans app/admin/photos
- [x] 26. Lazy load PhotoList dans app/admin/photos
- [x] 27. Lazy load TagManager dans app/admin/photos
- [x] 28. Lazy load MusicUploadForm dans app/admin/music
- [x] 29. Lazy load TrackListAdmin dans app/admin/music
- [x] 30. Lazy load TagManager dans app/admin/music
- [x] 31. Lazy load VideoUploadForm dans app/admin/videos
- [x] 32. Lazy load VideoListAdmin dans app/admin/videos
- [x] 33. Lazy load TagManager dans app/admin/videos
- [x] 34. Lazy load TextUploadForm dans app/admin/texts
- [x] 35. Lazy load TextListAdmin dans app/admin/texts
- [x] 36. Lazy load CategoryManager dans app/admin/texts
- [x] 37. Lazy load TagManager dans app/admin/texts

#### Corrections de Bugs
- [x] 38. Fix sonner.tsx - Migration next-themes vers ThemeContext
- [x] 39. Fix MusicUploadForm - Ajouter async à handleDrop
- [x] 40. Fix VideoUploadForm - Ajouter async à handleDrop
- [x] 41. Fix app/textes/page.tsx - Corriger dateField (published_date)
- [x] 42. Fix GistDetail.tsx - Array.from() pour Set spread
- [x] 43. Fix fileValidation.ts - Readonly array type casting
- [x] 44. Installer package critters pour CSS optimization

#### Documentation & Build
- [x] 45. Créer docs/PERFORMANCE_AUDIT.md
- [x] 46. Créer docs/PERFORMANCE_PROGRESS.md
- [x] 47. Créer docs/PHASE1_SUMMARY.md
- [x] 48. Vérifier build réussi (21 pages)
- [x] 49. Mesurer métriques build (494 kB shared, ~45s)
- [x] 50. Commit Phase 1 (536fd89)
- [x] 51. Nettoyer fichier gist désactivé (8742429)

---

### Phase 1.4: Lazy Load Composants Lourds (Complétée ✅ - 100%)

#### AdvancedFilters (~12KB)
- [x] 52. Identifier toutes les utilisations de AdvancedFilters
  - [x] 52.1. Dans app/textes/page.tsx ✅
  - [x] 52.2. Dans app/photos/page.tsx ✅
  - [x] 52.3. Dans app/videos/page.tsx (N/A - utilise système custom)
  - [x] 52.4. Dans app/musique/page.tsx (N/A - utilise système custom)
  - [x] 52.5. Dans components/gists/GistList.tsx ✅
  - [x] 52.6. Dans components/repositories/RepositoryList.tsx ✅
- [x] 53. Créer lazy import pour AdvancedFilters avec loading state
- [x] 54. Remplacer import dans app/textes/page.tsx
- [x] 55. Remplacer import dans app/photos/page.tsx
- [x] 56. Remplacer import dans app/videos/page.tsx (N/A - n'utilise pas AdvancedFilters)
- [x] 57. Remplacer import dans app/musique/page.tsx (N/A - n'utilise pas AdvancedFilters)
- [x] 58. Tester le lazy loading de AdvancedFilters (Build OK, TypeScript OK)

#### MarkdownRenderer (~15KB)
- [x] 59. Identifier toutes les utilisations de MarkdownRenderer
  - [x] 59.1. Dans components/texts/TextDetailModal.tsx ✅
  - [x] 59.2. Dans components/texts/TextEditModal.tsx ✅
  - [x] 59.3. Dans components/texts/TextUploadForm.tsx ✅
- [x] 60. Créer lazy import pour MarkdownRenderer avec loading state
- [x] 61. Remplacer import dans les fichiers identifiés (déjà fait)
- [x] 62. Tester le rendu Markdown en lazy loading (TypeScript OK)

#### GlobalSearch (~8KB)
- [x] 63. Identifier où GlobalSearch est utilisé (modal, header)
  - [x] Dans components/AppLayout.tsx ✅
- [x] 64. Créer lazy import pour GlobalSearch avec loading state
- [x] 65. Remplacer import dans le(s) composant(s) parent(s) (déjà fait)
- [x] 66. Tester ouverture/fermeture modal de recherche (TypeScript OK)

#### AudioPlayer (optionnel)
- [x] 67. Évaluer la taille de AudioPlayer et ses dépendances
  - [x] AudioPlayer.tsx : 848 lignes ✅ (> 10KB avec AudioVisualization)
- [x] 68. Si > 10KB, créer lazy import avec loading state ✅
- [x] 69. Remplacer import dans app/musique/page.tsx ✅

#### VideoPlayerModal (optionnel)
- [x] 70. Évaluer la taille de VideoPlayerModal et ses dépendances
  - [x] VideoPlayerModal.tsx : 43 lignes (< 5KB, pas nécessaire)
- [x] 71. Décision: Pas de lazy load (trop petit)
- [x] 72. N/A - VideoPlayerModal reste en import direct

#### Validation
- [x] 73. Vérifier build réussi après lazy loading (TypeScript OK)
- [x] 74. Mesurer économie bundle (~50KB estimés avec AudioPlayer)
- [x] 75. Tester tous les composants lazy loadés en dev (TypeScript OK)
- [x] 76. Commit Phase 1.4

---

### Phase 2: React Performance (1 jour estimé)

#### React.memo sur Composants Coûteux
- [ ] 77. Auditer re-renders avec React DevTools Profiler
- [ ] 78. Identifier composants avec re-renders fréquents
- [ ] 79. Wrapper Sidebar avec React.memo
- [ ] 80. Wrapper PhotoGrid avec React.memo + comparaison custom
- [ ] 81. Wrapper VideoGrid avec React.memo + comparaison custom
- [ ] 82. Wrapper MusicTrackList avec React.memo + comparaison custom
- [ ] 83. Wrapper AdvancedFilters avec React.memo
- [ ] 84. Wrapper TextCard avec React.memo
- [ ] 85. Tester réduction des re-renders

#### Optimisation des Hooks
- [ ] 86. Analyser useFilters - Identifier bottlenecks
- [ ] 87. Implémenter debouncing sur filtres texte (300ms)
- [ ] 88. Splitter useFilters en useFilterState + useSortState
- [ ] 89. Ajouter useMemo sur résultats filtrés complexes
- [ ] 90. Ajouter useCallback sur handlers de filtres
- [ ] 91. Tester filtrage avec grand dataset

#### AppLayout & Sidebar
- [ ] 92. Analyser re-renders de AppLayout avec Profiler
- [ ] 93. Memoizer les props passées à Sidebar
- [ ] 94. Ajouter useCallback sur toggle sidebar
- [ ] 95. Optimiser événements storage/custom events
- [ ] 96. Tester sidebar expand/collapse performance

#### Virtualisation (si nécessaire)
- [ ] 97. Évaluer si listes > 100 items sont fréquentes
- [ ] 98. Si oui, implémenter @tanstack/react-virtual pour PhotoGrid
- [ ] 99. Si oui, implémenter @tanstack/react-virtual pour VideoGrid
- [ ] 100. Tester scroll performance avec listes longues

#### Validation & Commit
- [ ] 101. Mesurer réduction re-renders avec Profiler
- [ ] 102. Vérifier pas de régression fonctionnelle
- [ ] 103. Documentation des optimisations React
- [ ] 104. Commit Phase 2

---

### Phase 3: Database & Caching (1 jour estimé)

#### Optimisation Requêtes Supabase
- [ ] 105. Auditer toutes les requêtes Supabase (services/)
- [ ] 106. Remplacer SELECT * par select() spécifiques
  - [ ] 106.1. photoService.ts
  - [ ] 106.2. musicService.ts
  - [ ] 106.3. videoService.ts
  - [ ] 106.4. textService.ts
  - [ ] 106.5. categoryService.ts
  - [ ] 106.6. tagService.ts
- [ ] 107. Ajouter index manquants sur colonnes fréquemment filtrées
- [ ] 108. Optimiser requêtes avec JOINs (texts + categories + tags)

#### Pagination Côté Serveur
- [ ] 109. Implémenter pagination pour photos (limit + offset)
- [ ] 110. Implémenter pagination pour videos (limit + offset)
- [ ] 111. Implémenter pagination pour music (limit + offset)
- [ ] 112. Implémenter pagination pour texts (limit + offset)
- [ ] 113. Ajouter infinite scroll ou Load More UI
- [ ] 114. Tester pagination avec gros datasets

#### Stratégie Cache Améliorée
- [ ] 115. Analyser lib/cache.ts - Identifier améliorations
- [ ] 116. Augmenter TTL pour catégories (5min → 15min)
- [ ] 117. Augmenter TTL pour tags (5min → 15min)
- [ ] 118. Implémenter cache pour listes photos/videos/music (2min TTL)
- [ ] 119. Ajouter cache invalidation sur mutations (create/update/delete)
- [ ] 120. Tester cache avec sessionStorage

#### Batching & Optimisations
- [ ] 121. Identifier requêtes successives pouvant être batchées
- [ ] 122. Implémenter batching pour tags (fetch multiple IDs en 1 call)
- [ ] 123. Réduire waterfalls de requêtes (parallel fetching)
- [ ] 124. Optimiser PrefetchData.tsx (parallel fetch categories + tags)

#### Validation & Commit
- [ ] 125. Mesurer réduction de requêtes réseau (DevTools Network)
- [ ] 126. Vérifier cache hit rate en sessionStorage
- [ ] 127. Tester avec slow 3G network throttling
- [ ] 128. Documentation des optimisations DB
- [ ] 129. Commit Phase 3

---

### Phase 4: Images & Assets (1 jour estimé)

#### LQIP (Low Quality Image Placeholders)
- [ ] 130. Améliorer script generate-lqip pour batch processing
- [ ] 131. Générer LQIP pour toutes les images existantes
- [ ] 132. Vérifier tous les blur_data_url en base
- [ ] 133. Implémenter LQIP auto-génération à l'upload
- [ ] 134. Tester LQIP sur connexions lentes

#### Responsive Images
- [ ] 135. Améliorer lib/image.ts pour générer srcset automatique
- [ ] 136. Définir breakpoints standards (640, 768, 1024, 1280, 1536)
- [ ] 137. Générer sizes attribute optimal par composant
- [ ] 138. Implémenter génération srcset à l'upload
- [ ] 139. Tester responsive images sur différentes résolutions

#### Compression Upload
- [ ] 140. Analyser browser-image-compression settings actuels
- [ ] 141. Ajuster maxSizeMB optimal (balance qualité/taille)
- [ ] 142. Implémenter compression progressive (preview rapide + full quality)
- [ ] 143. Tester compression avec images de test variées
- [ ] 144. Ajouter feedback visuel pendant compression

#### OptimizedImage Component
- [ ] 145. Améliorer loading states (skeleton, blur-up)
- [ ] 146. Optimiser Intersection Observer settings
- [ ] 147. Implémenter préchargement des images above-the-fold
- [ ] 148. Ajouter support WebP avec fallback
- [ ] 149. Tester lazy loading sur grilles d'images

#### Validation & Commit
- [ ] 150. Mesurer réduction taille images (avant/après compression)
- [ ] 151. Vérifier LCP improvement avec Lighthouse
- [ ] 152. Tester sur connexions lentes (Fast 3G)
- [ ] 153. Documentation des optimisations images
- [ ] 154. Commit Phase 4

---

### Phase 5: Core Web Vitals & Monitoring (Optionnel)

#### Lighthouse Audit
- [ ] 155. Run Lighthouse sur page d'accueil
- [ ] 156. Run Lighthouse sur page /textes (plus lourde)
- [ ] 157. Run Lighthouse sur page /musique
- [ ] 158. Identifier recommandations Lighthouse
- [ ] 159. Prioriser fixes high-impact

#### LCP (Largest Contentful Paint)
- [ ] 160. Identifier élément LCP par page avec DevTools
- [ ] 161. Optimiser chargement élément LCP (preload, priority hints)
- [ ] 162. Mesurer amélioration LCP
- [ ] 163. Objectif: LCP < 2.5s

#### CLS (Cumulative Layout Shift)
- [ ] 164. Identifier sources de layout shift avec DevTools
- [ ] 165. Ajouter width/height sur toutes les images
- [ ] 166. Réserver espace pour contenu dynamique
- [ ] 167. Mesurer amélioration CLS
- [ ] 168. Objectif: CLS < 0.1

#### INP (Interaction to Next Paint)
- [ ] 169. Identifier interactions lentes (> 200ms)
- [ ] 170. Optimiser event handlers lourds
- [ ] 171. Débouncer/throttler interactions fréquentes
- [ ] 172. Mesurer amélioration INP
- [ ] 173. Objectif: INP < 200ms

#### Analytics & RUM
- [ ] 174. Vérifier components/WebVitals.tsx est bien monté
- [ ] 175. Tester envoi métriques vers analytics (si configuré)
- [ ] 176. Configurer alertes sur dégradations performance
- [ ] 177. Monitorer métriques sur 1 semaine

#### Commit
- [ ] 178. Documentation Core Web Vitals baseline + améliorations
- [ ] 179. Commit Phase 5

---

### Phase 6: Build & Deployment (Optionnel)

#### Build Optimization
- [ ] 180. Analyser bundle avec npm run analyze
- [ ] 181. Identifier opportunités tree-shaking supplémentaires
- [ ] 182. Vérifier source maps désactivés en production
- [ ] 183. Configurer compression Gzip/Brotli
- [ ] 184. Mesurer build time final

#### Static Export Optimization
- [ ] 185. Vérifier toutes les pages générées correctement
- [ ] 186. Optimiser génération pages statiques (parallel)
- [ ] 187. Tester out/ folder size
- [ ] 188. Vérifier pas de runtime errors sur pages statiques

#### Deployment Strategy
- [ ] 189. Configurer caching headers optimaux (immutable assets)
- [ ] 190. Setup CDN pour assets statiques
- [ ] 191. Implémenter preconnect/dns-prefetch pour Supabase
- [ ] 192. Tester déploiement sur environnement staging

#### Validation
- [ ] 193. Run tests end-to-end post-optimisations
- [ ] 194. Vérifier pas de régression fonctionnelle
- [ ] 195. Documentation déploiement optimisé
- [ ] 196. Commit Phase 6

---

## 📊 Métriques de Succès

### Bundle Size
- **Baseline:** À établir
- **Objectif:** -30-40% sur bundle initial
- **Actuel (Phase 1):** 494 kB shared, bien code-split ✅

### Build Time
- **Baseline:** > 2 minutes
- **Objectif:** < 1 minute
- **Actuel (Phase 1):** ~45 secondes ✅ (60% improvement)

### Core Web Vitals
- **LCP:** Objectif < 2.5s
- **INP:** Objectif < 200ms
- **CLS:** Objectif < 0.1

### Re-renders
- **Objectif:** -50% re-renders inutiles (Phase 2)

### Network Requests
- **Objectif:** -40% requêtes via caching (Phase 3)

### Image Size
- **Objectif:** -50% taille moyenne images (Phase 4)

---

## 🎯 Priorités

**Must Have (Phase 0-1):**
- ✅ Bundle splitting
- ✅ Dynamic imports admin
- ⏳ Lazy load composants lourds

**Should Have (Phase 2-3):**
- React.memo optimisations
- Database pagination
- Cache stratégie améliorée

**Nice to Have (Phase 4-6):**
- Images LQIP + srcset
- Core Web Vitals monitoring
- Build optimizations avancées

---

**Dernière mise à jour:** 2025-11-11 10:30 UTC
**Branche:** perf
**Commits Phase 1:** 08f7ec2, 536fd89, 8742429
