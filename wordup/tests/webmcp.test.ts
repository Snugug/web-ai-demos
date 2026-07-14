import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { registerWebMCPTools } from '../src/lib/webmcp';
import type { GameStore } from '../src/lib/gameStoreTypes';

describe('WebMCP Tools Registration and Execution', () => {
  let mockRegisterTool: any;
  let registeredTools: Map<string, any>;
  let mockGameStore: any;

  beforeEach(() => {
    registeredTools = new Map();
    mockRegisterTool = vi.fn((toolDef: any, options?: any) => {
      registeredTools.set(toolDef.name, { def: toolDef, options });
    });

    (document as any).modelContext = {
      registerTool: mockRegisterTool
    };

    mockGameStore = {
      state: {
        gameStatus: 'playing',
        difficulty: 'hard',
        allowDuplicates: false,
        activeRow: ['', '', '', '', ''],
        isLocked: [false, false, false, false, false],
        guesses: [],
        streak: 3,
        score: 15,
        highScore: 25,
        helpActionsUsed: 0
      },
      difficulty: 'hard',
      allowDuplicates: false,
      canUseHelp: true,
      forceNewGame: vi.fn().mockResolvedValue(undefined),
      fillActiveRow: vi.fn((word: string) => {
        const chars = word.toUpperCase().split('');
        for (let i = 0; i < 5; i++) {
          if (!mockGameStore.state.isLocked[i] && chars[i]) {
            mockGameStore.state.activeRow[i] = chars[i];
          }
        }
      }),
      submitGuess: vi.fn().mockImplementation(async () => {
        const word = mockGameStore.state.activeRow.join('');
        if (word.length === 5) {
          mockGameStore.state.guesses.push(
            word.split('').map((char: string) => ({ letter: char, status: 'correct', isLocked: true }))
          );
          return true;
        }
        return false;
      }),
      useHelpAction: vi.fn().mockImplementation(async () => {
        if (!mockGameStore.canUseHelp) return false;
        mockGameStore.state.isLocked[0] = true;
        mockGameStore.state.activeRow[0] = 'A';
        mockGameStore.state.helpActionsUsed += 1;
        mockGameStore.state.score -= 1;
        return true;
      })
    };
  });

  afterEach(() => {
    delete (document as any).modelContext;
    delete (navigator as any).modelContext;
  });

  it('should safely do nothing if WebMCP modelContext is not present', () => {
    delete (document as any).modelContext;
    expect(() => registerWebMCPTools(mockGameStore as unknown as GameStore)).not.toThrow();
  });

  it('should register WebMCP tools including reveal_a_letter when modelContext exists', () => {
    const controller = new AbortController();
    registerWebMCPTools(mockGameStore as unknown as GameStore, { signal: controller.signal });

    expect(registeredTools.has('start_new_game')).toBe(true);
    expect(registeredTools.has('type_guess')).toBe(true);
    expect(registeredTools.has('submit_guess')).toBe(true);
    expect(registeredTools.has('get_current_guess')).toBe(true);
    expect(registeredTools.has('reveal_a_letter')).toBe(true);
    expect(registeredTools.has('reveal_letter')).toBe(true);
    expect(registeredTools.has('apply_hint')).toBe(true);
    expect(registeredTools.has('get_stats')).toBe(true);
    expect(registeredTools.has('get_previous_guesses')).toBe(true);
    expect(registeredTools.has('get_game_state')).toBe(true);
    expect(registeredTools.has('get_game_settings')).toBe(true);
    expect(registeredTools.has('get_settings')).toBe(true);
    expect(registeredTools.has('get_reveal_letter_info')).toBe(true);
    expect(registeredTools.has('get_hints_info')).toBe(true);
    expect(registeredTools.has('get_hint_status')).toBe(true);
  });

  it('should have prompt-engineered description for reveal_a_letter encouraging agents when stuck or on last guesses', () => {
    registerWebMCPTools(mockGameStore as unknown as GameStore);
    const revealTool = registeredTools.get('reveal_a_letter').def;
    expect(revealTool.description).toContain('Reveal one missing letter');
    expect(revealTool.description).toContain('stuck');
    expect(revealTool.description).toContain('last or second-to-last guess');
  });

  it('should execute start_new_game tool with difficulty and allowDuplicates options', async () => {
    registerWebMCPTools(mockGameStore as unknown as GameStore);
    const tool = registeredTools.get('start_new_game').def;

    const result = await tool.execute({ difficulty: 'easy', allowDuplicates: true });

    expect(mockGameStore.difficulty).toBe('easy');
    expect(mockGameStore.allowDuplicates).toBe(true);
    expect(mockGameStore.forceNewGame).toHaveBeenCalled();
    expect(result.status).toBe('playing');
  });

  it('should execute type_guess tool and fill active row', async () => {
    registerWebMCPTools(mockGameStore as unknown as GameStore);
    const tool = registeredTools.get('type_guess').def;

    const errorResult = tool.execute({ word: 'SHORT' }); // 5 letters valid
    expect(mockGameStore.fillActiveRow).toHaveBeenCalledWith('SHORT');
    expect(errorResult.activeRow).toEqual(['S', 'H', 'O', 'R', 'T']);

    const invResult = tool.execute({ word: 'TOO_LONG' });
    expect(invResult.error).toBeDefined();
  });

  it('should execute submit_guess tool', async () => {
    registerWebMCPTools(mockGameStore as unknown as GameStore);
    const tool = registeredTools.get('submit_guess').def;

    const result = await tool.execute({ word: 'APPLE' });

    expect(mockGameStore.fillActiveRow).toHaveBeenCalledWith('APPLE');
    expect(mockGameStore.submitGuess).toHaveBeenCalled();
    expect(result.guessesCount).toBe(1);
    expect(result.gameStatus).toBe('playing');
  });

  it('should execute get_current_guess tool and return active row and lock states', () => {
    registerWebMCPTools(mockGameStore as unknown as GameStore);
    const tool = registeredTools.get('get_current_guess').def;

    const result = tool.execute();

    expect(tool.annotations?.readOnlyHint).toBe(true);
    expect(result.activeRow).toEqual(['', '', '', '', '']);
    expect(result.isLocked).toEqual([false, false, false, false, false]);
  });

  it('should execute reveal_a_letter (and apply_hint) tool and return revealed index and letter', async () => {
    registerWebMCPTools(mockGameStore as unknown as GameStore);
    const tool = registeredTools.get('reveal_a_letter').def;

    const result = await tool.execute();

    expect(mockGameStore.useHelpAction).toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.revealedIndex).toBe(0);
    expect(result.revealedLetter).toBe('A');
    expect(result.activeRow[0]).toBe('A');
  });

  it('should execute get_stats tool and return streak, score, and highScore', () => {
    registerWebMCPTools(mockGameStore as unknown as GameStore);
    const tool = registeredTools.get('get_stats').def;

    const result = tool.execute();

    expect(tool.annotations?.readOnlyHint).toBe(true);
    expect(result).toEqual({
      streak: 3,
      score: 15,
      highScore: 25,
      difficulty: 'hard',
      allowDuplicates: false
    });
  });

  it('should execute get_previous_guesses and get_game_state tools and return array of guesses in order', () => {
    registerWebMCPTools(mockGameStore as unknown as GameStore);
    mockGameStore.state.guesses = [
      [{ letter: 'C', status: 'correct' }, { letter: 'A', status: 'absent' }],
      [{ letter: 'B', status: 'present' }, { letter: 'A', status: 'correct' }]
    ];

    const prevGuessesTool = registeredTools.get('get_previous_guesses').def;
    expect(prevGuessesTool.annotations?.readOnlyHint).toBe(true);
    const prevRes = prevGuessesTool.execute();
    expect(prevRes.guesses).toEqual(mockGameStore.state.guesses);
    expect(prevRes.guessesCount).toBe(2);

    const gameStateTool = registeredTools.get('get_game_state').def;
    expect(gameStateTool.annotations?.readOnlyHint).toBe(true);
    const stateRes = gameStateTool.execute();
    expect(stateRes.guesses).toEqual(mockGameStore.state.guesses);
    expect(stateRes.gameStatus).toBe('playing');
  });

  it('should execute get_game_settings and get_settings tools and return current difficulty level and allowDuplicates', () => {
    registerWebMCPTools(mockGameStore as unknown as GameStore);
    mockGameStore.state.difficulty = 'medium';
    mockGameStore.state.allowDuplicates = true;

    const gameSettingsTool = registeredTools.get('get_game_settings').def;
    expect(gameSettingsTool.annotations?.readOnlyHint).toBe(true);
    const res1 = gameSettingsTool.execute();
    expect(res1).toEqual({ difficulty: 'medium', allowDuplicates: true });

    const settingsTool = registeredTools.get('get_settings').def;
    expect(settingsTool.annotations?.readOnlyHint).toBe(true);
    const res2 = settingsTool.execute();
    expect(res2).toEqual({ difficulty: 'medium', allowDuplicates: true });
  });

  it('should execute get_reveal_letter_info and get_hints_info tools and return hints used and remaining', () => {
    registerWebMCPTools(mockGameStore as unknown as GameStore);
    mockGameStore.state.helpActionsUsed = 1;

    const hintsInfoTool = registeredTools.get('get_reveal_letter_info').def;
    expect(hintsInfoTool.annotations?.readOnlyHint).toBe(true);
    const res1 = hintsInfoTool.execute();
    expect(res1).toEqual({
      hintsUsed: 1,
      hintsRemaining: 2,
      hintsLeft: 2,
      maxHints: 3,
      canUseHelp: true
    });

    const hintStatusTool = registeredTools.get('get_hint_status').def;
    expect(hintStatusTool.annotations?.readOnlyHint).toBe(true);
    const res2 = hintStatusTool.execute();
    expect(res2).toEqual({
      hintsUsed: 1,
      hintsRemaining: 2,
      hintsLeft: 2,
      maxHints: 3,
      canUseHelp: true
    });
  });
});

