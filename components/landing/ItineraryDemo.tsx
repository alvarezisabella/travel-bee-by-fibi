'use client';

import { useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';

// ─── Types ────────────────────────────────────────────────────────────────────
type EventTag = 'activity' | 'reservation' | 'food' | 'transit';
type EventStatus = 'confirmed' | 'pending' | 'idea';

interface DemoEvent {
  name: string;
  tag: EventTag;
  desc: string;
  time: string;
  dur: string;
  status: EventStatus;
}

// ─── Itinerary Data ───────────────────────────────────────────────────────────
const D1: DemoEvent[] = [
  { name: 'Central Park Morning Walk',        tag: 'activity',    desc: 'Sunrise stroll, Bethesda Fountain & Bow Bridge',         time: '08:00:00', dur: '90',  status: 'confirmed' },
  { name: 'The Metropolitan Museum of Art',   tag: 'activity',    desc: 'Egyptian Wing, Impressionists, rooftop views',           time: '10:30:00', dur: '180', status: 'confirmed' },
  { name: 'Check-In @ The Plaza Hotel',       tag: 'reservation', desc: '5th Ave & Central Park South · Classic King room',       time: '15:00:00', dur: '60',  status: 'confirmed' },
  { name: 'Broadway Show — Hamilton',         tag: 'activity',    desc: 'Richard Rodgers Theatre · Orchestra seats',              time: '19:00:00', dur: '180', status: 'pending'   },
];
const D2: DemoEvent[] = [
  { name: 'Brooklyn Bridge Walk',             tag: 'activity',    desc: 'Cross on foot, photos from DUMBO waterfront',            time: '09:00:00', dur: '120', status: 'confirmed' },
  { name: 'Smorgasburg Food Market',          tag: 'food',        desc: 'Williamsburg · Open-air food market, 100+ vendors',      time: '11:30:00', dur: '90',  status: 'idea'      },
  { name: 'Top of the Rock Observation Deck', tag: 'activity',    desc: 'Rockefeller Center · Book tickets in advance',           time: '16:00:00', dur: '60',  status: 'pending'   },
  { name: 'Dinner at Carbone',                tag: 'food',        desc: '181 Thompson St · Italian-American · Reservation for 2', time: '19:30:00', dur: '120', status: 'confirmed' },
];
const D3: DemoEvent[] = [
  { name: 'Chelsea Market & High Line',       tag: 'activity',    desc: 'Walk the elevated park, browse Chelsea Market',          time: '10:00:00', dur: '150', status: 'confirmed' },
  { name: 'MoMA — Museum of Modern Art',      tag: 'activity',    desc: 'Picasso, Warhol, Monet — Floor 5 highlights',            time: '13:00:00', dur: '120', status: 'pending'   },
  { name: 'Times Square & Farewell Dinner',   tag: 'food',        desc: "Junior's Cheesecake · Classic NYC send-off",             time: '18:30:00', dur: '90',  status: 'confirmed' },
  { name: 'JFK Airport Departure',            tag: 'transit',     desc: 'Allow 90 min travel time from Midtown',                  time: '21:00:00', dur: '60',  status: 'pending'   },
];

const TAG_COLORS: Record<EventTag, string> = {
  activity:    '#16A34A',
  reservation: '#9D174D',
  food:        '#9D174D',
  transit:     '#1E40AF',
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function ItineraryDemo() {
  const vpoRef     = useRef<HTMLDivElement>(null);
  const vpiRef     = useRef<HTMLDivElement>(null);
  const scRef      = useRef<HTMLDivElement>(null);
  const dwRef      = useRef<HTMLDivElement>(null);
  const apRef      = useRef<HTMLDivElement>(null);
  const togRef     = useRef<HTMLDivElement>(null);
  const msgsRef    = useRef<HTMLDivElement>(null);
  const inpRef     = useRef<HTMLInputElement>(null);
  const curRef     = useRef<HTMLDivElement>(null);
  const crRef      = useRef<HTMLDivElement>(null);
  const runningRef = useRef(false);

  // ── Scale viewport ─────────────────────────────────────────────────────────
  const applyScale = useCallback(() => {
    if (!vpoRef.current || !vpiRef.current) return;
    const scale = vpoRef.current.offsetWidth / 1280;
    vpiRef.current.style.transform       = `scale(${scale})`;
    vpiRef.current.style.transformOrigin  = 'top left';
    vpoRef.current.style.height           = `${720 * scale}px`;
  }, []);

  useEffect(() => {
    applyScale();
    window.addEventListener('resize', applyScale);
    return () => window.removeEventListener('resize', applyScale);
  }, [applyScale]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

  const moveCur = (x: number, y: number) => {
    if (!curRef.current) return;
    curRef.current.style.left = `${x}px`;
    curRef.current.style.top  = `${y}px`;
  };

  const clickAt = async (x: number, y: number) => {
    moveCur(x, y);
    await delay(550);
    if (!crRef.current) return;
    crRef.current.className = 'cring';
    void crRef.current.offsetWidth;
    crRef.current.className = 'cring pop';
    await delay(360);
  };

  const smoothScroll = (to: number, dur = 650) =>
    new Promise<void>((res) => {
      const sc = scRef.current;
      if (!sc) return res();
      const from = -parseInt(
        (sc.style.transform || 'translateY(0)').replace(/[^\d.-]/g, '') || '0'
      );
      const diff = to - from;
      let t0: number | null = null;
      const ease = (t: number) =>
        t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
      const step = (ts: number) => {
        if (!t0) t0 = ts;
        const p = Math.min((ts - t0) / dur, 1);
        sc.style.transform = `translateY(${-(from + diff * ease(p))}px)`;
        p < 1 ? requestAnimationFrame(step) : res();
      };
      requestAnimationFrame(step);
    });

  const typeIn = async (text: string) => {
    if (!inpRef.current) return;
    inpRef.current.value = '';
    for (const ch of text) {
      inpRef.current.value += ch;
      await delay(36 + Math.random() * 18);
    }
    await delay(220);
  };

  const addMsg = async (html: string, role: 'usr' | 'bot', typingDelay = 1000) => {
    const msgs = msgsRef.current;
    if (!msgs) return;
    if (role === 'bot') {
      const t = document.createElement('div');
      t.className = 'tbub';
      t.innerHTML = '<div class="td"></div><div class="td"></div><div class="td"></div>';
      msgs.appendChild(t);
      msgs.scrollTop = 9999;
      await delay(typingDelay);
      t.remove();
    }
    const m = document.createElement('div');
    m.className = role === 'usr' ? 'musr' : 'mbot';
    m.innerHTML = html;
    if (role === 'usr') {
      const ts = document.createElement('div');
      ts.className   = 'musr-time';
      ts.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      m.appendChild(ts);
    }
    msgs.appendChild(m);
    msgs.scrollTop = 9999;
    await delay(30);
  };

  // ── Build event card ───────────────────────────────────────────────────────
  // The card uses a two-layer approach:
  //   .ev       = outer shell with the yellow ::before accent bar (position:relative, no flex)
  //   .ev-inner = flex-column content stack — completely isolated from the border
  const mkEv = (ev: DemoEvent) => {
    const uid  = ev.name.replace(/\W/g, '');

    const card = document.createElement('div');
    card.className = 'ev si';

    // Inner content wrapper — this is the flex-column, NOT the card border
    const inner = document.createElement('div');
    inner.className = 'ev-inner';

    // ── Row 1: name | votes + badge ──
    const top = document.createElement('div');
    top.className = 'ev-top';

    const nameEl = document.createElement('div');
    nameEl.className   = 'ev-name';
    nameEl.textContent = ev.name;

    const rhs = document.createElement('div');
    rhs.className = 'ev-rhs';

    const votes = document.createElement('div');
    votes.className = 'ev-votes';
    votes.innerHTML = `
      <span class="ev-vote">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
        </svg>0
      </span>
      <span class="ev-vote">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
        </svg>0
      </span>`;

    const badge = document.createElement('span');
    badge.className   = `badge ${ev.status} bi`;
    badge.id          = `b${uid}`;
    badge.textContent = ev.status[0].toUpperCase() + ev.status.slice(1);

    rhs.appendChild(votes);
    rhs.appendChild(badge);
    top.appendChild(nameEl);
    top.appendChild(rhs);
    inner.appendChild(top);

    // ── Row 2: tag pill ──
    const tag = document.createElement('span');
    tag.className = `ev-tag ${ev.tag}`;
    const dot = document.createElement('span');
    dot.className        = 'tag-dot';
    dot.style.background = TAG_COLORS[ev.tag];
    tag.appendChild(dot);
    tag.appendChild(document.createTextNode(
      ev.tag[0].toUpperCase() + ev.tag.slice(1)
    ));
    inner.appendChild(tag);

    // ── Row 3: description ──
    if (ev.desc) {
      const d = document.createElement('div');
      d.className   = 'ev-meta';
      d.textContent = ev.desc;
      inner.appendChild(d);
    }

    // ── Row 4: time + duration ──
    const tr = document.createElement('div');
    tr.className = 'ev-timerow';
    const t1 = document.createElement('span'); t1.textContent = ev.time;
    const t2 = document.createElement('span'); t2.textContent = ev.dur;
    tr.appendChild(t1);
    tr.appendChild(t2);
    inner.appendChild(tr);

    card.appendChild(inner);
    return card;
  };

  const addEv = async (block: HTMLElement, ev: DemoEvent) => {
    const c = mkEv(ev);
    block.appendChild(c);
    await delay(40);
    c.classList.add('in');
    await delay(180);
    const b = document.getElementById('b' + ev.name.replace(/\W/g, ''));
    if (b) { await delay(100); b.classList.add('in'); }
    await delay(260);
  };

  // ── Animation sequence ─────────────────────────────────────────────────────
  const run = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;

    const dw   = dwRef.current;
    const msgs = msgsRef.current;
    const sc   = scRef.current;
    const ap   = apRef.current;
    const tog  = togRef.current;
    const inp  = inpRef.current;
    if (!dw || !msgs || !sc || !ap || !tog || !inp) { runningRef.current = false; return; }

    dw.innerHTML   = '';
    msgs.innerHTML = '';
    sc.style.transform = 'translateY(0)';
    inp.value = '';
    ap.classList.remove('closed');
    tog.classList.remove('shut');
    tog.style.left = '320px';

    moveCur(700, 150); await delay(500);
    moveCur(230, 660); await delay(400);
    await clickAt(228, 658);
    await typeIn('i want to go to new york, give me a 3 day itinerary');
    moveCur(298, 660);
    await clickAt(296, 658);
    await addMsg('i want to go to new york, give me a 3 day itinerary', 'usr', 0);
    inp.value = '';
    await addMsg(
      `Sure! Here's your <strong>New York City 3-Day Itinerary</strong> 🗽<br><br>` +
      `<strong>Day 1:</strong> Central Park, The Met, The Plaza Hotel, Hamilton on Broadway<br>` +
      `<strong>Day 2:</strong> Brooklyn Bridge, Smorgasburg, Top of the Rock, Carbone dinner<br>` +
      `<strong>Day 3:</strong> High Line, MoMA, Times Square farewell<br><br>` +
      `Adding to your itinerary now...`,
      'bot', 1500
    );
    await delay(300);

    // Day 1
    const b1 = document.createElement('div');
    b1.className = 'day-block fi';
    b1.innerHTML = '<div class="day-lbl">Day 1</div>';
    dw.appendChild(b1); await delay(40); b1.classList.add('in'); await delay(200);
    for (const ev of D1) await addEv(b1, ev);
    const a1 = document.createElement('button');
    a1.className = 'add-ev fi'; a1.textContent = '+ Add Event';
    b1.appendChild(a1); await delay(40); a1.classList.add('in'); await delay(280);

    await smoothScroll(320, 600); await delay(120);

    // Day 2
    const b2 = document.createElement('div');
    b2.className = 'day-block fi';
    b2.innerHTML = '<div class="day-lbl">Day 2</div>';
    dw.appendChild(b2); await delay(40); b2.classList.add('in'); await delay(200);
    for (const ev of D2) await addEv(b2, ev);
    const a2 = document.createElement('button');
    a2.className = 'add-ev fi'; a2.textContent = '+ Add Event';
    b2.appendChild(a2); await delay(40); a2.classList.add('in'); await delay(280);

    await smoothScroll(620, 600); await delay(120);

    // Day 3
    const b3 = document.createElement('div');
    b3.className = 'day-block fi';
    b3.innerHTML = '<div class="day-lbl">Day 3</div>';
    dw.appendChild(b3); await delay(40); b3.classList.add('in'); await delay(200);
    for (const ev of D3) await addEv(b3, ev);
    const a3 = document.createElement('button');
    a3.className = 'add-ev fi'; a3.textContent = '+ Add Event';
    b3.appendChild(a3); await delay(40); a3.classList.add('in'); await delay(380);

    await addMsg(
      `<strong>🗽 NYC Tips</strong>` +
      `<div style="margin-top:6px;display:flex;flex-direction:column;gap:5px;">` +
        `<div class="tips-item">Get a MetroCard — unlimited 7-day pass saves money</div>` +
        `<div class="tips-item">Book Broadway tickets at least 2 weeks ahead</div>` +
        `<div class="tips-item">Walk the Brooklyn Bridge in the morning to beat crowds</div>` +
        `<div class="tips-item warn">Avoid Times Square during peak hours (6–9 PM)</div>` +
      `</div>`,
      'bot', 900
    );

    moveCur(228, 658); await delay(400); await clickAt(228, 658);
    await typeIn('find me a hotel near central park');
    moveCur(296, 658); await clickAt(296, 658);
    await addMsg('find me a hotel near central park', 'usr', 0);
    inp.value = '';
    await addMsg(
      `<strong>The Plaza Hotel</strong> is already confirmed on Day 1 — right on 5th Ave & Central Park South!` +
      `<br><br>Alternatives nearby:` +
      `<div style="margin-top:5px;display:flex;flex-direction:column;gap:3px;">` +
        `<div>• <strong>The Ritz-Carlton</strong> — $480/night ⭐ 4.9</div>` +
        `<div>• <strong>JW Marriott Essex House</strong> — $320/night ⭐ 4.7</div>` +
        `<div>• <strong>The Pierre</strong> — $550/night ⭐ 4.8</div>` +
      `</div>`,
      'bot', 1300
    );
    moveCur(700, 350);
    runningRef.current = false;
  }, []);

  useEffect(() => { run(); }, [run]);

  const toggleAtlas = () => {
    const ap  = apRef.current;
    const tog = togRef.current;
    if (!ap || !tog) return;
    const closed = ap.classList.toggle('closed');
    tog.classList.toggle('shut', closed);
    tog.style.left = closed ? '0' : '320px';
  };

  return (
    <>
      <style>{`
        .demo-wrap { font-family: 'Inter', sans-serif; background: transparent; display: flex; flex-direction: column; align-items: center; padding: 0 0 1.5rem; }

        /* ── Laptop ── */
        .laptop        { width: 100%; max-width: 960px; display: flex; flex-direction: column; align-items: center; }
        .laptop-screen { width: 100%; background: #1a1a1a; border-radius: 14px 14px 0 0; padding: 12px 12px 0; box-shadow: 0 0 0 1px #333, 0 20px 60px rgba(0,0,0,.35); }
        .laptop-base   { width: 110%; background: linear-gradient(180deg,#2a2a2a,#1a1a1a); height: 18px; border-radius: 0 0 8px 8px; }
        .laptop-foot   { width: 90%; height: 6px; background: #d1d1d1; border-radius: 0 0 6px 6px; margin: 0 auto; }

        /* ── Browser chrome ── */
        .browser { width: 100%; border-radius: 8px 8px 0 0; overflow: hidden; }
        .bbar    { background: #2d2d2d; padding: .45rem .75rem; display: flex; align-items: center; gap: .55rem; }
        .bdots   { display: flex; gap: 4px; }
        .bdot    { width: 9px; height: 9px; border-radius: 50%; }
        .burl    { flex: 1; background: #1a1a1a; border-radius: 4px; padding: .2rem .6rem; font-size: .62rem; color: #888; display: flex; align-items: center; gap: 4px; max-width: 420px; margin: 0 auto; }

        /* ── Viewport ── */
        .vp-outer { width: 100%; overflow: hidden; }
        .vp-inner { width: 1280px; height: 720px; transform-origin: top left; position: relative; background: #F0EEE8; display: flex; flex-direction: row; }

        /* ── Nav ── */
        .site-nav        { position: absolute; top: 0; left: 0; right: 0; height: 52px; background: #fff; border-bottom: 1px solid #E5E2D8; display: flex; align-items: center; justify-content: space-between; padding: 0 2rem; z-index: 20; }
        .site-logo       { font-family: 'Raleway', sans-serif; font-weight: 800; font-size: 1.15rem; color: #111; }
        .site-nav-links  { display: flex; gap: 2rem; }
        .site-nav-links a{ font-size: .88rem; color: #777; text-decoration: none; font-weight: 500; }
        .nav-avatar      { width: 36px; height: 36px; border-radius: 50%; overflow: hidden; border: 2px solid #E5E2D8; flex-shrink: 0; }

        /* ── Atlas sidebar ── */
        .atlas-col         { width: 320px; min-width: 320px; background: #fff; border-right: 1px solid #E5E2D8; display: flex; flex-direction: column; margin-top: 52px; height: 668px; transition: width .32s cubic-bezier(.22,1,.36,1), min-width .32s; overflow: hidden; position: relative; z-index: 10; flex-shrink: 0; }
        .atlas-col.closed  { width: 0; min-width: 0; }
        .atlas-toggle      { position: absolute; top: calc(52px + 50%); left: 320px; transform: translateY(-50%); width: 18px; height: 36px; background: #fff; border: 1px solid #E5E2D8; border-left: none; border-radius: 0 6px 6px 0; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 25; transition: left .32s cubic-bezier(.22,1,.36,1); }
        .atlas-toggle.shut { left: 0; }
        .atlas-toggle svg  { width: 10px; height: 10px; color: #777; transition: transform .25s; }
        .atlas-toggle.shut svg { transform: rotate(180deg); }
        .atlas-inner       { display: flex; flex-direction: column; height: 100%; min-width: 320px; }
        .atlas-hdr         { padding: .65rem 1rem; border-bottom: 1px solid #E5E2D8; font-size: .88rem; font-weight: 600; color: #111; }

        /* ── Messages ── */
        .atlas-msgs { flex: 1; overflow-y: auto; padding: .75rem .85rem; display: flex; flex-direction: column; gap: .5rem; align-items: stretch; }
        .atlas-msgs::-webkit-scrollbar       { width: 3px; }
        .atlas-msgs::-webkit-scrollbar-thumb { background: #D0CCC0; border-radius: 3px; }
        .musr       { background: #3B82F6; color: #fff; border-radius: 10px 10px 2px 10px; padding: .5rem .7rem; font-size: .78rem; line-height: 1.5; align-self: flex-end; max-width: 82%; word-break: break-word; }
        .musr-time  { font-size: .62rem; color: rgba(255,255,255,.55); text-align: right; margin-top: 3px; }
        .mbot       { background: #fff; border: 1px solid #E5E2D8; border-radius: 2px 10px 10px 10px; padding: .5rem .7rem; font-size: .78rem; line-height: 1.55; color: #444; align-self: flex-start; max-width: 92%; word-break: break-word; }
        .mbot strong{ color: #111; font-weight: 600; }
        .tips-item        { font-size: .73rem; color: #444; line-height: 1.6; padding-left: 18px; position: relative; }
        .tips-item::before{ content: '✅'; font-size: 10px; position: absolute; left: 0; top: 2px; }
        .tips-item.warn::before { content: '⚠️'; }
        .tbub { background: #fff; border: 1px solid #E5E2D8; border-radius: 2px 10px 10px 10px; padding: .5rem .7rem; align-self: flex-start; display: flex; gap: 3px; align-items: center; }
        .td   { width: 6px; height: 6px; background: #bbb; border-radius: 50%; animation: bl 1.1s infinite; }
        .td:nth-child(2) { animation-delay: .18s; }
        .td:nth-child(3) { animation-delay: .36s; }
        @keyframes bl { 0%,60%,100%{opacity:.2;} 30%{opacity:1;} }
        .atlas-inp-row  { border-top: 1px solid #E5E2D8; padding: .55rem .6rem; display: flex; gap: .35rem; align-items: center; }
        .atlas-inp      { flex: 1; border: 1px solid #E5E2D8; border-radius: 20px; padding: .42rem .7rem; font-size: .75rem; color: #111; font-family: inherit; outline: none; background: #fff; }
        .atlas-inp-send { background: none; border: none; cursor: pointer; color: #777; padding: .15rem; display: flex; }
        .atlas-inp-send svg { width: 16px; height: 16px; }

        /* ── Main column ── */
        .main-col { flex: 1; overflow: hidden; position: relative; margin-top: 52px; height: 668px; }
        .sc       { position: absolute; top: 0; left: 0; right: 0; will-change: transform; }

        /* ── Banner ── */
        .banner         { height: 200px; position: relative; overflow: hidden; display: flex; align-items: flex-end; padding: .75rem 1.5rem; }
        .banner-img     { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center 40%; }
        .banner-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom,rgba(0,0,0,.05),rgba(0,0,0,.4)); }
        .banner-change  { position: relative; z-index: 2; background: rgba(255,255,255,.92); border: none; border-radius: 5px; padding: .22rem .6rem; font-size: .7rem; font-weight: 500; color: #111; cursor: pointer; }

        /* ── Trip header ── */
        .trip-hdr    { background: #fff; padding: 1rem 1.75rem .75rem; border-bottom: 1px solid #E5E2D8; }
        .trip-row1   { display: flex; align-items: center; justify-content: space-between; margin-bottom: .5rem; }
        .trip-name   { font-family: 'Raleway', sans-serif; font-weight: 800; font-size: 1.5rem; color: #111; }
        .trip-btns   { display: flex; gap: .5rem; }
        .tbtn        { display: flex; align-items: center; gap: 5px; padding: .4rem 1rem; border: none; border-radius: 100px; background: #F5C300; font-size: .8rem; font-weight: 600; color: #111; cursor: pointer; font-family: inherit; }
        .trip-meta   { display: flex; gap: 1.25rem; font-size: .78rem; color: #777; margin-bottom: .6rem; }
        .trip-meta span { display: flex; align-items: center; gap: 4px; }
        .trip-toolbar{ display: flex; gap: 1rem; padding-top: .5rem; border-top: 1px solid #E5E2D8; }
        .ttool       { color: #777; font-size: .85rem; cursor: pointer; }

        /* ── Days ── */
        .days      { padding: 1.25rem 1.75rem; display: flex; flex-direction: column; gap: 1.1rem; }
        .day-block { background: #fff; border: 1px solid #E5E2D8; border-radius: 14px; overflow: hidden; }
        .day-lbl   { font-family: 'Raleway', sans-serif; font-size: 1.6rem; font-weight: 800; color: #111; padding: 1.1rem 1.4rem .5rem; }

        /*
          ── Event card ──
          .ev        = outer shell, position:relative, NO flex/grid on this element.
                       The yellow accent bar is drawn via ::before so it never
                       participates in the flex layout.
          .ev-inner  = flex-column content stack — completely independent of the
                       decorative border, so tag/description/time always stack
                       cleanly under the title row.
        */
        .ev {
          position: relative;
          background: #fff;
          border: 1px solid #E5E2D8;
          border-radius: 9px;
          margin: 0 1.1rem .7rem;
          overflow: hidden;
        }
        .ev::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 3px;
          background: #F5C300;
          border-radius: 9px 0 0 9px;
        }
        .ev-inner {
          display: flex;
          flex-direction: column;
          gap: .3rem;
          padding: .75rem 1rem .75rem 1.1rem;
        }

        /* Row 1 */
        .ev-top  { display: flex; align-items: center; justify-content: space-between; gap: .5rem; width: 100%; }
        .ev-name { font-size: .92rem; font-weight: 600; color: #111; flex: 1; min-width: 0; }
        .ev-rhs  { display: flex; align-items: center; gap: 7px; flex-shrink: 0; }
        .ev-votes{ display: flex; gap: 6px; font-size: .75rem; color: #777; align-items: center; }
        .ev-vote { display: flex; align-items: center; gap: 2px; }
        .ev-vote svg { width: 12px; height: 12px; }

        /* Badge */
        .badge           { font-size: .68rem; font-weight: 700; padding: .2rem .7rem; border-radius: 100px; white-space: nowrap; }
        .badge.pending   { background: #FEF3C7; color: #92400E; }
        .badge.confirmed { background: #DCFCE7; color: #15803D; }
        .badge.idea      { background: #F3F4F6; color: #4B5563; }

        /* Row 2 — tag pill. align-self:flex-start stops it stretching full width */
        .ev-tag             { display: inline-flex; align-items: center; gap: 3px; font-size: .68rem; font-weight: 500; padding: .18rem .6rem; border-radius: 100px; width: fit-content; align-self: flex-start; }
        .ev-tag.activity    { background: #DCFCE7; color: #166534; }
        .ev-tag.reservation { background: #FCE7F3; color: #9D174D; }
        .ev-tag.food        { background: #FCE7F3; color: #9D174D; }
        .ev-tag.transit     { background: #DBEAFE; color: #1E40AF; }
        .tag-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

        /* Row 3 */
        .ev-meta { font-size: .72rem; color: #777; }

        /* Row 4 */
        .ev-timerow { font-size: .72rem; color: #999; display: flex; gap: .75rem; }

        /* Add event button */
        .add-ev { display: inline-flex; align-items: center; gap: 4px; margin: 0 1.1rem .9rem; padding: .32rem 1rem; border: 1.5px solid #F5C300; background: transparent; border-radius: 100px; font-size: .75rem; font-weight: 600; color: #C8960A; cursor: pointer; font-family: inherit; }

        /* ── Animations ── */
        .fi    { opacity: 0; transform: translateY(8px);  transition: opacity .38s cubic-bezier(.22,1,.36,1), transform .38s cubic-bezier(.22,1,.36,1); }
        .fi.in { opacity: 1; transform: translateY(0); }
        .si    { opacity: 0; transform: translateX(-8px); transition: opacity .35s cubic-bezier(.22,1,.36,1), transform .35s cubic-bezier(.22,1,.36,1); }
        .si.in { opacity: 1; transform: translateX(0); }
        .bi    { transform: scale(.6); opacity: 0; transition: transform .28s cubic-bezier(.34,1.56,.64,1), opacity .28s; }
        .bi.in { transform: scale(1);  opacity: 1; }

        /* ── Cursor ── */
        .cursor     { position: absolute; pointer-events: none; z-index: 50; transition: top .5s cubic-bezier(.22,1,.36,1), left .5s cubic-bezier(.22,1,.36,1); filter: drop-shadow(0 2px 3px rgba(0,0,0,.3)); }
        .cursor svg { width: 18px; height: 18px; }
        .cring      { position: absolute; top: 50%; left: 50%; width: 28px; height: 28px; border-radius: 50%; border: 2px solid rgba(245,195,0,.85); transform: translate(-50%,-50%) scale(0); opacity: 0; }
        .cring.pop  { animation: cr .38s ease-out forwards; }
        @keyframes cr { 0%{transform:translate(-50%,-50%) scale(0);opacity:.9;} 100%{transform:translate(-50%,-50%) scale(1.8);opacity:0;} }

        /* ── Replay ── */
        .replay-btn       { display: flex; align-items: center; gap: 5px; padding: .38rem .9rem; border-radius: 100px; border: 1.5px solid #D0CCC0; background: transparent; color: #777; font-size: .72rem; font-weight: 600; cursor: pointer; font-family: inherit; margin-top: 1rem; }
        .replay-btn:hover { border-color: #aaa; color: #444; }
      `}</style>

      <div className="demo-wrap">
        <div className="laptop">
          <div className="laptop-screen">
            <div className="browser">

              {/* Browser chrome */}
              <div className="bbar">
                <div className="bdots">
                  <div className="bdot" style={{ background: '#FF5F57' }} />
                  <div className="bdot" style={{ background: '#FFBD2E' }} />
                  <div className="bdot" style={{ background: '#28CA42' }} />
                </div>
                <div className="burl">
                  <span style={{ opacity: 0.45, fontSize: 9 }}>🔒</span>
                  travelbeebyfibi.com/itinerary/new-york-city-trip
                </div>
              </div>

              {/* Scaled viewport */}
              <div className="vp-outer" ref={vpoRef}>
                <div className="vp-inner" ref={vpiRef}>

                  {/* Nav */}
                  <div className="site-nav">
                    <div className="site-logo">TravelBee🐝</div>
                    <div className="site-nav-links">
                      <a href="#">Home</a>
                      <a href="#">Trips</a>
                      <a href="#">Explore</a>
                    </div>
                    <div className="nav-avatar">
                      <svg viewBox="0 0 36 36" width="36" height="36">
                        <rect width="36" height="36" fill="#E8D5C4"/>
                        <ellipse cx="18" cy="10" rx="11" ry="10" fill="#C4A882"/>
                        <rect x="7" y="10" width="22" height="8" fill="#C4A882"/>
                        <ellipse cx="18" cy="17" rx="8.5" ry="9.5" fill="#F2D9C8"/>
                        <rect x="7" y="12" width="4" height="14" rx="2" fill="#C4A882"/>
                        <rect x="25" y="12" width="4" height="14" rx="2" fill="#C4A882"/>
                        <ellipse cx="14.5" cy="17" rx="1.6" ry="1.1" fill="#5A3E2B"/>
                        <ellipse cx="21.5" cy="17" rx="1.6" ry="1.1" fill="#5A3E2B"/>
                        <path d="M15.5 22.5 Q18 24.2 20.5 22.5" stroke="#C08070" strokeWidth="0.9" fill="none" strokeLinecap="round"/>
                        <path d="M7 36 Q7 29 18 27 Q29 29 29 36 Z" fill="#2D4A7A"/>
                      </svg>
                    </div>
                  </div>

                  {/* Atlas panel */}
                  <div className="atlas-col" ref={apRef}>
                    <div className="atlas-inner">
                      <div className="atlas-hdr">Agent Atlas</div>
                      <div className="atlas-msgs" ref={msgsRef} />
                      <div className="atlas-inp-row">
                        <input
                          className="atlas-inp"
                          ref={inpRef}
                          placeholder="Type a message..."
                          readOnly
                        />
                        <button className="atlas-inp-send">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <line x1="22" y1="2" x2="11" y2="13"/>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Toggle */}
                  <div className="atlas-toggle" ref={togRef} onClick={toggleAtlas}>
                    <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <polyline points="6,2 3,5 6,8"/>
                    </svg>
                  </div>

                  {/* Main itinerary column */}
                  <div className="main-col">
                    <div className="sc" ref={scRef}>

                      {/* Banner */}
                      <div className="banner">
                        <Image
                          className="banner-img"
                          src="/images/clip_nyc_cover_photo.jpg"
                          alt="New York City skyline at dusk"
                          fill
                          style={{ objectFit: 'cover', objectPosition: 'center 40%' }}
                          priority
                        />
                        <div className="banner-overlay" />
                        <button className="banner-change">Change photo</button>
                      </div>

                      {/* Trip header */}
                      <div className="trip-hdr">
                        <div className="trip-row1">
                          <div className="trip-name">New York City Trip</div>
                          <div className="trip-btns">
                            <button className="tbtn">👥 Invite Friends</button>
                            <button className="tbtn">📅 Save to Calendar</button>
                          </div>
                        </div>
                        <div className="trip-meta">
                          <span>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                              <circle cx="12" cy="10" r="3"/>
                            </svg>
                            New York, NY, USA
                          </span>
                          <span>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="4" width="18" height="18" rx="2"/>
                              <line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            2026-05-10 – 2026-05-13
                          </span>
                          <span>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                              <circle cx="9" cy="7" r="4"/>
                            </svg>
                            2 traveler(s)
                          </span>
                        </div>
                        <div className="trip-toolbar">
                          <span className="ttool">☰</span>
                          <span className="ttool">⊞</span>
                        </div>
                      </div>

                      {/* Days — populated by animation */}
                      <div className="days" ref={dwRef} />
                    </div>
                  </div>

                  {/* Cursor */}
                  <div className="cursor" ref={curRef} style={{ top: 150, left: 700 }}>
                    <svg viewBox="0 0 18 18" fill="none">
                      <path d="M2 2l10 4-4 2-2 4L2 2z" fill="white" stroke="#222" strokeWidth="1.2"/>
                    </svg>
                    <div className="cring" ref={crRef} />
                  </div>

                </div>
              </div>
            </div>
          </div>
          <div className="laptop-base" />
          <div className="laptop-foot" />
        </div>

        <button className="replay-btn" onClick={run}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 .49-3"/>
          </svg>
          Replay
        </button>
      </div>
    </>
  );
}