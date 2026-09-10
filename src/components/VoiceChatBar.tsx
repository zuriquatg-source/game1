import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { Mic, MicOff, Volume2, VolumeX, Radio, AlertCircle, RefreshCw } from 'lucide-react';
import { Player } from '../types.ts';
import { sound } from '../utils/audio.ts';

interface VoiceChatBarProps {
  socket: Socket | null;
  currentPlayerId: string;
  players: Player[];
  roomCode: string;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};

export const VoiceChatBar: React.FC<VoiceChatBarProps> = ({
  socket,
  currentPlayerId,
  players,
  roomCode,
}) => {
  const [isMicOn, setIsMicOn] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [speakingPlayers, setSpeakingPlayers] = useState<Record<string, boolean>>({});
  const [activeVoicePeers, setActiveVoicePeers] = useState<string[]>([]);
  const [micError, setMicError] = useState<string | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const iceCandidateQueueRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Helper to ensure audio is unblocked on any interaction
  const resumeAudioPlayback = useCallback(() => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {});
    }
    audioElementsRef.current.forEach((audio) => {
      if (audio.paused && audio.srcObject) {
        audio.play().catch(() => {});
      }
    });
  }, []);

  const closePeer = useCallback((peerId: string) => {
    const pc = peerConnectionsRef.current.get(peerId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(peerId);
    }
    const audio = audioElementsRef.current.get(peerId);
    if (audio) {
      audio.srcObject = null;
      audio.pause();
      audioElementsRef.current.delete(peerId);
    }
    iceCandidateQueueRef.current.delete(peerId);
  }, []);

  // Initiate WebRTC connection to a peer with deterministic initiator role
  const getOrCreateConnection = useCallback((peerId: string, shouldInitiateOffer: boolean) => {
    let pc = peerConnectionsRef.current.get(peerId);
    if (pc && pc.connectionState !== 'closed' && pc.connectionState !== 'failed') {
      if (shouldInitiateOffer && pc.signalingState === 'stable') {
        pc.createOffer({ offerToReceiveAudio: true })
          .then((offer) => pc!.setLocalDescription(offer))
          .then(() => {
            if (socket && pc!.localDescription) {
              socket.emit('voice:signal', {
                targetPlayerId: peerId,
                signal: { type: 'offer', offer: pc!.localDescription },
              });
            }
          })
          .catch((err) => console.error('Error creating offer on existing pc:', err));
      }
      return pc;
    }

    // Close any previous stale connection
    closePeer(peerId);

    pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current.set(peerId, pc);
    iceCandidateQueueRef.current.set(peerId, []);

    // Add local audio tracks if available
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        pc!.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle ICE Candidate
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('voice:signal', {
          targetPlayerId: peerId,
          signal: { type: 'candidate', candidate: event.candidate },
        });
      }
    };

    // Handle incoming remote audio stream (crucial for bidirectional hearing)
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (!remoteStream) return;

      let audio = audioElementsRef.current.get(peerId);
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        (audio as any).playsInline = true;
        audioElementsRef.current.set(peerId, audio);
      }
      audio.srcObject = remoteStream;
      audio.muted = isDeafened;
      audio.play().catch(() => {
        // Will be played on next user interaction
      });

      // Dual fallback through AudioContext destination
      try {
        if (!audioContextRef.current) {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) audioContextRef.current = new AudioCtx();
        }
        if (audioContextRef.current && audioContextRef.current.state === 'running') {
          const source = audioContextRef.current.createMediaStreamSource(remoteStream);
          source.connect(audioContextRef.current.destination);
        }
      } catch {
        // Ignore fallback error
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc!.connectionState === 'disconnected' || pc!.connectionState === 'failed') {
        closePeer(peerId);
      }
    };

    // If deterministic initiator, create and send offer
    if (shouldInitiateOffer) {
      pc.createOffer({ offerToReceiveAudio: true })
        .then((offer) => pc!.setLocalDescription(offer))
        .then(() => {
          if (socket && pc!.localDescription) {
            socket.emit('voice:signal', {
              targetPlayerId: peerId,
              signal: { type: 'offer', offer: pc!.localDescription },
            });
          }
        })
        .catch((err) => console.error('Error creating initial offer:', err));
    }

    return pc;
  }, [closePeer, isDeafened, socket]);

  // Clean up on unmount or roomCode change
  useEffect(() => {
    return () => {
      leaveVoice();
    };
  }, [roomCode]);

  // Handle Socket signaling events
  useEffect(() => {
    if (!socket) return;

    // When another peer joins voice:
    const handlePeerJoined = ({ playerId }: { playerId: string }) => {
      if (playerId === currentPlayerId) return;
      setActiveVoicePeers((prev) => Array.from(new Set([...prev, playerId])));

      // Deterministic negotiation: higher ID initiates offer to lower ID
      // This eliminates collision / one-way audio completely!
      if (localStreamRef.current) {
        const shouldInitiate = currentPlayerId > playerId;
        getOrCreateConnection(playerId, shouldInitiate);
      }
    };

    // When a peer leaves voice:
    const handlePeerLeft = ({ playerId }: { playerId: string }) => {
      closePeer(playerId);
      setActiveVoicePeers((prev) => prev.filter((id) => id !== playerId));
      setSpeakingPlayers((prev) => {
        const next = { ...prev };
        delete next[playerId];
        return next;
      });
    };

    // Process incoming WebRTC signal (Offer, Answer, ICE Candidate)
    const handleSignal = async ({
      senderPlayerId,
      signal,
    }: {
      senderPlayerId: string;
      signal: any;
    }) => {
      if (senderPlayerId === currentPlayerId) return;

      try {
        let pc = peerConnectionsRef.current.get(senderPlayerId);
        if (!pc) {
          pc = getOrCreateConnection(senderPlayerId, false);
        }

        if (signal.type === 'offer') {
          // If we receive an offer, set remote and send answer
          await pc.setRemoteDescription(new RTCSessionDescription(signal.offer));

          // Drain queued ICE candidates
          const queued = iceCandidateQueueRef.current.get(senderPlayerId) || [];
          for (const cand of queued) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            } catch (e) {
              console.warn('Queued candidate error:', e);
            }
          }
          iceCandidateQueueRef.current.set(senderPlayerId, []);

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit('voice:signal', {
            targetPlayerId: senderPlayerId,
            signal: { type: 'answer', answer },
          });
        } else if (signal.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.answer));

          // Drain queued ICE candidates
          const queued = iceCandidateQueueRef.current.get(senderPlayerId) || [];
          for (const cand of queued) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            } catch (e) {
              console.warn('Queued candidate error:', e);
            }
          }
          iceCandidateQueueRef.current.set(senderPlayerId, []);
        } else if (signal.type === 'candidate' && signal.candidate) {
          // If remote description isn't set yet, queue the candidate!
          if (!pc.remoteDescription) {
            const currentQueue = iceCandidateQueueRef.current.get(senderPlayerId) || [];
            currentQueue.push(signal.candidate);
            iceCandidateQueueRef.current.set(senderPlayerId, currentQueue);
          } else {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
            } catch (e) {
              console.warn('Error adding ICE candidate directly:', e);
            }
          }
        }
      } catch (err) {
        console.error('WebRTC signal handling error:', err);
      }
    };

    // Status updates (speaking/muted)
    const handleStatusUpdate = ({
      playerId,
      isSpeaking,
    }: {
      playerId: string;
      isSpeaking: boolean;
    }) => {
      setSpeakingPlayers((prev) => ({
        ...prev,
        [playerId]: isSpeaking,
      }));
    };

    socket.on('voice:peer-joined', handlePeerJoined);
    socket.on('voice:peer-left', handlePeerLeft);
    socket.on('voice:signal', handleSignal);
    socket.on('voice:status-update', handleStatusUpdate);

    return () => {
      socket.off('voice:peer-joined', handlePeerJoined);
      socket.off('voice:peer-left', handlePeerLeft);
      socket.off('voice:signal', handleSignal);
      socket.off('voice:status-update', handleStatusUpdate);
    };
  }, [socket, currentPlayerId, getOrCreateConnection, closePeer]);

  // Start Voice (Request Mic)
  const startVoice = async () => {
    setMicError(null);
    resumeAudioPlayback();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicError('المتصفح لا يدعم الوصول المباشر للمايك أو يتطلب تشغيل الموقع عبر HTTPS 🎙️');
      setTimeout(() => setMicError(null), 5000);
      return;
    }

    try {
      sound.playClick();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      localStreamRef.current = stream;
      setIsMicOn(true);
      setIsMuted(false);

      // Audio analysis for speaking indicator
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') ctx.resume();
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        src.connect(analyser);
        audioContextRef.current = ctx;
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        let wasSpeaking = false;

        const checkSpeaking = () => {
          if (!analyserRef.current || !localStreamRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const isNowSpeaking = avg > 22 && !isMuted;

          if (isNowSpeaking !== wasSpeaking) {
            wasSpeaking = isNowSpeaking;
            setSpeakingPlayers((prev) => ({
              ...prev,
              [currentPlayerId]: isNowSpeaking,
            }));
            if (socket) {
              socket.emit('voice:status', {
                isMuted: isMuted,
                isSpeaking: isNowSpeaking,
              });
            }
          }
          animFrameRef.current = requestAnimationFrame(checkSpeaking);
        };

        checkSpeaking();
      } catch (err) {
        console.warn('AudioContext voice meter issue:', err);
      }

      // Notify server that we joined voice
      if (socket) {
        socket.emit('voice:join');
      }

      // Connect with all other players in the room deterministically
      players.forEach((p) => {
        if (p.id !== currentPlayerId) {
          // Deterministic initiator: only peer with higher ID initiates offer
          const shouldInitiate = currentPlayerId > p.id;
          getOrCreateConnection(p.id, shouldInitiate);
        }
      });
    } catch (err: any) {
      console.error('Microphone access failed:', err);
      setMicError('يرجى السماح بالوصول للميكروفون من إعدادات المتصفح للحديث مع أصدقائك 🎙️');
      setIsMicOn(false);
      setTimeout(() => setMicError(null), 5000);
    }
  };

  // Toggle Mute
  const toggleMute = () => {
    sound.playClick();
    resumeAudioPlayback();
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      const nextMuted = !isMuted;
      audioTrack.enabled = !nextMuted;
      setIsMuted(nextMuted);
      if (socket) {
        socket.emit('voice:status', {
          isMuted: nextMuted,
          isSpeaking: false,
        });
      }
    }
  };

  // Toggle Hearing (Deafen)
  const toggleDeafen = () => {
    sound.playClick();
    resumeAudioPlayback();
    const nextDeaf = !isDeafened;
    setIsDeafened(nextDeaf);
    audioElementsRef.current.forEach((audio) => {
      audio.muted = nextDeaf;
    });
  };

  // Re-sync Audio (Fix for friend not hearing or autoplay pause)
  const handleResyncAudio = () => {
    sound.playClick();
    resumeAudioPlayback();
    // Re-trigger offer to peers if needed
    if (localStreamRef.current && socket) {
      players.forEach((p) => {
        if (p.id !== currentPlayerId) {
          const shouldInitiate = currentPlayerId > p.id;
          getOrCreateConnection(p.id, shouldInitiate);
        }
      });
    }
  };

  // Leave Voice Chat
  const leaveVoice = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();
    audioElementsRef.current.forEach((audio) => {
      audio.srcObject = null;
      audio.pause();
    });
    audioElementsRef.current.clear();
    iceCandidateQueueRef.current.clear();

    setIsMicOn(false);
    setIsMuted(false);
    if (socket) {
      socket.emit('voice:leave');
    }
  };

  return (
    <div id="voice-chat-bar" className="w-full max-w-md mx-auto px-4 py-2">
      {/* Mic permission error banner */}
      {micError && (
        <div className="mb-2 p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-bold flex items-center gap-2 text-right">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{micError}</span>
        </div>
      )}

      {/* Voice Control Capsule */}
      <div className="bg-slate-850/95 backdrop-blur-md rounded-2xl border border-slate-700/80 p-2.5 shadow-xl flex items-center justify-between gap-2">
        {/* Left: Status & Active Speakers */}
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isMicOn
                ? speakingPlayers[currentPlayerId]
                  ? 'bg-emerald-400 animate-ping'
                  : 'bg-emerald-500'
                : 'bg-slate-600'
            }`}
          />
          <div className="text-right">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-white">
              <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>شات صوتي (مايك فوري)</span>
            </div>
            <div className="text-[10px] text-slate-400 font-semibold">
              {isMicOn
                ? isMuted
                  ? 'المايك مكتوم 🔇'
                  : 'المايك يعمل 🎙️ (الصوت متصل)'
                : 'اضغط للحديث مع أصدقائك 🗣️'}
            </div>
          </div>
        </div>

        {/* Right: Interactive Buttons */}
        <div className="flex items-center gap-1.5">
          {!isMicOn ? (
            /* Button to Activate Mic */
            <button
              type="button"
              onClick={startVoice}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
            >
              <Mic className="w-4 h-4" />
              <span>تشغيل المايك</span>
            </button>
          ) : (
            /* Active Controls: Mute / Deafen / Re-sync / Disconnect */
            <>
              {/* Mute/Unmute Mic */}
              <button
                type="button"
                onClick={toggleMute}
                title={isMuted ? 'إلغاء الكتم' : 'كتم المايك'}
                className={`p-2.5 rounded-xl border transition-all active:scale-95 cursor-pointer ${
                  isMuted
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 hover:bg-rose-500/30'
                    : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30'
                }`}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Speaker On / Off */}
              <button
                type="button"
                onClick={toggleDeafen}
                title={isDeafened ? 'تشغيل الصوت' : 'كتم أصوات الآخرين'}
                className={`p-2.5 rounded-xl border transition-all active:scale-95 cursor-pointer ${
                  isDeafened
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 hover:bg-amber-500/30'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                {isDeafened ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Quick Re-sync in case of audio glitch */}
              <button
                type="button"
                onClick={handleResyncAudio}
                title="تنشيط وتحديث اتصال الصوت"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-amber-300 border border-slate-700 text-[11px] font-bold transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              {/* Turn Off Mic */}
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  leaveVoice();
                }}
                title="إيقاف المايك تماماً"
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 text-[11px] font-bold transition-all cursor-pointer"
              >
                إيقاف
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
