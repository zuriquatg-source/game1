import express from 'express';
import http from 'http';
import path from 'path';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import { INITIAL_WORDS, normalizeArabic } from './src/data/words.ts';
import { GamePhase, Player, ClueItem, VotingSummary, ImposterGuess } from './src/types.ts';

const PORT = 3000;

interface ServerPlayer {
  id: string;
  socketId: string;
  name: string;
  avatar: string;
  isHost: boolean;
  score: number;
  wins: number;
  clues: string[];
  hasVoted?: boolean;
  voteTargetId?: string;
  isMuted?: boolean;
  isSpeaking?: boolean;
  hasMicEnabled?: boolean;
}

interface ServerRoom {
  code: string;
  hostId: string;
  phase: GamePhase;
  players: Map<string, ServerPlayer>;
  secretWord: string;
  roundNumber: number;
  imposterId: string;
  clues: ClueItem[];
  discussionTimer?: NodeJS.Timeout | null;
  discussionEndsAt?: number | null;
  votingSummary: VotingSummary | null;
  imposterGuess: ImposterGuess | null;
  roundWinner: 'imposter' | 'players' | null;
  wordsList: string[];
}

const rooms = new Map<string, ServerRoom>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  if (rooms.has(code)) {
    return generateRoomCode();
  }
  return code;
}

function sanitizeRoomStateForPlayer(room: ServerRoom, playerId: string) {
  const isImposter = room.imposterId === playerId;
  const isGameOverOrResults = room.phase === 'results' || room.phase === 'leaderboard';

  const playersList: Player[] = Array.from(room.players.values()).map((p) => ({
    id: p.id,
    name: p.name,
    avatar: p.avatar,
    isHost: p.isHost,
    score: p.score,
    wins: p.wins,
    cluesCount: p.clues ? p.clues.length : 0,
    hasClue: Boolean(p.clues && p.clues.length >= 3),
    hasVoted: Boolean(p.hasVoted),
    isMuted: p.isMuted ?? false,
    isSpeaking: p.isSpeaking ?? false,
    hasMicEnabled: p.hasMicEnabled ?? false,
  }));

  const actualImposterPlayer = isGameOverOrResults && room.imposterId
    ? room.players.get(room.imposterId) || null
    : null;

  const discussionSecondsLeft = room.discussionEndsAt
    ? Math.max(0, Math.ceil((room.discussionEndsAt - Date.now()) / 1000))
    : (room.phase === 'discussion' ? 30 : undefined);

  return {
    roomCode: room.code,
    hostId: room.hostId,
    players: playersList,
    phase: room.phase,
    roundNumber: room.roundNumber,
    isImposter,
    secretWord: isGameOverOrResults ? room.secretWord : (isImposter ? null : room.secretWord),
    clues: room.clues,
    discussionSecondsLeft,
    votingSummary: room.votingSummary,
    actualImposter: actualImposterPlayer ? {
      id: actualImposterPlayer.id,
      name: actualImposterPlayer.name,
      avatar: actualImposterPlayer.avatar,
      isHost: actualImposterPlayer.isHost,
      score: actualImposterPlayer.score,
      wins: actualImposterPlayer.wins,
    } : null,
    imposterGuess: room.imposterGuess,
    roundWinner: room.roundWinner,
    wordsList: room.wordsList,
  };
}

function broadcastRoomUpdate(io: Server, room: ServerRoom) {
  for (const player of room.players.values()) {
    const sanitized = sanitizeRoomStateForPlayer(room, player.id);
    io.to(player.socketId).emit('room:update', sanitized);
  }
}

function startDiscussion(io: Server, room: ServerRoom) {
  if (room.discussionTimer) {
    clearTimeout(room.discussionTimer);
    room.discussionTimer = null;
  }
  room.phase = 'discussion';
  room.discussionEndsAt = Date.now() + 30 * 1000;
  broadcastRoomUpdate(io, room);

  room.discussionTimer = setTimeout(() => {
    if (room.phase === 'discussion') {
      room.phase = 'voting';
      room.discussionEndsAt = null;
      room.discussionTimer = null;
      broadcastRoomUpdate(io, room);
    }
  }, 30500);
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', activeRooms: rooms.size });
  });

  // Socket.io initialization
  const io = new Server(httpServer, {
    cors: { origin: '*' },
    transports: ['polling', 'websocket'],
  });

  io.on('connection', (socket) => {
    let currentRoomCode: string | null = null;
    let currentPlayerId: string | null = null;

    socket.on('create-room', ({ name, avatar, clientId }: { name: string; avatar: string; clientId?: string }) => {
      const roomCode = generateRoomCode();
      const playerId = (clientId && clientId.trim()) || ('p_' + Math.random().toString(36).substring(2, 9));

      const newPlayer: ServerPlayer = {
        id: playerId,
        socketId: socket.id,
        name: name.trim() || 'لاعب ' + Math.floor(Math.random() * 100),
        avatar: avatar || '👑',
        isHost: true,
        score: 0,
        wins: 0,
        clues: [],
      };

      const newRoom: ServerRoom = {
        code: roomCode,
        hostId: playerId,
        phase: 'lobby',
        players: new Map([[playerId, newPlayer]]),
        secretWord: '',
        roundNumber: 0,
        imposterId: '',
        clues: [],
        votingSummary: null,
        imposterGuess: null,
        roundWinner: null,
        wordsList: [...INITIAL_WORDS],
      };

      rooms.set(roomCode, newRoom);
      currentRoomCode = roomCode;
      currentPlayerId = playerId;

      socket.join(roomCode);
      socket.emit('room:joined', {
        playerId,
        state: sanitizeRoomStateForPlayer(newRoom, playerId),
      });
    });

    socket.on('join-room', ({ roomCode, name, avatar, clientId }: { roomCode: string; name: string; avatar: string; clientId?: string }) => {
      const code = roomCode.trim().toUpperCase();
      const room = rooms.get(code);

      if (!room) {
        socket.emit('room:error', 'عفواً، لم نتمكن من العثور على الغرفة! تأكد من الكود.');
        return;
      }

      const playerId = (clientId && clientId.trim()) || ('p_' + Math.random().toString(36).substring(2, 9));
      let player = room.players.get(playerId);

      if (player) {
        // Reconnect existing player without duplicating
        player.socketId = socket.id;
        if (name && name.trim()) player.name = name.trim();
        if (avatar) player.avatar = avatar;
      } else {
        // If the game is already in progress and player is not recognized, block new entrant
        if (room.phase !== 'lobby') {
          socket.emit('room:error', 'الجولة بدأت بالفعل في هذه الغرفة! انتظر حتى تنتهي الجولة للانضمام.');
          return;
        }

        // New player joining
        player = {
          id: playerId,
          socketId: socket.id,
          name: name.trim() || 'لاعب ' + (room.players.size + 1),
          avatar: avatar || '🦊',
          isHost: room.players.size === 0,
          score: 0,
          wins: 0,
          clues: [],
        };
        room.players.set(playerId, player);
      }

      currentRoomCode = code;
      currentPlayerId = playerId;

      socket.join(code);
      socket.emit('room:joined', {
        playerId,
        state: sanitizeRoomStateForPlayer(room, playerId),
      });

      broadcastRoomUpdate(io, room);
    });

    socket.on('reconnect-session', ({ roomCode, clientId, name, avatar }: { roomCode: string; clientId: string; name?: string; avatar?: string }) => {
      const code = roomCode.trim().toUpperCase();
      const room = rooms.get(code);

      if (!room) {
        socket.emit('room:expired');
        return;
      }

      let player = room.players.get(clientId);
      if (player) {
        player.socketId = socket.id;
        if (name && name.trim()) player.name = name.trim();
        if (avatar) player.avatar = avatar;
        if (!player.clues) player.clues = [];
      } else {
        if (room.phase !== 'lobby') {
          socket.emit('room:error', 'الجولة بدأت بالفعل');
          return;
        }
        player = {
          id: clientId,
          socketId: socket.id,
          name: (name && name.trim()) || 'لاعب ' + (room.players.size + 1),
          avatar: avatar || '🦊',
          isHost: room.players.size === 0,
          score: 0,
          wins: 0,
          clues: [],
        };
        room.players.set(clientId, player);
      }

      currentRoomCode = code;
      currentPlayerId = clientId;
      socket.join(code);

      socket.emit('room:joined', {
        playerId: clientId,
        state: sanitizeRoomStateForPlayer(room, clientId),
      });

      broadcastRoomUpdate(io, room);
    });

    socket.on('start-game', () => {
      if (!currentRoomCode || !currentPlayerId) return;
      const room = rooms.get(currentRoomCode);
      if (!room || room.hostId !== currentPlayerId) return;

      if (room.players.size < 2) {
        socket.emit('room:error', 'يجب وجود لاعبين اثنين على الأقل لبدء اللعبة!');
        return;
      }

      // Choose random secret word that is DIFFERENT from the previous round
      const availableWords = room.wordsList.length > 0 ? room.wordsList : INITIAL_WORDS;
      const filteredWords = availableWords.filter((w) => w !== room.secretWord);
      const poolToChooseFrom = filteredWords.length > 0 ? filteredWords : availableWords;
      const secretWord = poolToChooseFrom[Math.floor(Math.random() * poolToChooseFrom.length)];

      // Choose random imposter (prefer alternating if multiple players)
      const playerIds = Array.from(room.players.keys());
      let candidateImposters = playerIds.filter((id) => id !== room.imposterId);
      if (candidateImposters.length === 0) candidateImposters = playerIds;
      const randomImposterId = candidateImposters[Math.floor(Math.random() * candidateImposters.length)];

      room.secretWord = secretWord;
      room.imposterId = randomImposterId;
      room.roundNumber += 1;
      room.phase = 'game-round';
      room.clues = [];
      if (room.discussionTimer) {
        clearTimeout(room.discussionTimer);
        room.discussionTimer = null;
      }
      room.discussionEndsAt = null;
      room.votingSummary = null;
      room.imposterGuess = null;
      room.roundWinner = null;

      // Reset per-round player state
      for (const p of room.players.values()) {
        p.clues = [];
        delete p.hasVoted;
        delete p.voteTargetId;
      }

      broadcastRoomUpdate(io, room);
    });

    socket.on('proceed-to-clues', () => {
      if (!currentRoomCode || !currentPlayerId) return;
      const room = rooms.get(currentRoomCode);
      if (!room || room.hostId !== currentPlayerId) return;

      room.phase = 'clues';
      broadcastRoomUpdate(io, room);
    });

    socket.on('submit-clue', ({ clue }: { clue: string }) => {
      if (!currentRoomCode || !currentPlayerId) return;
      const room = rooms.get(currentRoomCode);
      if (!room || room.phase !== 'clues') return;

      const player = room.players.get(currentPlayerId);
      if (!player) return;

      if (!player.clues) player.clues = [];
      if (player.clues.length >= 3) {
        socket.emit('room:error', 'لقد أرسلت بالفعل جميع تلميحاتك الثلاثة (3/3)!');
        return;
      }

      const cleanClue = clue.trim();
      if (!cleanClue) return;

      // Validate clue doesn't contain secret word
      if (
        normalizeArabic(cleanClue).includes(normalizeArabic(room.secretWord)) ||
        normalizeArabic(room.secretWord).includes(normalizeArabic(cleanClue))
      ) {
        socket.emit('room:error', 'ممنوع كتابة الكلمة السرية نفسها بالتلميح!');
        return;
      }

      player.clues.push(cleanClue);
      const clueNumber = player.clues.length;

      const clueItem: ClueItem = {
        playerId: player.id,
        playerName: player.name,
        playerAvatar: player.avatar,
        clueText: cleanClue,
        clueNumber,
        timestamp: Date.now(),
      };
      room.clues.push(clueItem);

      // Check if all players submitted all 3 clues
      const allSubmitted3Clues = Array.from(room.players.values()).every(
        (p) => (p.clues?.length || 0) >= 3
      );

      if (allSubmitted3Clues) {
        // Automatically proceed to 30-second discussion!
        startDiscussion(io, room);
      } else {
        broadcastRoomUpdate(io, room);
      }
    });

    socket.on('proceed-to-discussion', () => {
      if (!currentRoomCode || !currentPlayerId) return;
      const room = rooms.get(currentRoomCode);
      if (!room || room.hostId !== currentPlayerId) return;

      startDiscussion(io, room);
    });

    socket.on('proceed-to-voting', () => {
      if (!currentRoomCode || !currentPlayerId) return;
      const room = rooms.get(currentRoomCode);
      if (!room || room.hostId !== currentPlayerId) return;

      if (room.discussionTimer) {
        clearTimeout(room.discussionTimer);
        room.discussionTimer = null;
      }
      room.discussionEndsAt = null;
      room.phase = 'voting';
      broadcastRoomUpdate(io, room);
    });

    socket.on('submit-vote', ({ targetPlayerId }: { targetPlayerId: string }) => {
      if (!currentRoomCode || !currentPlayerId) return;
      const room = rooms.get(currentRoomCode);
      if (!room || room.phase !== 'voting') return;

      if (targetPlayerId === currentPlayerId) {
        socket.emit('room:error', 'لا يمكنك التصويت لنفسك!');
        return;
      }

      const player = room.players.get(currentPlayerId);
      if (!player) return;

      player.hasVoted = true;
      player.voteTargetId = targetPlayerId;

      // Check if all players have voted
      const allVoted = Array.from(room.players.values()).every((p) => p.hasVoted);
      if (allVoted) {
        calculateVotingResults(room);
      }

      broadcastRoomUpdate(io, room);
    });

    socket.on('force-finish-voting', () => {
      if (!currentRoomCode || !currentPlayerId) return;
      const room = rooms.get(currentRoomCode);
      if (!room || room.hostId !== currentPlayerId) return;

      calculateVotingResults(room);
      broadcastRoomUpdate(io, room);
    });

    function calculateVotingResults(room: ServerRoom) {
      const voteCounts: Record<string, number> = {};
      for (const p of room.players.values()) {
        voteCounts[p.id] = 0;
      }

      for (const p of room.players.values()) {
        if (p.voteTargetId && voteCounts[p.voteTargetId] !== undefined) {
          voteCounts[p.voteTargetId] += 1;
        }
      }

      let maxVotes = -1;
      let mostVotedId: string | null = null;
      let isTie = false;

      for (const [pId, count] of Object.entries(voteCounts)) {
        if (count > maxVotes) {
          maxVotes = count;
          mostVotedId = pId;
          isTie = false;
        } else if (count === maxVotes && count > 0) {
          isTie = true;
        }
      }

      const imposterCaught = !isTie && mostVotedId === room.imposterId;

      room.votingSummary = {
        voteCounts,
        mostVotedId: isTie ? null : mostVotedId,
        isTie,
        imposterCaught,
      };

      if (imposterCaught) {
        // Give imposter a final chance to guess the secret word!
        room.phase = 'imposter-guess';
      } else {
        // Imposter was NOT caught! Imposter wins directly!
        room.roundWinner = 'imposter';
        const imposter = room.players.get(room.imposterId);
        if (imposter) {
          imposter.score += 100;
          imposter.wins += 1;
        }
        room.phase = 'results';
      }
    }

    socket.on('submit-imposter-guess', ({ guessedWord }: { guessedWord: string }) => {
      if (!currentRoomCode || !currentPlayerId) return;
      const room = rooms.get(currentRoomCode);
      if (!room || room.phase !== 'imposter-guess') return;

      // Only imposter can guess
      if (currentPlayerId !== room.imposterId) {
        socket.emit('room:error', 'المندس فقط هو من يخمن الكلمة!');
        return;
      }

      const cleanGuess = normalizeArabic(guessedWord);
      const cleanSecret = normalizeArabic(room.secretWord);
      const isCorrect = cleanGuess === cleanSecret;

      room.imposterGuess = {
        guessedWord: guessedWord.trim(),
        isCorrect,
      };

      const imposter = room.players.get(room.imposterId);

      if (isCorrect) {
        // Imposter wins despite being caught!
        room.roundWinner = 'imposter';
        if (imposter) {
          imposter.score += 80;
          imposter.wins += 1;
        }
      } else {
        // Other players win!
        room.roundWinner = 'players';
        for (const p of room.players.values()) {
          if (p.id !== room.imposterId) {
            p.score += 50;
            p.wins += 1;
          }
        }
      }

      room.phase = 'results';
      broadcastRoomUpdate(io, room);
    });

    socket.on('proceed-to-leaderboard', () => {
      if (!currentRoomCode || !currentPlayerId) return;
      const room = rooms.get(currentRoomCode);
      if (!room || room.hostId !== currentPlayerId) return;

      room.phase = 'leaderboard';
      broadcastRoomUpdate(io, room);
    });

    socket.on('return-to-lobby', () => {
      if (!currentRoomCode || !currentPlayerId) return;
      const room = rooms.get(currentRoomCode);
      if (!room || room.hostId !== currentPlayerId) return;

      room.phase = 'lobby';
      room.secretWord = '';
      room.imposterId = '';
      room.clues = [];
      if (room.discussionTimer) {
        clearTimeout(room.discussionTimer);
        room.discussionTimer = null;
      }
      room.discussionEndsAt = null;
      room.votingSummary = null;
      room.imposterGuess = null;
      room.roundWinner = null;
      for (const p of room.players.values()) {
        p.clues = [];
        delete p.hasVoted;
        delete p.voteTargetId;
      }
      broadcastRoomUpdate(io, room);
    });

    socket.on('add-custom-word', ({ word }: { word: string }) => {
      if (!currentRoomCode) return;
      const room = rooms.get(currentRoomCode);
      if (!room) return;
      const clean = word.trim();
      if (clean && !room.wordsList.includes(clean)) {
        room.wordsList.push(clean);
        broadcastRoomUpdate(io, room);
      }
    });

    socket.on('remove-word', ({ word }: { word: string }) => {
      if (!currentRoomCode) return;
      const room = rooms.get(currentRoomCode);
      if (!room) return;
      room.wordsList = room.wordsList.filter((w) => w !== word);
      broadcastRoomUpdate(io, room);
    });

    socket.on('kick-player', ({ targetPlayerId }: { targetPlayerId: string }) => {
      if (!currentRoomCode || !currentPlayerId) return;
      const room = rooms.get(currentRoomCode);
      if (!room || room.hostId !== currentPlayerId || targetPlayerId === currentPlayerId) return;

      const target = room.players.get(targetPlayerId);
      if (target) {
        const targetSocket = io.sockets.sockets.get(target.socketId);
        if (targetSocket) {
          targetSocket.emit('room:kicked');
          targetSocket.leave(room.code);
        }
        room.players.delete(targetPlayerId);
        broadcastRoomUpdate(io, room);
      }
    });

    socket.on('leave-room', () => {
      if (!currentRoomCode || !currentPlayerId) return;
      const room = rooms.get(currentRoomCode);
      if (!room) return;

      room.players.delete(currentPlayerId);
      socket.leave(currentRoomCode);

      if (room.players.size === 0) {
        rooms.delete(currentRoomCode);
      } else {
        if (room.hostId === currentPlayerId) {
          // Assign next player as host
          const nextHost = Array.from(room.players.values())[0];
          room.hostId = nextHost.id;
          nextHost.isHost = true;
        }
        broadcastRoomUpdate(io, room);
      }

      currentRoomCode = null;
      currentPlayerId = null;
    });

    // WebRTC Voice Chat Signaling
    socket.on('voice:signal', ({ targetPlayerId, signal }: { targetPlayerId: string; signal: any }) => {
      if (!currentRoomCode || !currentPlayerId) return;
      const room = rooms.get(currentRoomCode);
      if (!room) return;

      const targetPlayer = room.players.get(targetPlayerId);
      if (targetPlayer) {
        io.to(targetPlayer.socketId).emit('voice:signal', {
          senderPlayerId: currentPlayerId,
          signal,
        });
      }
    });

    socket.on('voice:join', () => {
      if (!currentRoomCode || !currentPlayerId) return;
      const room = rooms.get(currentRoomCode);
      if (!room) return;
      const me = room.players.get(currentPlayerId);
      if (me) {
        me.hasMicEnabled = true;
        me.isMuted = false;
        broadcastRoomUpdate(io, room);
      }
      socket.to(currentRoomCode).emit('voice:peer-joined', { playerId: currentPlayerId });
    });

    socket.on('voice:leave', () => {
      if (!currentRoomCode || !currentPlayerId) return;
      const room = rooms.get(currentRoomCode);
      if (!room) return;
      const me = room.players.get(currentPlayerId);
      if (me) {
        me.hasMicEnabled = false;
        me.isSpeaking = false;
        broadcastRoomUpdate(io, room);
      }
      socket.to(currentRoomCode).emit('voice:peer-left', { playerId: currentPlayerId });
    });

    socket.on('voice:status', ({ isMuted, isSpeaking }: { isMuted: boolean; isSpeaking: boolean }) => {
      if (!currentRoomCode || !currentPlayerId) return;
      const room = rooms.get(currentRoomCode);
      if (!room) return;

      const player = room.players.get(currentPlayerId);
      if (player) {
        player.isMuted = isMuted;
        player.isSpeaking = isSpeaking;
        io.to(currentRoomCode).emit('voice:status-update', {
          playerId: currentPlayerId,
          isMuted,
          isSpeaking,
        });
      }
    });

    socket.on('disconnect', () => {
      // Keep player for quick reconnections in mobile browsers, but update status if needed
    });
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
