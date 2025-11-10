'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useColorTheme, ColorThemeName } from '@/contexts/ColorThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { getSearchHistory, clearSearchHistory, removeSearchQuery } from '@/lib/searchHistory';
import { Trash2, Clock, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const colorThemes: { value: Exclude<ColorThemeName, 'custom'>; label: string; description: string }[] = [
  { value: 'ocean', label: 'Océan', description: 'Tons bleus et cyan apaisants' },
  { value: 'forest', label: 'Forêt', description: 'Verts naturels et rafraîchissants' },
  { value: 'sun', label: 'Soleil', description: 'Jaunes et oranges chaleureux' },
  { value: 'rose', label: 'Rose', description: 'Roses et fuchsias élégants' },
];

function hslToHex(hsl: string): string {
  const [h, s, l] = hsl.split(' ').map(v => parseFloat(v));
  const saturation = s / 100;
  const lightness = l / 100;

  const c = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lightness - c / 2;

  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `${h} ${s}% ${l}%`;
}

export default function ParametresPage() {
  const { theme, setTheme } = useTheme();
  const { colorTheme, setColorTheme, customColors, setCustomColors } = useColorTheme();
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    setSearchHistory(getSearchHistory());
    
    // Écouter les changements dans localStorage pour mettre à jour l'historique
    const handleStorageChange = () => {
      setSearchHistory(getSearchHistory());
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleClearHistory = () => {
    clearSearchHistory();
    setSearchHistory([]);
  };

  const handleRemoveQuery = (query: string) => {
    removeSearchQuery(query);
    setSearchHistory(getSearchHistory());
  };

  const handleCustomColorChange = (key: 'primary' | 'secondary' | 'accent', hexValue: string) => {
    const hslValue = hexToHsl(hexValue);
    setCustomColors({
      ...customColors,
      [key]: hslValue,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Paramètres</h1>
        <p className="text-muted-foreground">
          Personnalisez l&apos;apparence de l&apos;application
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thème d&apos;affichage</CardTitle>
          <CardDescription>
            Choisissez le mode d&apos;affichage qui vous convient le mieux
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={theme} onValueChange={(value) => setTheme(value as any)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="light" id="light" />
              <Label htmlFor="light" className="cursor-pointer">
                Clair
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="dark" id="dark" />
              <Label htmlFor="dark" className="cursor-pointer">
                Sombre
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="system" id="system" />
              <Label htmlFor="system" className="cursor-pointer">
                Système (par défaut)
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thème de couleur</CardTitle>
          <CardDescription>
            Sélectionnez une palette de couleurs ou créez la vôtre
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label className="text-base font-medium">Thèmes prédéfinis</Label>
            <div className="grid gap-4 sm:grid-cols-2">
              {colorThemes.map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => setColorTheme(theme.value)}
                  className={`flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition-all hover:border-primary ${
                    colorTheme === theme.value ? 'border-primary bg-accent' : 'border-border'
                  }`}
                >
                  <div className="font-medium">{theme.label}</div>
                  <div className="text-sm text-muted-foreground">{theme.description}</div>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="custom"
                checked={colorTheme === 'custom'}
                onChange={() => setColorTheme('custom')}
                className="cursor-pointer"
              />
              <Label htmlFor="custom" className="text-base font-medium cursor-pointer">
                Thème personnalisé
              </Label>
            </div>

            {colorTheme === 'custom' && (
              <div className="space-y-4 pl-6">
                <p className="text-sm text-muted-foreground">
                  Choisissez vos propres couleurs pour créer un thème unique
                </p>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="primary-color">Couleur principale</Label>
                    <input
                      type="color"
                      id="primary-color"
                      value={hslToHex(customColors.primary)}
                      onChange={(e) => handleCustomColorChange('primary', e.target.value)}
                      className="h-10 w-full cursor-pointer rounded border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondary-color">Couleur secondaire</Label>
                    <input
                      type="color"
                      id="secondary-color"
                      value={hslToHex(customColors.secondary)}
                      onChange={(e) => handleCustomColorChange('secondary', e.target.value)}
                      className="h-10 w-full cursor-pointer rounded border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accent-color">Couleur d&apos;accent</Label>
                    <input
                      type="color"
                      id="accent-color"
                      value={hslToHex(customColors.accent)}
                      onChange={(e) => handleCustomColorChange('accent', e.target.value)}
                      className="h-10 w-full cursor-pointer rounded border"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historique de recherche</CardTitle>
          <CardDescription>
            Gérez vos recherches récentes ({searchHistory.length} recherche{searchHistory.length > 1 ? 's' : ''})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {searchHistory.length > 0 ? (
            <>
              <div className="space-y-2">
                {searchHistory.map((query, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-md border p-3 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm truncate">{query}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={() => handleRemoveQuery(query)}
                      aria-label={`Supprimer "${query}" de l'historique`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="w-full">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Effacer tout l&apos;historique
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Effacer l&apos;historique de recherche</AlertDialogTitle>
                    <AlertDialogDescription>
                      Êtes-vous sûr de vouloir effacer tout l&apos;historique de recherche ? Cette action est irréversible.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearHistory}>
                      Effacer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune recherche récente
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
