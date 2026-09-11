/* 竹の塚西口商店街 v1 - スクロール演出・地図・UI */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- header ---- */
  const hd = $('.hd');
  const onScroll = () => hd && hd.classList.toggle('is-scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const burger = $('.hd__burger'), drawer = $('.drawer');
  if (burger && drawer) {
    burger.addEventListener('click', () => { const o = drawer.classList.toggle('is-open'); burger.classList.toggle('is-open', o); burger.setAttribute('aria-expanded', o); });
    $$('a', drawer).forEach(a => a.addEventListener('click', () => { drawer.classList.remove('is-open'); burger.classList.remove('is-open'); }));
  }

  /* ---- shop filter ---- */
  const chips = $$('.chip');
  chips.forEach(c => c.addEventListener('click', () => {
    chips.forEach(x => x.classList.remove('is-on')); c.classList.add('is-on');
    const g = c.dataset.g;
    $$('.shop[data-g]').forEach(s => s.classList.toggle('is-hidden', g !== 'all' && s.dataset.g !== g));
  }));

  /* ---- map ---- */
  const map = $('#tmap');
  if (map) {
    const card = $('.mapcard');
    let active = null;
    const data = window.TN_SHOPS || {};
    const open = (g) => {
      if (active) active.classList.remove('is-active');
      active = g; g.classList.add('is-active');
      const slug = g.dataset.slug, d = data[slug] || {};
      $('.mapcard__name', card).textContent = g.dataset.name;
      $('.mapcard__cat', card).textContent = d.cat || '周辺のお店・施設';
      $('.mapcard__fest', card).textContent = d.festival ? '秋祭り：' + d.festival : (d.member ? '' : 'このお店・施設の紹介ページは準備中です');
      const btn = $('.mapcard .btn');
      if (d.member) { btn.style.display = ''; btn.href = d.url || ('shop.html?s=' + slug); } else { btn.style.display = 'none'; }
      card.classList.add('is-open');
      // 地図の親要素をスクロールさせない範囲で、カードを見えるように
      const r = card.getBoundingClientRect();
      if (r.bottom > window.innerHeight) card.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
    };
    $$('.mshop', map).forEach(g => {
      g.addEventListener('click', () => open(g));
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(g); } });
    });
    // zoom
    const sc = $('.mapscroll'); let zoom = 1;
    const apply = () => { map.style.width = (100 * zoom) + '%'; map.style.minWidth = (760 * zoom) + 'px'; };
    $('[data-zoom="in"]') && $('[data-zoom="in"]').addEventListener('click', () => { zoom = Math.min(2.5, zoom + .4); apply(); });
    $('[data-zoom="out"]') && $('[data-zoom="out"]').addEventListener('click', () => { zoom = Math.max(1, zoom - .4); apply(); });
    $('[data-zoom="st"]') && $('[data-zoom="st"]').addEventListener('click', () => { zoom = 1; apply(); sc.scrollTo({ left: sc.scrollWidth, behavior: 'smooth' }); });
    // 初期表示：スマホは駅側(右)から
    if (window.innerWidth < 760) sc.scrollLeft = sc.scrollWidth;
  }

  /* ---- GSAP ---- */
  if (reduce || !window.gsap) { $$('.reveal').forEach(e => { e.style.opacity = 1; e.style.transform = 'none'; }); $$('.hero__title .l span').forEach(s => s.style.transform = 'none'); return; }
  gsap.registerPlugin(ScrollTrigger);

  if ($('.hero')) {
  // hero intro（バックグラウンドタブ等で描画が止まる場合は即完了させる）
  const intro = gsap.timeline();
  intro.to('.hero__title .l span', { y: 0, duration: 1, ease: 'power4.out', stagger: .12 }, .2)
    .from('.hero__kicker', { y: 10, opacity: 0, duration: .6 }, .1)
    .from('.hero__lead, .hero__actions', { y: 16, opacity: 0, duration: .8, stagger: .1 }, .6)
    .from('.hero__fuda', { scale: .6, rotate: -12, opacity: 0, duration: .9, ease: 'back.out(1.6)' }, .9)
    .from('#street .st-shop', { y: 60, opacity: 0, duration: .8, stagger: .07, ease: 'power3.out' }, .3)
    .from('#st-lanterns', { y: -40, opacity: 0, duration: 1 }, .8)
    .from('#st-lamps', { y: 40, opacity: 0, duration: .8 }, .5);
  if (document.hidden) intro.progress(1);
  setTimeout(() => { if (intro.progress() < 1) intro.progress(1); }, 4000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && intro.progress() < 1) intro.progress(1); });

  // hero parallax & walkers（スクロール量で街が動く）
  const hero = $('.hero');
  if (hero && $('#street')) {
    const tl = gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: .6 } });
    tl.to('#st-far', { x: -40, y: 20 }, 0)
      .to('#st-shops', { x: -90 }, 0)
      .to('#st-lanterns', { x: -110, y: -10 }, 0)
      .to('#st-lamps', { x: -150 }, 0)
      .to('#walk-family', { x: 420 }, 0)
      .to('#walk-bike', { x: -900 }, 0)
      .to('#walk-cart', { x: 180 }, 0)
      .to('#train', { x: 520 }, 0)
      .to('.hero__copy', { y: -60, opacity: .2 }, 0);
  }

  }
  // roadline（左ガター）
  const rl = $('.roadline');
  if (rl) {
    const prog = $('.rl-prog', rl), walker = $('.rl-walker', rl);
    const len = prog.getTotalLength(); prog.style.strokeDasharray = len; prog.style.strokeDashoffset = len;
    ScrollTrigger.create({ start: 0, end: 'max', onUpdate: s => { prog.style.strokeDashoffset = len * (1 - s.progress); walker.setAttribute('transform', `translate(0,${8 + s.progress * (rl.clientHeight - 40)})`); } });
    $$('.rl-lamp', rl).forEach(l => {
      const target = $(l.dataset.target); if (!target) return;
      ScrollTrigger.create({ trigger: target, start: 'top 60%', end: 'bottom 40%', toggleClass: { targets: l, className: 'is-on' } });
    });
  }

  // reveal（汎用）
  $$('.reveal').forEach(el => gsap.to(el, { opacity: 1, y: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 85%' } }));

  // 秋祭り：横断幕が張られる→札が貼られる
  if ($('.fest__banner')) {
    gsap.from('.fest__banner', { scaleX: 0, duration: .9, ease: 'power4.out', scrollTrigger: { trigger: '.fest', start: 'top 70%' } });
    gsap.from('.fuda', { y: -30, rotate: () => gsap.utils.random(-10, 10), opacity: 0, duration: .6, ease: 'back.out(1.8)', stagger: .09, scrollTrigger: { trigger: '.fuda-list', start: 'top 80%' } });
    gsap.from('.fest__poster', { y: 40, rotate: 4, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.fest__poster', start: 'top 80%' } });
  }
  // ポラロイド
  gsap.from('.pola', { y: 60, opacity: 0, rotate: 12, duration: .9, stagger: .15, ease: 'power3.out', scrollTrigger: { trigger: '.polas', start: 'top 75%' } });
  gsap.from('.about__points li', { x: 30, opacity: 0, duration: .7, stagger: .12, scrollTrigger: { trigger: '.about__points', start: 'top 80%' } });
  // お店カード：暖簾がめくれる
  gsap.from('.shops .shop', { clipPath: 'inset(0 0 100% 0)', y: 20, duration: .8, stagger: { each: .05, grid: 'auto', from: 'start' }, ease: 'power3.out', scrollTrigger: { trigger: '.shops', start: 'top 80%' } });
  // 地図：道が伸びる→店名がふわっと出る（SVGのtranslateを壊さないよう opacity/y のみ・一度だけ）
  if (map) {
    const road = $('#road-main');
    ScrollTrigger.create({ trigger: '.mapwrap', start: 'top 85%', once: true, onEnter: () => {
      if (road) { const L = road.getTotalLength(); gsap.fromTo(road, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut' }); }
      gsap.fromTo('.mshop', { opacity: 0, scale: .3, transformOrigin: '50% 100%' }, { opacity: 1, scale: 1, duration: .5, ease: 'back.out(1.8)', stagger: { each: .03, from: 'random' }, delay: .2 }); // ※ y は使わない（SVGのtranslateを上書きしてしまう）
    } });
  }
  // アクセス：電車が到着
  if ($('#rt-train')) {
    gsap.from('#rt-train', { x: -260, duration: 1.4, ease: 'power2.out', scrollTrigger: { trigger: '.route', start: 'top 75%' } });
    gsap.from('.rt-step', { scale: 0, transformOrigin: 'center', duration: .4, stagger: .12, ease: 'back.out(2)', scrollTrigger: { trigger: '.route', start: 'top 70%' }, delay: 1.2 });
  }
  gsap.from('.news li', { y: 24, opacity: 0, duration: .6, stagger: .1, scrollTrigger: { trigger: '.news', start: 'top 85%' } });
})();
