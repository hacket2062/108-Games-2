import { useSessionScheduler } from '../core/useSessionScheduler';
import { ONLINE_MATCHES_READY, ONLINE_SAFETY_NOTICE } from '../network/onlineSafety';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  CloudFog,
  Copy,
  Flame,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  Users,
  Volume2,
  Zap,
} from 'lucide-react';
import type {
  AscensionPath,
  GradeLevel,
  GuardianId,
  PvPCombatEvent,
  PvPJammerType,
  PvPQuestionCard,
  PvPRoomState,
  PvPRunResult,
  SubjectId,
} from '../types/game';
import { useAuth } from '../auth/AuthContext';
import { useGameState } from '../core/GameStateContext';
import { getPvPMixedQuestions } from '../data/questionBank';
import { ASCENSION_PATHS } from '../data/itemsAndGems';
import { getPvPRankTier } from '../data/spiritsAndTitles';
import {
  calculatePvPAttackDamage,
  calculatePvPRatingDelta,
  getSpeedGrade,
} from '../core/combatMath';
import {
  cancelWaitingOnlineRoom,
  createOnlinePvPRoom,
  joinOnlinePvPRoom,
  pickSmartRival,
  PlayerLoadout,
  pushOnlineCombatEvent,
  pushOnlineCombatUpdate,
  SmartRivalProfile,
  subscribeOnlineRoom,
  subscribeOnlineRoomEvents,
  tryFindWaitingOnlineRoom,
} from '../network/pvpMatchmaker';
import {
  createGameFeel,
  drawPvPDuelist,
  drawRoundedRect,
  FloatingTextPool,
  ParticlePool,
  triggerGameFeel,
  updateGameFeel,
} from '../core/canvasEffects';
import { soundEngine } from '../audio/soundEngine';
import { UltimateCutIn } from '../components/UltimateCutIn';

interface PvPArenaEngineProps {
  onExit: () => void;
}

type ArenaPhase = 'lobby' | 'waiting_room' | 'matching' | 'fighting' | 'result';

interface ArenaProjectile {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  progress: number;
  color: string;
  secondary: string;
  isUltimate: boolean;
}

export const PvPArenaEngine: React.FC<PvPArenaEngineProps> = ({ onExit }) => {
  const { user, signInWithGoogle } = useAuth();
  const { save, combatStats, equippedWeapon, applyPvPResult, consumeBattleItem } = useGameState();

  const { schedule, cancelAll } = useSessionScheduler();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [phase, setPhase] = useState<ArenaPhase>('lobby');
  const [subjectFilter, setSubjectFilter] = useState<SubjectId | 'all'>('all');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [lobbyError, setLobbyError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Active Match Metadata
  const [isOnlineReal, setIsOnlineReal] = useState(false);
  const [roomCode, setRoomCode] = useState<string>('');
  const [isHost, setIsHost] = useState(true);
  const [onlineRoom, setOnlineRoom] = useState<PvPRoomState | null>(null);
  const [opponent, setOpponent] = useState<{
    uid: string;
    name: string;
    schoolTag: string;
    weaponPath: AscensionPath;
    weaponLevel: number;
    guardian: GuardianId;
    rating: number;
  } | null>(null);

  // Live Combat State
  const MAX_HP = 260;
  const [myHp, setMyHp] = useState(MAX_HP);
  const [oppHp, setOppHp] = useState(MAX_HP);
  const [myScore, setMyScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);
  const [myCombo, setMyCombo] = useState(0);
  const [oppCombo, setOppCombo] = useState(0);
  const [ultCharge, setUltCharge] = useState(20);
  const [jamEnergy, setJamEnergy] = useState(1); // 0..3 charges
  const [myShielded, setMyShielded] = useState(false);
  const [myFogTimer, setMyFogTimer] = useState(0);
  const [myHasteTimer, setMyHasteTimer] = useState(0);
  const [questionTimer, setQuestionTimer] = useState(12);
  const [cutIn, setCutIn] = useState(false);
  const [showVsBanner, setShowVsBanner] = useState(false);
  const [answerFeedback, setAnswerFeedback] = useState<string | null>(null);
  const [finalResult, setFinalResult] = useState<PvPRunResult | null>(null);

  // Question Deck
  const [deck, setDeck] = useState<PvPQuestionCard[]>([]);
  const [qIndex, setQIndex] = useState(0);

  // Simulation refs for 60FPS Canvas & zero stale closures
  const phaseRef = useRef<ArenaPhase>('lobby');
  const myHpRef = useRef(MAX_HP);
  const oppHpRef = useRef(MAX_HP);
  const myScoreRef = useRef(0);
  const oppScoreRef = useRef(0);
  const myComboRef = useRef(0);
  const maxComboRef = useRef(0);
  const correctRef = useRef(0);
  const attemptsRef = useRef(0);
  const startTimeRef = useRef(Date.now());
  const qStartTimeRef = useRef(Date.now());
  const qTimerRef = useRef(12);
  const myShieldRef = useRef(false);
  const oppShieldRef = useRef(false);
  const myFogRef = useRef(0);
  const myHasteRef = useRef(0);
  const oppFogRef = useRef(0);
  const smartRivalRef = useRef<SmartRivalProfile | null>(null);
  const rivalCdRef = useRef(4.2);
  const finishedRef = useRef(false);
  const isOnlineRef = useRef(false);
  const isHostRef = useRef(true);
  const roomRef = useRef<PvPRoomState | null>(null);
  const opponentRef = useRef(opponent);

  const vfxRef = useRef({
    time: 0,
    width: 1200,
    height: 440,
    myAttackAnim: 0,
    oppAttackAnim: 0,
    myHitFlash: 0,
    oppHitFlash: 0,
    projectiles: [] as ArenaProjectile[],
    particles: new ParticlePool(320),
    floats: new FloatingTextPool(40),
    feel: createGameFeel(),
    myEmote: null as { text: string; ttl: number } | null,
  });

  const handleSendEmote = (text: string) => {
    soundEngine.playClick();
    vfxRef.current.myEmote = { text, ttl: 2.4 };
  };

  useEffect(() => {
    phaseRef.current = phase;
    document.body.dataset.state = phase === 'fighting' ? 'playing' : 'menu';
  }, [phase]);

  useEffect(() => {
    opponentRef.current = opponent;
  }, [opponent]);

  const loadout: PlayerLoadout = {
    uid: user.uid,
    name: user.displayName,
    weaponPath: equippedWeapon.ascensionPath,
    weaponLevel: equippedWeapon.enhanceLevel,
    guardian: save.selectedGuardian,
    rating: save.pvp.rating,
    canUseOnlineFirestore: ONLINE_MATCHES_READY && save.parentSettings.pvpEnabled && user.provider === 'google' && user.emailVerified,
  };

  const launchBeam = useCallback(
    (fromLeft: boolean, path: AscensionPath, isUltimate = false) => {
      const v = vfxRef.current;
      const def = ASCENSION_PATHS[path];
      v.projectiles.push({
        fromX: fromLeft ? v.width * 0.25 : v.width * 0.75,
        fromY: v.height * 0.56,
        toX: fromLeft ? v.width * 0.75 : v.width * 0.25,
        toY: v.height * 0.56,
        progress: 0,
        color: def.auraPrimary,
        secondary: def.auraSecondary,
        isUltimate,
      });
    },
    []
  );

  const settleMatch = useCallback(
    (victory: boolean) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      cancelAll();
      setPhase('result');

      if (victory) soundEngine.playVictoryFanfare();
      else soundEngine.playDefeatSting();

      const opp = opponentRef.current;
      const oppRating = opp?.rating ?? save.pvp.rating;
      const ratingDelta = isOnlineRef.current ? calculatePvPRatingDelta(save.pvp.rating, oppRating, victory) : 0;
      const honorEarned = isOnlineRef.current ? (victory ? 45 + Math.min(25, maxComboRef.current * 4) : 15) : 0;
      const coinsEarned = victory ? 140 + maxComboRef.current * 10 : 45;
      const xpEarned = victory ? 110 : 35;

      const res: PvPRunResult = {
        victory,
        opponentName: opp?.name ?? '學園勁敵',
        isOnlineRealPlayer: isOnlineRef.current,
        roomCode: roomRef.current?.roomCode,
        myScore: myScoreRef.current,
        opponentScore: oppScoreRef.current,
        correctCount: correctRef.current,
        totalAttempts: attemptsRef.current,
        maxCombo: maxComboRef.current,
        ratingDelta,
        newRating: Math.max(600, save.pvp.rating + ratingDelta),
        honorEarned,
        coinsEarned,
        xpEarned,
        durationSeconds: Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000)),
      };

      applyPvPResult(res);
      setFinalResult(res);

      if (isOnlineRef.current && roomRef.current) {
        const r = roomRef.current;
        pushOnlineCombatUpdate({
          roomCode: r.roomCode,
          isHost: isHostRef.current,
          hostHp: isHostRef.current ? myHpRef.current : oppHpRef.current,
          guestHp: isHostRef.current ? oppHpRef.current : myHpRef.current,
          myScore: myScoreRef.current,
          myCombo: myComboRef.current,
          status: 'finished',
          winnerUid: victory ? user.uid : opp?.uid || '',
        });
      }
    },
    [applyPvPResult, save.pvp.rating, user.uid]
  );

  const startFightSession = useCallback(
    (params: {
      online: boolean;
      host: boolean;
      seed: number;
      gradeLevel: GradeLevel;
      subj: SubjectId | 'all';
      opp: {
        uid: string;
        name: string;
        schoolTag: string;
        weaponPath: AscensionPath;
        weaponLevel: number;
        guardian: GuardianId;
        rating: number;
      };
      rivalProfile: SmartRivalProfile | null;
      room: PvPRoomState | null;
    }) => {
      finishedRef.current = false;
      isOnlineRef.current = params.online;
      isHostRef.current = params.host;
      roomRef.current = params.room;
      smartRivalRef.current = params.rivalProfile;
      rivalCdRef.current = params.rivalProfile ? params.rivalProfile.avgReactionSeconds : 4.5;

      setIsOnlineReal(params.online);
      setIsHost(params.host);
      setOnlineRoom(params.room);
      setOpponent(params.opp);
      opponentRef.current = params.opp;

      const cards = getPvPMixedQuestions(params.gradeLevel, params.subj, params.seed);
      setDeck(cards);
      setQIndex(0);

      myHpRef.current = MAX_HP;
      oppHpRef.current = MAX_HP;
      myScoreRef.current = 0;
      oppScoreRef.current = 0;
      myComboRef.current = 0;
      maxComboRef.current = 0;
      correctRef.current = 0;
      attemptsRef.current = 0;
      myShieldRef.current = false;
      oppShieldRef.current = false;
      myFogRef.current = 0;
      myHasteRef.current = 0;
      oppFogRef.current = 0;
      qTimerRef.current = 12;
      startTimeRef.current = Date.now();
      qStartTimeRef.current = Date.now();

      setMyHp(MAX_HP);
      setOppHp(MAX_HP);
      setMyScore(0);
      setOppScore(0);
      setMyCombo(0);
      setOppCombo(0);
      setUltCharge(25);
      setJamEnergy(1);
      setMyShielded(false);
      setMyFogTimer(0);
      setMyHasteTimer(0);
      setQuestionTimer(12);
      setAnswerFeedback(null);
      setFinalResult(null);
      setPhase('fighting');
      setShowVsBanner(true);
      soundEngine.playPerfectBell();
      soundEngine.hapticPulse(24);
      schedule(() => setShowVsBanner(false), 1250);
    },
    []
  );

  // Incoming Online Firestore Room + Combat Events Subscription
  useEffect(() => {
    if (!roomCode || (phase !== 'waiting_room' && phase !== 'fighting')) return;

    const unsubRoom = subscribeOnlineRoom(roomCode, (updated) => {
      setOnlineRoom(updated);
      roomRef.current = updated;

      if (phaseRef.current === 'waiting_room' && updated.status === 'playing' && updated.guestUid) {
        startFightSession({
          online: true,
          host: true,
          seed: updated.questionSeed,
          gradeLevel: updated.grade,
          subj: updated.subjectFilter,
          opp: {
            uid: updated.guestUid,
            name: updated.guestName || '線上挑戰者',
            schoolTag: 'Firebase 即時連線',
            weaponPath: updated.guestWeaponPath,
            weaponLevel: updated.guestWeaponLevel,
            guardian: updated.guestGuardian,
            rating: save.pvp.rating,
          },
          rivalProfile: null,
          room: updated,
        });
        return;
      }

      if (phaseRef.current === 'fighting') {
        const remoteOppScore = isHostRef.current ? updated.guestScore : updated.hostScore;
        const remoteOppCombo = isHostRef.current ? updated.guestCombo : updated.hostCombo;
        const remoteMyHp = isHostRef.current ? updated.hostHp : updated.guestHp;
        const remoteOppHp = isHostRef.current ? updated.guestHp : updated.hostHp;
        oppScoreRef.current = remoteOppScore;
        setOppScore(remoteOppScore);
        setOppCombo(remoteOppCombo);
        if (remoteMyHp < myHpRef.current) {
          myHpRef.current = remoteMyHp;
          setMyHp(remoteMyHp);
        }
        if (remoteOppHp < oppHpRef.current) {
          oppHpRef.current = remoteOppHp;
          setOppHp(remoteOppHp);
        }
        if (updated.status === 'finished' && !finishedRef.current) {
          settleMatch(updated.winnerUid === user.uid || myHpRef.current > oppHpRef.current);
        }
      }
    });

    const unsubEvents = subscribeOnlineRoomEvents(roomCode, user.uid, (evt: PvPCombatEvent) => {
      if (phaseRef.current !== 'fighting') return;
      const v = vfxRef.current;
      v.oppAttackAnim = 1;
      const oppPath = opponentRef.current?.weaponPath ?? 'base';
      if (evt.actionType === 'attack' || evt.actionType === 'ultimate') {
        launchBeam(false, oppPath, evt.actionType === 'ultimate');
        if (myShieldRef.current) {
          myShieldRef.current = false;
          setMyShielded(false);
          soundEngine.playPerfectBell();
          v.floats.spawn(v.width * 0.25, v.height * 0.44, '結界反震！', 'perfect');
        } else {
          v.myHitFlash = 1;
          soundEngine.playPvpImpact();
          triggerGameFeel(v.feel, { hitstop: 0.055, shake: 0.55, flash: 0.22, flashColor: '#F43F5E' });
          v.particles.burst(v.width * 0.25, v.height * 0.54, 24, ['#F43F5E', '#FB923C', '#FFFFFF'], 80, 260, 6, 'spark');
          v.floats.spawn(v.width * 0.25, v.height * 0.42, `-${evt.damage}`, 'crit', evt.label);
        }
      } else if (evt.actionType === 'jam_fog') {
        if (myShieldRef.current) {
          myShieldRef.current = false;
          setMyShielded(false);
          v.floats.spawn(v.width * 0.25, v.height * 0.42, '結界抵擋墨霧！', 'heal');
        } else {
          myFogRef.current = 4.5;
          setMyFogTimer(4.5);
          soundEngine.playJammerCast();
          v.floats.spawn(v.width * 0.25, v.height * 0.42, '遭遇墨霧干擾！', 'miss');
        }
      } else if (evt.actionType === 'jam_haste') {
        myHasteRef.current = 5.0;
        setMyHasteTimer(5.0);
        soundEngine.playJammerCast();
        v.floats.spawn(v.width * 0.25, v.height * 0.42, '對手施放時間加速！', 'miss');
      } else if (evt.actionType === 'jam_shield') {
        oppShieldRef.current = true;
        v.floats.spawn(v.width * 0.75, v.height * 0.42, '對手展開結界', 'normal');
      }
    });

    return () => {
      unsubRoom();
      unsubEvents();
    };
  }, [launchBeam, phase, roomCode, save.pvp.rating, settleMatch, startFightSession, user.uid]);

  // Quick Matchmaking Handler (Online Firestore first -> Smart Rival instant fallback)
  const handleQuickMatch = async () => {
    if (!save.parentSettings.pvpEnabled) { setLobbyError('家長設定已暫停競技模式。'); return; }
    soundEngine.playClick();
    setLobbyError(null);
    setPhase('matching');

    if (loadout.canUseOnlineFirestore) {
      const found = await tryFindWaitingOnlineRoom(loadout, save.grade);
      if (found) {
        setRoomCode(found.roomCode);
        startFightSession({
          online: true,
          host: false,
          seed: found.questionSeed,
          gradeLevel: found.grade,
          subj: found.subjectFilter,
          opp: {
            uid: found.hostUid,
            name: found.hostName,
            schoolTag: 'Firebase 即時連線',
            weaponPath: found.hostWeaponPath,
            weaponLevel: found.hostWeaponLevel,
            guardian: found.hostGuardian,
            rating: save.pvp.rating,
          },
          rivalProfile: null,
          room: found,
        });
        return;
      }
    }

    // Seamless smart human-paced matchmaking after short authentic search pulse
    schedule(() => {
      if (phaseRef.current !== 'matching') return;
      const rival = pickSmartRival(save.pvp.rating);
      startFightSession({
        online: false,
        host: true,
        seed: Math.floor(10000 + Math.random() * 899999),
        gradeLevel: save.grade,
        subj: subjectFilter,
        opp: {
          uid: rival.uid,
          name: rival.name,
          schoolTag: rival.schoolTag,
          weaponPath: rival.weaponPath,
          weaponLevel: rival.weaponLevel,
          guardian: rival.guardian,
          rating: rival.rating,
        },
        rivalProfile: rival,
        room: null,
      });
    }, 950);
  };

  const handleCreateFriendRoom = async () => {
    if (!ONLINE_MATCHES_READY || !save.parentSettings.pvpEnabled) { setLobbyError(ONLINE_SAFETY_NOTICE); return; }
    soundEngine.playClick();
    setLobbyError(null);
    if (!loadout.canUseOnlineFirestore) {
      setLobbyError('建立跨裝置好友房號需要先登入 Google 帳號（或點選上方「快速排位對戰」立即開戰）！');
      return;
    }
    const created = await createOnlinePvPRoom(loadout, save.grade, subjectFilter);
    if (!created) {
      setLobbyError('建立線上房間暫時失敗，請確認網路或直接使用快速排位對戰！');
      return;
    }
    setRoomCode(created.roomCode);
    setOnlineRoom(created);
    roomRef.current = created;
    setPhase('waiting_room');
  };

  const handleJoinFriendRoom = async () => {
    if (!ONLINE_MATCHES_READY || !save.parentSettings.pvpEnabled) { setLobbyError(ONLINE_SAFETY_NOTICE); return; }
    soundEngine.playClick();
    setLobbyError(null);
    const joined = await joinOnlinePvPRoom(joinCodeInput, loadout);
    if (!joined.room) {
      setLobbyError(joined.error || '無法加入該房間。');
      return;
    }
    setRoomCode(joined.room.roomCode);
    startFightSession({
      online: true,
      host: false,
      seed: joined.room.questionSeed,
      gradeLevel: joined.room.grade,
      subj: joined.room.subjectFilter,
      opp: {
        uid: joined.room.hostUid,
        name: joined.room.hostName,
        schoolTag: '好友即時連線',
        weaponPath: joined.room.hostWeaponPath,
        weaponLevel: joined.room.hostWeaponLevel,
        guardian: joined.room.hostGuardian,
        rating: save.pvp.rating,
      },
      rivalProfile: null,
      room: joined.room,
    });
  };

  const advanceQuestion = useCallback(() => {
    setQIndex((prev) => (deck.length > 0 ? (prev + 1) % deck.length : 0));
    qTimerRef.current = 12;
    qStartTimeRef.current = Date.now();
    setQuestionTimer(12);
  }, [deck.length]);

  // Answer Submission -> Weapon Aura Attack!
  const handleSelectAnswer = (optionIdx: number) => {
    if (phase !== 'fighting' || deck.length === 0) return;
    const card = deck[qIndex % deck.length];
    const isCorrect = optionIdx === card.correctIndex;
    attemptsRef.current += 1;
    const v = vfxRef.current;

    if (isCorrect) {
      correctRef.current += 1;
      const nextCombo = myComboRef.current + 1;
      myComboRef.current = nextCombo;
      maxComboRef.current = Math.max(maxComboRef.current, nextCombo);
      setMyCombo(nextCombo);

      const elapsed = (Date.now() - qStartTimeRef.current) / 1000;
      const speed = getSpeedGrade(elapsed, 12, 'adventure', save.selectedGuardian);
      const calc = calculatePvPAttackDamage({
        speedGrade: speed,
        combo: nextCombo,
        weaponPath: equippedWeapon.ascensionPath,
        weaponEnhanceLevel: equippedWeapon.enhanceLevel,
        critChance: combatStats.critChance,
        targetShieldMitigation: oppShieldRef.current ? 0.5 : 0,
      });

      const finalDmg = oppShieldRef.current ? Math.round(calc.damage * 0.4) : calc.damage;
      if (oppShieldRef.current) {
        oppShieldRef.current = false;
        v.floats.spawn(v.width * 0.75, v.height * 0.36, '擊碎結界！', 'normal');
      }

      v.myAttackAnim = 1;
      v.oppHitFlash = 1;
      launchBeam(true, equippedWeapon.ascensionPath, false);
      soundEngine.playPvpImpact();
      if (speed === 'PERFECT') soundEngine.playPerfectBell();
      else soundEngine.playCorrectChord(nextCombo);

      triggerGameFeel(v.feel, {
        hitstop: 0.06,
        shake: calc.isCritical ? 0.65 : 0.4,
        flash: 0.2,
        flashColor: ASCENSION_PATHS[equippedWeapon.ascensionPath].auraPrimary,
      });

      const auraCols = [
        ASCENSION_PATHS[equippedWeapon.ascensionPath].auraPrimary,
        ASCENSION_PATHS[equippedWeapon.ascensionPath].auraSecondary,
        '#FFFFFF',
      ];
      v.particles.burst(v.width * 0.75, v.height * 0.54, 28, auraCols, 90, 310, 7, 'spark');
      v.particles.spawn(v.width * 0.75, v.height * 0.54, 0, 0, auraCols[0], 18, 0.35, 0, 'ring');
      v.floats.spawn(
        v.width * 0.75,
        v.height * 0.4,
        `-${finalDmg}`,
        speed === 'PERFECT' ? 'perfect' : calc.isCritical ? 'crit' : 'normal',
        speed === 'PERFECT' ? 'PERFECT 光環斬！' : `${nextCombo} 連擊！`
      );

      oppHpRef.current = Math.max(0, oppHpRef.current - finalDmg);
      setOppHp(oppHpRef.current);
      myScoreRef.current += finalDmg * 3 + (speed === 'PERFECT' ? 60 : 25);
      setMyScore(myScoreRef.current);

      setUltCharge((u) => Math.min(100, u + (speed === 'PERFECT' ? 30 : 22) + Math.round(combatStats.ultChargeBonus * 0.5)));
      if (nextCombo % 2 === 0) setJamEnergy((j) => Math.min(3, j + 1));
      setAnswerFeedback(`命中！${speed} 造成 ${finalDmg} 點神兵光環傷害！`);

      if (isOnlineRef.current && roomRef.current) {
        const r = roomRef.current;
        const won = oppHpRef.current <= 0;
        pushOnlineCombatUpdate({
          roomCode: r.roomCode,
          isHost: isHostRef.current,
          hostHp: isHostRef.current ? myHpRef.current : oppHpRef.current,
          guestHp: isHostRef.current ? oppHpRef.current : myHpRef.current,
          myScore: myScoreRef.current,
          myCombo: nextCombo,
          status: won ? 'finished' : 'playing',
          winnerUid: won ? user.uid : '',
        });
        pushOnlineCombatEvent({
          roomCode: r.roomCode,
          senderUid: user.uid,
          hostUid: r.hostUid,
          guestUid: r.guestUid,
          actionType: 'attack',
          damage: finalDmg,
          label: `${equippedWeapon.name} ${speed}`,
        });
      }

      if (oppHpRef.current <= 0) {
        schedule(() => settleMatch(true), 450);
      } else {
        advanceQuestion();
      }
    } else {
      myComboRef.current = 0;
      setMyCombo(0);
      soundEngine.playWrongBuzz();
      triggerGameFeel(v.feel, { shake: 0.25 });
      v.floats.spawn(v.width * 0.25, v.height * 0.4, '失誤！', 'miss', `正解：${card.answer}`);
      setAnswerFeedback(`答錯了！正確答案是「${card.answer}」— ${card.explanation}`);
      advanceQuestion();
    }
  };

  // Cast Jammer Magic (Fog / Haste / Reflective Shield)
  const handleCastJammer = (type: PvPJammerType) => {
    if (phase !== 'fighting' || jamEnergy <= 0) return;
    setJamEnergy((j) => Math.max(0, j - 1));
    soundEngine.playJammerCast();
    const v = vfxRef.current;

    if (type === 'jam_shield') {
      myShieldRef.current = true;
      setMyShielded(true);
      v.floats.spawn(v.width * 0.25, v.height * 0.36, '黃金反震結界！', 'perfect');
    } else if (type === 'jam_fog') {
      oppFogRef.current = 4.5;
      v.particles.burst(v.width * 0.75, v.height * 0.5, 22, ['#334155', '#64748B', '#A855F7'], 60, 180, 9);
      v.floats.spawn(v.width * 0.75, v.height * 0.38, '施放墨霧干擾！', 'crit');
    } else {
      rivalCdRef.current += 1.8;
      v.particles.burst(v.width * 0.75, v.height * 0.5, 18, ['#F59E0B', '#FDE047'], 70, 210, 6);
      v.floats.spawn(v.width * 0.75, v.height * 0.38, '時空加速干擾！', 'crit');
    }

    if (isOnlineRef.current && roomRef.current) {
      const r = roomRef.current;
      pushOnlineCombatEvent({
        roomCode: r.roomCode,
        senderUid: user.uid,
        hostUid: r.hostUid,
        guestUid: r.guestUid,
        actionType: type,
        damage: 0,
        label: type === 'jam_fog' ? '墨霧遮蔽' : type === 'jam_haste' ? '時空加速' : '結界反震',
      });
    }
  };

  // Use Battle Item: Shield Scroll / Wisdom Potion right inside Arena!
  const handleUseArenaPotion = () => {
    if (phase !== 'fighting') return;
    if (!consumeBattleItem('wisdom_potion')) return;
    soundEngine.playPerfectBell();
    const heal = Math.round(MAX_HP * 0.35);
    myHpRef.current = Math.min(MAX_HP, myHpRef.current + heal);
    setMyHp(myHpRef.current);
    vfxRef.current.floats.spawn(vfxRef.current.width * 0.25, vfxRef.current.height * 0.42, `+${heal} HP`, 'heal', '智光藥水');
  };

  // Trigger Full-Screen PvP Ultimate Cut-In!
  const handleTriggerUltimate = () => {
    if (phase !== 'fighting' || ultCharge < 100) return;
    setUltCharge(0);
    soundEngine.playUltimateRoar();
    setCutIn(true);

    schedule(() => {
      setCutIn(false);
      if (finishedRef.current) return;
      const calc = calculatePvPAttackDamage({
        speedGrade: 'PERFECT',
        combo: Math.max(3, myComboRef.current),
        weaponPath: equippedWeapon.ascensionPath,
        weaponEnhanceLevel: equippedWeapon.enhanceLevel,
        critChance: 1,
        targetShieldMitigation: 0,
        isUltimate: true,
      });
      const v = vfxRef.current;
      v.myAttackAnim = 1;
      v.oppHitFlash = 1;
      launchBeam(true, equippedWeapon.ascensionPath, true);
      soundEngine.playExplosion();
      triggerGameFeel(v.feel, {
        hitstop: 0.08,
        shake: 0.9,
        flash: 0.36,
        flashColor: ASCENSION_PATHS[equippedWeapon.ascensionPath].auraPrimary,
      });
      v.particles.burst(v.width * 0.75, v.height * 0.54, 48, ['#FDE047', '#38BDF8', '#F43F5E', '#FFFFFF'], 110, 380, 9, 'spark');
      v.floats.spawn(v.width * 0.75, v.height * 0.38, `-${calc.damage}`, 'perfect', '神兵必殺・智光天罰！');

      oppHpRef.current = Math.max(0, oppHpRef.current - calc.damage);
      setOppHp(oppHpRef.current);
      myScoreRef.current += calc.damage * 4;
      setMyScore(myScoreRef.current);

      if (isOnlineRef.current && roomRef.current) {
        const r = roomRef.current;
        const won = oppHpRef.current <= 0;
        pushOnlineCombatUpdate({
          roomCode: r.roomCode,
          isHost: isHostRef.current,
          hostHp: isHostRef.current ? myHpRef.current : oppHpRef.current,
          guestHp: isHostRef.current ? oppHpRef.current : myHpRef.current,
          myScore: myScoreRef.current,
          myCombo: myComboRef.current,
          status: won ? 'finished' : 'playing',
          winnerUid: won ? user.uid : '',
        });
        pushOnlineCombatEvent({
          roomCode: r.roomCode,
          senderUid: user.uid,
          hostUid: r.hostUid,
          guestUid: r.guestUid,
          actionType: 'ultimate',
          damage: calc.damage,
          label: '智光天罰必殺！',
        });
      }

      if (oppHpRef.current <= 0) {
        schedule(() => settleMatch(true), 500);
      }
    }, 1050);
  };

  // ==================== 60FPS DUAL-PLAYER CANVAS ARENA LOOP ====================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      vfxRef.current.width = rect.width;
      vfxRef.current.height = rect.height;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let rafId = 0;
    let yieldTimer = 0;
    let alive = true;
    let lastTs = performance.now();
    let syncAccum = 0;

    const loop = (now: number) => {
      if (!alive) return;
      const frameStart = performance.now();
      const rawDt = Math.min(0.05, Math.max(0.001, (now - lastTs) / 1000));
      lastTs = now;
      const v = vfxRef.current;
      const { simDt, shakeX, shakeY } = updateGameFeel(v.feel, rawDt);
      const dt = simDt;
      v.time += dt;

      if (v.myAttackAnim > 0) v.myAttackAnim = Math.max(0, v.myAttackAnim - dt * 2.8);
      if (v.oppAttackAnim > 0) v.oppAttackAnim = Math.max(0, v.oppAttackAnim - dt * 2.8);
      if (v.myHitFlash > 0) v.myHitFlash = Math.max(0, v.myHitFlash - dt * 4.5);
      if (v.oppHitFlash > 0) v.oppHitFlash = Math.max(0, v.oppHitFlash - dt * 4.5);
      if (v.myEmote) {
        v.myEmote.ttl -= dt;
        if (v.myEmote.ttl <= 0) v.myEmote = null;
      }

      if (phaseRef.current === 'fighting' && dt > 0 && !finishedRef.current) {
        if (myFogRef.current > 0) myFogRef.current = Math.max(0, myFogRef.current - dt);
        if (myHasteRef.current > 0) myHasteRef.current = Math.max(0, myHasteRef.current - dt);
        if (oppFogRef.current > 0) oppFogRef.current = Math.max(0, oppFogRef.current - dt);

        // Countdown per question
        const hasteMult = myHasteRef.current > 0 ? 1.65 : 1.0;
        qTimerRef.current -= dt * hasteMult;
        if (qTimerRef.current <= 0) {
          myComboRef.current = 0;
          setMyCombo(0);
          v.floats.spawn(v.width * 0.25, v.height * 0.42, '超時換題', 'miss');
          advanceQuestion();
        }

        // Smart Human-Paced Rival cadence (when not paired with a second remote Firestore player)
        if (!isOnlineRef.current && smartRivalRef.current) {
          const rival = smartRivalRef.current;
          const fogSlow = oppFogRef.current > 0 ? 0.55 : 1.0;
          rivalCdRef.current -= dt * fogSlow;
          if (rivalCdRef.current <= 0) {
            rivalCdRef.current = Math.max(2.6, rival.avgReactionSeconds + (Math.random() - 0.5) * 2.0);
            const hitRoll = Math.random() < rival.accuracy;
            if (hitRoll) {
              v.oppAttackAnim = 1;
              launchBeam(false, rival.weaponPath, false);
              if (myShieldRef.current) {
                myShieldRef.current = false;
                setMyShielded(false);
                soundEngine.playPerfectBell();
                v.floats.spawn(v.width * 0.25, v.height * 0.42, '結界反震 0 傷！', 'perfect');
              } else {
                const dmg = Math.round(
                  (26 + rival.weaponLevel * 1.1) * (1 - combatStats.shieldMitigation)
                );
                myHpRef.current = Math.max(0, myHpRef.current - dmg);
                setMyHp(myHpRef.current);
                oppScoreRef.current += dmg * 3;
                setOppScore(oppScoreRef.current);
                setOppCombo((c) => c + 1);
                v.myHitFlash = 1;
                soundEngine.playPvpImpact();
                triggerGameFeel(v.feel, { hitstop: 0.05, shake: 0.45, flash: 0.18, flashColor: '#F43F5E' });
                v.particles.burst(v.width * 0.25, v.height * 0.54, 20, ['#F43F5E', '#FB923C', '#FFFFFF'], 70, 240, 6, 'spark');
                v.floats.spawn(v.width * 0.25, v.height * 0.4, `-${dmg}`, 'crit', `${rival.name} 斬擊`);

                // Occasional smart jammer cast
                if (Math.random() < 0.22 && myFogRef.current <= 0) {
                  myFogRef.current = 3.2;
                  setMyFogTimer(3.2);
                  soundEngine.playJammerCast();
                  v.floats.spawn(v.width * 0.25, v.height * 0.3, '對手施放墨霧！', 'miss');
                }

                if (myHpRef.current <= 0) {
                  schedule(() => settleMatch(false), 450);
                }
              }
            } else {
              setOppCombo(0);
              v.floats.spawn(v.width * 0.75, v.height * 0.42, '對手失誤！', 'normal');
            }
          }
        }
      }

      // Advance beams
      for (let i = v.projectiles.length - 1; i >= 0; i--) {
        v.projectiles[i].progress += dt * 4.2;
        if (v.projectiles[i].progress >= 1) v.projectiles.splice(i, 1);
      }

      v.particles.update(dt);
      v.floats.update(dt);

      syncAccum += rawDt;
      if (syncAccum > 0.2) {
        syncAccum = 0;
        setQuestionTimer(Math.max(0, Math.ceil(qTimerRef.current)));
        setMyFogTimer(Number(myFogRef.current.toFixed(1)));
        setMyHasteTimer(Number(myHasteRef.current.toFixed(1)));
      }

      // ==================== RENDER DUAL-PLAYER KNOWLEDGE ARENA ====================
      ctx.save();
      ctx.translate(shakeX, shakeY);
      const W = v.width;
      const H = v.height;

      // Cosmic Colosseum Backdrop
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, '#090D24');
      bg.addColorStop(0.5, '#1E1B4B');
      bg.addColorStop(1, '#3B0764');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Arena Radial Spotlights
      const leftGlow = ctx.createRadialGradient(W * 0.25, H * 0.58, 12, W * 0.25, H * 0.58, 220);
      leftGlow.addColorStop(0, 'rgba(56, 189, 248, 0.28)');
      leftGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = leftGlow;
      ctx.fillRect(0, 0, W, H);

      const rightGlow = ctx.createRadialGradient(W * 0.75, H * 0.58, 12, W * 0.75, H * 0.58, 220);
      rightGlow.addColorStop(0, 'rgba(244, 63, 94, 0.28)');
      rightGlow.addColorStop(1, 'rgba(244, 63, 94, 0)');
      ctx.fillStyle = rightGlow;
      ctx.fillRect(0, 0, W, H);

      // Perspective Arena Floor Deck
      ctx.fillStyle = '#0F172A';
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(W * 0.5, H * 0.78, W * 0.44, H * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Center VS Energy Crest
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.32)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(W * 0.5, H * 0.58, 42 + Math.sin(v.time * 4) * 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(254, 240, 138, 0.55)';
      ctx.font = '900 22px "Fredoka", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('VS', W * 0.5, H * 0.58);

      // Left Duelist: Player
      drawPvPDuelist(ctx, W * 0.25, H * 0.62, v.time, {
        facing: 1,
        name: user.displayName,
        weaponPath: equippedWeapon.ascensionPath,
        weaponLevel: equippedWeapon.enhanceLevel,
        guardianId: save.selectedGuardian,
        attackProgress: v.myAttackAnim,
        hitFlash: v.myHitFlash,
        shielded: myShieldRef.current,
        fogged: myFogRef.current > 0,
        scale: W < 760 ? 1.15 : 1.45,
      });

      // Safe Friendly Quick-Emote Speech Bubble over Player Duelist
      if (v.myEmote) {
        const bx = W * 0.25;
        const by = H * 0.27;
        ctx.save();
        ctx.globalAlpha = Math.min(1, v.myEmote.ttl * 2);
        ctx.fillStyle = '#FFFBEB';
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 3;
        drawRoundedRect(ctx, bx - 66, by - 22, 132, 38, 16);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#0F172A';
        ctx.font = '900 15px "Noto Sans TC", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(v.myEmote.text, bx, by - 3);
        ctx.restore();
      }

      // Right Duelist: Opponent (or preview rival in lobby)
      const opp = opponentRef.current;
      drawPvPDuelist(ctx, W * 0.75, H * 0.62, v.time, {
        facing: -1,
        name: opp?.name ?? '神話挑戰者',
        weaponPath: opp?.weaponPath ?? 'inferno',
        weaponLevel: opp?.weaponLevel ?? 8,
        guardianId: opp?.guardian ?? 'stardragon',
        attackProgress: v.oppAttackAnim,
        hitFlash: v.oppHitFlash,
        shielded: oppShieldRef.current,
        fogged: oppFogRef.current > 0,
        scale: W < 760 ? 1.15 : 1.45,
      });

      // Weapon Aura Energy Beams flying across Arena
      for (const p of v.projectiles) {
        const cx = p.fromX + (p.toX - p.fromX) * p.progress;
        const cy = p.fromY + (p.toY - p.fromY) * p.progress - Math.sin(p.progress * Math.PI) * 32;
        ctx.save();
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.isUltimate ? 20 : 10;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.fromX + (p.toX - p.fromX) * Math.max(0, p.progress - 0.22), cy);
        ctx.lineTo(cx, cy);
        ctx.stroke();

        ctx.fillStyle = p.secondary;
        ctx.beginPath();
        ctx.arc(cx, cy, p.isUltimate ? 18 : 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Ink Fog Jammer visual cloud on player side
      if (myFogRef.current > 0) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
        drawRoundedRect(ctx, 18, H * 0.25, W * 0.42, H * 0.65, 24);
        ctx.fill();
      }

      v.particles.render(ctx);
      v.floats.render(ctx);

      if (v.feel.flashAlpha > 0.01) {
        ctx.fillStyle = v.feel.flashColor;
        ctx.globalAlpha = v.feel.flashAlpha;
        ctx.fillRect(0, 0, W, H);
      }

      ctx.restore();
      const workMs = performance.now() - frameStart;
      if (workMs > 10) {
        yieldTimer = window.setTimeout(() => {
          if (alive) rafId = requestAnimationFrame(loop);
        }, Math.min(40, Math.round(workMs)));
      } else {
        rafId = requestAnimationFrame(loop);
      }
    };

    rafId = requestAnimationFrame(loop);
    return () => {
      alive = false;
      cancelAnimationFrame(rafId);
      clearTimeout(yieldTimer);
      ro.disconnect();
    };
  }, [
    advanceQuestion,
    combatStats.shieldMitigation,
    equippedWeapon.ascensionPath,
    equippedWeapon.enhanceLevel,
    launchBeam,
    save.selectedGuardian,
    settleMatch,
    user.displayName,
  ]);

  const rankTier = getPvPRankTier(save.pvp.rating);
  const currentCard = deck.length > 0 ? deck[qIndex % deck.length] : null;

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 overflow-hidden" data-testid="pvp-arena-engine">
      {/* Top Dual-Player Live Canvas Stage */}
      <div className={`relative w-full shrink-0 ${phase === 'fighting' ? 'h-[44%]' : 'h-[48%]'}`}>
        <canvas ref={canvasRef} className="block w-full h-full" data-testid="pvp-arena-canvas" />

        {/* Top Bar Overlay: Back + Duelist HP Bars when fighting */}
        <div className="absolute top-3 inset-x-3 z-20 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              if (phase === 'waiting_room' && roomCode) {
                cancelWaitingOnlineRoom(roomCode);
              }
              soundEngine.playClick();
              onExit();
            }}
            className="min-h-[44px] px-3.5 rounded-xl bg-slate-900/92 hover:bg-slate-800 border-2 border-slate-600 text-white font-black text-xs inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> 返回學園
          </button>

          {phase === 'fighting' && (
            <div className="flex-1 max-w-2xl grid grid-cols-11 items-center gap-2 rounded-2xl bg-slate-900/92 border-2 border-amber-400/75 px-3 py-2 shadow-xl">
              <div className="col-span-5">
                <div className="flex justify-between text-xs font-black">
                  <span className="text-sky-300 truncate">{user.displayName}</span>
                  <span className="text-white font-mono-num">{myHp}/{MAX_HP}</span>
                </div>
                <div className="mt-1 h-3 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                  <div
                    className="h-full bg-sky-400 transition-transform origin-left"
                    style={{ transform: `scaleX(${Math.max(0, myHp / MAX_HP)})` }}
                  />
                </div>
                <div className="text-[10px] text-amber-300 font-mono-num mt-0.5">
                  得分 {myScore} · 連擊 {myCombo}x
                </div>
              </div>

              <div className="col-span-1 text-center">
                <div className={`text-base font-black font-mono-num ${questionTimer <= 4 ? 'text-rose-400' : 'text-amber-300'}`}>
                  {questionTimer}s
                </div>
              </div>

              <div className="col-span-5">
                <div className="flex justify-between text-xs font-black">
                  <span className="text-white font-mono-num">{oppHp}/{MAX_HP}</span>
                  <span className="text-rose-300 truncate">{opponent?.name ?? '對手'}</span>
                </div>
                <div className="mt-1 h-3 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                  <div
                    className="h-full bg-rose-500 transition-transform origin-right"
                    style={{ transform: `scaleX(${Math.max(0, oppHp / MAX_HP)})` }}
                  />
                </div>
                <div className="text-[10px] text-rose-300 font-mono-num mt-0.5 text-right">
                  {opponent?.schoolTag} · 連擊 {oppCombo}x
                </div>
              </div>
            </div>
          )}

          <div className="rounded-xl bg-slate-900/92 border-2 border-amber-400/70 px-3 py-1.5 text-right hidden sm:block">
            <div className="text-[10px] text-slate-400 font-bold">目前段位</div>
            <div className="text-xs font-black" style={{ color: rankTier.color }}>
              {rankTier.name} · {save.pvp.rating}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Interactive Deck Area */}
      <div className="flex-1 bg-slate-900 border-t-4 border-indigo-400 p-3 sm:p-5 overflow-y-auto">
        {phase === 'lobby' && (
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* Left: Rank & Loadout Card */}
            <div className="lg:col-span-5 rounded-2xl bg-slate-950 border-2 border-indigo-500/60 p-4 flex flex-col justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-14 h-14 rounded-2xl border-2 border-white/60 flex items-center justify-center text-2xl font-black text-slate-950 shrink-0"
                  style={{ backgroundColor: rankTier.color }}
                >
                  {rankTier.emblem}
                </div>
                <div>
                  <div className="text-xs font-bold text-indigo-300">雙人同框知識競技場</div>
                  <div className="text-lg font-black text-white">{rankTier.name}</div>
                  <div className="text-xs text-slate-300 font-mono-num">
                    積分 {save.pvp.rating} · {save.pvp.wins}勝 {save.pvp.losses}敗 · 榮譽幣 {save.pvp.honorTokens}
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-slate-900 border border-slate-800 p-3 text-xs space-y-1">
                <div className="font-black text-amber-300">
                  出戰神兵：{equippedWeapon.name} (+{equippedWeapon.enhanceLevel})
                </div>
                <div className="text-slate-300">
                  光環路線：{ASCENSION_PATHS[equippedWeapon.ascensionPath].name}
                </div>
                <div className="text-slate-400">
                  {ONLINE_SAFETY_NOTICE}
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-slate-400 mb-1.5">出題科目範圍（{save.grade}年級）</div>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      ['all', '全科綜合'],
                      ['chinese', '國語'],
                      ['english', '英語'],
                      ['math', '數學'],
                      ['science', '自然'],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        setSubjectFilter(id);
                      }}
                      className={`min-h-[38px] px-3 rounded-lg text-xs font-black ${
                        subjectFilter === id
                          ? 'bg-indigo-500 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Matchmaking & Friend Room Controls */}
            <div className="lg:col-span-7 flex flex-col justify-between gap-3">
              <button
                type="button"
                onClick={handleQuickMatch}
                className="w-full min-h-[68px] rounded-2xl bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-rose-500 hover:brightness-110 text-white font-black text-lg shadow-xl border-2 border-white/40 flex items-center justify-center gap-2.5 transition-transform active:scale-[0.99]"
              >
                <Swords className="w-6 h-6" /> 開始 AI 知識練習（不計排位）
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-950 border border-slate-700 p-3.5 flex flex-col justify-between gap-2">
                  <div className="text-sm font-black text-cyan-300 flex items-center gap-1.5">
                    <Users className="w-4 h-4" /> 建立好友房號
                  </div>
                  <p className="text-xs text-slate-400">
                    產生 6 碼邀請房號，與同學在各自裝置即時同框對轟！
                  </p>
                  {loadout.canUseOnlineFirestore ? (
                    <button
                      type="button"
                      onClick={handleCreateFriendRoom}
                      className="min-h-[46px] rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs"
                    >
                      建立線上房間
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={signInWithGoogle}
                      className="min-h-[46px] rounded-xl bg-slate-800 hover:bg-slate-700 border border-cyan-400/60 text-cyan-200 font-black text-xs"
                    >
                      登入 Google 解鎖好友連線房
                    </button>
                  )}
                </div>

                <div className="rounded-2xl bg-slate-950 border border-slate-700 p-3.5 flex flex-col justify-between gap-2">
                  <div className="text-sm font-black text-amber-300">輸入好友房號加入</div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase().slice(0, 8))}
                      placeholder="例如 STAR42"
                      className="flex-1 min-w-0 min-h-[46px] rounded-xl bg-slate-900 border border-slate-600 px-3 text-white font-mono-num font-black text-sm uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleJoinFriendRoom}
                      className="min-h-[46px] px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shrink-0"
                    >
                      加入
                    </button>
                  </div>
                </div>
              </div>

              {lobbyError && (
                <div className="rounded-xl bg-rose-950/90 border border-rose-500 px-3.5 py-2 text-xs text-rose-200 font-bold">
                  {lobbyError}
                </div>
              )}
            </div>
          </div>
        )}

        {phase === 'matching' && (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
            <Swords className="w-12 h-12 text-amber-400 animate-bounce" />
            <div className="text-xl font-black text-white">正在搜尋同級學園對手...</div>
            <p className="text-xs text-slate-400">優先媒合 Firebase 線上真人房間，並依實力智慧配對</p>
          </div>
        )}

        {phase === 'waiting_room' && (
          <div className="max-w-lg mx-auto rounded-2xl bg-slate-950 border-2 border-cyan-400 p-5 text-center space-y-4">
            <div className="text-sm font-black text-cyan-300">好友線上對戰房間已開啟！</div>
            <div className="text-4xl font-black tracking-widest text-amber-300 font-mono-num">
              {roomCode}
            </div>
            <p className="text-xs text-slate-300">
              將上方 6 碼房號告訴同學，對方輸入加入後將立刻同步開戰！
            </p>
            <div className="flex flex-wrap justify-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(roomCode).catch(() => {});
                  setCopiedCode(true);
                  schedule(() => setCopiedCode(false), 1800);
                }}
                className="min-h-[46px] px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs inline-flex items-center gap-1.5"
              >
                <Copy className="w-4 h-4" /> {copiedCode ? '已複製房號！' : '複製邀請房號'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (roomCode) cancelWaitingOnlineRoom(roomCode);
                  setRoomCode('');
                  setPhase('lobby');
                }}
                className="min-h-[46px] px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs"
              >
                取消房間
              </button>
            </div>
          </div>
        )}

        {phase === 'fighting' && currentCard && (
          <div className="max-w-5xl mx-auto flex flex-col gap-3">
            {/* Prompt + Jammer/Ultimate Action Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-slate-950 border-2 border-indigo-400/70 px-4 py-2.5">
              <div className="flex-1 min-w-[220px]">
                <div className="text-[11px] font-bold text-indigo-300 flex items-center gap-2">
                  <span>{currentCard.knowledgeTag}</span>
                  {myFogTimer > 0 && <span className="text-rose-400">· 墨霧遮蔽中 {myFogTimer}s</span>}
                  {myHasteTimer > 0 && <span className="text-amber-400">· 倒數加速中 {myHasteTimer}s</span>}
                  {myShielded && <span className="text-sky-300">· 結界反震啟動中</span>}
                </div>
                <div className={`text-sm sm:text-base font-black text-white mt-0.5 ${myFogTimer > 0 ? 'opacity-65' : ''}`}>
                  {currentCard.prompt}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {currentCard.speakText && (
                  <button
                    type="button"
                    onClick={() =>
                      soundEngine.speakText(currentCard.speakText!, currentCard.speakLang ?? 'zh-TW')
                    }
                    aria-label="朗讀題目"
                    className="w-11 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                )}

                {/* 3 Jammer Spells */}
                <button
                  type="button"
                  disabled={jamEnergy <= 0}
                  onClick={() => handleCastJammer('jam_fog')}
                  className="min-h-[44px] px-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-black text-xs inline-flex items-center gap-1"
                >
                  <CloudFog className="w-4 h-4" /> 墨霧 ({jamEnergy})
                </button>
                <button
                  type="button"
                  disabled={jamEnergy <= 0}
                  onClick={() => handleCastJammer('jam_haste')}
                  className="min-h-[44px] px-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black text-xs inline-flex items-center gap-1"
                >
                  <Zap className="w-4 h-4" /> 加速
                </button>
                <button
                  type="button"
                  disabled={jamEnergy <= 0}
                  onClick={() => handleCastJammer('jam_shield')}
                  className="min-h-[44px] px-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black text-xs inline-flex items-center gap-1"
                >
                  <Shield className="w-4 h-4" /> 反震
                </button>
                <button
                  type="button"
                  disabled={(save.items.wisdom_potion ?? 0) <= 0}
                  onClick={handleUseArenaPotion}
                  className="min-h-[44px] px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-black text-xs"
                >
                  藥水 ({save.items.wisdom_potion ?? 0})
                </button>
                <button
                  type="button"
                  disabled={ultCharge < 100}
                  onClick={handleTriggerUltimate}
                  className={`min-h-[44px] px-3 rounded-xl font-black text-xs inline-flex items-center gap-1 border-2 ${
                    ultCharge >= 100
                      ? 'bg-rose-500 hover:bg-rose-400 border-amber-200 text-white shadow-[0_0_16px_rgba(244,63,94,0.8)]'
                      : 'bg-slate-800 border-slate-700 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Flame className="w-4 h-4" /> 必殺 ({ultCharge}%)
                </button>
              </div>
            </div>

            {/* 4 Large Touch-Friendly Answer Buttons (>= 56px) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {currentCard.options.map((opt, idx) => (
                <button
                  key={`${currentCard.id}-${idx}`}
                  type="button"
                  onClick={() => {
                    soundEngine.hapticPulse(14);
                    handleSelectAnswer(idx);
                  }}
                  className="min-h-[58px] rounded-2xl bg-slate-800 hover:bg-indigo-600 active:scale-[0.98] border-2 border-slate-600 hover:border-amber-300 px-4 py-2 text-left text-white font-black text-sm sm:text-base transition-all flex items-center gap-3"
                >
                  <span className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-600 text-amber-300 font-mono-num text-xs flex items-center justify-center shrink-0">
                    {['A', 'B', 'C', 'D'][idx]}
                  </span>
                  <span className="leading-snug">{opt}</span>
                </button>
              ))}
            </div>

            {/* Safe Friendly Quick-Emote Strip (Zero Free-Text Chat) */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-400">安全互動表情：</span>
                {['加油！', '好厲害！', '接招吧！', '太神啦！'].map((msg) => (
                  <button
                    key={msg}
                    type="button"
                    onClick={() => handleSendEmote(msg)}
                    className="min-h-[38px] px-3 rounded-xl bg-slate-800 hover:bg-amber-400 hover:text-slate-950 border border-slate-600 text-amber-200 font-black text-xs transition-colors active:scale-95"
                  >
                    {msg}
                  </button>
                ))}
              </div>
              {answerFeedback && (
                <div className="text-xs font-bold text-amber-200 bg-slate-950/90 border border-slate-700 rounded-xl px-3.5 py-2">
                  {answerFeedback}
                </div>
              )}
            </div>
          </div>
        )}

        {phase === 'result' && finalResult && (
          <div className="max-w-xl mx-auto rounded-3xl bg-slate-950 border-2 border-amber-400 p-5 text-center space-y-4 shadow-2xl">
            <div className="inline-flex items-center gap-2 text-amber-300 font-black text-xs">
              <Trophy className="w-4 h-4" /> 競技場段位結算
            </div>
            <div className={`text-3xl font-black ${finalResult.victory ? 'text-amber-300' : 'text-rose-300'}`}>
              {finalResult.victory ? '對戰勝利！光環稱霸！' : '惜敗對手！再接再厲！'}
            </div>
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="rounded-xl bg-slate-900 border border-slate-800 p-2.5">
                <div className="text-[11px] text-slate-400">段位積分</div>
                <div className={`text-lg font-black font-mono-num ${finalResult.ratingDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {finalResult.newRating} ({finalResult.ratingDelta >= 0 ? '+' : ''}{finalResult.ratingDelta})
                </div>
              </div>
              <div className="rounded-xl bg-slate-900 border border-slate-800 p-2.5">
                <div className="text-[11px] text-slate-400">競技榮譽幣</div>
                <div className="text-lg font-black font-mono-num text-fuchsia-300">
                  +{finalResult.honorEarned}
                </div>
              </div>
              <div className="rounded-xl bg-slate-900 border border-slate-800 p-2.5">
                <div className="text-[11px] text-slate-400">金幣 / 經驗</div>
                <div className="text-lg font-black font-mono-num text-amber-300">
                  +{finalResult.coinsEarned} / +{finalResult.xpEarned}
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleQuickMatch}
                className="min-h-[48px] px-5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-black text-sm inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" /> 再戰一場
              </button>
              <button
                type="button"
                onClick={onExit}
                className="min-h-[48px] px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm"
              >
                返回學園廣場
              </button>
            </div>
          </div>
        )}
      </div>

      {showVsBanner && (
        <div className="fixed inset-x-0 top-24 z-40 pointer-events-none flex justify-center px-4">
          <div className="animate-vs-banner rounded-2xl bg-gradient-to-r from-sky-950/96 via-fuchsia-950/96 to-rose-950/96 border-2 border-amber-300 px-6 py-3.5 text-center shadow-[0_0_36px_rgba(251,191,36,0.55)]">
            <div className="text-[11px] font-black tracking-widest text-amber-300">
              KNOWLEDGE DUEL · 線上對決開始！
            </div>
            <div className="text-lg sm:text-2xl font-black text-white mt-0.5 flex items-center justify-center gap-3">
              <span className="text-sky-300">{user.displayName}</span>
              <span className="text-amber-400 font-display text-2xl">VS</span>
              <span className="text-rose-300">{opponent?.name ?? '神話挑戰者'}</span>
            </div>
          </div>
        </div>
      )}

      <UltimateCutIn
        visible={cutIn}
        title="神兵覺醒・智光天罰斬！"
        subtitle={`${equippedWeapon.name} 釋放極致知識光環轟擊！`}
        symbol="光"
        accentBg="bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-amber-500"
      />
    </div>
  );
};
