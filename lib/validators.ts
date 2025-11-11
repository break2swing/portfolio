import { z } from 'zod';

/**
 * Validation des couleurs HSL pour les catégories
 * Format attendu: "H S% L%" où H ∈ [0, 360], S ∈ [0, 100], L ∈ [0, 100]
 * Exemples valides: "210 100% 50%", "0 0% 100%", "120 50% 50%"
 */
const hslColorSchema = z.string().refine(
  (val) => {
    const hslRegex = /^(\d{1,3})\s+(\d{1,3})%\s+(\d{1,3})%$/;
    const match = val.match(hslRegex);
    if (!match) return false;

    const [, h, s, l] = match.map(Number);
    return h >= 0 && h <= 360 && s >= 0 && s <= 100 && l >= 0 && l <= 100;
  },
  {
    message: 'Format HSL invalide. Utilisez le format "H S% L%" (ex: 210 100% 50%)',
  }
);

/**
 * Validation des couleurs hexadécimales pour les tags
 * Format attendu: #RRGGBB ou #RGB
 * Exemples valides: "#3b82f6", "#fff", "#000000"
 */
const hexColorSchema = z.string().refine(
  (val) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(val),
  {
    message: 'Couleur hexadécimale invalide. Utilisez le format #RRGGBB (ex: #3b82f6)',
  }
);

/**
 * Schéma de validation pour les textes
 */
export const textSchema = z.object({
  title: z
    .string()
    .min(1, 'Le titre est requis')
    .max(200, 'Le titre ne peut pas dépasser 200 caractères')
    .trim(),

  subtitle: z
    .string()
    .max(300, 'Le sous-titre ne peut pas dépasser 300 caractères')
    .trim()
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),

  content: z
    .string()
    .min(1, 'Le contenu est requis')
    .max(50000, 'Le contenu ne peut pas dépasser 50 000 caractères')
    .trim(),

  excerpt: z
    .string()
    .max(500, 'L\'extrait ne peut pas dépasser 500 caractères')
    .trim()
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),

  author: z
    .string()
    .max(100, 'Le nom de l\'auteur ne peut pas dépasser 100 caractères')
    .trim()
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),

  published_date: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),

  category_id: z
    .string()
    .uuid('ID de catégorie invalide')
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),

  is_published: z.boolean().default(false),

  display_order: z.number().int().nonnegative().default(0),
});

/**
 * Schéma pour la création d'un texte (sans display_order qui est auto-généré)
 */
export const createTextSchema = textSchema.omit({ display_order: true });

/**
 * Schéma pour la mise à jour d'un texte (tous les champs optionnels sauf validation)
 */
export const updateTextSchema = textSchema.partial();

/**
 * Schéma de validation pour les catégories
 */
export const categorySchema = z.object({
  name: z
    .string()
    .min(1, 'Le nom est requis')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .trim()
    .refine((val) => val.length > 0, 'Le nom ne peut pas être vide'),

  description: z
    .string()
    .max(500, 'La description ne peut pas dépasser 500 caractères')
    .trim()
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),

  color: hexColorSchema.default('#3b82f6'),

  display_order: z.number().int().nonnegative().default(0),
});

/**
 * Schéma pour la création d'une catégorie
 */
export const createCategorySchema = categorySchema.omit({ display_order: true });

/**
 * Schéma pour la mise à jour d'une catégorie
 */
export const updateCategorySchema = categorySchema.partial();

/**
 * Schéma de validation pour les tags
 */
export const tagSchema = z.object({
  name: z
    .string()
    .min(1, 'Le nom est requis')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères')
    .trim()
    .refine((val) => val.length > 0, 'Le nom ne peut pas être vide'),

  color: hexColorSchema.optional().default('#3b82f6'),
});

/**
 * Schéma pour la création d'un tag
 */
export const createTagSchema = tagSchema;

/**
 * Schéma pour la mise à jour d'un tag
 */
export const updateTagSchema = tagSchema.partial();

/**
 * Types TypeScript inférés des schémas
 */
export type TextFormData = z.infer<typeof textSchema>;
export type CreateTextFormData = z.infer<typeof createTextSchema>;
export type UpdateTextFormData = z.infer<typeof updateTextSchema>;

export type CategoryFormData = z.infer<typeof categorySchema>;
export type CreateCategoryFormData = z.infer<typeof createCategorySchema>;
export type UpdateCategoryFormData = z.infer<typeof updateCategorySchema>;

export type TagFormData = z.infer<typeof tagSchema>;
export type CreateTagFormData = z.infer<typeof createTagSchema>;
export type UpdateTagFormData = z.infer<typeof updateTagSchema>;

/**
 * Schéma de validation pour les playlists
 */
export const playlistSchema = z.object({
  name: z
    .string()
    .min(1, 'Le nom est requis')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .trim()
    .refine((val) => val.length > 0, 'Le nom ne peut pas être vide'),

  description: z
    .string()
    .max(500, 'La description ne peut pas dépasser 500 caractères')
    .trim()
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),

  is_public: z.boolean().default(false),

  display_order: z.number().int().nonnegative().default(0),
});

/**
 * Schéma pour la création d'une playlist (sans display_order qui est auto-généré)
 */
export const createPlaylistSchema = playlistSchema.omit({ display_order: true });

/**
 * Schéma pour la mise à jour d'une playlist
 */
export const updatePlaylistSchema = playlistSchema.partial();

/**
 * Types TypeScript inférés des schémas de playlist
 */
export type PlaylistFormData = z.infer<typeof playlistSchema>;
export type CreatePlaylistFormData = z.infer<typeof createPlaylistSchema>;
export type UpdatePlaylistFormData = z.infer<typeof updatePlaylistSchema>;
