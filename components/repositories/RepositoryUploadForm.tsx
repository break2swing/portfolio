'use client';

import { useState, useRef, DragEvent } from 'react';
import { repositoryService } from '@/services/repositoryService';
import { filterFilesByGitignore, findGitignoreFile, readGitignoreContent } from '@/lib/gitignore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Loader2, Github, Folder, CheckCircle2, XCircle, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RepositoryUploadFormProps {
  onSuccess: () => void;
}

export function RepositoryUploadForm({ onSuccess }: RepositoryUploadFormProps) {
  const [mode, setMode] = useState<'github' | 'local'>('github');
  const [uploading, setUploading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // GitHub fields
  const [githubOwner, setGithubOwner] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [githubBranch, setGithubBranch] = useState('main');
  const [githubMetadata, setGithubMetadata] = useState<any>(null);
  const [githubError, setGithubError] = useState<string | null>(null);

  // Local fields
  const [localName, setLocalName] = useState('');
  const [localDescription, setLocalDescription] = useState('');
  const [localFiles, setLocalFiles] = useState<File[]>([]);
  const [localFilesPreview, setLocalFilesPreview] = useState<string[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<File[]>([]);
  const [gitignoreFound, setGitignoreFound] = useState(false);
  const [filesFiltered, setFilesFiltered] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // GitHub handlers
  const handleVerifyGitHub = async () => {
    if (!githubOwner.trim() || !githubRepo.trim()) {
      toast.error('Veuillez remplir le propriétaire et le nom du dépôt');
      return;
    }

    setVerifying(true);
    setGithubError(null);
    setGithubMetadata(null);

    try {
      const { repository, error } = await repositoryService.verifyGitHubRepository(
        githubOwner.trim(),
        githubRepo.trim()
      );

      if (error) {
        setGithubError(error.message || 'Erreur lors de la vérification du dépôt');
        toast.error('Erreur', { description: error.message || 'Impossible de vérifier le dépôt GitHub' });
        return;
      }

      if (repository) {
        setGithubMetadata(repository);
        toast.success('Dépôt vérifié avec succès');
      }
    } catch (error) {
      setGithubError('Erreur inattendue lors de la vérification');
      toast.error('Erreur', { description: 'Une erreur inattendue s\'est produite' });
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmitGitHub = async () => {
    if (!githubOwner.trim() || !githubRepo.trim()) {
      toast.error('Veuillez remplir tous les champs requis');
      return;
    }

    if (!githubMetadata) {
      toast.error('Veuillez d\'abord vérifier le dépôt');
      return;
    }

    setUploading(true);

    try {
      const { repository, error } = await repositoryService.createRepository({
        name: githubMetadata.name || githubRepo,
        description: githubMetadata.description || null,
        source_type: 'github',
        github_owner: githubOwner.trim(),
        github_repo: githubRepo.trim(),
        github_branch: githubBranch.trim() || 'main',
        language: githubMetadata.language || null,
        is_public: true,
        github_stars: githubMetadata.stargazers_count ?? null,
        github_forks: githubMetadata.forks_count ?? null,
        github_watchers: githubMetadata.watchers_count ?? null,
        github_open_issues: githubMetadata.open_issues_count ?? null,
      });

      if (error) {
        toast.error('Erreur', { description: error.message || 'Impossible de créer le dépôt' });
        return;
      }

      toast.success('Dépôt GitHub ajouté avec succès');
      
      // Reset form
      setGithubOwner('');
      setGithubRepo('');
      setGithubBranch('main');
      setGithubMetadata(null);
      setGithubError(null);

      onSuccess();
    } catch (error) {
      toast.error('Erreur', { description: 'Une erreur inattendue s\'est produite' });
    } finally {
      setUploading(false);
    }
  };

  // Local handlers
  const handleFileSelect = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const filesArray = Array.from(selectedFiles);
    setLocalFiles(filesArray);

    // Chercher le fichier .gitignore
    const gitignoreFile = findGitignoreFile(filesArray);
    setGitignoreFound(!!gitignoreFile);

    let filtered = filesArray;
    let filteredCount = 0;

    if (gitignoreFile) {
      try {
        // Lire le contenu du .gitignore
        const gitignoreContent = await readGitignoreContent(gitignoreFile);
        
        // Filtrer les fichiers selon .gitignore
        filtered = filterFilesByGitignore(filesArray, gitignoreContent);
        filteredCount = filesArray.length - filtered.length;
        setFilesFiltered(filteredCount > 0);
      } catch (error) {
        console.error('Error reading .gitignore:', error);
        toast.error('Erreur', { description: 'Impossible de lire le fichier .gitignore' });
        setFilesFiltered(false);
      }
    } else {
      setFilesFiltered(false);
    }

    setFilteredFiles(filtered);
    setLocalFilesPreview(filtered.map(f => {
      const path = 'webkitRelativePath' in f && f.webkitRelativePath ? f.webkitRelativePath : f.name;
      return path;
    }));
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = filteredFiles.filter((_, i) => i !== index);
    setFilteredFiles(newFiles);
    setLocalFiles(localFiles.filter((_, i) => {
      const path = 'webkitRelativePath' in localFiles[i] && localFiles[i].webkitRelativePath
        ? localFiles[i].webkitRelativePath
        : localFiles[i].name;
      return newFiles.some(f => {
        const fPath = 'webkitRelativePath' in f && f.webkitRelativePath
          ? f.webkitRelativePath
          : f.name;
        return fPath === path;
      });
    }));
    setLocalFilesPreview(newFiles.map(f => {
      const path = 'webkitRelativePath' in f && f.webkitRelativePath ? f.webkitRelativePath : f.name;
      return path;
    }));
  };

  const handleSubmitLocal = async () => {
    if (!localName.trim()) {
      toast.error('Veuillez saisir un nom pour le dépôt');
      return;
    }

    if (filteredFiles.length === 0) {
      toast.error('Veuillez sélectionner au moins un fichier');
      return;
    }

    setUploading(true);

    try {
      // Générer un chemin unique pour le dépôt
      const storagePath = `repos/${localName.trim().toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

      const { repository, error } = await repositoryService.uploadLocalRepository(
        localName.trim(),
        localDescription.trim() || null,
        filteredFiles, // Utiliser les fichiers filtrés
        storagePath
      );

      if (error) {
        toast.error('Erreur', { description: error.message || 'Impossible de créer le dépôt' });
        return;
      }

      toast.success('Dépôt local créé avec succès');
      
      // Reset form
      setLocalName('');
      setLocalDescription('');
      setLocalFiles([]);
      setFilteredFiles([]);
      setLocalFilesPreview([]);
      setGitignoreFound(false);
      setFilesFiltered(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (folderInputRef.current) folderInputRef.current.value = '';

      onSuccess();
    } catch (error) {
      toast.error('Erreur', { description: 'Une erreur inattendue s\'est produite' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Tabs value={mode} onValueChange={(v) => setMode(v as 'github' | 'local')} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="github" className="gap-2">
          <Github className="h-4 w-4" />
          GitHub
        </TabsTrigger>
        <TabsTrigger value="local" className="gap-2">
          <Folder className="h-4 w-4" />
          Local
        </TabsTrigger>
      </TabsList>

      {/* GitHub Tab */}
      <TabsContent value="github" className="space-y-4 mt-4">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="github-owner">Propriétaire *</Label>
              <Input
                id="github-owner"
                placeholder="ex: facebook"
                value={githubOwner}
                onChange={(e) => {
                  setGithubOwner(e.target.value);
                  setGithubMetadata(null);
                  setGithubError(null);
                }}
                disabled={uploading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="github-repo">Dépôt *</Label>
              <Input
                id="github-repo"
                placeholder="ex: react"
                value={githubRepo}
                onChange={(e) => {
                  setGithubRepo(e.target.value);
                  setGithubMetadata(null);
                  setGithubError(null);
                }}
                disabled={uploading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="github-branch">Branche</Label>
            <Input
              id="github-branch"
              placeholder="main"
              value={githubBranch}
              onChange={(e) => setGithubBranch(e.target.value)}
              disabled={uploading}
            />
          </div>

          <Button
            type="button"
            onClick={handleVerifyGitHub}
            disabled={!githubOwner.trim() || !githubRepo.trim() || verifying || uploading}
            variant="outline"
            className="w-full"
          >
            {verifying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Vérification...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Vérifier le dépôt
              </>
            )}
          </Button>

          {githubError && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{githubError}</AlertDescription>
            </Alert>
          )}

          {githubMetadata && (
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="font-semibold">Dépôt vérifié</span>
                  </div>
                  {githubMetadata.description && (
                    <p className="text-sm text-muted-foreground">{githubMetadata.description}</p>
                  )}
                  {githubMetadata.language && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Langage:</span>
                      <span className="text-xs font-medium">{githubMetadata.language}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Button
            type="button"
            onClick={handleSubmitGitHub}
            disabled={!githubMetadata || uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Ajout en cours...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Ajouter le dépôt
              </>
            )}
          </Button>
        </div>
      </TabsContent>

      {/* Local Tab */}
      <TabsContent value="local" className="space-y-4 mt-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="local-name">Nom du dépôt *</Label>
            <Input
              id="local-name"
              placeholder="ex: Mon Projet"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              disabled={uploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="local-description">Description</Label>
            <Textarea
              id="local-description"
              placeholder="Description du projet..."
              value={localDescription}
              onChange={(e) => setLocalDescription(e.target.value)}
              disabled={uploading}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Fichiers *</Label>
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
                dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
                uploading && 'opacity-50'
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Glissez-déposez vos fichiers ici ou
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  Sélectionner des fichiers
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => folderInputRef.current?.click()}
                  disabled={uploading}
                >
                  Sélectionner un dossier
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
              <input
                ref={folderInputRef}
                type="file"
                multiple
                {...({ webkitdirectory: "" } as any)}
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
            </div>

            {localFilesPreview.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {filteredFiles.length} fichier{filteredFiles.length > 1 ? 's' : ''} à uploader
                    {filesFiltered && (
                      <span className="ml-2 text-xs">
                        ({localFiles.length - filteredFiles.length} fichier{localFiles.length - filteredFiles.length > 1 ? 's' : ''} ignoré{localFiles.length - filteredFiles.length > 1 ? 's' : ''} par .gitignore)
                      </span>
                    )}
                  </p>
                </div>
                {gitignoreFound && (
                  <Alert className="bg-muted/50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Fichier .gitignore détecté. Les fichiers correspondant aux règles seront exclus de l&apos;upload.
                    </AlertDescription>
                  </Alert>
                )}
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {localFilesPreview.map((name, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      <span className="flex-1 truncate">{name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        disabled={uploading}
                        className="h-6 w-6 p-0"
                      >
                        <XCircle className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button
            type="button"
            onClick={handleSubmitLocal}
            disabled={!localName.trim() || filteredFiles.length === 0 || uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Upload en cours...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Créer le dépôt
              </>
            )}
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );
}

