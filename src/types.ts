export type GamePhase =
  | 'home'
  | 'create'
  | 'join'
  | 'lobby'
  | 'game-round'
  | 'clues'
  | 'discussion'
  | 'voting'
  | 'imposter-guess'
  | 'results'
  | 'leaderboard';

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  score: number;
  wins: number;
  cluesCount?: number;
  hasClue?: boolean;
  hasVoted?: boolean;
  isMuted?: boolean;
  isSpeaking?: boolean;
  hasMicEnabled?: boolean;
}

export interface ClueItem {
  playerId: string;
  playerName: string;
  playerAvatar: string;
  clueText: string;
  clueNumber?: number;
  timestamp: number;
}

export interface VotingSummary {
  voteCounts: Record<string, number>;
  mostVotedId: string | null;
  isTie: boolean;
  imposterCaught: boolean;
}

export interface ImposterGuess {
  guessedWord: string;
  isCorrect: boolean;
}

export interface RoomClientState {
  roomCode: string;
  hostId: string;
  players: Player[];
  phase: GamePhase;
  roundNumber: number;
  isImposter: boolean;
  secretWord: string | null;
  clues: ClueItem[];
  currentClueRound?: number;
  discussionSecondsLeft?: number;
  votingSummary: VotingSummary | null;
  actualImposter: Player | null;
  imposterGuess: ImposterGuess | null;
  roundWinner: 'imposter' | 'players' | null;
  wordsList: string[];
}

