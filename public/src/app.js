/* Browser UI. Rules live in engine.js; authored content lives in content.js.
   Every meaningful action is saved. No accounts, analytics or external calls. */
(function () {
  'use strict';
  const E = window.SHELF_ENGINE;
  const C = window.SHELF_CONTENT;
  const A = window.SHELF_ART;
  const S = window.SHELF_STORAGE;
  const W = window.SHELF_WORDS;
  const allowed = new Set(W.allowed.split(' '));
  const $ = selector => document.querySelector(selector);
  const escape = value => String(value).replace(/[&<>"']/g, x => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[x]);
  const number = value => new Intl.NumberFormat('en-GB').format(value);
  let backend;
  try { backend = window.localStorage; } catch (_) { backend = { getItem() { throw new Error('Storage is unavailable.'); }, setItem() { throw new Error('Storage is unavailable.'); } }; }
  const store = S.create(backend);
  const loaded = store.load();
  const seed = window.crypto?.getRandomValues ? window.crypto.getRandomValues(new Uint32Array(1))[0] : E.hash(String(Date.now()));
  let state = loaded.state || E.fresh(seed);
  let page = 'play';
  let selected = -1;
  let requestIndex = 0;
  let upgradeIndex = 0;
  let pantryIndex = 0;
  let recipeTab = 0;
  let journalTab = 'recipes';
  let journalIndex = 0;
  let vaultMode = 'daily';
  let activeWord = 0;
  let helpStep = 0;
  let undoState = null;
  let swapMode = false;
  let popCell = -1;
  let toastTimer;
  let pendingImport = null;
  let lastFocus = null;
  let modalDismissable = true;
  let audio;
  let updateWorker = null;
  let reloadForUpdate = false;
  let drag = null;
  let suppressClick = false;
  let savingWarningShown = false;
  const modal = $('#modal');
  const app = $('#app');

  function nameOf(item) {
    if (!item) return 'Empty space';
    if (item.kind === 'book') return `${E.section(item.section)?.name || 'Fiction'} · ${C.bookNames[item.tier]}`;
    const r = E.recipe(item.id);
    if (item.kind === 'ingredient') return r.components.find(c => c.id === item.component)?.name || 'Recipe component';
    if (item.kind === 'prep') return `${r.short} · ${item.components.length}/${r.components.length} prepared`;
    if (item.kind === 'cheese') return r.cheese;
    return r.short;
  }
  function labelOf(item) {
    if (!item) return 'Empty space';
    if (item.kind === 'book') return `${nameOf(item)}, level ${item.tier}`;
    if (item.kind === 'ingredient') return `${nameOf(item)}, component for ${E.recipe(item.id).short}`;
    if (item.kind === 'prep') return `${nameOf(item)}, incomplete preparation`;
    return `${nameOf(item)}, finished dish`;
  }
  function say(text) {
    const el = $('#toast');
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3100);
  }
  function sound(type = 'tap') {
    if (!state.settings.sound) return;
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
      const notes = type === 'win' ? [523, 659, 784] : type === 'merge' ? [440, 587] : [380];
      notes.forEach((frequency, i) => {
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        const time = audio.currentTime + i * .09;
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(.045, time + .015);
        gain.gain.exponentialRampToValueAtTime(.001, time + .22);
        oscillator.connect(gain); gain.connect(audio.destination);
        oscillator.start(time); oscillator.stop(time + .24);
      });
    } catch (_) { /* Audio is optional, never a gameplay dependency. */ }
  }
  function confetti() {
    if (!state.settings.motion || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    $('#particles').innerHTML = Array.from({ length: 11 }, (_, i) => `<span class="particle" style="--x:${14 + i * 7}%;--y:${37 + (i % 3) * 4}%;--delay:${i * .025}s">✦</span>`).join('');
    app.classList.add('celebrate');
    setTimeout(() => { $('#particles').innerHTML = ''; app.classList.remove('celebrate'); }, 1600);
  }
  function save(force = false) {
    const result = store.save(state, force);
    if (result.conflict) {
      state = result.conflict;
      selected = -1;
      undoState = null;
      say('Progress updated from another open tab. Your last tap was not applied.');
    }
    $('#save-warning').hidden = result.ok || result.blocked;
    if (!result.ok && !result.blocked && !result.conflict && !savingWarningShown) {
      savingWarningShown = true;
      say('This browser cannot save right now. You can still play and export a backup.');
    }
    return result.ok;
  }
  function commit(options = {}) {
    E.rotateDay(state, E.dateKey());
    const ok = save(options.force || false);
    render();
    return ok;
  }
  function rememberBoard() { undoState = E.copy(state); }
  function clearUndo() { undoState = null; }
  function getPuzzle() {
    if (vaultMode === 'daily') {
      const date = E.dateKey();
      if (!state.dailyPuzzle || state.dailyPuzzle.date !== date) {
        state.dailyPuzzle = E.makePuzzle(E.hash('ShelfLife.daily.v1.' + date), W.answers, date);
        save();
      }
      return state.dailyPuzzle;
    }
    if (!state.practicePuzzle) {
      state.practicePuzzle = E.makePuzzle(E.hash('ShelfLife.practice.v1.' + state.seed + '.' + state.practiceCount), W.answers);
      save();
    }
    return state.practicePuzzle;
  }
  function renderHeader() {
    $('#funds').textContent = number(state.funds);
    document.querySelectorAll('.nav-button').forEach(button => {
      const active = button.dataset.page === page;
      button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
    });
    $('#journal-dot').hidden = !C.achievements.some(a => !state.claimed.includes(a.id) && E.metric(state, a.metric) >= a.goal);
    app.classList.toggle('motion-off', !state.settings.motion);
    app.classList.toggle('high-contrast', state.settings.contrast);
    document.body.classList.toggle('motion-off', !state.settings.motion);
  }
  function render() {
    renderHeader();
    for (const id of ['play', 'library', 'vault', 'journal']) $('#page-' + id).hidden = id !== page;
    if (page === 'play') renderPlay();
    if (page === 'library') renderLibrary();
    if (page === 'vault') renderVault();
    if (page === 'journal') renderJournal();
  }
  function requirement(item, ready) {
    return `<button class="need ${ready ? 'ready' : ''}" data-action="need-info" data-kind="${item.kind}" data-id="${item.id || ''}" data-tier="${item.tier || ''}" data-section="${item.section || ''}" aria-label="Need ${escape(labelOf(item))}. ${ready ? 'Ready to serve' : 'Not ready'}">${A.item(item)}<span>${escape(nameOf(item))}<small>${ready ? 'Ready' : item.kind === 'book' ? 'Exact section · L' + item.tier : 'Prepare every component'}</small></span>${ready ? '<i class="check-badge">' + A.icon('check') + '</i>' : ''}</button>`;
  }
  function renderPlay() {
    const focusedTile = document.activeElement?.matches('.tile') ? document.activeElement.dataset.index : null;
    const q = state.requests[requestIndex];
    const v = C.visitors[q.visitor];
    const line = v.lines[Math.min(v.lines.length - 1, Math.floor(state.visits[q.visitor] / 3))];
    const needed = E.neededIndices(state, q);
    const selectedItem = selected >= 0 ? state.board[selected] : null;
    if (!selectedItem) { selected = -1; swapMode = false; }
    const slots = state.board.map((item, index) => {
      const match = selected >= 0 && index !== selected && E.compatible(selectedItem, item);
      const badge = item?.kind === 'book' ? `<span class="section-mark" style="--section:${E.section(item.section).colour}">${E.section(item.section).mark}</span><span class="tier">${item.tier}</span>` : item?.kind === 'prep' ? `<span class="prep-count">${item.components.length}/${E.recipe(item.id).components.length}</span>` : item?.kind === 'dish' ? '<span class="dish-dot">' + A.icon('check') + '</span>' : '';
      return `<button class="tile ${!item ? 'empty' : ''} ${index === selected ? 'selected' : ''} ${match ? 'match' : ''} ${index === popCell ? 'pop' : ''}" data-action="tile" data-index="${index}" aria-label="Space ${index + 1}: ${escape(labelOf(item))}${index === selected ? ', selected' : ''}${match ? ', can combine with selected item' : ''}" aria-pressed="${index === selected}" tabindex="0">${A.item(item)}${badge}</button>`;
    }).join('');
    $('#page-play').innerHTML = `
      <div class="hero" data-action="open-library" role="button" tabindex="0" aria-label="Visit your library">${A.room(state)}<div class="hero-caption"><strong>Lou’s Library</strong><small>SIX COLLECTIONS · SERIOUS CHEESE · OBSCURE WORDS</small></div><button class="daily-chip ${state.daily.served >= 3 && !state.daily.claimed ? 'claimable' : ''}" data-action="daily" aria-label="Today’s three visitor bonus">Daily jobs<b>${state.daily.claimed ? '✓' : Math.min(3, state.daily.served) + '/3'}</b></button></div>
      <article class="request-card" aria-label="Visitor request from ${escape(v.name)}">
        <div class="req-top"><button class="visitor-button" data-action="visitor-story" data-index="${q.visitor}" aria-label="Read ${escape(v.name)}’s story">${A.visitor(q.visitor)}</button><div class="req-person"><strong>${escape(v.name)}</strong><p>${escape(line)}</p></div><div class="req-pager"><button data-action="request-prev" aria-label="Previous visitor">${A.icon('left')}</button><span>${requestIndex + 1}/3</span><button data-action="request-next" aria-label="Next visitor">${A.icon('right')}</button></div></div>
        <div class="req-bottom"><div class="needs">${requirement({ kind: 'book', tier: q.tier, section: q.section }, needed.book >= 0)}${q.recipe ? requirement({ kind: 'dish', id: q.recipe }, needed.dish >= 0) : ''}</div><button data-action="serve" class="serve-button ${needed.ready ? 'ready' : ''}" ${needed.ready ? '' : 'disabled'}><strong>Serve ${needed.ready ? '✓' : ''}</strong><small>+${E.reward(state, q)} funds</small></button></div>
      </article>
      <div class="merge-board" aria-label="Merge board, five columns and four rows">${slots}</div>
      <div class="selection-bar">${selectedItem ? `<span class="selection-name">${escape(nameOf(selectedItem))}</span><button data-action="selected-info" aria-label="Selected item details">${A.icon('info')}</button><button data-action="swap" aria-label="${swapMode ? 'Cancel swap mode' : 'Move or swap this item'}" aria-pressed="${swapMode}">${A.icon('swap')}</button><button data-action="return-item" aria-label="Return selected item">${A.icon('back')}</button>` : `<span>${undoState ? 'Board changed. Undo is available.' : 'Match exact books; assemble every recipe component.'}</span>`}${undoState ? `<button data-action="undo" aria-label="Undo last board action">Undo</button>` : ''}${!selectedItem ? '<button class="board-help" data-action="help" aria-label="How to play">' + A.icon('help') + '</button>' : ''}</div>
      <div class="deliveries"><button class="delivery-button books" data-action="deliver-book">${A.book(2,'fiction')}<span><strong>Acquisitions desk</strong><small>Choose a book section</small></span></button><button class="delivery-button food" data-action="pantry">${A.icon('cheese')}<span><strong>The cheese pantry</strong><small>Build a proper preparation</small></span></button></div>`;
    popCell = -1;
    if(focusedTile!==null) document.querySelector(`.tile[data-index="${focusedTile}"]`)?.focus({preventScroll:true});
  }
  function renderLibrary() {
    const u = C.upgrades[upgradeIndex];
    const owned = state.upgrades.includes(u.id);
    const locked = u.requires && state.upgrades.length < u.requires;
    const total=C.upgrades.length;
    const chapter = state.upgrades.length < 4 ? 'I · Opening the doors' : state.upgrades.length < 8 ? 'II · Finding its people' : state.upgrades.length < 12 ? 'III · The serious shelves' : state.upgrades.length < total ? 'IV · After-hours culture' : 'Epilogue · The doors stay open';
    $('#page-library').innerHTML = `
      <div class="page-heading"><div><h1>Lou’s Library</h1><p>Sixteen improvements. Every one changes the room.</p></div><button class="icon-button" data-action="room-info" aria-label="About the library">${A.icon('heart')}</button></div>
      <div class="library-scene">${A.room(state)}<div class="scene-label">${A.icon('leaf')} ${state.upgrades.length}/${total} upgrades installed</div></div>
      <div class="chapter-progress"><div class="row between"><strong>${chapter}</strong><span>${Math.round(state.upgrades.length / total * 100)}%</span></div><div class="progress-track" role="progressbar" aria-label="Library improvements" aria-valuenow="${state.upgrades.length}" aria-valuemin="0" aria-valuemax="${total}"><div class="progress-fill" style="width:${state.upgrades.length / total * 100}%"></div></div></div>
      <article class="upgrade-card"><div class="upgrade-header"><div class="upgrade-icon">${A.icon(u.icon)}</div><div><h2>${escape(u.name)}</h2><p class="tag">${escape(u.tag)}</p></div></div><p class="description">${escape(u.description)}</p><p class="upgrade-benefit">${escape(u.benefit)}</p><div class="upgrade-footer"><div class="pager"><button data-action="upgrade-prev" aria-label="Previous improvement">${A.icon('left')}</button><span>${upgradeIndex + 1}/${total}</span><button data-action="upgrade-next" aria-label="Next improvement">${A.icon('right')}</button></div><button class="btn ${owned ? 'secondary' : 'primary'}" data-action="buy" ${owned || locked || state.funds < u.price ? 'disabled' : ''}>${owned ? A.icon('check') + 'Installed' : locked ? u.requires + ' upgrades first' : A.icon('coin') + number(u.price)}</button></div></article>
      <div class="library-stats"><div><b>${state.served}</b><small>Visitors</small></div><div><b>${state.upgrades.length}/${total}</b><small>Improvements</small></div><div><b>${state.catalogued.length}/36</b><small>Catalogue</small></div><div><b>${state.discovered.length}/${C.recipes.length}</b><small>Atlas</small></div></div>
      <div class="themes">${state.upgrades.includes('plants') ? 'Room palette ' + ['teal','sea-glass','midnight'].map(theme => `<button class="theme-choice ${state.theme === theme ? 'active' : ''}" data-action="theme" data-theme="${theme}" aria-label="${theme} colour scheme" aria-pressed="${state.theme === theme}"></button>`).join('') : A.icon('lock') + 'The conservatory unlocks room colours.'}</div>`;
  }
  function renderVault() {
    const p = getPuzzle();
    const status = E.puzzleStatus(p);
    const letters = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
    const keyStates = {};
    p.guesses.forEach(guess => E.feedback(guess, p.targets[activeWord]).forEach((value, index) => { keyStates[guess[index]] = Math.max(keyStates[guess[index]] ?? -1, value); }));
    const boards = p.targets.map((target, index) => {
      const solvedAt = p.guesses.indexOf(target);
      let grid = '';
      for (let row = 0; row < 9; row++) {
        const frozen = solvedAt >= 0 && row > solvedAt;
        const guess = !frozen ? p.guesses[row] : null;
        const typing = !status.done && row === p.guesses.length && !status.solved[index];
        const input = typing ? p.input : '';
        const feedback = guess ? E.feedback(guess, target) : null;
        for (let col = 0; col < 7; col++) {
          const letter = guess?.[col] || input[col] || '';
          const meaning = feedback ? ['not present', 'present, different position', 'correct position'][feedback[col]] : typing ? 'current guess' : 'empty';
          grid += `<span class="letter ${feedback ? 's' + feedback[col] : typing && letter ? 'typed' : ''}" aria-label="Word ${index + 1}, guess ${row + 1}, letter ${col + 1}: ${letter || 'empty'}${letter ? ', ' + meaning : ''}">${letter}</span>`;
        }
      }
      return `<div class="word-board ${activeWord === index ? 'active' : ''}"><button class="word-board-head" data-action="word-focus" data-index="${index}" aria-pressed="${activeWord === index}">${status.solved[index] ? A.icon('check') : A.icon('key')} ${index === 0 ? 'THE WEST ARCHIVE' : 'THE EAST ARCHIVE'}</button><div class="letter-grid">${grid}</div></div>`;
    }).join('');
    const key = (letter, wide = false) => `<button class="key-button ${wide ? 'wide' : ''} ${keyStates[letter] !== undefined ? 'k' + keyStates[letter] : ''}" data-action="key" data-key="${letter}" aria-label="${letter === 'BACK' ? 'Delete letter' : letter === 'ENTER' ? 'Submit guess' : letter}">${letter === 'BACK' ? A.icon('keyboard') : letter}</button>`;
    let statusText = `<strong>${9 - p.guesses.length} shared guesses left</strong><p>${status.solved.filter(Boolean).length}/2 archives unlocked. Both need seven letters.</p>`;
    if (status.done) statusText = `<strong>${status.won ? 'Both archives unlocked.' : 'The archives keep a few secrets.'}</strong><p>${status.won ? 'A very well-earned 140 library funds.' : 'One word solved earns 30 funds. No penalties.'}</p>`;
    $('#page-vault').innerHTML = `
      <div class="page-heading"><div><h1>The Word Vault</h1><p>Two words. Seven letters. Nine shared guesses.</p></div><button class="icon-button" data-action="vault-help" aria-label="Word Vault rules">${A.icon('help')}</button></div>
      <div class="segmented" aria-label="Puzzle mode"><button data-action="vault-mode" data-mode="daily" class="${vaultMode === 'daily' ? 'active' : ''}">Daily archive</button><button data-action="vault-mode" data-mode="practice" class="${vaultMode === 'practice' ? 'active' : ''}">The endless shelves</button></div>
      <div class="word-boards">${boards}</div>
      <div class="word-status"><div>${statusText}</div>${status.done ? `<button class="btn secondary" data-action="${vaultMode === 'practice' ? 'new-practice' : 'puzzle-result'}">${vaultMode === 'practice' ? 'Next pair' : 'Results'}</button>` : `<button class="btn ghost" data-action="${vaultMode === 'practice' ? 'abandon-practice' : 'vault-help'}">${vaultMode === 'practice' ? 'New pair' : 'Rules'}</button>`}</div>
      <div class="keyboard" aria-label="On-screen keyboard. Colours describe the selected archive.">${letters.map((row, index) => `<div class="key-row ${index === 1 ? 'middle' : ''}">${index === 2 ? key('ENTER', true) : ''}${row.split('').map(l => key(l)).join('')}${index === 2 ? key('BACK', true) : ''}</div>`).join('')}</div>
      <div class="vault-footer"><span class="legend"><i></i>Right place</span><span class="legend gold"><i></i>Wrong place</span><span class="legend grey"><i></i>Not present</span></div>`;
  }
  function journalTotal() { return journalTab === 'recipes' ? C.recipes.length : journalTab === 'books' ? C.sections.length : journalTab === 'people' ? C.visitors.length : Math.ceil(C.achievements.length / 3); }
  function renderJournal() {
    journalIndex = Math.min(journalIndex, journalTotal() - 1);
    let content;
    if (journalTab === 'recipes') {
      const r = C.recipes[journalIndex];
      const discovered = state.discovered.includes(r.id);
      const unlocked = state.served >= r.unlock;
      content = `<article class="collection-card ${unlocked ? '' : 'locked'}"><span class="eyebrow">THE CHEESE ATLAS · ${journalIndex + 1}/${C.recipes.length}</span>${A.item({ kind: 'dish', id: r.id })}<div><h2>${escape(r.name)}</h2><p class="recipe-region">${escape(r.region)}</p></div><span class="pill">${A.icon(discovered ? 'check' : unlocked ? 'cheese' : 'lock')}${discovered ? 'Prepared in your library' : unlocked ? 'Ready to discover' : 'Unlocks after ' + r.unlock + ' visitors'}</span><div class="atlas-notes"><span class="eyebrow">THE PREPARATION</span><p>${escape(r.ingredients)}</p><small>Source: ${escape(r.sources[0][0])}</small></div><p class="fact">${escape(r.fact)}</p><button class="btn secondary" data-action="recipe-details" data-index="${journalIndex}">${A.icon('book')}Ingredients & provenance</button></article>`;
    } else if (journalTab === 'books') {
      const section=C.sections[journalIndex],found=Array.from({length:6},(_,i)=>state.catalogued.includes(section.id+':'+(i+1)));
      const best=found.lastIndexOf(true)+1||1;
      content = `<article class="collection-card book-ledger"><span class="eyebrow">THE CATALOGUE · ${journalIndex+1}/${C.sections.length}</span>${A.book(best,section.id)}<div><h2>${escape(section.name)}</h2><p class="recipe-region">${escape(section.description)}</p></div><span class="pill">${A.icon('book')}${found.filter(Boolean).length}/6 collection levels recorded</span><div class="catalogue-levels">${found.map((yes,i)=>`<div class="${yes?'found':''}">${A.book(i+1,section.id)}<b>L${i+1}</b><span>${escape(C.bookNames[i+1])}</span></div>`).join('')}</div><p class="fact">${found.every(Boolean)?'Every level catalogued. A frankly excessive and excellent shelf.':'Choose this section at Acquisitions, then merge exact section and level matches.'}</p></article>`;
    } else if (journalTab === 'people') {
      const v = C.visitors[journalIndex];
      const visits = state.visits[journalIndex];
      const chapter = Math.min(v.lines.length - 1, Math.floor(visits / 3));
      content = `<article class="collection-card">${A.visitor(journalIndex)}<div><h2>${escape(v.name)}</h2><p class="recipe-region">${escape(v.role)}</p></div><blockquote>“${escape(v.lines[chapter])}”</blockquote><span class="pill">${visits} request${visits === 1 ? '' : 's'} completed</span><p class="small muted">${chapter < 3 ? 'Regulars have more to say as you get to know them.' : 'A familiar face. A place worth coming back to.'}</p></article>`;
    } else {
      content = '<div class="achievement-list">' + C.achievements.slice(journalIndex * 3, journalIndex * 3 + 3).map(a => {
        const value = E.metric(state, a.metric);
        const claimed = state.claimed.includes(a.id);
        const ready = !claimed && value >= a.goal;
        return `<article class="achievement-card ${claimed ? 'claimed' : ''}"><div class="achievement-icon">${A.icon(claimed ? 'check' : 'star')}</div><div class="grow"><h2>${escape(a.name)}</h2><p>${escape(a.desc)}</p><div class="progress-track"><div class="progress-fill" style="width:${Math.min(100, value / a.goal * 100)}%"></div></div><div class="amount">${Math.min(value, a.goal)}/${a.goal}</div></div><button class="btn ${ready ? 'gold' : 'ghost'}" data-action="claim-achievement" data-id="${a.id}" ${ready ? '' : 'disabled'}>${claimed ? 'Claimed' : '+' + a.reward}</button></article>`;
      }).join('') + `<p class="journal-note">${state.served} visitors helped · ${state.merges} book merges<br>${state.puzzles} vaults unlocked · Best: ${state.stats.best || '—'} guesses</p></div>`;
    }
    $('#page-journal').innerHTML = `<div class="page-heading"><div><h1>Journal</h1><p>${state.discovered.length}/${C.recipes.length} dishes · ${state.catalogued.length}/36 books · ${C.visitors.length} regulars</p></div>${A.icon('journal')}</div><div class="segmented journal-tabs"><button data-action="journal-tab" data-tab="recipes" class="${journalTab === 'recipes' ? 'active' : ''}">Cheese</button><button data-action="journal-tab" data-tab="books" class="${journalTab === 'books' ? 'active' : ''}">Books</button><button data-action="journal-tab" data-tab="achievements" class="${journalTab === 'achievements' ? 'active' : ''}">Milestones</button><button data-action="journal-tab" data-tab="people" class="${journalTab === 'people' ? 'active' : ''}">Regulars</button></div><div class="journal-content">${content}</div><div class="pager journal-pager"><button data-action="journal-prev" aria-label="Previous journal page">${A.icon('left')}</button><span>${journalIndex + 1} / ${journalTotal()}</span><button data-action="journal-next" aria-label="Next journal page">${A.icon('right')}</button></div>`;
  }
  function showModal(html, dismissable = true) {
    if (!modal.open) lastFocus = document.activeElement;
    modalDismissable = dismissable;
    $('#modal-body').className = '';
    $('#modal-body').innerHTML = html;
    if (!modal.open) modal.showModal();
    // Native dialog handles focus trapping. Focus a real action rather than the backdrop.
    const target = $('#modal-body [autofocus]') || $('#modal-body button');
    if (target) target.focus({ preventScroll: true });
  }
  function modalHead(title, closeAction = 'close') {
    return `<div class="modal-head"><h2 id="modal-title">${escape(title)}</h2><button class="icon-button" data-action="${closeAction}" aria-label="Close">${A.icon('close')}</button></div>`;
  }
  function closeModal() {
    if (!modalDismissable) return;
    modal.close();
    if (lastFocus?.isConnected) lastFocus.focus({ preventScroll: true });
  }
  function welcome() {
    showModal(`<div class="welcome-illustration">${A.lou()}<div class="welcome-book">${A.book(3,'art-music')}</div><div class="welcome-cheese">${A.item({ kind: 'dish', id: 'manchego' })}</div></div><span class="eyebrow">SHELF LIFE / BUILT FOR LOU</span><h1 id="modal-title">Books. Cheese.<br>Difficult words.</h1><p>Build six real collections, assemble researched cheese dishes and make the library entirely yours.</p><p class="tiny">No timers. No energy bars. Nothing to catch up on.</p><button class="btn primary" data-action="start-game" autofocus>Open the doors ${A.icon('right')}</button><span class="tiny muted">Progress saves on this device.</span>`, false);
    $('#modal-body').className = 'welcome';
  }
  const helpPages = [
    { title: 'Catalogue exact matches', copy: 'Choose one of six sections at Acquisitions. Two books merge only when both their section and level match; Fiction level 2 will not merge with Poetry level 2.', extra: 'Build all six shelves in the Journal. Tap an empty space to move an item, or drag it. There is no delivery timer.', art: () => A.book(1,'fiction') + A.icon('plus') + A.book(1,'fiction') + A.icon('right') + A.book(2,'fiction') },
    { title: 'Build the whole dish', copy: 'Every pantry tile is a real component from the cited preparation. Combine any two components from the same recipe, then keep adding the missing ones until the dish is complete.', extra: 'Simple pairings need two tiles. Later preparations need three, four, five, six or seven. Pantry deliveries are free and clearly state the space required.', art: () => A.item({kind:'ingredient',id:'raclette',component:'raclette'}) + A.icon('plus') + A.item({kind:'ingredient',id:'raclette',component:'potatoes'}) + A.icon('right') + A.item({kind:'prep',id:'raclette',components:['raclette','potatoes']}) },
    { title: 'A place of your own', copy: 'Visitors ask for an exact book section and level, and sometimes a complete dish. Fulfil the request for library funds, then spend those on visible improvements. Check the Journal for the catalogue and milestones.', extra: 'Browse all three requests with the arrows. Return unwanted items with the curved arrow; Undo reverses your last board action.', art: () => A.lou() + A.icon('heart') + A.icon('library') },
    { title: 'A less cosy word puzzle', copy: 'The Word Vault has TWO seven-letter words and NINE shared guesses. Every guess gives feedback for both words. Select an archive to see its keyboard colours. Repeated letters are counted correctly.', extra: 'Daily and endless practice puzzles are optional. Solve both for 140 funds, or one for 30. No easy sentence clues. No penalties for leaving.', art: () => A.icon('key') + '<strong style="letter-spacing:3px;font-size:18px">? ? ? ? ? ? ?</strong>' }
  ];
  function help() {
    const h = helpPages[helpStep];
    showModal(`${modalHead(h.title)}<div class="help-art">${h.art()}</div><p class="modal-copy">${h.copy}</p><p class="modal-copy">${h.extra}</p><div class="step-dots">${helpPages.map((_, i) => `<i class="${i === helpStep ? 'active' : ''}"></i>`).join('')}</div><div class="modal-actions"><button class="btn ghost" data-action="${helpStep ? 'help-prev' : 'close'}">${helpStep ? 'Back' : 'Got the idea'}</button><button class="btn primary" data-action="${helpStep === 3 ? 'close' : 'help-next'}">${helpStep === 3 ? 'Into the library' : 'Next'}</button></div>`);
  }
  function settings() {
    showModal(`${modalHead('Settings')}<div class="stack"><button class="setting-row" data-action="toggle-setting" data-setting="sound" role="switch" aria-checked="${state.settings.sound}"><span class="setting-label">${A.icon('volume')} Gentle sound effects</span><span class="toggle ${state.settings.sound ? 'on' : ''}"></span></button><button class="setting-row" data-action="toggle-setting" data-setting="motion" role="switch" aria-checked="${state.settings.motion}"><span class="setting-label">${A.icon('spark')} Character & merge animation</span><span class="toggle ${state.settings.motion ? 'on' : ''}"></span></button><button class="setting-row" data-action="toggle-setting" data-setting="contrast" role="switch" aria-checked="${state.settings.contrast}"><span class="setting-label">${A.icon('key')} Extra letter feedback symbols</span><span class="toggle ${state.settings.contrast ? 'on' : ''}"></span></button></div><div class="settings-grid"><button class="btn secondary" data-action="help">${A.icon('help')}How to play</button><button class="btn secondary" data-action="backup">${A.icon('download')}Save backups</button><button class="btn ghost" data-action="about">${A.icon('info')}About the game</button><button class="btn ghost" data-action="reset-confirm">Start again</button></div>${updateWorker ? '<button class="btn gold block" data-action="update-app">A new version is ready. Save & reload.</button>' : ''}<p class="modal-note">Your device’s reduced-motion preference takes priority. Progress stays in this browser, on this website address.</p><div class="version-note"><span>Shelf Life 1.1.0</span><span>${store.volatile ? 'Backup recommended' : 'Saved on this device'}</span></div>`);
  }
  function acquisitions() {
    showModal(`${modalHead('The acquisitions desk')}<p class="modal-copy">Choose the section for this donation. Its level is still determined by your library improvements.</p><div class="section-picker">${C.sections.map(s=>`<button data-action="acquire-book" data-section="${s.id}" style="--section:${s.colour};--accent:${s.accent}">${A.book(2,s.id)}<span><strong>${escape(s.name)}</strong><small>${escape(s.description)}</small></span></button>`).join('')}</div><p class="modal-note">Exact section and level matches merge. This is a catalogue, not one beige heap of “books”.</p>`);
  }
  function recipeModal(index, canDeliver = false) {
    const r = C.recipes[index];
    pantryIndex = index;
    const unlocked = state.served >= r.unlock;
    let panel;
    if (recipeTab === 1) panel = `<p>${escape(r.ingredients)}</p><p>Each named component appears separately on the merge board. Combining them is game shorthand; the Atlas description records the actual preparation.</p>`;
    else if (recipeTab === 2) panel = `<p>Recipe and provenance references:</p>${r.sources.map(([title, url]) => `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(title)} ↗</a>`).join('')}<p class="tiny">Authored summaries, not copied recipes. Regional and producer variations are not all represented.</p>`;
    else panel = `<span class="pill">${escape(r.region)}</span><p>${escape(r.detail)}</p>`;
    const parts=r.components.map((c,i)=>`<div class="ingredient">${A.item({kind:'ingredient',id:r.id,component:c.id})}<span><b>${i+1}</b>${escape(c.name)}</span></div>`).join('');
    showModal(`${modalHead(canDeliver ? 'The cheese pantry' : 'The cheese atlas')}<div class="recipe-title-row"><div><span class="eyebrow">${r.components.length} COMPONENT${r.components.length===1?'':'S'}</span><h3 class="recipe-name">${escape(r.name)}</h3></div><span class="complexity" aria-label="${r.components.length} component recipe">${'●'.repeat(r.components.length)}</span></div><div class="recipe-combo">${parts}</div><div class="recipe-tabs">${['The preparation','Ingredients','Sources'].map((tab,i)=>`<button data-action="recipe-tab" data-index="${i}" data-deliver="${canDeliver}" class="${recipeTab===i?'active':''}">${tab}</button>`).join('')}</div><div class="recipe-panel">${panel}</div>${canDeliver ? `<div class="pantry-footer"><div class="pager"><button data-action="pantry-prev" aria-label="Previous pairing">${A.icon('left')}</button><span>${index + 1}/${C.recipes.length}</span><button data-action="pantry-next" aria-label="Next pairing">${A.icon('right')}</button></div><button class="btn ${unlocked ? 'primary' : 'ghost'}" data-action="stock-recipe" ${unlocked ? '' : 'disabled'}>${unlocked ? 'Bring '+r.components.length+' to board' : r.unlock + ' visitors first'}</button></div><p class="modal-note">${unlocked ? 'Needs '+r.components.length+' empty spaces. No charge, no waiting.' : Math.max(0,r.unlock-state.served)+' more visitor requests to unlock this preparation.'}</p>` : '<button class="btn secondary block" data-action="close">Back to the library</button>'}`);
  }
  function itemInfo(item) {
    if (!item) return;
    if (item.kind === 'dish') { recipeTab = 0; recipeModal(C.recipes.findIndex(r => r.id === item.id), false); return; }
    if (item.kind === 'ingredient' || item.kind === 'prep') {
      const r=E.recipe(item.id),have=item.kind==='ingredient'?[item.component]:item.components,missing=r.components.filter(c=>!have.includes(c.id));
      showModal(`${modalHead(nameOf(item))}<div class="item-detail-art">${A.item(item)}</div><p class="modal-copy">This is part of <strong>${escape(r.name)}</strong>. Combine it with any different component from the same preparation.</p><p class="modal-copy"><strong>${have.length}/${r.components.length} assembled.</strong> Still needed: ${escape(missing.map(c=>c.name).join(', ')||'nothing — the dish is complete')}.</p><button class="btn secondary block" data-action="close">Back to the board</button>`);return;
    }
    const next = item.tier < 6 ? C.bookNames[item.tier + 1] : null;
    showModal(`${modalHead(nameOf(item))}<div class="item-detail-art">${A.item(item)}</div><p class="modal-copy"><strong>${escape(E.section(item.section).name)}</strong>, level ${item.tier} of 6. ${next ? 'Combine two copies from this same section and level to make a ' + escape(next.toLowerCase()) + '.' : 'This is the final level for this section.'}</p><p class="modal-copy">Requests need the exact section and level. Bigger, or from a different shelf, is not a substitute.</p><button class="btn secondary block" data-action="close">Back to the shelves</button>`);
  }
  function showDaily() {
    const ready = state.daily.served >= 3 && !state.daily.claimed;
    showModal(`${modalHead('Daily jobs')}<div class="help-art">${A.icon('heart')}${A.lou()}${A.icon('star')}</div><p class="modal-copy">Help any three visitors today for a little extra library fund. You have completed <strong>${Math.min(3,state.daily.served)} of 3</strong>.</p><p class="modal-copy">No streak to protect, no penalty for missing a day. Your library will be here.</p><button class="btn ${ready?'gold':'secondary'} block" data-action="claim-daily" ${ready?'':'disabled'}>${state.daily.claimed ? 'Today’s bonus is already yours' : ready ? 'Collect 75 library funds' : 'Three visitors, then +75 funds'}</button>`);
  }
  function puzzleResult() {
    const p = getPuzzle(), status = E.puzzleStatus(p);
    if (!status.done) return;
    showModal(`${modalHead(status.won ? 'Both archives unlocked' : 'This pair is complete')}<div class="answer-list">${p.targets.map(t => `<article class="answer-entry"><strong>${t}</strong><p>${escape(W.definitions[t].definition)}</p><small>${escape(W.definitions[t].note)}</small></article>`).join('')}</div><p class="modal-copy">${status.won ? 'Solved in ' + p.guesses.length + ' of 9 shared guesses. Your 140 library funds have already been added.' : status.solved.some(Boolean) ? 'One archive unlocked. Your 30 library funds have already been added.' : 'No funds lost. Well, that went to shit. A fresh pair is waiting on the endless shelves.'}</p>${status.won && state.puzzles % 3 === 0 ? '<p class="modal-copy">Lou: “Fuck me, that was obscure.”</p>' : ''}<p class="modal-note">The answer pool is curated separately. The broader offline guess dictionary also accepts some names and regional variants.</p><div class="modal-actions"><button class="btn ghost" data-action="close">See the board</button><button class="btn primary" data-action="new-practice">Another pair</button></div>`);
  }
  function backup() {
    showModal(`${modalHead('Keep your library safe')}<div class="backup-state"><strong>Your current library</strong><br>${state.served} visitors · ${state.upgrades.length}/${C.upgrades.length} improvements<br>${number(state.funds)} funds · ${state.discovered.length}/${C.recipes.length} dishes · ${state.catalogued.length}/36 books</div><p class="modal-copy">Automatic saving uses this browser on this website address. Clearing site data, changing browsers or moving to a different address can leave that save behind.</p><div class="stack"><button class="btn primary block" data-action="export">${A.icon('download')}Export a save file</button><button class="btn secondary block" data-action="import">${A.icon('upload')}Import a save file</button><button class="btn ghost block" data-action="previous-save">Restore the previous valid save</button></div><p class="modal-note">Export before a big update or a change of hosting. Import it afterwards. Importing replaces local progress only after you confirm.</p>`);
  }
  function download(filename, text) {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = filename;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  function previewImport(text) {
    try {
      const parsed = S.decode(text);
      pendingImport = parsed.state;
      showModal(`${modalHead('Replace this local save?')}<p class="modal-copy">The selected file contains:</p><div class="backup-state">${pendingImport.served} visitors helped<br>${pendingImport.upgrades.length}/${C.upgrades.length} improvements<br>${number(pendingImport.funds)} library funds</div><p class="modal-copy">This will replace the progress currently open in this browser. Export your current save first if you need both.</p><div class="modal-actions"><button class="btn ghost" data-action="backup">Cancel</button><button class="btn primary" data-action="confirm-import">Use this save</button></div>`);
    } catch (error) { showModal(`${modalHead('That save could not be opened')}<p class="modal-copy">${escape(error.message)}</p><p class="modal-copy">Your current library has not changed.</p><button class="btn secondary block" data-action="backup">Back to backups</button>`); }
  }
  function recovery() {
    showModal(`<div class="modal-head"><h2 id="modal-title">Your save needs a little care</h2></div><p class="modal-copy">${escape(loaded.error || 'The browser could not read its saved progress.')}</p><p class="modal-copy">${loaded.recovered ? 'A previous valid save is available. It has not replaced the unreadable file yet.' : 'Nothing has been overwritten. You can import a backup or deliberately start again.'}</p><div class="stack">${loaded.recovered ? '<button class="btn primary block" data-action="recover-backup">Use the previous valid save</button>' : ''}<button class="btn secondary block" data-action="export-raw">Keep a copy of the unreadable save</button><button class="btn secondary block" data-action="import">Import a backup</button><button class="btn ghost block" data-action="recovery-new">Start a new library</button></div>`, false);
  }
  function showFinale() {
    showModal(`${modalHead('The Little Library Festival')}<div class="finale-art">${A.room(state)}</div><h3 class="recipe-name">Look what you’ve made, Lou.</h3><p class="modal-copy">Sixteen improvements became a teal-lit place full of serious books, familiar faces, excellent records and extremely well-informed cheese choices.</p><p class="modal-copy">This chapter is complete. The doors stay open. There are more readers to meet, collections to finish and archives to unlock.</p><button class="btn primary block" data-action="close">One more chapter ${A.icon('heart')}</button>`);
  }
  function selectTile(index) {
    if (!Number.isInteger(index) || index < 0 || index >= E.SIZE) return;
    if (selected === index) { selected = -1; swapMode = false; renderPlay(); return; }
    if (selected < 0 || !state.board[selected]) {
      selected = state.board[index] ? index : -1;
      renderPlay(); return;
    }
    if (!state.board[index] || E.compatible(state.board[selected], state.board[index]) || swapMode) {
      moveItem(selected, index, swapMode); return;
    }
    selected = index;
    renderPlay();
    document.querySelectorAll('.room-lou .lou-character').forEach(el=>el.dataset.expression='unimpressed');
  }
  function moveItem(from, to, swap) {
    rememberBoard();
    const result = E.move(state, from, to, swap);
    if (!result.ok) { undoState = null; return; }
    selected = -1; swapMode = false; popCell = to;
    commit();
    sound(result.type === 'move' ? 'tap' : 'merge');
    if (result.type === 'dish' || result.type === 'prep') document.querySelectorAll('.room-lou .lou-character').forEach(el=>el.dataset.expression='pleased');
    if (result.type === 'merge' && state.merges % 4 === 0) say(C.reactions.merge[state.merges % C.reactions.merge.length]);
    if (result.type === 'prep') say(`${nameOf(result.item)}. ${C.reactions.prep[state.xp % C.reactions.prep.length]}`);
    if (result.type === 'dish') say(`${E.recipe(result.item.id).short}. ${C.reactions.dish[state.dishes % C.reactions.dish.length]}`);
  }
  function keyInput(key) {
    const p = getPuzzle();
    if (E.puzzleStatus(p).done) return;
    if (key === 'BACK') p.input = p.input.slice(0, -1);
    else if (key === 'ENTER') {
      const result = E.submitGuess(state, p, p.input, allowed);
      if (!result.ok) { say(result.message); return; }
      clearUndo();
      if (result.solved[activeWord] && !result.done) activeWord = activeWord === 0 ? 1 : 0;
      commit();
      sound(result.won ? 'win' : 'tap');
      if (result.done) { if (result.won) confetti(); puzzleResult(); }
      return;
    } else if (/^[A-Z]$/.test(key) && p.input.length < 7) p.input += key;
    else return;
    save(); renderVault();
  }
  function nextPractice() {
    vaultMode = 'practice'; activeWord = 0; state.practiceCount++;
    state.practicePuzzle = E.makePuzzle(E.hash('ShelfLife.practice.v1.' + state.seed + '.' + state.practiceCount), W.answers);
    page = 'vault'; clearUndo(); modalDismissable = true; closeModal(); commit();
  }
  function navigate(target) {
    if (!['play', 'library', 'vault', 'journal'].includes(target)) return;
    clearUndo();
    selected = -1; swapMode = false;
    if (target === 'library' && page !== 'library') {
      const next = C.upgrades.findIndex(u => !state.upgrades.includes(u.id));
      upgradeIndex = next >= 0 ? next : C.upgrades.length-1;
    }
    page = target; render();
  }
  function perform(action, data = {}) {
    if(E.rotateDay(state,E.dateKey())) clearUndo();
    switch (action) {
      case 'home': navigate('play'); break;
      case 'nav': navigate(data.page); break;
      case 'open-library': navigate('library'); break;
      case 'close': closeModal(); break;
      case 'start-game': state.started = true; modalDismissable = true; closeModal(); commit(); helpStep = 0; help(); break;
      case 'settings': settings(); break;
      case 'help': helpStep = 0; help(); break;
      case 'vault-help': helpStep = 3; help(); break;
      case 'help-prev': helpStep = Math.max(0, helpStep - 1); help(); break;
      case 'help-next': helpStep = Math.min(3, helpStep + 1); help(); break;
      case 'tile': selectTile(Number(data.index)); break;
      case 'request-prev': requestIndex = (requestIndex + 2) % 3; renderPlay(); break;
      case 'request-next': requestIndex = (requestIndex + 1) % 3; renderPlay(); break;
      case 'deliver-book': if (!state.board.includes(null)) say('Your board is full. Merge a pair or return an unwanted item.'); else acquisitions(); break;
      case 'acquire-book': {
        rememberBoard(); const result=E.spawnBook(state,data.section);
        if(!result.ok){undoState=null;closeModal();say('Your board is full. Merge a pair or return an unwanted item.');return;}
        popCell=result.index;selected=-1;closeModal();commit();sound();say(E.section(result.section).name+' delivery. Level '+result.tier+'.');break;
      }
      case 'pantry': {
        const id = state.requests[requestIndex].recipe;
        pantryIndex = id ? C.recipes.findIndex(r => r.id === id) : 0;
        recipeTab = 0; recipeModal(pantryIndex, true); break;
      }
      case 'pantry-prev': pantryIndex = (pantryIndex + C.recipes.length - 1) % C.recipes.length; recipeTab = 0; recipeModal(pantryIndex, true); break;
      case 'pantry-next': pantryIndex = (pantryIndex + 1) % C.recipes.length; recipeTab = 0; recipeModal(pantryIndex, true); break;
      case 'recipe-tab': recipeTab = Number(data.index); recipeModal(pantryIndex, data.deliver === 'true'); break;
      case 'recipe-details': recipeTab = 0; recipeModal(Number(data.index), false); break;
      case 'stock-recipe': {
        rememberBoard(); const result = E.stockRecipe(state, C.recipes[pantryIndex].id);
        if (!result.ok) { undoState = null; const needed=E.recipe(C.recipes[pantryIndex].id).components.length;showModal(`${modalHead(needed+' empty spaces needed')}<p class="modal-copy">${result.reason === 'locked' ? 'That preparation is not unlocked yet.' : 'This pantry delivery contains '+needed+' real components. Clear enough board spaces first, then assemble them in any order.'}</p><button class="btn primary block" data-action="close">Back to the board</button>`); return; }
        selected = -1; popCell = result.indices[0]; closeModal(); commit(); sound(); break;
      }
      case 'swap': swapMode = !swapMode; renderPlay(); if (swapMode) say('Tap another space to move or swap. Matching items will still combine.'); break;
      case 'selected-info': itemInfo(state.board[selected]); break;
      case 'need-info': itemInfo(data.kind === 'book' ? { kind: 'book', tier: Number(data.tier), section:data.section } : { kind: 'dish', id: data.id }); break;
      case 'return-item': {
        const item = state.board[selected]; if (!item) return;
        if (item.kind === 'dish' || item.kind === 'book' && item.tier >= 3) {
          showModal(`${modalHead('Return this item?')}<div class="item-detail-art">${A.item(item)}</div><p class="modal-copy">Return ${escape(nameOf(item))} to make a space. You receive no funds, but can make it again. Undo is available until your next non-board action.</p><div class="modal-actions"><button class="btn ghost" data-action="close">Keep it</button><button class="btn secondary" data-action="confirm-return">Return item</button></div>`);
        } else perform('confirm-return'); break;
      }
      case 'confirm-return': rememberBoard(); E.returnItem(state, selected); selected = -1; closeModal(); commit(); say('Returned. There’s room for something else.'); break;
      case 'undo': if (undoState) { state = E.copy(undoState); undoState = null; selected = -1; commit(); say('Last board action undone.'); } break;
      case 'serve': {
        const result = E.serve(state, requestIndex); if (!result.ok) return;
        clearUndo(); selected = -1; commit(); confetti(); sound('win');
        say(result.newRecipes.length ? `+${result.coins} funds. ${result.newRecipes[0].short} is now in the pantry.` : `+${result.coins} funds. ${state.served % 5 === 0 ? C.reactions.serve[state.served % C.reactions.serve.length] : C.visitors[result.visitor].name + '’s request is complete.'}`);
        break;
      }
      case 'upgrade-prev': upgradeIndex = (upgradeIndex + C.upgrades.length - 1) % C.upgrades.length; renderLibrary(); break;
      case 'upgrade-next': upgradeIndex = (upgradeIndex + 1) % C.upgrades.length; renderLibrary(); break;
      case 'buy': {
        const u = C.upgrades[upgradeIndex];
        if (!E.buy(state, u.id)) return;
        clearUndo(); commit(); confetti(); sound('win'); say(u.name + '. Installed.');
        if (state.upgrades.length === C.upgrades.length && !state.seenEnding) { state.seenEnding = true; save(); showFinale(); }
        break;
      }
      case 'theme': if (state.upgrades.includes('plants') && ['teal','sea-glass','midnight'].includes(data.theme)) { state.theme = data.theme; clearUndo(); commit(); } break;
      case 'room-info': showModal(`${modalHead('A library, not a shift')}<p class="modal-copy">Your library changes through sixteen visible improvements: deeper shelves, a bindery, catalogue, listening alcove and the properly serious cheese dresser.</p><p class="modal-copy">Books remain free to borrow. Visitor donations and fundraising tastings support the improvements. No wages, rent, spoilage or unhappy queues to manage.</p><button class="btn secondary block" data-action="close">Back to my library</button>`); break;
      case 'daily': showDaily(); break;
      case 'claim-daily': if (E.claimDaily(state)) { clearUndo(); commit(); closeModal(); sound('win'); say('75 extra funds. Three favours, nicely done.'); } break;
      case 'journal-tab': if (['recipes','books','achievements','people'].includes(data.tab)) { journalTab = data.tab; journalIndex = 0; renderJournal(); } break;
      case 'journal-prev': journalIndex = (journalIndex + journalTotal() - 1) % journalTotal(); renderJournal(); break;
      case 'journal-next': journalIndex = (journalIndex + 1) % journalTotal(); renderJournal(); break;
      case 'claim-achievement': if (E.claim(state, data.id)) { clearUndo(); commit(); sound('win'); say('Milestone claimed. Funds added.'); } break;
      case 'visitor-story': {
        const index = Number(data.index), v = C.visitors[index]; if (!v) return;
        const line = v.lines[Math.min(3, Math.floor(state.visits[index] / 3))];
        showModal(`${modalHead(v.name)}<div class="help-art">${A.visitor(index)}</div><p class="eyebrow">${escape(v.role)}</p><p class="modal-copy">“${escape(line)}”</p><p class="modal-note">${state.visits[index]} request${state.visits[index] === 1 ? '' : 's'} completed. The regulars have more to say as you get to know them.</p><button class="btn secondary block" data-action="close">Back to the shelves</button>`); break;
      }
      case 'vault-mode': if (['daily','practice'].includes(data.mode)) { vaultMode = data.mode; activeWord = 0; clearUndo(); renderVault(); } break;
      case 'word-focus': activeWord = Number(data.index) === 1 ? 1 : 0; renderVault(); break;
      case 'key': keyInput(data.key); break;
      case 'puzzle-result': puzzleResult(); break;
      case 'new-practice': nextPractice(); break;
      case 'abandon-practice': showModal(`${modalHead('Try a different pair?')}<p class="modal-copy">This replaces the current practice puzzle. Your daily archive and library progress are untouched.</p><div class="modal-actions"><button class="btn ghost" data-action="close">Keep this pair</button><button class="btn primary" data-action="new-practice">New pair</button></div>`); break;
      case 'toggle-setting': if (['sound','motion','contrast'].includes(data.setting)) { clearUndo(); state.settings[data.setting] = !state.settings[data.setting]; commit(); settings(); if (data.setting === 'sound') sound('merge'); } break;
      case 'backup': backup(); break;
      case 'export': download(`shelf-life-${E.dateKey()}.json`, S.encode(state)); say('Save file prepared. Keep it somewhere safe.'); break;
      case 'import': $('#import-file').click(); break;
      case 'previous-save': {
        try { const raw = backend.getItem(S.BACKUP_KEY); if (!raw) throw new Error('No previous save is available yet.'); previewImport(raw); }
        catch (error) { showModal(`${modalHead('No previous save')}<p class="modal-copy">${escape(error.message)}</p><button class="btn secondary block" data-action="backup">Back to backups</button>`); }
        break;
      }
      case 'confirm-import': if (pendingImport) { state = pendingImport; pendingImport = null; state.started = true; clearUndo(); selected = -1; page = 'play'; modalDismissable = true; closeModal(); commit({force:true}); say('Your library is back where it belongs.'); } break;
      case 'export-raw': download(`shelf-life-unreadable-${E.dateKey()}.json`, store.raw() || '{}'); break;
      case 'recover-backup': modalDismissable = true; closeModal(); state.started = true; commit({force:true}); say('Previous valid save restored.'); break;
      case 'recovery-new': showModal(`${modalHead('Start a new library?', 'recovery')}<p class="modal-copy">This replaces the unreadable current save. Keep a copy first if you may need to recover it later.</p><div class="modal-actions"><button class="btn ghost" data-action="recovery">Go back</button><button class="btn danger" data-action="reset-now">Start again</button></div>`); break;
      case 'recovery': recovery(); break;
      case 'reset-confirm': showModal(`${modalHead('Start the library again?')}<p class="modal-copy">This clears your current board, funds, improvements, puzzle progress and collections in this browser. Export a backup first to keep them.</p><div class="stack"><button class="btn secondary block" data-action="export">Export my current save first</button><button class="btn danger block" data-action="reset-now">Yes, start a new library</button><button class="btn ghost block" data-action="settings">Keep my progress</button></div>`); break;
      case 'reset-now': state = E.fresh(seed ^ E.hash(String(Date.now()))); selected = -1; requestIndex = 0; clearUndo(); page = 'play'; modalDismissable = true; closeModal(); commit({force:true}); welcome(); break;
      case 'about': showModal(`${modalHead('Shelf Life')}<p class="modal-copy">Made for Lou: a personal game about serious shelves, proper cheese, difficult words and records after closing.</p><p class="modal-copy">All gameplay runs on your device. No analytics, adverts, accounts, purchases or background earnings. Opening a recipe source is the only optional trip to another website.</p><p class="modal-copy">Lou is original cel-shaded vector artwork based on the supplied description: recognisable, expressive and deliberately illustrated rather than photographic. Her reference photograph is not included. The offline guess list uses CMUdict; targets are separately curated.</p><a class="small" href="data/WORDLIST-LICENCE.txt" target="_blank" rel="noopener noreferrer">Word-list attribution & licence ↗</a><button class="btn secondary block" data-action="settings">Back to settings</button>`); break;
      case 'update-app': if (updateWorker) { save(); reloadForUpdate = true; updateWorker.postMessage({type:'SKIP_WAITING'}); } break;
      default: break;
    }
  }

  function withSaveLock(task) {
    const run=()=>{try{const raw=backend.getItem(S.KEY);if(raw){const incoming=store.accept(raw);if(incoming){state=incoming;clearUndo();selected=-1;}}}catch(_){} task();};
    return navigator.locks ? navigator.locks.request(S.KEY,run) : run();
  }
  document.addEventListener('click', event => {
    if (suppressClick) { suppressClick = false; event.preventDefault(); return; }
    const target = event.target.closest('[data-action]');
    if (!target || target.disabled) return;
    // A nested daily button must not activate the surrounding scene.
    event.stopPropagation();
    withSaveLock(()=>perform(target.dataset.action, target.dataset));
  });
  document.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (page === 'vault' && !modal.open) {
      const key = event.key.toUpperCase();
      if (/^[A-Z]$/.test(key) || ['ENTER','BACKSPACE','DELETE'].includes(key)) {
        event.preventDefault(); withSaveLock(()=>keyInput(key === 'BACKSPACE' || key === 'DELETE' ? 'BACK' : key)); return;
      }
    }
    if (event.target.matches('.hero') && ['Enter',' '].includes(event.key)) { event.preventDefault(); navigate('library'); }
    if (page === 'play' && event.target.matches('.tile') && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) {
      event.preventDefault();
      const delta = {ArrowLeft:-1,ArrowRight:1,ArrowUp:-5,ArrowDown:5}[event.key];
      const next = Math.max(0,Math.min(19,Number(event.target.dataset.index)+delta));
      document.querySelector(`.tile[data-index="${next}"]`)?.focus();
    }
  });
  // Pointer gestures support touch and mouse. Taps retain native button semantics.
  document.addEventListener('pointerdown', event => {
    const tile = event.target.closest('.tile');
    if (!tile || modal.open || page !== 'play' || event.button > 0) return;
    const index = Number(tile.dataset.index);
    if (!state.board[index]) return;
    drag = {index, x:event.clientX, y:event.clientY, pointer:event.pointerId, active:false, source:tile, ghost:null};
  });
  document.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.pointer) return;
    if (!drag.active && Math.hypot(event.clientX-drag.x,event.clientY-drag.y)>9) {
      drag.active = true;
      drag.ghost = document.createElement('div'); drag.ghost.className = 'drag-ghost';
      drag.ghost.innerHTML = A.item(state.board[drag.index]);
      document.body.appendChild(drag.ghost); drag.source.classList.add('drag-source');
    }
    if (drag.active) { event.preventDefault(); drag.ghost.style.left = event.clientX+'px'; drag.ghost.style.top = event.clientY+'px'; }
  }, {passive:false});
  function endDrag(event, cancelled=false) {
    if (!drag || event.pointerId!==drag.pointer) return;
    const current = drag; drag = null;
    if (current.ghost) current.ghost.remove();
    current.source.classList.remove('drag-source');
    if (current.active) {
      suppressClick = true;
      setTimeout(()=>{suppressClick=false;},100);
      if (!cancelled) {
        const target = document.elementFromPoint(event.clientX,event.clientY)?.closest('.tile');
        if(target) withSaveLock(()=>moveItem(current.index,Number(target.dataset.index),true));
      }
    }
  }
  document.addEventListener('pointerup', event => endDrag(event));
  document.addEventListener('pointercancel', event => endDrag(event,true));
  modal.addEventListener('cancel', event => { if(!modalDismissable) event.preventDefault(); });
  modal.addEventListener('click', event => {
    if(event.target !== modal || !modalDismissable) return;
    const rect=modal.getBoundingClientRect();
    if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom) closeModal();
  });
  $('#import-file').addEventListener('change', async event => {
    const file=event.target.files?.[0];
    if(!file) return;
    try {
      if(file.size>S.MAX_BYTES) throw new Error('That save file is too large. Choose a Shelf Life JSON backup.');
      previewImport(await file.text());
    } catch(error) { say(error.message); }
    finally { event.target.value=''; }
  });
  window.addEventListener('storage', event => {
    if(event.key!==S.KEY||!event.newValue) return;
    try {
      const incoming=store.accept(event.newValue);
      if (!incoming) return;
      state=incoming; clearUndo(); selected=-1;
      if(drag?.ghost)drag.ghost.remove(); drag=null;
      if(modal.open && modalDismissable)closeModal();
      render(); say('Library progress updated from another tab.');
    } catch(_) { say('Another tab has a save this version cannot read. Export your current progress.'); }
  });
  function onReturn() {
    if(document.visibilityState==='hidden') return;
    if(E.rotateDay(state,E.dateKey())) { clearUndo(); commit(); }
    else if(page==='vault') renderVault();
  }
  document.addEventListener('visibilitychange',()=>withSaveLock(onReturn));
  window.addEventListener('focus',()=>withSaveLock(onReturn));
  // Dynamic viewport fallback for older browsers. Never disable pinch zoom.
  function viewport() {
    if(!window.CSS?.supports('height','100dvh')) document.documentElement.style.setProperty('--vh',window.innerHeight+'px');
  }
  viewport(); window.addEventListener('resize',viewport);
  $('#fund-icon').innerHTML=A.icon('coin');
  $('#settings-icon').innerHTML=A.icon('settings');
  for(const [id,icon] of [['play','book'],['library','library'],['vault','key'],['journal','journal']]) $('#nav-'+id).innerHTML=A.icon(icon);
  E.rotateDay(state,E.dateKey());
  render();
  if(loaded.error) recovery(); else if(!state.started) welcome();
  // Read-only diagnostics for automated browser tests and maintenance.
  window.SHELF_APP=Object.freeze({snapshot:()=>E.copy(state),page:()=>page,version:'1.1.0'});
  if('serviceWorker' in navigator && location.protocol!=='file:') {
    let reloading=false;
    navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloadForUpdate&&!reloading){reloading=true;location.reload();}});
    navigator.serviceWorker.register('./sw.js').then(registration=>{
      if(registration.waiting){updateWorker=registration.waiting;}
      registration.addEventListener('updatefound',()=>{
        const worker=registration.installing;
        worker?.addEventListener('statechange',()=>{
          if(worker.state==='installed'&&navigator.serviceWorker.controller){updateWorker=worker;say('An update is ready. Save and reload from Settings when convenient.');}
        });
      });
    }).catch(()=>{/* Offline caching is optional. The live game still works. */});
  }
})();
