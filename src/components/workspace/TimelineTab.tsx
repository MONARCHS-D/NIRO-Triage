'use client';

import React, { useState, useEffect } from 'react';
import { Patient } from '../../types/triage';
import { SourceBadge } from '../common/Badge';
import { Clock, User, Mic, FileText, Bot, UserCheck, Play, Pause, RotateCcw, Volume2 } from 'lucide-react';

interface TimelineTabProps {
  patient: Patient;
}

const AudioWaveformPlayer: React.FC<{
  durationSeconds?: number;
  language?: string;
}> = ({ durationSeconds = 42, language = 'Odia' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0); // 0 to 100
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlaybackProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + (100 / (durationSeconds * 10)) * playbackSpeed;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, durationSeconds, playbackSpeed]);

  const currentSeconds = Math.floor((playbackProgress / 100) * durationSeconds);
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const toggleSpeed = () => {
    if (playbackSpeed === 1.0) setPlaybackSpeed(1.25);
    else if (playbackSpeed === 1.25) setPlaybackSpeed(1.5);
    else setPlaybackSpeed(1.0);
  };

  const waveformHeights = [
    30, 45, 75, 60, 90, 40, 65, 85, 100, 70, 50, 80, 95, 60, 40, 70, 85, 60, 45, 90, 75, 55, 35, 65, 80, 50, 30, 20
  ];

  return (
    <div className="mt-3 p-3 rounded-lg bg-blue-50/70 border border-blue-100 flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-900">
          <Volume2 className="w-3.5 h-3.5 text-blue-600" />
          <span>Patient Audio Intake ({language})</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSpeed}
            className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors cursor-pointer"
            title="Toggle playback speed"
          >
            {playbackSpeed}x
          </button>
          <span className="text-[11px] font-mono text-blue-700">
            {formatTime(currentSeconds)} / {formatTime(durationSeconds)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          className={`p-2 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isPlaying
              ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
              : 'bg-white border border-blue-200 text-blue-700 hover:bg-blue-100'
          }`}
          title={isPlaying ? 'Pause Audio' : 'Play Audio'}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
        </button>

        {/* Dynamic Waveform Visualizer */}
        <div
          className="flex-1 flex items-center gap-1 h-8 px-2 bg-white/80 rounded-md border border-blue-100 cursor-pointer overflow-hidden"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const newProgress = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
            setPlaybackProgress(newProgress);
          }}
        >
          {waveformHeights.map((height, i) => {
            const barProgress = (i / waveformHeights.length) * 100;
            const isPlayed = barProgress <= playbackProgress;

            return (
              <div
                key={i}
                className={`flex-1 rounded-full transition-all duration-150 ${
                  isPlayed ? 'bg-blue-600' : 'bg-blue-200'
                } ${isPlaying && isPlayed ? 'animate-pulse' : ''}`}
                style={{
                  height: `${height}%`,
                }}
              />
            );
          })}
        </div>

        {playbackProgress > 0 && (
          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setPlaybackProgress(0);
            }}
            className="p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            title="Reset audio"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};

export const TimelineTab: React.FC<TimelineTabProps> = ({ patient }) => {
  return (
    <div className="bg-white rounded-xl border border-[#E6ECF2] p-6 shadow-xs max-w-4xl">
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#E6ECF2]">
        <div>
          <h3 className="text-base font-bold text-[#102033]">Patient Clinical &amp; Intake Timeline</h3>
          <p className="text-xs text-[#6B7B8F]">
            Chronological provenance tracking of patient statements, lab uploads, reviewer inputs, and advisory flags
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded bg-[#F8FAFC] border border-[#E6ECF2] text-[#25364A] tabular-nums">
          {patient.timeline.length} Events Logged
        </span>
      </div>

      <div className="relative pl-6 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E6ECF2]">
        {patient.timeline.map((event) => {
          return (
            <div key={event.id} className="relative group">
              {/* Event node icon */}
              <div className="absolute -left-6 top-0.5 w-6 h-6 rounded-full bg-white border-2 border-[#2563EB] flex items-center justify-center text-[#2563EB] shadow-xs">
                {event.source === 'VOICE' && <Mic className="w-3 h-3 text-[#2563EB]" />}
                {event.source === 'REPORT' && <FileText className="w-3 h-3 text-purple-600" />}
                {event.source === 'REVIEWER' && <UserCheck className="w-3 h-3 text-emerald-600" />}
                {(event.source === 'AI_DRAFT' || event.source === 'SYSTEM') && <Bot className="w-3 h-3 text-indigo-600" />}
              </div>

              {/* Event Content Card */}
              <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E6ECF2] hover:border-slate-300 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#102033]">{event.title}</span>
                    <SourceBadge source={event.source} />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#6B7B8F] tabular-nums">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{event.timestamp}</span>
                  </div>
                </div>

                <p className="mt-2 text-xs text-[#25364A] leading-relaxed">
                  {event.description}
                </p>

                {/* Audio Waveform Player for Voice intakes */}
                {event.source === 'VOICE' && (
                  <AudioWaveformPlayer language={patient.primaryLanguage} durationSeconds={38} />
                )}

                {/* Actor & Details line */}
                <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex flex-wrap items-center justify-between text-[11px] text-[#6B7B8F]">
                  <span className="flex items-center gap-1 font-medium text-[#25364A]">
                    <User className="w-3 h-3 text-[#526276]" />
                    Actor: {event.actor}
                  </span>
                  {event.details && (
                    <span className="italic text-[#526276]">{event.details}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
