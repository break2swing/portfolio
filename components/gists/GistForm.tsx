'use client';

import { useState } from 'react';
import { gistService } from '@/services/gistService';
import { detectLanguageFromFilename, formatLanguageName } from '@/lib/detectLanguage';
import { CodeViewer } from '@/components/repositories/CodeViewer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Loader2, FileCode } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface GistFile {
  id?: string;
  filename: string;
  content: string;
  language: string | null;
}

interface GistFormProps {
  initialData?: {
    id: string;
    title: string | null;
    description: string | null;
    is_public: boolean;
    files: Array<{
      id: string;
      filename: string;
      content: string;
      language: string | null;
    }>;
  };
  onSuccess: () => void;
  onCancel?: () => void;
}

const COMMON_LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'java',
  'c',
  'cpp',
  'csharp',
  'php',
  'ruby',
  'go',
  'rust',
  'swift',
  'kotlin',
  'html',
  'css',
  'scss',
  'sql',
  'json',
  'yaml',
  'xml',
  'markdown',
  'shell',
  'dockerfile',
  'makefile',
  'text',
];

export function GistForm({ initialData, onSuccess, onCancel }: GistFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [isPublic, setIsPublic] = useState(initialData?.is_public ?? true);
  const [files, setFiles] = useState<GistFile[]>(
    initialData?.files.map(f => ({
      id: f.id,
      filename: f.filename,
      content: f.content,
      language: f.language,
    })) || [
      {
        filename: '',
        content: '',
        language: null,
      },
    ]
  );

  const addFile = () => {
    setFiles([
      ...files,
      {
        filename: '',
        content: '',
        language: null,
      },
    ]);
  };

  const removeFile = (index: number) => {
    if (files.length <= 1) {
      toast.error('Un Gist doit contenir au moins un fichier');
      return;
    }
    setFiles(files.filter((_, i) => i !== index));
  };

  const updateFile = (index: number, updates: Partial<GistFile>) => {
    const newFiles = [...files];
    const file = newFiles[index];

    // Si le filename change, détecter automatiquement le langage
    if (updates.filename !== undefined) {
      const newFilename = updates.filename;
      const detectedLanguage = detectLanguageFromFilename(newFilename);
      
      newFiles[index] = {
        ...file,
        ...updates,
        language: detectedLanguage || file.language || null,
      };
    } else {
      newFiles[index] = {
        ...file,
        ...updates,
      };
    }

    setFiles(newFiles);
  };

  const validateForm = (): boolean => {
    // Vérifier qu'il y a au moins un fichier
    if (files.length === 0) {
      toast.error('Un Gist doit contenir au moins un fichier');
      return false;
    }

    // Vérifier que tous les fichiers ont un nom et du contenu
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.filename.trim()) {
        toast.error(`Le fichier ${i + 1} doit avoir un nom`);
        return false;
      }

      // Vérifier que le nom de fichier contient une extension
      if (!file.filename.includes('.')) {
        toast.error(`Le fichier "${file.filename}" doit avoir une extension`);
        return false;
      }

      // Vérifier les caractères spéciaux dans le nom de fichier
      if (!/^[a-zA-Z0-9._-]+$/.test(file.filename)) {
        toast.error(`Le nom de fichier "${file.filename}" contient des caractères invalides`);
        return false;
      }

      if (!file.content.trim()) {
        toast.error(`Le fichier "${file.filename}" ne peut pas être vide`);
        return false;
      }
    }

    // Vérifier qu'il n'y a pas de doublons de noms de fichiers
    const filenames = files.map(f => f.filename.toLowerCase());
    const duplicates = filenames.filter((name, index) => filenames.indexOf(name) !== index);
    if (duplicates.length > 0) {
      toast.error(`Les fichiers suivants sont en double : ${[...new Set(duplicates)].join(', ')}`);
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const filesData = files.map((file, index) => ({
        filename: file.filename.trim(),
        content: file.content,
        language: file.language,
        display_order: index,
      }));

      if (initialData) {
        // Mise à jour
        const { error: updateError } = await gistService.updateGist(initialData.id, {
          title: title.trim() || null,
          description: description.trim() || null,
          is_public: isPublic,
        });

        if (updateError) {
          throw updateError;
        }

        const { error: filesError } = await gistService.updateGistFiles(initialData.id, filesData);

        if (filesError) {
          throw filesError;
        }

        toast.success('Gist mis à jour avec succès');
      } else {
        // Création
        const { gist, error } = await gistService.createGist({
          title: title.trim() || null,
          description: description.trim() || null,
          is_public: isPublic,
          files: filesData,
        });

        if (error) {
          throw error;
        }

        if (!gist) {
          throw new Error('Erreur lors de la création du Gist');
        }

        toast.success('Gist créé avec succès');
      }

      onSuccess();
    } catch (error: any) {
      logger.error('Error saving gist', error);
      toast.error('Erreur', {
        description: error.message || 'Une erreur est survenue lors de la sauvegarde du Gist',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Informations générales */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Titre (optionnel)</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ex: Exemple de fonction utilitaire"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (optionnelle)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description du Gist..."
            rows={3}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="is-public">Gist public</Label>
            <p className="text-sm text-muted-foreground">
              Les Gists publics sont visibles par tous
            </p>
          </div>
          <Switch
            id="is-public"
            checked={isPublic}
            onCheckedChange={setIsPublic}
          />
        </div>
      </div>

      {/* Fichiers */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Fichiers</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addFile}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Ajouter un fichier
          </Button>
        </div>

        {files.map((file, index) => (
          <Card key={index} className="space-y-4">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileCode className="h-4 w-4" />
                  Fichier {index + 1}
                </CardTitle>
                {files.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`filename-${index}`}>Nom du fichier *</Label>
                  <Input
                    id={`filename-${index}`}
                    value={file.filename}
                    onChange={(e) => updateFile(index, { filename: e.target.value })}
                    placeholder="ex: example.js"
                    required
                  />
                  {file.filename && !file.filename.includes('.') && (
                    <Alert>
                      <AlertDescription className="text-xs">
                        Le nom de fichier doit contenir une extension
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`language-${index}`}>Langage</Label>
                  <Select
                    value={file.language || 'text'}
                    onValueChange={(value) =>
                      updateFile(index, { language: value === 'text' ? null : value })
                    }
                  >
                    <SelectTrigger id={`language-${index}`}>
                      <SelectValue placeholder="Détection automatique" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Détection automatique</SelectItem>
                      {COMMON_LANGUAGES.map((lang) => (
                        <SelectItem key={lang} value={lang}>
                          {formatLanguageName(lang)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {file.filename && file.language && (
                    <p className="text-xs text-muted-foreground">
                      Détecté : {formatLanguageName(detectLanguageFromFilename(file.filename) || 'text')}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`content-${index}`}>Contenu *</Label>
                <Textarea
                  id={`content-${index}`}
                  value={file.content}
                  onChange={(e) => updateFile(index, { content: e.target.value })}
                  placeholder="Contenu du fichier..."
                  rows={10}
                  className="font-mono text-sm"
                  required
                />
              </div>

              {/* Prévisualisation */}
              {file.content && file.filename && (
                <div className="space-y-2">
                  <Label>Prévisualisation</Label>
                  <CodeViewer
                    code={file.content}
                    language={file.language || detectLanguageFromFilename(file.filename) || 'text'}
                    filename={file.filename}
                    showLineNumbers={true}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {initialData ? 'Mise à jour...' : 'Création...'}
            </>
          ) : (
            initialData ? 'Mettre à jour' : 'Créer le Gist'
          )}
        </Button>
      </div>
    </div>
  );
}

// Import logger
import { createLogger } from '@/lib/logger';
const logger = createLogger('gist-form');

