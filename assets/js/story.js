/* たけにし、よりみち日和。— シーン演出（GSAP ScrollTrigger） v4（モーション層追加） */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sp = () => window.innerWidth < 960;
  if (!window.gsap || reduce) {
    $$('.ch').forEach(c => { const first = $('img', c); if (first) first.classList.add('is-on'); });
    $$('.bubble').forEach(b => b.classList.add('is-on'));
    $$('.sc-1 .title .l span').forEach(s => s.style.transform = 'none');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add('js-motion');

  /* ---------- ローディング（画像の読み込み or 最大2.4秒） ---------- */
  const loader = $('#loader');
  const doneLoad = () => {
    if (window.__tnLoaderDone) return; window.__tnLoaderDone = true;
    if (loader) { loader.classList.add('is-done'); setTimeout(() => loader.remove(), 700); }
    document.dispatchEvent(new Event('tn:loaded')); ScrollTrigger.refresh();
  };
  if (loader) {
    const imgs = $$('.sc-1 img, #navi img').filter(i => !i.complete); let left = imgs.length;
    const bar = $('.loader__bar i', loader); const tick = () => { if (bar) bar.style.width = Math.round((1 - left / Math.max(1, imgs.length)) * 100) + '%'; };
    imgs.forEach(i => { const f = () => { left--; tick(); if (left <= 0) setTimeout(doneLoad, 350); }; i.addEventListener('load', f, { once: true }); i.addEventListener('error', f, { once: true }); });
    if (!imgs.length) setTimeout(doneLoad, 900);
    setTimeout(doneLoad, 2400);
  } else doneLoad();

  /* ---------- ヘルパー ---------- */
  const poseOf = {};
  /* ポーズ切替：画像差替＋ぷにっと弾む（squash & stretch）。歩きコマは quiet で弾ませない */
  const pop = c => { if (c.animate) c.animate([{ scale: '1 1' }, { scale: '1.07 .92', offset: .28 }, { scale: '.97 1.05', offset: .62 }, { scale: '1 1' }], { duration: 420, easing: 'cubic-bezier(.3,.7,.4,1)' }); };
  const pose = (sel, name, quiet) => {
    const c = $(sel); if (!c || poseOf[sel] === name) return;
    if (!$(sel + ' img[data-pose="' + name + '"]')) return;
    const had = !!poseOf[sel]; poseOf[sel] = name;
    $$('img', c).forEach(i => i.classList.toggle('is-on', i.dataset.pose === name));
    if (had && !quiet) pop(c);
  };
  const hasPose = (sel, name) => !!$(sel + ' img[data-pose="' + name + '"]');
  /* 吹き出し：出るときに1文字ずつタイプ（幅は先に確保してガタつかせない） */
  const typeIn = (el, text, speed = 42) => {
    clearInterval(el._t); el.style.minWidth = ''; el.textContent = text;
    const w = el.offsetWidth; el.style.minWidth = w + 'px'; el.textContent = '';
    let i = 0; el._t = setInterval(() => { el.textContent = text.slice(0, ++i); if (i >= text.length) clearInterval(el._t); }, speed);
  };
  const bub = (sel, on) => {
    const b = $(sel); if (!b) return;
    const was = b.classList.contains('is-on'); if (was === on) return;
    if (!b.dataset.full) b.dataset.full = b.textContent;
    b.classList.toggle('is-on', on);
    if (on) typeIn(b, b.dataset.full); else { clearInterval(b._t); b.textContent = b.dataset.full; }
  };
  /* 歩き：walk/walk2 の2コマを交互に切替＋上下ボブ（CSS） */
  const walkers = new Map();
  const walking = (sel, on) => {
    const c = $(sel); if (!c) return;
    c.classList.toggle('is-walking', on);
    if (on && !walkers.has(sel)) {
      let f = 0; const two = hasPose(sel, 'walk2');
      pose(sel, 'walk', true);
      walkers.set(sel, setInterval(() => { f ^= 1; pose(sel, two && f ? 'walk2' : 'walk', true); }, 230));
    } else if (!on && walkers.has(sel)) { clearInterval(walkers.get(sel)); walkers.delete(sel); }
  };
  /* 進行率テーブルでポーズ／吹き出しを決める（逆スクロールでも同じ状態になる） */
  const drive = (s, table) => {
    for (const [sel, rules] of Object.entries(table)) {
      if (sel.startsWith('#b')) { bub(sel, s.progress >= rules); continue; }
      let p = rules[0][1];
      for (const [t, name] of rules) if (s.progress >= t) p = name;
      if (p === 'walk') walking(sel, true); else { walking(sel, false); pose(sel, p); }
    }
  };
  $$('.ch').forEach(c => { const p = c.dataset.init || ($('img', c) && $('img', c).dataset.pose); if (p) pose('#' + c.id, p); });

  /* 各シーン共通：背景視差＋紙もの出現 */
  $$('.scene').forEach(sc => {
    const bg = $('.scene__bg', sc);
    /* 背景：視差＋ゆっくり寄り（Ken Burns） */
    if (bg) gsap.fromTo(bg, { yPercent: -4, scale: 1.1 }, { yPercent: 4, scale: 1, ease: 'none', scrollTrigger: { trigger: sc, start: 'top bottom', end: 'bottom top', scrub: true } });
    /* 紙もの：少し傾いて“ぽん”と着地 → 中身が1行ずつ上がる */
    $$('.paper, .board, .note, .mapwrap, .access', sc).forEach(el => {
      if (el.closest('.no-reveal')) return;
      const st = { trigger: el, start: 'top 88%' };
      gsap.from(el, { y: 56, rotate: -2.5, scale: .94, opacity: 0, duration: 1, ease: 'back.out(1.5)', scrollTrigger: st });
      if (el.classList.contains('paper')) gsap.from(el.children, { y: 16, opacity: 0, duration: .6, ease: 'power3.out', stagger: .07, delay: .18, scrollTrigger: st });
    });
  });

  /* ---- Scene1 ---- */
  if ($('.sc-1')) {
    const intro = gsap.timeline({ paused: true });
    intro.to('.sc-1 .title .l span', { y: 0, duration: 1, ease: 'power4.out', stagger: .12 }, .2)
      .from('.sc-1 .kicker-tag', { y: 10, opacity: 0, duration: .5 }, .1)
      .from('.sc-1 .sub, .sc-1 .hero__actions', { y: 14, opacity: 0, duration: .7, stagger: .1 }, .7)
      .from('.sc-1 .hero__fuda', { scale: .6, rotate: -12, opacity: 0, duration: .9, ease: 'back.out(1.6)' }, .9)
      .to('.sc-1 .title em', { backgroundSize: '100% 100%', duration: .7, ease: 'power2.inOut' }, 1.05)
      .from('#c1-koharu', { xPercent: -220, duration: 1.6, ease: 'power2.out', onStart: () => walking('#c1-koharu', true), onComplete: () => { walking('#c1-koharu', false); pose('#c1-koharu', 'point'); bub('#b1', true); } }, .2)
      .from('#c1-sota', { xPercent: -260, duration: 1.8, ease: 'power2.out', onStart: () => walking('#c1-sota', true), onComplete: () => { walking('#c1-sota', false); pose('#c1-sota', 'jump'); } }, .35);
    const finish = () => { if (intro.progress() < 1) intro.progress(1); };
    const startIntro = () => { intro.play(); if (document.hidden) finish(); setTimeout(finish, 3500); };
    if (window.__tnLoaderDone) startIntro(); else document.addEventListener('tn:loaded', startIntro, { once: true });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) finish(); });
    gsap.timeline({ scrollTrigger: { trigger: '.sc-1', start: 'top top', end: 'bottom top', scrub: .5,
      onUpdate: s => { if (s.progress < .04) { if (intro.progress() >= 1) { pose('#c1-koharu', 'point'); bub('#b1', true); } return; } bub('#b1', false); drive(s, { '#c1-koharu': [[0, 'walk'], [.96, 'stand']], '#c1-sota': [[0, 'walk'], [.96, 'stand']] }); } } })
      .to('#c1-koharu', { xPercent: 260, ease: 'none' }, 0).to('#c1-sota', { xPercent: 300, ease: 'none' }, 0)
      .to('.sc-1 .scene__info', { y: -80, opacity: .15, ease: 'none' }, 0);
  }

  /* ---- Scene2 掲示板 ---- */
  if ($('.sc-2')) {
    gsap.timeline({ scrollTrigger: { trigger: '.sc-2', start: 'top 80%', end: 'top 10%', scrub: .6,
      onUpdate: s => drive(s, { '#c2-sota': [[0, 'walk'], [.55, 'surprise']], '#c2-koharu': [[0, 'walk'], [.7, 'think']], '#b2': .8 }) } })
      .from('#c2-sota', { xPercent: -160, ease: 'none' }, 0)
      .from('#c2-koharu', { xPercent: -220, ease: 'none' }, 0);
    gsap.from('.sc-2 .board__paper', { y: -18, rotate: -6, opacity: 0, stagger: .12, duration: .6, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.sc-2 .board', start: 'top 80%' } });
  }

  /* ---- Scene3 店先 ---- */
  if ($('.sc-3')) {
    gsap.timeline({ scrollTrigger: { trigger: '.sc-3', start: 'top 75%', end: 'top 5%', scrub: .6,
      onUpdate: s => drive(s, { '#c3-midori': [[0, 'stand'], [.45, 'wave']], '#c3-sota': [[0, 'walk'], [.6, 'peek']], '#c3-koharu': [[0, 'walk'], [.7, 'wave']], '#b3': .5, '#b3b': .8 }) } })
      .from('#c3-sota', { xPercent: -200, ease: 'none' }, 0)
      .from('#c3-koharu', { xPercent: -240, ease: 'none' }, 0);
  }

  /* ---- Scene4 ノート（pinなし：入ってきたら開く） ---- */
  if ($('.sc-4')) {
    gsap.timeline({ scrollTrigger: { trigger: '.sc-4', start: 'top 70%', end: 'top 10%', scrub: .5,
      onUpdate: s => drive(s, { '#c4-koharu': [[0, 'stand'], [.3, 'note']], '#c4-sota': [[0, 'stand'], [.5, 'peek']], '#b4': .7 }) } })
      .from('#c4-sota', { xPercent: -140, rotate: -6, ease: 'none' }, 0);
    gsap.from('.sc-4 .note', { scale: .6, rotate: -6, opacity: 0, transformOrigin: '30% 100%', duration: .9, ease: 'back.out(1.4)', scrollTrigger: { trigger: '.sc-4 .note', start: 'top 85%' } });
  }

  /* ---- Scene 主要店舗（横スクロール・pin） ---- */
  if ($('.sc-shops')) {
    const track = $('.sc-shops .strip');
    const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
    gsap.timeline({ scrollTrigger: { trigger: '.sc-shops', start: 'top top', end: () => '+=' + (dist() + window.innerHeight * .6), pin: true, scrub: .6, anticipatePin: 1, invalidateOnRefresh: true,
      onUpdate: s => { drive(s, { '#cs-koharu': [[0, 'walk'], [.97, 'wave']], '#cs-sota': [[0, 'walk'], [.97, 'jump']] });
        const cards = $$('.sc-shops .sf'); cards.forEach((el, i) => el.classList.toggle('is-near', Math.abs((i + .5) / cards.length - s.progress) < .6 / cards.length)); } } })
      .fromTo('.sc-shops .scene__info', { opacity: 0, y: 20 }, { opacity: 1, y: 0, ease: 'none', duration: .06 }, 0)
      .to(track, { x: () => -dist(), ease: 'none' }, 0)
      .to('.sc-shops .strip-far', { x: () => -dist() * .35, ease: 'none' }, 0);
  }

  /* ---- Scene5 きっかけ ---- */
  if ($('.sc-5')) {
    gsap.timeline({ scrollTrigger: { trigger: '.sc-5', start: 'top 75%', end: 'top 0%', scrub: .6,
      onUpdate: s => drive(s, { '#c5-sota': [[0, 'walk'], [.55, 'jump']], '#c5-koharu': [[0, 'walk'], [.65, 'point']], '#b5': .7 }) } })
      .from('#c5-sota', { xPercent: -220, ease: 'none' }, 0)
      .from('#c5-koharu', { xPercent: -280, ease: 'none' }, 0)
      .fromTo('.sc-5 .signboard', { y: 40, rotate: -8, opacity: 0 }, { y: 0, rotate: -2, opacity: 1, ease: 'none' }, .3);
  }

  /* ---- Scene6 主役（pin） ---- */
  if ($('.sc-6')) {
    const mode = document.body.dataset.mode;
    const tl = gsap.timeline({ scrollTrigger: sp() ? { trigger: '.sc-6', start: 'top 75%', end: 'bottom 70%', scrub: .5 } : { trigger: '.sc-6 .scene__open', start: 'top top', end: '+=120%', pin: true, scrub: .5, anticipatePin: 1,
      onUpdate: s => drive(s, { '#c6-midori': [[0, 'stand'], [.1, 'board']], '#c6-sota': [[0, 'stand'], [.62, 'cheer'], [.85, 'laugh']], '#c6-koharu': [[0, 'stand'], [.5, 'point'], [.8, 'jump']], '#b6': .8 }) } });
    tl.from('#c6-midori', { xPercent: 120, ease: 'none' }, 0);
    if (mode === 'aki') {
      tl.fromTo('#ring', { x: 0, y: 0, rotate: 0, opacity: 0 }, { opacity: 1, duration: .05 }, .25)
        .to('#ring', { x: 50, y: -55, rotate: 50, ease: 'power1.out', duration: .18 }, .27)
        .to('#ring', { x: 96, y: 14, rotate: 100, ease: 'power1.in', duration: .17 }, .45)
        .to('#c6-sota', { y: -14, yoyo: true, repeat: 1, duration: .06 }, .62)
        .to('#fx-notes', { opacity: 1, duration: .2 }, .1);
    } else if (mode === 'saimatsu') {
      tl.to('#drum', { rotate: 300, transformOrigin: '50% 50%', ease: 'power1.inOut', duration: .45 }, .2)
        .fromTo('#ball', { y: 0, opacity: 0 }, { opacity: 1, duration: .03 }, .65)
        .to('#ball', { y: 44, ease: 'power1.in', duration: .08 }, .66)
        .to('#ball', { y: 38, ease: 'power1.out', duration: .04 }, .74)
        .to('#c6-sota', { y: -14, yoyo: true, repeat: 1, duration: .06 }, .62);
    } else {
      tl.fromTo('#bag', { x: 0, opacity: 0 }, { opacity: 1, x: 24, ease: 'power1.out', duration: .3 }, .3)
        .to('#c6-sota', { y: -14, yoyo: true, repeat: 1, duration: .06 }, .62);
    }
    /* スマホは紙が長く、スクロール連動だと上部を見る位置で透明に戻る → 共通の出現演出（一度出たら消えない）に任せる */
    if (!sp()) tl.from('.sc-6 .paper', { y: 40, opacity: 0, ease: 'none', duration: .25 }, .3);
  }

  /* ---- Scene7 帰り道 ---- */
  if ($('.sc-7')) {
    gsap.timeline({ scrollTrigger: { trigger: '.sc-7', start: 'top 75%', end: 'top 0%', scrub: .6,
      onUpdate: s => drive(s, { '#c7-haru': [[0, 'walk'], [.5, 'bow']], '#c7-koharu': [[0, 'walk'], [.55, 'eat']], '#b7': .6, '#b7b': .75 }) } })
      .from('#c7-haru', { xPercent: 160, ease: 'none' }, 0)
      .from('#c7-koharu', { xPercent: -200, ease: 'none' }, 0);
    gsap.from('.sc-7 .pick', { y: 24, opacity: 0, stagger: .12, duration: .6, scrollTrigger: { trigger: '.sc-7 .picks', start: 'top 85%' } });
  }

  /* ---- Scene8 地図（地図の描画演出は main.js 側） ---- */
  if ($('.sc-8')) {
    gsap.timeline({ scrollTrigger: { trigger: '.sc-8', start: 'top 70%', end: 'top 0%', scrub: .6, onUpdate: s => drive(s, { '#c8-koharu': [[0, 'stand'], [.5, 'point']], '#c8-sota': [[0, 'stand'], [.6, 'peek']] }) } })
      .from('#c8-sota', { xPercent: -120, ease: 'none' }, 0)
      .from('#c8-koharu', { xPercent: 140, ease: 'none' }, 0);
  }

  /* ---- Scene9 街灯 ---- */
  if ($('.sc-9')) {
    gsap.timeline({ scrollTrigger: { trigger: '.sc-9', start: 'top 70%', end: 'bottom 60%', scrub: .6, onUpdate: s => drive(s, { '#c9-koharu': [[0, 'walk'], [.45, 'stand']], '#c9-sota': [[0, 'walk'], [.45, 'eat']] }) } })
      .from('#c9-koharu', { xPercent: -160, ease: 'none' }, 0).from('#c9-sota', { xPercent: -200, ease: 'none' }, 0)
      .to('.sc-9 .glow', { opacity: 1, ease: 'power2.out', duration: .4, stagger: .08 }, .35);
    if ($('#rt-train')) {
      gsap.from('#rt-train', { x: -260, duration: 1.4, ease: 'power2.out', scrollTrigger: { trigger: '.sc-9 .route', start: 'top 75%' } });
      gsap.from('.rt-step', { scale: 0, transformOrigin: 'center', duration: .4, stagger: .12, ease: 'back.out(2)', scrollTrigger: { trigger: '.sc-9 .route', start: 'top 70%' }, delay: 1.2 });
    }
  }

  /* ---- Scene10 ラスト ---- */
  if ($('.sc-10')) {
    gsap.timeline({ scrollTrigger: { trigger: '.sc-10', start: 'top 60%', end: 'bottom bottom', scrub: .6, onUpdate: s => drive(s, { '#c10-koharu': [[0, 'walk'], [.35, 'wave']], '#c10-sota': [[0, 'walk'], [.5, 'jump'], [.75, 'bye']] }) } })
      .from('#c10-koharu', { xPercent: -120, ease: 'none' }, 0).from('#c10-sota', { xPercent: -160, ease: 'none' }, 0)
      .from('.sc-10 .last', { y: 24, opacity: 0, ease: 'none', duration: .35 }, .5)
      .from('.sc-10 .actions', { y: 16, opacity: 0, ease: 'none', duration: .3 }, .7);
  }

  /* ---------- v4 モーション層（空気感・慣性・奥行き） ---------- */
  /* 待機中の呼吸：キャラごとに位相をずらす */
  $$('.ch').forEach((c, i) => c.style.setProperty('--bd', (-(i * .83) % 3.2).toFixed(2) + 's'));
  /* スクロールの速さで、歩いているキャラが前のめり／主要店舗カードがしなる */
  const root = document.documentElement, lean = { v: 0 };
  const leanTo = gsap.quickTo(lean, 'v', { duration: .45, ease: 'power3.out', onUpdate: () => root.style.setProperty('--lean', lean.v.toFixed(2) + 'deg') });
  let leanRest = 0;
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: s => {
    leanTo(gsap.utils.clamp(-8, 8, -s.getVelocity() / 240));
    clearTimeout(leanRest); leanRest = setTimeout(() => leanTo(0), 140);
  } });
  /* 光の粒（昼）／ほたる火（夜）：背景と人物の間にふわふわ漂わせる */
  const rnd = (a, b) => a + Math.random() * (b - a);
  $$('.scene').forEach(sc => {
    if (!$('.scene__bg', sc)) return;
    const night = sc.classList.contains('sc-10');
    const box = document.createElement('div'); box.className = 'fx-amb' + (night ? ' fx-amb--fire' : ''); box.setAttribute('aria-hidden', 'true');
    const n = sp() ? 7 : 14;
    for (let i = 0; i < n; i++) {
      const d = document.createElement('i');
      d.style.cssText = 'left:' + rnd(2, 98).toFixed(1) + '%;top:' + rnd(night ? 30 : 15, 92).toFixed(1) + '%;--s:' + rnd(night ? 5 : 4, night ? 11 : 12).toFixed(1) + 'px;--d:' + rnd(7, 13).toFixed(1) + 's;--dl:-' + rnd(0, 12).toFixed(1) + 's;--dx:' + rnd(-60, 60).toFixed(0) + 'px;--o:' + rnd(.45, .95).toFixed(2);
      box.appendChild(d);
    }
    const ref = $('.scene__fx', sc) || $('.scene__chars', sc); if (ref) ref.parentNode.insertBefore(box, ref); else sc.appendChild(box);
  });
  /* オープニング：朝の光だまり＋マウスで奥行き（PCのみ） */
  const s1 = $('.sc-1');
  if (s1) {
    const sun = document.createElement('div'); sun.className = 'fx-sun'; sun.setAttribute('aria-hidden', 'true'); sun.innerHTML = '<i></i>';
    const ref1 = $('.scene__chars', s1); if (ref1) ref1.parentNode.insertBefore(sun, ref1);
    if (window.matchMedia('(pointer:fine)').matches) {
      const bgImg = $('.scene__bg img', s1), chs = $('.scene__chars', s1);
      gsap.set(bgImg, { scale: 1.05 });
      const bx = gsap.quickTo(bgImg, 'x', { duration: 1.2, ease: 'power3.out' }), by = gsap.quickTo(bgImg, 'y', { duration: 1.2, ease: 'power3.out' });
      const cx = gsap.quickTo(chs, 'x', { duration: .9, ease: 'power3.out' });
      s1.addEventListener('pointermove', e => { const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5; bx(nx * -18); by(ny * -10); cx(nx * 22); });
      s1.addEventListener('pointerleave', () => { bx(0); by(0); cx(0); });
    }
  }
  /* 主要店舗カード：窓の中で絵が少し遅れて動く（のぞき窓パララックス） */
  const shopsSc = $('.sc-shops'), cardsImg = $$('.sc-shops .sf img');
  if (shopsSc && cardsImg.length) {
    gsap.ticker.add(() => {
      const R = shopsSc.getBoundingClientRect(); if (R.bottom < 0 || R.top > innerHeight) return;
      const W = innerWidth;
      cardsImg.forEach(im => { const r = im.getBoundingClientRect(); const rel = gsap.utils.clamp(-1, 1, (r.left + r.width / 2 - W / 2) / W); im.style.objectPosition = (50 + rel * 35).toFixed(1) + '% 60%'; });
    });
  }

  /* ---------- ナビゲーター（右下に常駐・シーンごとにひとこと） ---------- */
  const navi = $('#navi');
  if (navi) {
    const tip = $('.navi__tip', navi);
    let hideT = 0;
    const say = (t, p) => {
      clearTimeout(hideT);
      if (p) $$('img', navi).forEach(i => i.classList.toggle('is-on', i.dataset.pose === p));
      if (!t) { tip.classList.remove('is-on'); return; }
      tip.classList.add('is-on'); typeIn(tip, t, 34);
      navi.classList.add('is-hop'); setTimeout(() => navi.classList.remove('is-hop'), 700);
      hideT = setTimeout(() => tip.classList.remove('is-on'), 5000);
    };
    $$('.scene[data-tip]').forEach(sc => ScrollTrigger.create({ trigger: sc, start: 'top 55%', end: 'bottom 55%', onEnter: () => say(sc.dataset.tip, sc.dataset.tipPose), onEnterBack: () => say(sc.dataset.tip, sc.dataset.tipPose) }));
    navi.addEventListener('click', () => navi.classList.toggle('is-open'));
    $$('.navi__menu a', navi).forEach(a => a.addEventListener('click', () => navi.classList.remove('is-open')));
    setTimeout(() => say(navi.dataset.hello, 'wave'), 1800);
  }

  window.addEventListener('load', () => ScrollTrigger.refresh());
  $$('.chip').forEach(c => c.addEventListener('click', () => setTimeout(() => ScrollTrigger.refresh(), 50)));
})();
