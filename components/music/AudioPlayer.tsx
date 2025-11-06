'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AudioVisualization, VisualizationType } from './AudioVisualization';
import { MusicTrack } from '@/lib/supabaseClient';

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
}

export function AudioPlayer({ tracks, initialTrackIndex = 0 }: AudioPlayerProps) {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(initialTrackIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [visualizationIndex, setVisualizationIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLInputElement>(null);
  const animationRef = useRef<number>();

  const currentTrack = tracks[currentTrackIndex];
  const currentVisualization = VISUALIZATION_TYPES[visualizationIndex];

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
      playNext();
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
  }, [currentTrackIndex]);

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

  const togglePlay = async () => {
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
  };

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
    }
  };

  const playPrevious = () => {
    if (currentTrackIndex > 0) {
      setCurrentTrackIndex(currentTrackIndex - 1);
      setIsPlaying(true);
    }
  };

  const playNext = () => {
    if (currentTrackIndex < tracks.length - 1) {
      setCurrentTrackIndex(currentTrackIndex + 1);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
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
          <h2 className="text-xl font-bold">{currentTrack.title}</h2>
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

        <div className="flex items-center justify-between mb-2">
          <button
            onClick={previousVisualization}
            className="p-2 rounded-full hover:bg-secondary/80 transition-colors"
            aria-label="Visualisation précédente"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm text-muted-foreground font-medium">
            {VISUALIZATION_NAMES[currentVisualization]}
          </span>
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

        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground w-12 text-right">
            {formatTime(currentTime)}
          </span>
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
          <span className="text-sm text-muted-foreground w-12">
            {formatTime(duration)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={playPrevious}
              disabled={currentTrackIndex === 0}
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
              disabled={currentTrackIndex === tracks.length - 1}
              className="p-2 rounded-full hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Morceau suivant"
            >
              <SkipForward size={24} />
            </button>
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
