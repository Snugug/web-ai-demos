<script lang="ts">
  let {
    gameStatus,
    isFetchingSuggestions = false,
    guessesLength = 0,
    helpActionsUsed = 0,
    canUseHelp = (guessesLength > 0 && 3 - helpActionsUsed > 0),
    onSubmit,
    onHelp,
    onNewGame
  } = $props<{
    gameStatus: 'loading' | 'playing' | 'won' | 'lost' | 'error';
    isFetchingSuggestions?: boolean;
    guessesLength?: number;
    helpActionsUsed?: number;
    canUseHelp?: boolean;
    onSubmit: () => void;
    onHelp: () => void;
    onNewGame: () => void;
  }>();

  function autofocus(node: HTMLButtonElement) {
    node.focus();
  }
</script>

<div class="action-area">
  {#if gameStatus === 'playing'}
    <div class="playing-actions">
      <button class="submit-btn" onclick={onSubmit}>
        GUESS!
      </button>
      <button 
        class="help-btn" 
        onclick={onHelp} 
        disabled={isFetchingSuggestions || !canUseHelp}
        title={canUseHelp ? 'Reveal a missing letter (costs 1 point)' : (guessesLength === 0 ? 'Unavailable on first turn.' : (3 - helpActionsUsed <= 0 ? 'No hints remaining.' : 'Cannot reveal the last letter.'))}
        aria-label={canUseHelp ? `Reveal a missing letter, costs 1 point. ${3 - helpActionsUsed} hints remaining.` : (guessesLength === 0 ? 'Unavailable on first turn.' : (3 - helpActionsUsed <= 0 ? 'No hints remaining.' : 'Cannot reveal the last letter.'))}
      >
        {#if isFetchingSuggestions}
          <div class="thinking-loader">
            <span class="thinking-dot"></span>
            <span class="thinking-dot"></span>
            <span class="thinking-dot"></span>
          </div>
        {:else}
          {#if canUseHelp}
            <svg class="hint-icon" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor" aria-hidden="true">
              <path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z"/>
            </svg>
          {:else}
            <svg class="hint-icon" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor" aria-hidden="true">
              <path d="m644-428-58-58q9-47-27-88t-93-32l-58-58q17-8 34.5-12t37.5-4q75 0 127.5 52.5T660-500q0 20-4 37.5T644-428Zm128 126-58-56q38-29 67.5-63.5T832-500q-50-101-143.5-160.5T480-720q-29 0-57 4t-55 12l-62-62q41-17 84-25.5t90-8.5q151 0 269 83.5T920-500q-23 59-60.5 109.5T772-302Zm20 246L624-222q-35 11-70.5 16.5T480-200q-151 0-269-83.5T40-500q21-53 53-98.5t73-81.5L56-792l56-56 736 736-56 56ZM222-624q-29 26-53 57t-41 67q50 101 143.5 160.5T480-280q20 0 39-2.5t39-5.5l-36-38q-11 3-21 4.5t-21 1.5q-75 0-127.5-52.5T300-500q0-11 1.5-21t4.5-21l-84-82Zm319 93Zm-151 75Z"/>
            </svg>
          {/if}
          {#if guessesLength > 0}
            <span class="help-count">{3 - helpActionsUsed}</span>
          {/if}
        {/if}
      </button>
    </div>
  {:else if gameStatus === 'loading'}
    <button class="submit-btn loading-btn" disabled>
      LOADING...
    </button>
  {:else if gameStatus === 'error'}
    <button use:autofocus class="submit-btn retry-btn" onclick={onNewGame}>
      RETRY!
    </button>
  {:else}
    <button use:autofocus class="submit-btn play-again-btn" onclick={onNewGame}>
      PLAY AGAIN!
    </button>
  {/if}
</div>

<style>
  .action-area {
    display: flex;
    justify-content: center;
    margin-top: 10px;
  }

  .submit-btn {
    width: 100%;
    padding: 14px;
    border-radius: 16px;
    border: 3px solid #0f172a;
    background: #be185d;
    color: #fff;
    font-family: inherit;
    font-size: 1.1rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 4px 4px 0px #0f172a;
    transition: all 0.1s ease;
    letter-spacing: 0.05em;
  }

  .submit-btn:hover {
    background: #9f1239;
    transform: translate(-2px, -2px);
    box-shadow: 6px 6px 0px #0f172a;
  }

  .submit-btn:active {
    transform: translate(2px, 2px);
    box-shadow: 0px 0px 0px #0f172a;
  }

  .play-again-btn {
    background: #047857;
  }

  .play-again-btn:hover {
    background: #065f46;
  }

  .loading-btn {
    background: #94a3b8 !important;
    cursor: not-allowed !important;
    box-shadow: 0px 0px 0px #0f172a !important;
    transform: none !important;
  }

  .retry-btn {
    background: #c2410c;
  }

  .retry-btn:hover {
    background: #9a3412;
  }

  .playing-actions {
    display: flex;
    gap: 12px;
    width: 100%;
    max-width: 350px;
    justify-content: center;
    align-items: center;
  }

  .help-btn {
    width: 54px;
    height: 54px;
    flex-shrink: 0;
    border-radius: 50%;
    border: 3px solid #0f172a;
    background: #fef08a;
    color: #0f172a;
    font-size: 1.5rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 3px 3px 0px #0f172a;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    user-select: none;
    padding: 0;
  }

  .hint-icon {
    width: 26px;
    height: 26px;
    display: inline-block;
    user-select: none;
  }

  .help-btn:hover:not(:disabled) {
    transform: scale(1.08) translateY(-2px);
    box-shadow: 4px 5px 0px #0f172a;
    background: #fde047;
  }

  .help-btn:active:not(:disabled) {
    transform: scale(0.95);
    box-shadow: 1px 1px 0px #0f172a;
  }

  .help-btn:disabled {
    background: #cbd5e1;
    color: #94a3b8;
    cursor: not-allowed;
    box-shadow: 0px 0px 0px #0f172a;
    transform: none;
  }

  @media (max-width: 480px) {
    .submit-btn {
      padding: 10px 14px;
      font-size: 1rem;
      border-radius: 14px;
    }
    .playing-actions {
      gap: 10px;
    }
    .help-btn {
      width: 46px;
      height: 46px;
    }
    .hint-icon {
      width: 22px;
      height: 22px;
    }
  }

  @media (max-width: 360px) {
    .submit-btn {
      padding: 9px 12px;
      font-size: 0.95rem;
      border-radius: 12px;
    }
    .help-btn {
      width: 42px;
      height: 42px;
    }
    .hint-icon {
      width: 20px;
      height: 20px;
    }
  }

  .help-count {
    position: absolute;
    top: -6px;
    right: -6px;
    background: #b91c1c;
    color: #ffffff;
    font-size: 0.75rem;
    font-weight: 700;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid #0f172a;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 1px 1px 0px #0f172a;
  }

  .submit-btn:focus-visible,
  .help-btn:focus-visible {
    outline: 3px solid #0284c7;
    outline-offset: 2px;
  }

  /* Thinking Loader wave animation inside help button */
  .thinking-loader {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    height: 100%;
    width: 100%;
  }

  .thinking-dot {
    width: 6px;
    height: 6px;
    background-color: #0f172a;
    border-radius: 50%;
    display: inline-block;
    animation: thinking-wave 1.2s infinite ease-in-out;
  }

  .thinking-dot:nth-child(1) { animation-delay: 0s; }
  .thinking-dot:nth-child(2) { animation-delay: 0.15s; }
  .thinking-dot:nth-child(3) { animation-delay: 0.3s; }

  @keyframes thinking-wave {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-8px);
    }
  }
</style>
