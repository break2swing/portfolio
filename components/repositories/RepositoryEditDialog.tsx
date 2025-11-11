'use client';

import { useState, useEffect } from 'react';
import { Repository } from '@/lib/supabaseClient';
import { repositoryService } from '@/services/repositoryService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, Github, Folder } from 'lucide-react';
import { toast } from 'sonner';

interface RepositoryEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repository: Repository;
  onSuccess: () => void;
}

export function RepositoryEditDialog({
  open,
  onOpenChange,
  repository,
  onSuccess,
}: RepositoryEditDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [githubOwner, setGithubOwner] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [githubBranch, setGithubBranch] = useState('main');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (repository) {
      setName(repository.name);
      setDescription(repository.description || '');
      setIsPublic(repository.is_public);
      if (repository.source_type === 'github') {
        setGithubOwner(repository.github_owner || '');
        setGithubRepo(repository.github_repo || '');
        setGithubBranch(repository.github_branch || 'main');
      }
    }
  }, [repository]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Le nom est requis');
      return;
    }

    setUpdating(true);

    try {
      const updates: Partial<Repository> = {
        name: name.trim(),
        description: description.trim() || null,
        is_public: isPublic,
      };

      // Pour les dépôts GitHub, mettre à jour aussi les infos GitHub
      if (repository.source_type === 'github') {
        updates.github_owner = githubOwner.trim();
        updates.github_repo = githubRepo.trim();
        updates.github_branch = githubBranch.trim() || 'main';
      }

      const { repository: updatedRepo, error } = await repositoryService.updateRepository(
        repository.id,
        updates
      );

      if (error) {
        toast.error('Erreur', { description: error.message || 'Impossible de mettre à jour le dépôt' });
        return;
      }

      toast.success('Dépôt mis à jour avec succès');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error('Erreur', { description: 'Une erreur inattendue s\'est produite' });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {repository.source_type === 'github' ? (
              <Github className="h-5 w-5" />
            ) : (
              <Folder className="h-5 w-5" />
            )}
            Éditer le dépôt
          </DialogTitle>
          <DialogDescription>
            Modifiez les informations du dépôt
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nom *</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={updating}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={updating}
              rows={3}
            />
          </div>

          {repository.source_type === 'github' && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium">Informations GitHub</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-github-owner">Propriétaire *</Label>
                  <Input
                    id="edit-github-owner"
                    value={githubOwner}
                    onChange={(e) => setGithubOwner(e.target.value)}
                    disabled={updating}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-github-repo">Dépôt *</Label>
                  <Input
                    id="edit-github-repo"
                    value={githubRepo}
                    onChange={(e) => setGithubRepo(e.target.value)}
                    disabled={updating}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-github-branch">Branche</Label>
                <Input
                  id="edit-github-branch"
                  value={githubBranch}
                  onChange={(e) => setGithubBranch(e.target.value)}
                  disabled={updating}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-t pt-4">
            <div className="space-y-0.5">
              <Label htmlFor="edit-public">Dépôt public</Label>
              <p className="text-sm text-muted-foreground">
                Le dépôt sera visible par tous les visiteurs
              </p>
            </div>
            <Switch
              id="edit-public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
              disabled={updating}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updating}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={updating}>
              {updating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                'Enregistrer'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

