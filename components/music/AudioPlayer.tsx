'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Repeat,
} from 'lucide-react';
import { AudioVisualization, VisualizationType } from './AudioVisualization';
import { MusicTrack } from '@/lib/supabaseClient';
import {
  savePlayerState,
  getPlayerState,
  savePlaylistState,
  getPlaylistState,
} from '@/lib/audioPlayerStorage';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ShareButton } from '@/components/ShareButton';

const VISUALIZATION_TYPES: VisualizationType[] = [
  'bars',
  'wave',
  'circle',
  'dots',
  'line',
];

const VISUALIZATION_NAMES: Record<VisualizationType, string> = {
  bars: 'Barres',
  wave: 'Onde',
  circle: 'Cercle',
  dots: 'Points',
  line: 'Ligne',
};

interface AudioPlayerProps {
  tracks: MusicTrack[];
  initialTrackIndex?: number;
  onTracksReorder?: (newOrder: number[]) => void;
}

export function AudioPlayer({ tracks, initialTrackIndex = 0, onTracksReorder }: AudioPlayerProps) {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(initialTrackIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [visualizationIndex, setVisualizationIndex] = useState(4);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<'none' | 'one' | 'all'>('none');
  const [shuffledPlaylist, setShuffledPlaylist] = useState<number[]>([]);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLInputElement>(null);
  const progressContainerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const previousTracksRef = useRef<MusicTrack[]>(tracks);

  const currentTrack = tracks[currentTrackIndex];
  const currentVisualization = VISUALIZATION_TYPES[visualizationIndex];

  // Générer la playlist aléatoire avec Fisher-Yates
  const generateShuffledPlaylist = useCallback(() => {
    const indices = tracks.map((_, index) => index);
    const shuffled = [...indices];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [tracks]);

  // Fonctions de navigation
  const playPrevious = useCallback(() => {
    if (tracks.length === 0) return;

    if (shuffle && shuffledPlaylist.length > 0) {
      // Trouver la position actuelle dans la playlist mélangée
      const currentShuffledIndex = shuffledPlaylist.indexOf(currentTrackIndex);
      if (currentShuffledIndex > 0) {
        const prevShuffledIndex = currentShuffledIndex - 1;
        setCurrentTrackIndex(shuffledPlaylist[prevShuffledIndex]);
        setIsPlaying(true);
      } else if (repeat === 'all') {
        // Aller au dernier morceau de la playlist mélangée
        setCurrentTrackIndex(shuffledPlaylist[shuffledPlaylist.length - 1]);
        setIsPlaying(true);
      }
    } else {
      // Ordre normal
      if (currentTrackIndex > 0) {
        setCurrentTrackIndex(currentTrackIndex - 1);
        setIsPlaying(true);
      } else if (repeat === 'all') {
        // Aller au dernier morceau
        setCurrentTrackIndex(tracks.length - 1);
        setIsPlaying(true);
      }
    }
  }, [tracks.length, shuffle, shuffledPlaylist, currentTrackIndex, repeat]);

  const playNext = useCallback(() => {
    if (tracks.length === 0) return;

    if (shuffle && shuffledPlaylist.length > 0) {
      // Trouver la position actuelle dans la playlist mélangée
      const currentShuffledIndex = shuffledPlaylist.indexOf(currentTrackIndex);
      if (currentShuffledIndex < shuffledPlaylist.length - 1) {
        const nextShuffledIndex = currentShuffledIndex + 1;
        setCurrentTrackIndex(shuffledPlaylist[nextShuffledIndex]);
        setIsPlaying(true);
      } else if (repeat === 'all') {
        // Aller au premier morceau de la playlist mélangée
        setCurrentTrackIndex(shuffledPlaylist[0]);
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }
    } else {
      // Ordre normal
      if (currentTrackIndex < tracks.length - 1) {
        setCurrentTrackIndex(currentTrackIndex + 1);
        setIsPlaying(true);
      } else if (repeat === 'all') {
        // Aller au premier morceau
        setCurrentTrackIndex(0);
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }
    }
  }, [tracks.length, shuffle, shuffledPlaylist, currentTrackIndex, repeat]);

  // Générer la playlist aléatoire quand shuffle est activé ou quand les tracks changent
  useEffect(() => {
    if (shuffle && tracks.length > 0) {
      setShuffledPlaylist(generateShuffledPlaylist());
    }
  }, [shuffle, tracks, generateShuffledPlaylist]);

  // Restaurer l'état de la playlist au chargement
  useEffect(() => {
    const savedState = getPlaylistState();
    if (savedState && tracks.length > 0) {
      // Vérifier que les trackIds correspondent
      const currentTrackIds = tracks.map((t) => t.id);
      if (
        savedState.trackIds.length === currentTrackIds.length &&
        savedState.trackIds.every((id, index) => id === currentTrackIds[index])
      ) {
        setShuffle(savedState.shuffle);
        setRepeat(savedState.repeat);
        if (savedState.currentIndex >= 0 && savedState.currentIndex < tracks.length) {
          setCurrentTrackIndex(savedState.currentIndex);
        }
      }
    }
  }, []); // Seulement au montage

  // Sauvegarder l'état de la playlist quand il change
  useEffect(() => {
    if (tracks.length > 0) {
      const trackIds = tracks.map((t) => t.id);
      savePlaylistState(trackIds, currentTrackIndex, shuffle, repeat);
    }
  }, [tracks, currentTrackIndex, shuffle, repeat]);

  // Mettre à jour currentTrackIndex si les tracks ont été réorganisés
  useEffect(() => {
    if (tracks.length === 0 || previousTracksRef.current.length === 0) {
      previousTracksRef.current = tracks;
      return;
    }

    const previousTracks = previousTracksRef.current;
    const currentTrackId = previousTracks[currentTrackIndex]?.id;

    // Vérifier si les tracks ont été réorganisés (mêmes IDs mais ordre différent)
    const previousIds = previousTracks.map((t) => t.id);
    const currentIds = tracks.map((t) => t.id);

    // Si les IDs sont les mêmes mais dans un ordre différent, c'est une réorganisation
    if (
      previousIds.length === currentIds.length &&
      previousIds.every((id) => currentIds.includes(id)) &&
      !previousIds.every((id, index) => id === currentIds[index])
    ) {
      // Trouver la nouvelle position du morceau actuel
      const newIndex = tracks.findIndex((t) => t.id === currentTrackId);
      if (newIndex !== -1 && newIndex !== currentTrackIndex) {
        setCurrentTrackIndex(newIndex);
      }
    }

    previousTracksRef.current = tracks;
  }, [tracks, currentTrackIndex]);

  // Restaurer la position et le volume au chargement d'un morceau
  useEffect(() => {
    if (currentTrack) {
      const savedState = getPlayerState(currentTrack.id);
      if (savedState) {
        setVolume(savedState.volume);
        if (audioRef.current && savedState.currentTime > 0) {
          audioRef.current.currentTime = savedState.currentTime;
        }
      }
    }
  }, [currentTrack?.id]);

  // Sauvegarder la position toutes les 5 secondes pendant la lecture
  useEffect(() => {
    if (isPlaying && currentTrack) {
      const interval = setInterval(() => {
        if (audioRef.current) {
          savePlayerState(
            currentTrack.id,
            audioRef.current.currentTime,
            volume
          );
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isPlaying, currentTrack, volume]);

  // Sauvegarder la position au changement de morceau
  useEffect(() => {
    return () => {
      // Cleanup : sauvegarder avant de changer de morceau
      if (currentTrack && audioRef.current) {
        savePlayerState(
          currentTrack.id,
          audioRef.current.currentTime,
          volume
        );
      }
    };
  }, [currentTrackIndex, currentTrack, volume]);

  // Sauvegarder avant le démontage
  useEffect(() => {
    return () => {
      if (currentTrack && audioRef.current) {
        savePlayerState(
          currentTrack.id,
          audioRef.current.currentTime,
          volume
        );
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [currentTrack, volume]);

  useEffect(() => {
    console.log('[AUDIO PLAYER] Current track:', currentTrack);
    console.log('[AUDIO PLAYER] Audio URL:', currentTrack?.audio_url);
  }, [currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setIsLoading(true);
    setError(null);

    const setAudioData = () => {
      console.log('[AUDIO PLAYER] Audio loaded - duration:', audio.duration);
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
      setIsLoading(false);
    };

    const setAudioTime = () => {
      if (progressBarRef.current) {
        progressBarRef.current.value = audio.currentTime.toString();
      }
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      if (repeat === 'one') {
        // Répéter le même morceau
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play();
        }
      } else {
        // Répéter toute la playlist ou pas de répétition
        playNext();
      }
    };

    const handleError = (e: ErrorEvent) => {
      console.error('[AUDIO PLAYER] Error loading audio:', e);
      console.error('[AUDIO PLAYER] Audio error code:', audio.error?.code);
      console.error('[AUDIO PLAYER] Audio error message:', audio.error?.message);
      setError('Erreur lors du chargement du fichier audio');
      setIsLoading(false);
      setIsPlaying(false);
    };

    const handleCanPlay = () => {
      console.log('[AUDIO PLAYER] Can play - audio ready');
      setIsLoading(false);
    };

    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError as any);
    audio.addEventListener('canplay', handleCanPlay);

    audio.load();

    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError as any);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [currentTrackIndex, repeat, playNext]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play();
    } else {
      audio.pause();
    }
  }, [currentTrackIndex]);

  const formatTime = (time: number) => {
    if (isNaN(time)) return '00:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        cancelAnimationFrame(animationRef.current!);
        setIsPlaying(false);
      } else {
        console.log('[AUDIO PLAYER] Attempting to play...');
        await audio.play();
        console.log('[AUDIO PLAYER] Playing successfully');
        animationRef.current = requestAnimationFrame(whilePlaying);
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('[AUDIO PLAYER] Play error:', err);
      setError('Impossible de lire le fichier audio');
      setIsPlaying(false);
    }
  }, [isPlaying]);

  const whilePlaying = () => {
    if (progressBarRef.current && audioRef.current) {
      progressBarRef.current.value = audioRef.current.currentTime.toString();
      setCurrentTime(audioRef.current.currentTime);
      animationRef.current = requestAnimationFrame(whilePlaying);
    }
  };

  const changeRange = () => {
    if (audioRef.current && progressBarRef.current) {
      audioRef.current.currentTime = Number(progressBarRef.current.value);
      setCurrentTime(Number(progressBarRef.current.value));
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const changeVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      setVolume(newVolume);
      if (newVolume === 0) {
        setIsMuted(true);
      } else if (isMuted) {
        setIsMuted(false);
      }
      // Sauvegarder le volume
      if (currentTrack) {
        savePlayerState(currentTrack.id, currentTime, newVolume);
      }
    }
  };

  // Gestion du survol de la barre de progression
  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressContainerRef.current || !duration) return;

    const rect = progressContainerRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const time = Math.max(0, Math.min(duration, percent * duration));
    setHoverTime(time);
  };

  const handleProgressMouseLeave = () => {
    setHoverTime(null);
  };

  // Contrôles clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorer si l'utilisateur est en train de taper dans un input
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Ignorer si un modal est ouvert (vérifier la présence de Dialog)
      const hasOpenDialog = document.querySelector('[role="dialog"]');
      if (hasOpenDialog) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          if (e.shiftKey) {
            e.preventDefault();
            playPrevious();
          } else {
            e.preventDefault();
            if (audioRef.current) {
              audioRef.current.currentTime = Math.max(
                0,
                audioRef.current.currentTime - 5
              );
            }
          }
          break;
        case 'ArrowRight':
          if (e.shiftKey) {
            e.preventDefault();
            playNext();
          } else {
            e.preventDefault();
            if (audioRef.current) {
              audioRef.current.currentTime = Math.min(
                duration,
                audioRef.current.currentTime + 5
              );
            }
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          const newVolumeUp = Math.min(1, volume + 0.1);
          if (audioRef.current) {
            audioRef.current.volume = newVolumeUp;
            setVolume(newVolumeUp);
            if (currentTrack) {
              savePlayerState(currentTrack.id, currentTime, newVolumeUp);
            }
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          const newVolumeDown = Math.max(0, volume - 0.1);
          if (audioRef.current) {
            audioRef.current.volume = newVolumeDown;
            setVolume(newVolumeDown);
            if (currentTrack) {
              savePlayerState(currentTrack.id, currentTime, newVolumeDown);
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [volume, duration, currentTrack, currentTime, togglePlay, playPrevious, playNext]);

  const toggleShuffle = () => {
    setShuffle(!shuffle);
    if (!shuffle) {
      // Activer shuffle : générer nouvelle playlist aléatoire
      setShuffledPlaylist(generateShuffledPlaylist());
    }
  };

  const toggleRepeat = () => {
    if (repeat === 'none') {
      setRepeat('all');
    } else if (repeat === 'all') {
      setRepeat('one');
    } else {
      setRepeat('none');
    }
  };

  const previousVisualization = () => {
    setVisualizationIndex((prev) =>
      prev === 0 ? VISUALIZATION_TYPES.length - 1 : prev - 1
    );
  };

  const nextVisualization = () => {
    setVisualizationIndex((prev) =>
      prev === VISUALIZATION_TYPES.length - 1 ? 0 : prev + 1
    );
  };

  if (!currentTrack) {
    return (
      <div className="w-full max-w-2xl mx-auto bg-card border border-border rounded-xl p-6 shadow-lg">
        <p className="text-center text-muted-foreground">
          Aucun morceau disponible
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-card border border-border rounded-xl p-6 shadow-lg">
      <div className="flex flex-col space-y-4">
        <div className="text-center mb-2">
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-xl font-bold">{currentTrack.title}</h2>
            <ShareButton
              url={`${typeof window !== 'undefined' ? window.location.origin : ''}/musique#track-${currentTrack.id}`}
              title={`${currentTrack.title} - ${currentTrack.artist || 'Artiste inconnu'}`}
              description={currentTrack.album || undefined}
              imageUrl={currentTrack.cover_image_url || undefined}
              type="music"
              variant="ghost"
              size="sm"
            />
          </div>
          <p className="text-muted-foreground">{currentTrack.artist || 'Artiste inconnu'}</p>
          {currentTrack.album && (
            <p className="text-sm text-muted-foreground">{currentTrack.album}</p>
          )}
          {isLoading && (
            <p className="text-sm text-blue-500 mt-2">Chargement...</p>
          )}
          {error && (
            <p className="text-sm text-red-500 mt-2">{error}</p>
          )}
        </div>

        <div className="flex items-center justify-center gap-4 mb-2">
          <button
            onClick={previousVisualization}
            className="p-2 rounded-full hover:bg-secondary/80 transition-colors"
            aria-label="Visualisation précédente"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={nextVisualization}
            className="p-2 rounded-full hover:bg-secondary/80 transition-colors"
            aria-label="Visualisation suivante"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <AudioVisualization
          audioElement={audioRef.current}
          isPlaying={isPlaying}
          visualizationType={currentVisualization}
        />

        <div
          ref={progressContainerRef}
          className="flex items-center space-x-2 relative"
          onMouseMove={handleProgressMouseMove}
          onMouseLeave={handleProgressMouseLeave}
        >
          <span className="text-sm text-muted-foreground w-12 text-right">
            {formatTime(currentTime)}
          </span>
          <div className="flex-1 relative">
            <input
              type="range"
              ref={progressBarRef}
              defaultValue="0"
              onChange={changeRange}
              min="0"
              max={duration}
              step="0.01"
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
            />
            {hoverTime !== null && duration > 0 && (
              <div
                className="absolute top-0 h-2 bg-primary/30 pointer-events-none z-10"
                style={{
                  left: `${(hoverTime / duration) * 100}%`,
                  width: '2px',
                }}
              />
            )}
            {hoverTime !== null && duration > 0 && (
              <div
                className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs shadow-md pointer-events-none z-20 whitespace-nowrap"
                style={{
                  left: `${(hoverTime / duration) * 100}%`,
                }}
              >
                {formatTime(hoverTime)}
              </div>
            )}
          </div>
          <span className="text-sm text-muted-foreground w-12">
            {formatTime(duration)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleShuffle}
                    className={`p-2 rounded-full transition-colors ${
                      shuffle
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'hover:bg-secondary/80'
                    }`}
                    aria-label={shuffle ? 'Désactiver le mode aléatoire' : 'Activer le mode aléatoire'}
                  >
                    <Shuffle size={20} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{shuffle ? 'Mode aléatoire activé' : 'Mode aléatoire désactivé'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <button
              onClick={playPrevious}
              disabled={tracks.length === 0 || (currentTrackIndex === 0 && repeat !== 'all')}
              className="p-2 rounded-full hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Morceau précédent"
            >
              <SkipBack size={24} />
            </button>
            <button
              onClick={togglePlay}
              className="p-4 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              aria-label={isPlaying ? 'Pause' : 'Lecture'}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <button
              onClick={playNext}
              disabled={tracks.length === 0 || (currentTrackIndex === tracks.length - 1 && repeat !== 'all')}
              className="p-2 rounded-full hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Morceau suivant"
            >
              <SkipForward size={24} />
            </button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleRepeat}
                    className={`p-2 rounded-full transition-colors ${
                      repeat !== 'none'
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'hover:bg-secondary/80'
                    }`}
                    aria-label={
                      repeat === 'none'
                        ? 'Activer la répétition'
                        : repeat === 'all'
                        ? 'Répéter toute la playlist'
                        : 'Répéter un morceau'
                    }
                  >
                    {repeat === 'one' ? (
                      <div className="relative">
                        <Repeat size={20} />
                        <span className="absolute -top-1 -right-1 text-xs">1</span>
                      </div>
                    ) : (
                      <Repeat size={20} />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {repeat === 'none'
                      ? 'Pas de répétition'
                      : repeat === 'all'
                      ? 'Répéter toute la playlist'
                      : 'Répéter un morceau'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleMute}
              className="p-2 rounded-full hover:bg-secondary/80 transition-colors"
              aria-label={isMuted ? 'Réactiver le son' : 'Couper le son'}
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={changeVolume}
              className="w-24 h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
              aria-label="Contrôle du volume"
            />
          </div>
        </div>

        {tracks.length > 1 && (
          <div className="text-center text-sm text-muted-foreground">
            Morceau {currentTrackIndex + 1} sur {tracks.length}
          </div>
        )}
      </div>
      <audio
        ref={audioRef}
        src={currentTrack.audio_url}
        preload="auto"
        crossOrigin="anonymous"
      />
    </div>
  );
}
