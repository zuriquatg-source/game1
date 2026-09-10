import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Header } from './components/Header.tsx';
import { HowToPlayModal } from './components/HowToPlayModal.tsx';
import { WordsManagerModal } from './components/WordsManagerModal.tsx';
import { HomeScreen } from './components/HomeScreen.tsx';
import { CreateRoomScreen } from './components/CreateRoomScreen.tsx';
import { JoinRoomScreen } from './components/JoinRoomScreen.tsx';
import { LobbyScreen } from './components/LobbyScreen.tsx';
import { GameRoundScreen } from './components/GameRoundScreen.tsx';
import { CluesScreen } from './components/CluesScreen.tsx';
import { DiscussionScreen } from './components/DiscussionScreen.tsx';
import { VotingScreen } from './components/VotingScreen.tsx';
import { ImposterGuessScreen } from './components/ImposterGuessScreen.tsx';
import { ResultsScreen } from './components/ResultsScreen.tsx';
import { LeaderboardScreen } from './components/LeaderboardScreen.tsx';
import { VoiceChatBar } from './components/VoiceChatBar.tsx';
import { RoomClientState, GamePhase } from './types.ts';
import { INITIAL_WORDS } from './data/words.ts';
import { sound } from './utils/audio.ts';

function getOrCreateClientId(): string {
  let id = localStorage.getItem('al_mundass_client_id');
  if (!id) {
    id = 'p_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
    localStorage.setItem('al_mundass_client_id', id);
  }
  return id;
}

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomState, setRoomState] = useState<RoomClientState | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [view, setView] = useState<'home' | 'create' | 'join'>('home');
  const [urlRoomCode, setUrlRoomCode] = useState('');
  const [previousRoomCode, setPreviousRoomCode] = useState<string | null>(() =>
    localStorage.getItem('al_mundass_room_code')
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isWordsOpen, setIsWordsOpen] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    // Check URL parameters for room code invite link
    const searchParams = new URLSearchParams(window.location.search);
    const codeFromUrl = searchParams.get('room');
    if (codeFromUrl) {
      setUrlRoomCode(codeFromUrl.toUpperCase());
      setView('join');
    }

    const newSocket = io({
      transports: ['polling', 'websocket'],
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      // Auto-reconnect if player was in an active room and has saved credentials
      const savedRoom = localStorage.getItem('al_mundass_room_code');
      const savedName = localStorage.getItem('al_mundass_name');
      const savedAvatar = localStorage.getItem('al_mundass_avatar');
      const clientId = getOrCreateClientId();

      if (savedRoom && savedName && !codeFromUrl) {
        newSocket.emit('reconnect-session', {
          roomCode: savedRoom,
          clientId,
          name: savedName,
          avatar: savedAvatar || '🦊',
        });
      }
    });

    newSocket.on('room:joined', ({ playerId, state }: { playerId: string; state: RoomClientState }) => {
      setIsLoading(false);
      setErrorMessage(null);
      setCurrentPlayerId(playerId);
      setRoomState(state);
      // Persist active room session
      localStorage.setItem('al_mundass_room_code', state.roomCode);
      setPreviousRoomCode(state.roomCode);
    });

    newSocket.on('room:update', (state: RoomClientState) => {
      setRoomState(state);
    });

    newSocket.on('room:expired', () => {
      setIsLoading(false);
      setRoomState(null);
      setCurrentPlayerId(null);
      localStorage.removeItem('al_mundass_room_code');
      setPreviousRoomCode(null);
      setView('home');
    });

    newSocket.on('room:error', (msg: string) => {
      setIsLoading(false);
      setErrorMessage(msg);
      // If room not found or expired, clear stale saved room
      if (msg.includes('العثور على الغرفة') || msg.includes('غير موجودة') || msg.includes('بدأت بالفعل')) {
        localStorage.removeItem('al_mundass_room_code');
        setPreviousRoomCode(null);
      }
      setTimeout(() => setErrorMessage(null), 4000);
    });

    newSocket.on('room:kicked', () => {
      setRoomState(null);
      setCurrentPlayerId(null);
      setView('home');
      localStorage.removeItem('al_mundass_room_code');
      setPreviousRoomCode(null);
      alert('تم إخراجك من الغرفة بواسطة المضيف.');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Room Actions
  const handleCreateRoom = (name: string, avatar: string) => {
    if (!socket) return;
    setIsLoading(true);
    setErrorMessage(null);
    localStorage.removeItem('al_mundass_room_code');
    localStorage.setItem('al_mundass_name', name);
    localStorage.setItem('al_mundass_avatar', avatar);
    const clientId = getOrCreateClientId();
    socket.emit('create-room', { name, avatar, clientId });
  };

  const handleJoinRoom = (roomCode: string, name: string, avatar: string) => {
    if (!socket) return;
    setIsLoading(true);
    setErrorMessage(null);
    localStorage.setItem('al_mundass_name', name);
    localStorage.setItem('al_mundass_avatar', avatar);
    localStorage.setItem('al_mundass_room_code', roomCode.trim().toUpperCase());
    const clientId = getOrCreateClientId();
    socket.emit('join-room', { roomCode: roomCode.trim().toUpperCase(), name, avatar, clientId });
  };

  const handleStartGame = () => {
    if (!socket) return;
    socket.emit('start-game');
  };

  const handleProceedToClues = () => {
    if (!socket) return;
    socket.emit('proceed-to-clues');
  };

  const handleSubmitClue = (clue: string) => {
    if (!socket) return;
    socket.emit('submit-clue', { clue });
  };

  const handleProceedToVoting = () => {
    if (!socket) return;
    socket.emit('proceed-to-voting');
  };

  const handleVote = (targetPlayerId: string) => {
    if (!socket) return;
    socket.emit('submit-vote', { targetPlayerId });
  };

  const handleForceFinishVoting = () => {
    if (!socket) return;
    socket.emit('force-finish-voting');
  };

  const handleSubmitImposterGuess = (guessedWord: string) => {
    if (!socket) return;
    socket.emit('submit-imposter-guess', { guessedWord });
  };

  const handleProceedToLeaderboard = () => {
    if (!socket) return;
    socket.emit('proceed-to-leaderboard');
  };

  const handleNextRound = () => {
    if (!socket) return;
    socket.emit('start-game');
  };

  const handleReturnToLobby = () => {
    if (!socket) return;
    // If host, return ALL players back to the lobby together in the same room!
    if (isHost) {
      socket.emit('return-to-lobby');
    } else {
      // If non-host player explicitly clicks to leave
      handleLeaveRoom();
    }
  };

  const handleLeaveRoom = () => {
    if (!socket) return;
    socket.emit('leave-room');
    setRoomState(null);
    setCurrentPlayerId(null);
    setView('home');
    localStorage.removeItem('al_mundass_room_code');
    localStorage.removeItem('al_mundass_player_id');
    setPreviousRoomCode(null);
  };

  const handleKickPlayer = (targetPlayerId: string) => {
    if (!socket) return;
    socket.emit('kick-player', { targetPlayerId });
  };

  const handleAddWord = (word: string) => {
    if (!socket) return;
    socket.emit('add-custom-word', { word });
  };

  const handleRemoveWord = (word: string) => {
    if (!socket) return;
    socket.emit('remove-word', { word });
  };

  const isHost = Boolean(roomState && currentPlayerId && roomState.hostId === currentPlayerId);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-slate-100 flex flex-col font-['Cairo'] selection:bg-rose-500 selection:text-white">
      {/* Global Brand & Navigation Header */}
      <Header
        roomCode={roomState?.roomCode}
        onOpenRules={() => setIsRulesOpen(true)}
        onLeaveRoom={roomState ? handleLeaveRoom : undefined}
        isHost={isHost}
      />

      {/* Real-time WebRTC Voice Chat (Mic) when in an active room */}
      {roomState && (
        <VoiceChatBar
          socket={socket}
          currentPlayerId={currentPlayerId || ''}
          players={roomState.players}
          roomCode={roomState.roomCode}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center items-center w-full">
        {/* If Not in Room: Show Home, Create, or Join */}
        {!roomState ? (
          <>
            {view === 'home' && (
              <HomeScreen
                onCreateRoom={() => setView('create')}
                onJoinRoom={() => setView('join')}
                onOpenRules={() => setIsRulesOpen(true)}
                onOpenWords={() => setIsWordsOpen(true)}
                previousRoomCode={previousRoomCode}
                onRejoinRoom={(code) => {
                  const savedName = localStorage.getItem('al_mundass_name') || 'لاعب';
                  const savedAvatar = localStorage.getItem('al_mundass_avatar') || '🦊';
                  handleJoinRoom(code, savedName, savedAvatar);
                }}
              />
            )}

            {view === 'create' && (
              <CreateRoomScreen
                onBack={() => setView('home')}
                onSubmit={handleCreateRoom}
                isLoading={isLoading}
              />
            )}

            {view === 'join' && (
              <JoinRoomScreen
                onBack={() => setView('home')}
                onSubmit={handleJoinRoom}
                initialCode={urlRoomCode}
                isLoading={isLoading}
                errorMessage={errorMessage}
              />
            )}
          </>
        ) : (
          /* When in Room: Render According to Synchronized Game Phase */
          <>
            {roomState.phase === 'lobby' && (
              <LobbyScreen
                roomCode={roomState.roomCode}
                players={roomState.players}
                currentPlayerId={currentPlayerId || ''}
                isHost={isHost}
                onStartGame={handleStartGame}
                onOpenWords={() => setIsWordsOpen(true)}
                onKickPlayer={handleKickPlayer}
              />
            )}

            {roomState.phase === 'game-round' && (
              <GameRoundScreen
                isImposter={roomState.isImposter}
                secretWord={roomState.secretWord}
                roundNumber={roomState.roundNumber}
                isHost={isHost}
                onProceedToClues={handleProceedToClues}
              />
            )}

            {roomState.phase === 'clues' && (
              <CluesScreen
                clues={roomState.clues}
                players={roomState.players}
                currentPlayerId={currentPlayerId || ''}
                isHost={isHost}
                secretWord={roomState.secretWord}
                onSubmitClue={handleSubmitClue}
                onProceedToDiscussion={() => socket?.emit('proceed-to-discussion')}
                onProceedToVoting={handleProceedToVoting}
                errorMessage={errorMessage}
              />
            )}

            {roomState.phase === 'discussion' && (
              <DiscussionScreen
                players={roomState.players}
                clues={roomState.clues}
                currentPlayerId={currentPlayerId || ''}
                isHost={isHost}
                secretWord={roomState.secretWord}
                secondsLeft={roomState.discussionSecondsLeft}
                onProceedToVoting={handleProceedToVoting}
              />
            )}

            {roomState.phase === 'voting' && (
              <VotingScreen
                players={roomState.players}
                clues={roomState.clues}
                currentPlayerId={currentPlayerId || ''}
                isHost={isHost}
                secretWord={roomState.secretWord}
                onVote={handleVote}
                onForceFinishVoting={handleForceFinishVoting}
              />
            )}

            {roomState.phase === 'imposter-guess' && (
              <ImposterGuessScreen
                isImposter={roomState.isImposter}
                actualImposter={roomState.actualImposter}
                onSubmitGuess={handleSubmitImposterGuess}
              />
            )}

            {roomState.phase === 'results' && (
              <ResultsScreen
                votingSummary={roomState.votingSummary}
                actualImposter={roomState.actualImposter}
                secretWord={roomState.secretWord}
                imposterGuess={roomState.imposterGuess}
                roundWinner={roomState.roundWinner}
                players={roomState.players}
                isHost={isHost}
                onProceedToLeaderboard={handleProceedToLeaderboard}
                onNextRound={handleNextRound}
              />
            )}

            {roomState.phase === 'leaderboard' && (
              <LeaderboardScreen
                players={roomState.players}
                isHost={isHost}
                roundNumber={roomState.roundNumber}
                onNextRound={handleNextRound}
                onReturnToLobby={handleReturnToLobby}
              />
            )}
          </>
        )}
      </main>

      {/* Global Modals */}
      <HowToPlayModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

      <WordsManagerModal
        isOpen={isWordsOpen}
        onClose={() => setIsWordsOpen(false)}
        wordsList={roomState?.wordsList || INITIAL_WORDS}
        onAddWord={handleAddWord}
        onRemoveWord={handleRemoveWord}
        isHost={isHost}
      />
    </div>
  );
}
