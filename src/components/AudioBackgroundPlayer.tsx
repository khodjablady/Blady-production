import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  Volume1, 
  VolumeX, 
  Play, 
  Pause, 
  Music, 
  Sliders, 
  Sparkles, 
  X, 
  Radio, 
  Check, 
  Disc,
  Headphones
} from 'lucide-react';
import { ambientAudioService, AUDIO_PRESETS, AudioPreset } from '../services/ambientAudioService';

export const AudioBackgroundPlayer: React.FC = () => {
  const [audioState, setAudioState] = useState(ambientAudioService.getState());
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Sync with audio service state changes
  useEffect(() => {
    const unsubscribe = ambientAudioService.subscribe(() => {
      setAudioState(ambientAudioService.getState());
    });
    return () => unsubscribe();
  }, []);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsPopoverOpen(false);
      }
    };
    if (isPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPopoverOpen]);

  const { isPlaying, isMuted, volume, effectiveVolume, currentPreset } = audioState;
  const volumePercentage = isMuted ? 0 : Math.round(volume * 100);

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX className="w-4 h-4 text-slate-400" />;
    if (volume < 0.5) return <Volume1 className="w-4 h-4 text-emerald-400" />;
    return <Volume2 className="w-4 h-4 text-emerald-400" />;
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Navbar Button Trigger */}
      <div className="flex items-center space-x-1 bg-slate-950/80 border border-slate-800 hover:border-slate-700 p-1 rounded-xl shadow-sm transition-all">
        
        {/* Play / Pause Toggle Button */}
        <button
          onClick={() => ambientAudioService.togglePlay()}
          className={`flex items-center space-x-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
            isPlaying
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
          title={isPlaying ? 'Mettre en pause la musique douce' : 'Lancer la musique douce relaxante'}
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              {/* Dancing sound bars animation */}
              <div className="flex items-end space-x-0.5 h-3 px-0.5">
                <span className="w-0.5 bg-emerald-400 rounded-full animate-[bounce_1s_infinite_100ms] h-2"></span>
                <span className="w-0.5 bg-emerald-400 rounded-full animate-[bounce_1s_infinite_300ms] h-3"></span>
                <span className="w-0.5 bg-emerald-400 rounded-full animate-[bounce_1s_infinite_200ms] h-1.5"></span>
              </div>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 text-slate-300 fill-slate-300 shrink-0" />
              <span className="text-[11px] hidden sm:inline text-slate-300">Musique</span>
            </>
          )}
        </button>

        {/* Volume & Menu Trigger Button */}
        <button
          onClick={() => setIsPopoverOpen(!isPopoverOpen)}
          className={`flex items-center space-x-1 px-1.5 py-1 rounded-lg text-xs transition-colors ${
            isPopoverOpen ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
          title="Réglages du volume et ambiance sonore"
        >
          {getVolumeIcon()}
          <span className="font-mono text-[10px] text-slate-300 w-6 text-left">
            {volumePercentage}%
          </span>
        </button>
      </div>

      {/* Popover Controller Menu */}
      {isPopoverOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-4">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white tracking-tight">Ambiance Musicale Douce</h4>
                <p className="text-[10px] text-slate-400">Synthèse sonore relaxante & apaisante</p>
              </div>
            </div>

            <button
              onClick={() => setIsPopoverOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Master Play/Pause and Quick Status */}
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <div className="space-y-0.5 truncate max-w-[170px]">
              <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider block">
                {isPlaying ? '● En cours de lecture' : '○ En pause'}
              </span>
              <span className="text-xs font-medium text-white truncate block">
                {currentPreset.name}
              </span>
            </div>

            <button
              onClick={() => ambientAudioService.togglePlay()}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md ${
                isPlaying
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Écouter</span>
                </>
              )}
            </button>
          </div>

          {/* Volume Slider Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <button 
                  onClick={() => ambientAudioService.toggleMute()}
                  className="hover:text-emerald-400 transition-colors"
                  title={isMuted ? 'Activer le son' : 'Couper le son (Muet)'}
                >
                  {getVolumeIcon()}
                </button>
                <span>Volume sonore</span>
              </span>
              <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900/60">
                {volumePercentage}%
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : Math.round(volume * 100)}
                onChange={(e) => ambientAudioService.setVolume(parseInt(e.target.value, 10) / 100)}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-all"
                title="Ajuster le niveau sonore"
              />
            </div>

            {/* Quick volume presets */}
            <div className="grid grid-cols-4 gap-1.5 pt-1 text-[10px] font-mono">
              <button
                onClick={() => ambientAudioService.setVolume(0.10)}
                className="py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                10% Doux
              </button>
              <button
                onClick={() => ambientAudioService.setVolume(0.25)}
                className="py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-emerald-400 font-bold hover:text-emerald-300 transition-colors"
              >
                25% Idéal
              </button>
              <button
                onClick={() => ambientAudioService.setVolume(0.50)}
                className="py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
              >
                50% Médium
              </button>
              <button
                onClick={() => ambientAudioService.toggleMute()}
                className={`py-1 rounded border transition-colors ${
                  isMuted 
                    ? 'bg-rose-950 text-rose-300 border-rose-800 font-bold' 
                    : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-400'
                }`}
              >
                {isMuted ? 'Démuter' : 'Muet'}
              </button>
            </div>
          </div>

          {/* Soundscape Preset Selection */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono block">
              Thèmes Harmoniques :
            </span>

            <div className="space-y-1.5">
              {AUDIO_PRESETS.map((preset) => {
                const isSelected = preset.id === currentPreset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => ambientAudioService.setPreset(preset.id)}
                    className={`w-full text-left p-2 rounded-xl border text-xs transition-all flex items-start justify-between ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500/60 text-white shadow-sm ring-1 ring-emerald-500/30'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-850 hover:text-white'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold flex items-center space-x-1.5">
                        <Music className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                        <span>{preset.name}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1">{preset.description}</p>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
