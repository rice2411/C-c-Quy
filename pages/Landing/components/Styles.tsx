import React from "react";

const Styles: React.FC = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Allura&family=Playfair+Display:ital,wght@0,400;0,700;0,800;0,900;1,400;1,500;1,700&family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap');

    :root {
      --cq-bg: #F5EBDB;
      --cq-bg-deep: #E8D9BC;
      --cq-ink: #1A1410;
      --cq-orange: #D87E2D;
      --cq-orange-deep: #B25C16;
      --cq-gold: #C9954A;
      --cq-cream: #FAF3E6;
      --cq-sage: #6B8E5A;
      --cq-red: #9B2C2C;
    }

    .cq2-root { font-family: 'Inter', system-ui, sans-serif; color: var(--cq-ink); background: var(--cq-bg); overflow-x: hidden; }
    .cq2-root *, .cq2-root *::before, .cq2-root *::after { box-sizing: border-box; }
    .cq2-script { font-family: 'Allura', cursive; font-style: normal; font-weight: 400; }
    .cq2-script-gold { font-family: 'Allura', cursive; color: var(--cq-orange); font-style: normal; }
    .cq2-script-orange { font-family: 'Allura', cursive; color: var(--cq-orange); font-style: normal; }

    /* ============ Reveal ============ */
    .cq-reveal { opacity: 0; transition: opacity 1s cubic-bezier(.16,1,.3,1), transform 1s cubic-bezier(.16,1,.3,1), clip-path 1.2s cubic-bezier(.7,0,.3,1); }
    .cq-reveal-up { transform: translateY(50px); }
    .cq-reveal-left { transform: translateX(-60px); }
    .cq-reveal-right { transform: translateX(60px); }
    .cq-reveal-scale { transform: scale(0.92); }
    .cq-reveal-mask { clip-path: inset(0 100% 0 0); }
    .cq-reveal.is-visible { opacity: 1; transform: none; clip-path: inset(0 0 0 0); }

    /* ============ Spotlight cursor ============ */
    .cq-spotlight {
      position: fixed; top: 0; left: 0;
      width: 600px; height: 600px;
      margin: -300px 0 0 -300px;
      pointer-events: none; z-index: 5;
      background: radial-gradient(circle, rgba(216,126,45,0.18) 0%, rgba(216,126,45,0) 60%);
      mix-blend-mode: multiply;
      transition: transform 0.15s ease-out;
    }
    @media (max-width: 768px) { .cq-spotlight { display: none; } }

    /* ============ Magnetic button ============ */
    .cq-magbtn {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 1rem 2rem;
      font-weight: 700; font-size: 0.95rem;
      text-decoration: none; cursor: pointer; border: 2px solid transparent;
      border-radius: 999px; transition: transform 0.4s cubic-bezier(.2,.8,.2,1), background 0.3s, color 0.3s, border-color 0.3s;
      letter-spacing: 0.5px;
    }
    .cq-magbtn span { transition: transform 0.3s; }
    .cq-magbtn-gold { background: var(--cq-orange); color: #FFFFFF; box-shadow: 0 12px 30px rgba(216,126,45,0.4); }
    .cq-magbtn-gold:hover { background: var(--cq-ink); color: var(--cq-orange); }
    .cq-magbtn-ghost { background: transparent; color: var(--cq-ink); border-color: var(--cq-ink); }
    .cq-magbtn-ghost:hover { background: var(--cq-ink); color: var(--cq-bg); }
    .cq-magbtn-dark { background: var(--cq-ink); color: var(--cq-bg); }
    .cq-magbtn-dark:hover { background: var(--cq-orange); color: var(--cq-ink); }

    /* ============ HERO ============ */
    .cq2-hero {
      position: relative; min-height: 100vh;
      padding: 5rem 1.5rem 6rem;
      display: flex; align-items: center; justify-content: center;
      overflow: hidden;
      background: var(--cq-bg);
      --mx: 0; --my: 0;
    }
    .cq2-hero-grid {
      position: absolute; inset: 0;
      background-image:
        linear-gradient(to right, rgba(26,20,16,0.06) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(26,20,16,0.06) 1px, transparent 1px);
      background-size: 80px 80px;
      pointer-events: none;
      mask-image: radial-gradient(ellipse 90% 60% at 50% 40%, black 30%, transparent 80%);
    }
    .cq2-hero-float { position: absolute; filter: drop-shadow(0 25px 40px rgba(0,0,0,0.25)); animation: cq2Float 7s ease-in-out infinite; }
    .cq2-hero-float-1 { top: 12%; left: 6%; animation-delay: 0s; transform: translate(var(--mx), var(--my)); }
    .cq2-hero-float-2 { bottom: 18%; right: 8%; animation-delay: 1.5s; transform: translate(calc(var(--mx) * -1), calc(var(--my) * -1)); }
    .cq2-hero-float-3 { top: 22%; right: 14%; animation-delay: 3s; transform: translate(calc(var(--mx) * 0.5), calc(var(--my) * -0.5)); }
    @keyframes cq2Float {
      0%,100% { transform: translateY(0) rotate(0deg); }
      50% { transform: translateY(-30px) rotate(-6deg); }
    }

    .cq2-nav {
      position: absolute; top: 2rem; left: 2rem; right: 2rem;
      display: flex; justify-content: space-between; align-items: center;
      font-size: 0.7rem; letter-spacing: 3px; font-weight: 700;
      z-index: 6;
    }
    .cq2-nav-brand { display: inline-flex; align-items: center; gap: 0.6rem; }
    .cq2-nav-dot { width: 9px; height: 9px; border-radius: 999px; background: var(--cq-orange); animation: cq2Pulse 2s ease-in-out infinite; }
    @keyframes cq2Pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.3); } }
    .cq2-nav-links { display: flex; gap: 1.5rem; }
    .cq2-nav-links a { color: var(--cq-ink); text-decoration: none; opacity: 0.8; transition: opacity 0.2s; }
    .cq2-nav-links a:hover { opacity: 1; }
    @media (max-width: 640px) { .cq2-nav-links { display: none; } }

    .cq2-side-label {
      position: absolute; top: 50%; font-size: 0.65rem; letter-spacing: 6px; font-weight: 600;
      color: var(--cq-ink); opacity: 0.55;
      writing-mode: vertical-rl; transform-origin: center;
    }
    .cq2-side-label-left { left: 1.2rem; transform: translateY(-50%) rotate(180deg); }
    .cq2-side-label-right { right: 1.2rem; transform: translateY(-50%); }
    @media (max-width: 768px) { .cq2-side-label { display: none; } }

    .cq2-hero-inner { position: relative; z-index: 4; max-width: 1200px; width: 100%; }
    .cq2-hero-eyebrow {
      display: flex; align-items: center; gap: 1rem;
      font-size: 0.75rem; letter-spacing: 4px; font-weight: 700; text-transform: uppercase;
      margin-bottom: 2rem; color: var(--cq-ink); opacity: 0.7;
    }
    .cq2-line { display: inline-block; width: 60px; height: 1px; background: var(--cq-ink); opacity: 0.4; }

    .cq2-hero-headline {
      font-family: 'Playfair Display', serif;
      font-size: clamp(4.5rem, 14vw, 12rem);
      line-height: 0.88;
      font-weight: 900;
      margin: 0;
      color: var(--cq-ink);
      letter-spacing: -0.03em;
    }
    .cq2-h-row { display: flex; align-items: baseline; gap: 0.3em; flex-wrap: wrap; }
    .cq2-h-row-2 { justify-content: flex-end; margin-top: -0.05em; }
    .cq2-h-word { display: inline-block; }
    .cq2-h-word-outline {
      -webkit-text-stroke: 2px var(--cq-ink);
      color: transparent;
      font-style: italic;
    }
    .cq2-hero-headline .cq2-script {
      font-size: 1.1em; line-height: 1;
      color: var(--cq-orange);
      font-weight: 400;
      transform: translateY(0.1em);
    }
    .cq2-blob {
      display: inline-block; width: 0.5em; height: 0.5em;
      background: var(--cq-orange); border-radius: 999px;
      transform: translateY(-0.15em);
      animation: cq2Pulse 2.5s ease-in-out infinite;
    }

    .cq2-hero-foot {
      margin-top: 4rem;
      display: grid; grid-template-columns: 1fr; gap: 2rem;
      align-items: end;
    }
    @media (min-width: 900px) { .cq2-hero-foot { grid-template-columns: 1fr auto; } }
    .cq2-hero-claim {
      font-family: 'Playfair Display', serif;
      font-size: 1.15rem; line-height: 1.6;
      max-width: 480px; margin: 0; color: var(--cq-ink); opacity: 0.85;
    }
    .cq2-hero-claim em { font-style: italic; color: var(--cq-orange); }
    .cq2-hero-cta { display: flex; gap: 0.75rem; flex-wrap: wrap; }

    /* ============ STATS ============ */
    .cq2-stats {
      background: var(--cq-ink); color: var(--cq-bg);
      padding: 5rem 1.5rem;
    }
    .cq2-stats-grid { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr; gap: 3rem; text-align: center; }
    @media (min-width: 768px) { .cq2-stats-grid { grid-template-columns: repeat(3, 1fr); } }
    .cq2-stat-num {
      font-family: 'Playfair Display', serif;
      font-size: clamp(3.5rem, 8vw, 6rem);
      font-weight: 800;
      color: var(--cq-orange);
      line-height: 1;
      font-style: italic;
    }
    .cq2-stat-label {
      font-size: 0.85rem; letter-spacing: 4px; text-transform: uppercase; font-weight: 600;
      opacity: 0.75; margin-top: 0.75rem;
    }

    /* ============ Section label (rotated vertical num) ============ */
    .cq2-section-label {
      display: inline-flex; align-items: center; gap: 1rem;
      font-size: 0.7rem; letter-spacing: 5px; text-transform: uppercase; font-weight: 700;
      color: var(--cq-ink); opacity: 0.65;
    }
    .cq2-section-label-dark { color: var(--cq-bg); opacity: 0.7; }
    .cq2-section-num {
      display: inline-flex; align-items: center; justify-content: center;
      width: 38px; height: 38px;
      border-radius: 999px; border: 1.5px solid currentColor;
      font-family: 'Playfair Display', serif; font-size: 0.95rem; font-style: italic; font-weight: 700;
      letter-spacing: 0;
    }
    .cq2-h-big {
      font-family: 'Playfair Display', serif;
      font-size: clamp(2.5rem, 6vw, 5rem); font-weight: 800;
      line-height: 1.05; letter-spacing: -0.02em;
      margin: 1.5rem 0; color: var(--cq-ink);
    }
    .cq2-h-dark { color: var(--cq-bg); }
    .cq2-h-big .cq2-script-gold, .cq2-h-big .cq2-script-orange { font-size: 1.2em; }

    /* ============ STORY ============ */
    .cq2-story { padding: 7rem 1.5rem; }
    .cq2-story-inner { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr; gap: 2.5rem; }
    @media (min-width: 900px) { .cq2-story-inner { grid-template-columns: 280px 1fr; gap: 5rem; } }
    .cq2-story-text {
      font-family: 'Playfair Display', serif; font-size: 1.15rem; line-height: 1.8;
      max-width: 660px; margin: 1.5rem 0; color: var(--cq-ink); opacity: 0.82;
    }
    .cq2-pill-row { display: flex; flex-wrap: wrap; gap: 0.6rem; margin-top: 1.5rem; }
    .cq2-pill {
      display: inline-flex; align-items: center; gap: 0.5rem;
      padding: 0.6rem 1.1rem; border-radius: 999px;
      background: var(--cq-cream); border: 1px solid rgba(26,20,16,0.1);
      font-size: 0.85rem; font-weight: 600;
      transition: transform 0.3s, background 0.3s;
    }
    .cq2-pill:hover { background: var(--cq-orange); color: #FFFFFF; transform: translateY(-3px); }

    /* ============ BENTO ============ */
    .cq2-bento-section { padding: 6rem 1.5rem; background: var(--cq-cream); }
    .cq2-bento-head { max-width: 1300px; margin: 0 auto 3rem; }
    .cq2-bento {
      max-width: 1300px; margin: 0 auto;
      display: grid; gap: 1.25rem;
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: auto;
    }
    @media (min-width: 768px) { .cq2-bento { grid-template-columns: repeat(4, 1fr); } }
    @media (min-width: 1100px) { .cq2-bento { grid-template-columns: repeat(6, 1fr); } }

    /* ============ BENTO CARDS — Bakery vibe ============ */
    .cq2-bento-cell {
      position: relative; border-radius: 28px; overflow: hidden;
      background: #FFFFFF;
      transition: transform 0.5s cubic-bezier(.2,.8,.2,1), box-shadow 0.5s, rotate 0.5s;
      will-change: transform;
      min-height: 200px;
      box-shadow: 0 8px 20px rgba(74,42,18,0.06);
    }
    /* Paper texture overlay */
    .cq2-bento-cell::before {
      content: ''; position: absolute; inset: 0; z-index: 2; pointer-events: none;
      background-image: radial-gradient(rgba(74,42,18,0.04) 1px, transparent 1px);
      background-size: 3px 3px;
      opacity: 0.6;
      mix-blend-mode: multiply;
    }
    .cq2-bento-cell:hover { transform: translateY(-8px) rotate(-0.5deg); box-shadow: 0 30px 60px rgba(74,42,18,0.15); }

    .cq2-cell-bg { position: absolute; inset: 0; z-index: 0; }

    /* Butter cream — Cookies Lạnh hero */
    .cq2-cell-bg-orange {
      background:
        radial-gradient(ellipse at 20% 20%, #F5D9A8 0%, transparent 50%),
        radial-gradient(ellipse at 80% 80%, #E8B872 0%, transparent 50%),
        linear-gradient(135deg, #F0C88A 0%, #D9A55C 100%);
    }

    /* Warm milk chocolate — Combo card */
    .cq2-cell-bg-dark {
      background:
        radial-gradient(ellipse at 30% 30%, #5C3F26 0%, transparent 55%),
        linear-gradient(135deg, #4A2F1A 0%, #2D1A0C 100%);
    }
    /* Sprinkle dots */
    .cq2-cell-bg-dark::after {
      content: ''; position: absolute; inset: 0;
      background-image:
        radial-gradient(circle at 15% 25%, #E8B872 1.5px, transparent 1.5px),
        radial-gradient(circle at 75% 60%, #D9A55C 2px, transparent 2px),
        radial-gradient(circle at 40% 80%, #F5D9A8 1.5px, transparent 1.5px),
        radial-gradient(circle at 85% 20%, #E5B989 1px, transparent 1px);
      background-size: 200px 200px;
      opacity: 0.4;
    }

    /* Warm caramel — Brownies */
    .cq2-cell-bg-choco {
      background:
        radial-gradient(ellipse at 25% 30%, #8B5A3C 0%, transparent 55%),
        linear-gradient(135deg, #6B4A2C 0%, #3D2818 100%);
    }
    .cq2-cell-bg-choco::after {
      content: ''; position: absolute; inset: 0;
      background-image:
        radial-gradient(circle at 30% 40%, #D9A55C 2px, transparent 2px),
        radial-gradient(circle at 70% 70%, #F5D9A8 1.5px, transparent 1.5px);
      background-size: 180px 180px;
      opacity: 0.35;
    }

    .cq2-cell-content { position: relative; z-index: 3; padding: 1.75rem 1.75rem 2rem; height: 100%; display: flex; flex-direction: column; }
    @media (min-width: 768px) { .cq2-cell-content { padding: 2.25rem 2rem; } }

    /* Tag — kiểu nhãn dán giấy kraft */
    .cq2-cell-tag {
      display: inline-flex; align-items: center;
      padding: 0.4rem 1rem; border-radius: 999px;
      background: rgba(255,255,255,0.7); color: #5C3F26;
      font-size: 0.65rem; letter-spacing: 2.5px; font-weight: 800; text-transform: uppercase;
      width: fit-content; margin-bottom: 1.25rem;
      border: 1.5px dashed rgba(92,63,38,0.35);
      backdrop-filter: blur(8px);
    }
    .cq2-tag-light {
      background: rgba(255,255,255,0.12); color: #FFE9CC;
      border-color: rgba(255,233,204,0.3);
    }

    .cq2-cell-title {
      font-family: 'Playfair Display', serif; font-size: 2rem; font-weight: 800;
      line-height: 1.05; margin: 0 0 0.6rem;
      color: #3D2818;
    }
    .cq2-title-light { color: #FFE9CC; }

    .cq2-cell-text {
      font-size: 0.95rem;
      color: rgba(61,40,24,0.78);
      margin: 0; font-style: italic; font-family: 'Playfair Display', serif;
    }
    .cq2-title-light + .cq2-cell-text { color: rgba(255,233,204,0.82); }

    .cq2-cell-price {
      display: flex; align-items: baseline; gap: 0.5rem;
      margin-top: 1rem;
      color: #3D2818;
      font-family: 'Playfair Display', serif;
    }
    .cq2-cell-price span {
      font-size: 3.5rem; font-weight: 900;
      font-style: italic;
      text-shadow: 2px 2px 0 rgba(255,255,255,0.25);
    }
    .cq2-cell-price small {
      font-size: 0.95rem; opacity: 0.7;
      font-family: 'Allura', cursive; font-style: normal;
      font-size: 1.4rem; transform: rotate(-8deg) translateY(-4px); display: inline-block;
    }

    /* Hero cell — span 4 cols x 2 rows */
    .cq2-bento-cell-hero {
      grid-column: span 2;
      min-height: 380px;
      color: #FFFFFF;
    }
    @media (min-width: 768px) { .cq2-bento-cell-hero { grid-column: span 4; grid-row: span 2; min-height: 420px; } }
    @media (min-width: 1100px) { .cq2-bento-cell-hero { grid-column: span 4; grid-row: span 2; min-height: 480px; } }
    .cq2-cell-cookies { position: absolute; bottom: -20px; right: -20px; width: 320px; height: 280px; pointer-events: none; }
    .cq2-fc { position: absolute; filter: drop-shadow(0 15px 25px rgba(0,0,0,0.3)); animation: cq2Float 6s ease-in-out infinite; }
    .cq2-fc-1 { bottom: 30px; right: 30px; animation-delay: 0s; }
    .cq2-fc-2 { bottom: 90px; right: 130px; animation-delay: 1s; }
    .cq2-fc-3 { bottom: 0; right: 150px; animation-delay: 2s; }
    .cq2-fc-4 { bottom: 130px; right: 50px; animation-delay: 3s; }

    .cq2-bento-cell-combo { grid-column: span 2; min-height: 320px; }
    @media (min-width: 1100px) { .cq2-bento-cell-combo { grid-column: span 2; grid-row: span 2; } }
    .cq2-combo-list { list-style: none; padding: 0; margin: auto 0 0; }
    .cq2-combo-list li {
      display: flex; justify-content: space-between; align-items: baseline;
      padding: 0.8rem 0;
      border-bottom: 1.5px dashed rgba(255,255,255,0.2);
    }
    .cq2-combo-list li:last-child { border-bottom: none; }
    .cq2-combo-list li span {
      font-size: 0.9rem; color: rgba(255,233,204,0.85);
      font-family: 'Playfair Display', serif; font-style: italic;
    }
    .cq2-combo-list li strong {
      font-family: 'Playfair Display', serif; font-style: italic;
      font-size: 1.75rem; font-weight: 900; color: #FFE9CC;
      text-shadow: 1px 1px 0 rgba(0,0,0,0.2);
    }
    .cq2-combo-hot strong { color: #FFD494 !important; }
    .cq2-combo-light li { border-color: rgba(255,233,204,0.22); }

    .cq2-bento-mini { padding: 1.25rem; text-align: center; min-height: 200px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    /* Mini cards — soft bakery pastels with subtle blob backdrop */
    .cq2-tone-a {
      background:
        radial-gradient(circle at 70% 30%, rgba(255,255,255,0.6) 0%, transparent 50%),
        linear-gradient(160deg, #FCE6BE 0%, #E8C285 100%);
    }
    .cq2-tone-b {
      background:
        radial-gradient(circle at 30% 30%, rgba(255,255,255,0.5) 0%, transparent 50%),
        linear-gradient(160deg, #E8D5B3 0%, #C9A877 100%);
    }
    .cq2-tone-c {
      background:
        radial-gradient(circle at 70% 70%, rgba(255,255,255,0.5) 0%, transparent 50%),
        linear-gradient(160deg, #D6E2BD 0%, #A8C18A 100%);
    }
    .cq2-tone-d {
      background:
        radial-gradient(circle at 30% 70%, rgba(255,255,255,0.55) 0%, transparent 50%),
        linear-gradient(160deg, #EFC5C5 0%, #D49494 100%);
    }
    /* Mini card sticker hover effect */
    .cq2-bento-mini { transition: transform 0.5s cubic-bezier(.2,.8,.2,1), box-shadow 0.5s, rotate 0.5s; }
    .cq2-bento-mini:hover { transform: translateY(-8px) rotate(1.5deg); }
    .cq2-mini-img { filter: drop-shadow(0 12px 24px rgba(74,42,18,0.25)); }
    .cq2-mini-name {
      font-size: 0.7rem; letter-spacing: 2px; font-weight: 800;
      text-transform: uppercase; margin-top: 1rem;
      color: #3D2818; opacity: 0.85;
    }
    .cq2-mini-price {
      font-family: 'Playfair Display', serif; font-style: italic;
      font-size: 2rem; font-weight: 900;
      color: #3D2818; margin-top: 0.4rem;
      text-shadow: 1.5px 1.5px 0 rgba(255,255,255,0.4);
    }
    /* Optional dashed price-tag border around mini */
    .cq2-bento-mini::after {
      content: ''; position: absolute; inset: 8px; border-radius: 20px;
      border: 1.5px dashed rgba(61,40,24,0.18);
      pointer-events: none; z-index: 1;
    }

    .cq2-bento-brownie { grid-column: span 2; min-height: 280px; }
    @media (min-width: 1100px) { .cq2-bento-brownie { grid-column: span 3; } }

    .cq2-bento-jars {
      grid-column: span 2; min-height: 280px;
      background:
        radial-gradient(circle at 80% 20%, rgba(168,193,138,0.25) 0%, transparent 50%),
        radial-gradient(circle at 20% 80%, rgba(216,164,90,0.2) 0%, transparent 50%),
        linear-gradient(160deg, #F5EBDB 0%, #E5D5BB 100%);
    }
    @media (min-width: 1100px) { .cq2-bento-jars { grid-column: span 3; } }
    .cq2-jar-row { display: flex; gap: 1.5rem; align-items: flex-end; justify-content: center; margin-top: auto; padding-top: 1.5rem; flex-wrap: wrap; }
    .cq2-jar { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
    .cq2-jar-cap { width: 60px; height: 14px; background: linear-gradient(180deg, #6B8E5A 0%, #4F6E42 100%); border-radius: 4px 4px 0 0; box-shadow: 0 2px 5px rgba(0,0,0,0.15); }
    .cq2-jar-body { width: 70px; height: 95px; background: linear-gradient(135deg, #C9954A 0%, #A37734 100%); border-radius: 0 0 14px 14px; display: flex; align-items: center; justify-content: center; box-shadow: inset 0 6px 15px rgba(0,0,0,0.2), 0 8px 20px rgba(0,0,0,0.1); }
    .cq2-jar-body span { background: #FFFFFF; padding: 0.3rem 0.6rem; border-radius: 4px; font-size: 0.6rem; font-weight: 700; color: #4F6E42; }
    .cq2-jar-big .cq2-jar-cap { width: 72px; height: 16px; }
    .cq2-jar-big .cq2-jar-body { width: 85px; height: 115px; }
    .cq2-jar-price { font-family: 'Playfair Display', serif; font-size: 1.4rem; font-weight: 800; color: var(--cq-orange); }

    /* ============ MARQUEE ============ */
    .cq-marquee { padding: 1.5rem 0; overflow: hidden; border-top: 1px solid rgba(0,0,0,0.05); border-bottom: 1px solid rgba(0,0,0,0.05); }
    .cq-marquee-track { display: flex; gap: 3rem; white-space: nowrap; animation: cq2Marquee 35s linear infinite; }
    .cq-marquee-reverse { animation-direction: reverse; }
    @keyframes cq2Marquee { from { transform: translateX(0); } to { transform: translateX(-33.33%); } }
    .cq-marquee-item { display: inline-flex; align-items: center; gap: 3rem; }
    .cq-marquee-text { font-family: 'Playfair Display', serif; font-style: italic; font-weight: 700; font-size: 2.5rem; letter-spacing: -0.01em; }
    .cq-marquee-star { font-size: 2rem; opacity: 0.7; }

    /* ============ GIFTS ============ */
    .cq2-gifts {
      background: var(--cq-ink); color: var(--cq-bg);
      padding: 7rem 1.5rem; position: relative; overflow: hidden;
    }
    .cq2-gifts::before {
      content: ''; position: absolute; inset: 0;
      background-image:
        radial-gradient(circle at 20% 30%, rgba(216,126,45,0.15) 0%, transparent 40%),
        radial-gradient(circle at 80% 70%, rgba(155,44,44,0.12) 0%, transparent 40%);
      pointer-events: none;
    }
    .cq2-gifts-head { max-width: 1300px; margin: 0 auto 4rem; position: relative; z-index: 1; }
    .cq2-gifts-sub { font-family: 'Playfair Display', serif; font-style: italic; font-size: 1.1rem; opacity: 0.8; margin: 0; }
    .cq2-gifts-rail {
      max-width: 1300px; margin: 0 auto;
      display: grid; grid-template-columns: 1fr; gap: 1.5rem; position: relative; z-index: 1;
    }
    @media (min-width: 640px) { .cq2-gifts-rail { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 1024px) { .cq2-gifts-rail { grid-template-columns: repeat(3, 1fr); } }
    @media (min-width: 1280px) { .cq2-gifts-rail { grid-template-columns: repeat(5, 1fr); } }

    .cq2-gift {
      position: relative;
      padding: 1.5rem 1.5rem 4rem;
      border-radius: 20px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      transition: transform 0.5s, background 0.4s;
      cursor: pointer;
    }
    .cq2-gift:hover { transform: translateY(-8px); background: rgba(255,255,255,0.08); }
    .cq2-gift-num { position: absolute; top: 1rem; right: 1.25rem; font-family: 'Playfair Display', serif; font-style: italic; font-weight: 700; font-size: 1.1rem; opacity: 0.4; }
    .cq2-gift-img {
      position: relative; aspect-ratio: 1/1; width: 100%; border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 1.25rem; overflow: hidden;
      box-shadow: inset 0 0 60px rgba(0,0,0,0.3);
    }
    .cq2-gift-emoji { font-size: 4rem; filter: drop-shadow(0 8px 15px rgba(0,0,0,0.4)); transition: transform 0.5s; }
    .cq2-gift:hover .cq2-gift-emoji { transform: scale(1.15) rotate(-5deg); }
    .cq2-gift-tag {
      position: absolute; top: 0.8rem; left: 0.8rem;
      background: rgba(255,255,255,0.95); padding: 0.25rem 0.6rem; border-radius: 4px;
      font-size: 0.6rem; letter-spacing: 2px; font-weight: 800;
    }
    .cq2-gift-name { font-family: 'Playfair Display', serif; font-size: 1.3rem; font-weight: 800; margin: 0 0 0.5rem; }
    .cq2-gift-desc { font-size: 0.85rem; line-height: 1.6; opacity: 0.7; margin: 0; }
    .cq2-gift-arrow { position: absolute; bottom: 1.25rem; right: 1.5rem; font-size: 1.5rem; transition: transform 0.3s; }
    .cq2-gift:hover .cq2-gift-arrow { transform: translateX(6px); }

    /* ============ CTA ============ */
    .cq2-cta {
      padding: 8rem 1.5rem; position: relative;
      background: linear-gradient(135deg, #FAF3E6 0%, #F5EBDB 100%); overflow: hidden;
    }
    .cq2-cta-grid {
      position: absolute; inset: 0;
      background-image:
        linear-gradient(to right, rgba(26,20,16,0.04) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(26,20,16,0.04) 1px, transparent 1px);
      background-size: 60px 60px;
      pointer-events: none;
    }
    .cq2-cta-inner { max-width: 900px; margin: 0 auto; text-align: center; position: relative; z-index: 1; }
    .cq2-cta-kicker { font-size: 0.7rem; letter-spacing: 6px; text-transform: uppercase; font-weight: 700; opacity: 0.65; margin: 0 0 1.5rem; }
    .cq2-cta-head {
      font-family: 'Playfair Display', serif;
      font-size: clamp(2.5rem, 7vw, 5.5rem);
      font-weight: 800; line-height: 1.05; letter-spacing: -0.02em;
      margin: 0 0 1.5rem; color: var(--cq-ink);
    }
    .cq2-cta-head .cq2-script-gold { font-size: 1.3em; }
    .cq2-cta-sub { font-family: 'Playfair Display', serif; font-style: italic; font-size: 1.15rem; opacity: 0.75; margin: 0 auto 3rem; max-width: 540px; line-height: 1.7; }
    .cq2-cta-row { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }

    /* ============ FOOTER ============ */
    .cq2-footer { background: var(--cq-ink); color: var(--cq-bg); padding: 5rem 1.5rem 2rem; }
    .cq2-footer-top { max-width: 1300px; margin: 0 auto 3rem; display: grid; grid-template-columns: 1fr; gap: 3rem; padding-bottom: 3rem; border-bottom: 1px solid rgba(255,255,255,0.08); }
    @media (min-width: 768px) { .cq2-footer-top { grid-template-columns: 1fr 1.5fr; } }
    .cq2-footer-brand { display: flex; flex-direction: column; gap: 0.5rem; }
    .cq2-footer-logo { font-family: 'Allura', cursive; font-size: 4.5rem; line-height: 1; color: var(--cq-orange); }
    .cq2-footer-mark { font-size: 0.7rem; letter-spacing: 4px; opacity: 0.6; }
    .cq2-footer-meta { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.5rem; }
    @media (max-width: 480px) { .cq2-footer-meta { grid-template-columns: 1fr 1fr; } }
    .cq2-footer-meta > div { display: flex; flex-direction: column; gap: 0.4rem; }
    .cq2-footer-h { font-size: 0.7rem; letter-spacing: 3px; text-transform: uppercase; opacity: 0.6; margin-bottom: 0.4rem; font-weight: 700; }
    .cq2-footer-meta a, .cq2-footer-meta span { font-size: 0.9rem; color: rgba(245,235,219,0.85); text-decoration: none; transition: color 0.2s; }
    .cq2-footer-meta a:hover { color: var(--cq-orange); }
    .cq2-footer-bot { max-width: 1300px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; opacity: 0.55; flex-wrap: wrap; gap: 1rem; }
    .cq2-footer-bot a { color: inherit; text-decoration: none; }
    .cq2-footer-bot a:hover { color: var(--cq-orange); opacity: 1; }


    /* ============ PHOTO COOKIES ============ */
    .cq2-photo-cookie {
      display: block;
      object-fit: cover;
      border-radius: 50%;
      filter: drop-shadow(0 15px 25px rgba(0,0,0,0.3)) drop-shadow(0 5px 10px rgba(0,0,0,0.15));
      transition: transform 0.4s cubic-bezier(.2,.8,.2,1);
    }
    .cq2-photo-cookie:hover { transform: scale(1.05) rotate(-3deg); }





    /* ============ Product emoji fallback (no image) ============ */
    .cq2-product-emoji {
      font-size: clamp(8rem, 18vw, 14rem);
      filter: drop-shadow(0 25px 40px rgba(0,0,0,0.4));
      transition: transform 0.8s cubic-bezier(.2,.8,.2,1);
      transform: scale(0.85);
      display: inline-block;
    }
    .cq2-product.is-visible .cq2-product-emoji { transform: scale(1) rotate(-3deg); }
    .cq2-product-img:hover .cq2-product-emoji { transform: scale(1.1) rotate(5deg); }

    /* Combo tags variant inline in scroll rows */
    .cq2-combo-tags-inline { margin-top: 0; }
    .cq2-product.is-reverse .cq2-combo-tags-inline { margin-left: auto; }

    /* Gift showcase — atmospheric bg with depth */
    .cq2-gift-showcase {
      background:
        radial-gradient(ellipse 70% 40% at 30% 10%, rgba(212,165,116,0.12) 0%, transparent 60%),
        radial-gradient(ellipse 70% 40% at 70% 90%, rgba(232,164,164,0.1) 0%, transparent 60%),
        linear-gradient(180deg, var(--cq-bg) 0%, var(--cq-bg-deep) 50%, var(--cq-bg) 100%);
      padding: 6rem 1.5rem 4rem;
      position: relative; overflow: hidden;
    }
    .cq2-gift-showcase::before {
      content: ''; position: absolute; inset: 0;
      background-image: radial-gradient(rgba(74,42,18,0.04) 1px, transparent 1px);
      background-size: 4px 4px;
      pointer-events: none; opacity: 0.5;
      mix-blend-mode: multiply;
    }

    /* ============ Traditional gallery row (4 warm cookies) ============ */
    .cq2-product-gallery { grid-template-columns: 1fr; gap: 3rem; }
    @media (min-width: 900px) { .cq2-product-gallery { grid-template-columns: 1.2fr 1fr; gap: 5rem; } }

    .cq2-trad-images {
      position: relative;
      aspect-ratio: 1/1;
      border-radius: 32px;
      overflow: hidden;
      min-height: 360px;
      box-shadow: 0 30px 80px rgba(74,42,18,0.25);
    }
    .cq2-trad-bg {
      position: absolute; inset: 0;
      background:
        radial-gradient(circle at 30% 30%, #F0C88A 0%, transparent 50%),
        radial-gradient(circle at 70% 70%, #D9A55C 0%, transparent 50%),
        linear-gradient(135deg, #E8B872 0%, #C9954A 100%);
    }
    .cq2-trad-bg::after {
      content: ''; position: absolute; inset: 0;
      background-image: radial-gradient(rgba(74,42,18,0.06) 1.5px, transparent 1.5px);
      background-size: 24px 24px;
    }

    .cq2-trad-cookie {
      position: absolute;
      display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
      filter: drop-shadow(0 25px 40px rgba(0,0,0,0.3));
      opacity: 0; transform: scale(0.5) rotate(-15deg);
      transition: opacity 1.2s cubic-bezier(.16,1,.3,1), transform 1.2s cubic-bezier(.16,1,.3,1);
    }
    .cq2-product-gallery.is-visible .cq2-trad-cookie { opacity: 1; transform: scale(1) rotate(0deg); }
    .cq2-product-gallery.is-visible .cq2-trad-cookie-1 { transition-delay: 0.2s; }
    .cq2-product-gallery.is-visible .cq2-trad-cookie-2 { transition-delay: 0.4s; }
    .cq2-product-gallery.is-visible .cq2-trad-cookie-3 { transition-delay: 0.6s; }
    .cq2-product-gallery.is-visible .cq2-trad-cookie-4 { transition-delay: 0.8s; }

    .cq2-trad-cookie-1 { top: 12%; left: 10%; }
    .cq2-trad-cookie-2 { top: 18%; right: 10%; }
    .cq2-trad-cookie-3 { bottom: 16%; left: 14%; }
    .cq2-trad-cookie-4 { bottom: 10%; right: 12%; }

    .cq2-trad-name {
      background: rgba(255,255,255,0.95);
      padding: 0.25rem 0.7rem;
      border-radius: 999px;
      font-size: 0.65rem; letter-spacing: 1.5px; font-weight: 800;
      text-transform: uppercase;
      color: #3D2818;
      border: 1px dashed rgba(61,40,24,0.25);
    }

    /* Combo tags */
    .cq2-combo-tags {
      display: flex; flex-direction: column; gap: 0.75rem;
      max-width: 480px;
    }
    .cq2-combo-tag {
      display: flex; justify-content: space-between; align-items: baseline;
      padding: 0.75rem 1.25rem;
      background: rgba(255,255,255,0.7);
      border: 1.5px dashed rgba(61,40,24,0.2);
      border-radius: 14px;
      transition: transform 0.3s, background 0.3s;
    }
    .cq2-combo-tag:hover { transform: translateX(4px); background: #FFFFFF; }
    .cq2-combo-tag span {
      font-family: 'Playfair Display', serif; font-style: italic;
      font-size: 0.95rem; color: rgba(61,40,24,0.85);
    }
    .cq2-combo-tag strong {
      font-family: 'Playfair Display', serif; font-style: italic;
      font-size: 1.6rem; font-weight: 900;
      color: var(--cq-orange);
    }
    .cq2-combo-tag-hot {
      background: var(--cq-orange);
      border-color: var(--cq-orange-deep);
    }
    .cq2-combo-tag-hot span { color: rgba(255,255,255,0.9); }
    .cq2-combo-tag-hot strong { color: #FFFFFF; }

    /* ============ PRODUCT SHOWCASE — 3D Floating ============ */
    .cq2-showcase {
      background:
        radial-gradient(ellipse 80% 50% at 50% 0%, rgba(216,126,45,0.08) 0%, transparent 60%),
        radial-gradient(ellipse 80% 50% at 50% 100%, rgba(107,142,90,0.06) 0%, transparent 60%),
        linear-gradient(180deg, var(--cq-cream) 0%, var(--cq-bg) 50%, var(--cq-cream) 100%);
      padding: 6rem 1.5rem 4rem;
      position: relative; overflow: hidden;
    }
    /* Subtle grain texture on whole section */
    .cq2-showcase::before {
      content: ''; position: absolute; inset: 0;
      background-image: radial-gradient(rgba(74,42,18,0.04) 1px, transparent 1px);
      background-size: 4px 4px;
      pointer-events: none; opacity: 0.5;
      mix-blend-mode: multiply;
    }
    .cq2-showcase-head { max-width: 1200px; margin: 0 auto 8rem; position: relative; z-index: 2; }
    .cq2-showcase-lead {
      font-family: 'Playfair Display', serif; font-style: italic;
      font-size: 1.1rem; opacity: 0.7; margin: 1rem 0 0;
      max-width: 540px;
    }
    .cq2-products {
      max-width: 1400px; margin: 0 auto;
      display: flex; flex-direction: column;
      gap: 8rem; position: relative; z-index: 1;
    }
    @media (min-width: 768px) { .cq2-products { gap: 14rem; } }

    .cq2-product {
      display: grid; grid-template-columns: 1fr; gap: 2rem;
      align-items: center;
      position: relative;
      opacity: 0;
      transform: translateY(80px);
      transition:
        opacity 1.4s cubic-bezier(.16,1,.3,1),
        transform 1.4s cubic-bezier(.16,1,.3,1);
      perspective: 1600px;
    }
    .cq2-product.is-visible { opacity: 1; transform: translateY(0); }
    @media (min-width: 900px) { .cq2-product { grid-template-columns: 1fr 1fr; gap: 4rem; } }

    /* Reversed layout — alternate sides on desktop */
    @media (min-width: 900px) {
      .cq2-product.is-reverse .cq2-product-stage { order: 2; }
      .cq2-product.is-reverse .cq2-product-text { order: 1; text-align: right; }
      .cq2-product.is-reverse .cq2-product-tag { flex-direction: row-reverse; }
      .cq2-product.is-reverse .cq2-product-price-row { flex-direction: row-reverse; }
    }

    /* Background floating product number */
    .cq2-product-num {
      position: absolute;
      font-family: 'Playfair Display', serif; font-style: italic; font-weight: 900;
      font-size: clamp(10rem, 30vw, 24rem);
      color: var(--cq-ink);
      opacity: 0.035;
      line-height: 0.8;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none; user-select: none;
      z-index: 0;
    }

    /* ===== Stage (no card!) — just positioning + 3D perspective context ===== */
    .cq2-product-stage {
      position: relative;
      aspect-ratio: 1/1;
      display: flex; align-items: center; justify-content: center;
      will-change: transform;
      transform-style: preserve-3d;
      min-height: 320px;
    }

    /* Soft color blob that bleeds into background — gives 3D depth */
    .cq2-product-blob {
      position: absolute; inset: -15%;
      background:
        radial-gradient(circle at 50% 50%, var(--blob, #D87E2D) 0%, transparent 60%);
      filter: blur(50px);
      opacity: 0.45;
      z-index: 0;
      pointer-events: none;
      transform: translateZ(-100px) scale(0.9);
      transition: opacity 0.8s ease, transform 0.8s ease;
    }
    .cq2-product.is-visible .cq2-product-blob {
      opacity: 0.55;
      transform: translateZ(-100px) scale(1);
    }

    /* Secondary smaller glow underneath product for "floating shadow" feel */
    .cq2-product-stage::after {
      content: '';
      position: absolute;
      bottom: 8%; left: 20%; right: 20%;
      height: 30px;
      background: radial-gradient(ellipse, rgba(0,0,0,0.35) 0%, transparent 70%);
      filter: blur(15px);
      z-index: 0;
      pointer-events: none;
    }

    /* 3D container that rotates with scroll */
    .cq2-product-3d {
      position: relative;
      z-index: 1;
      display: flex; align-items: center; justify-content: center;
      transform-style: preserve-3d;
      will-change: transform;
      transition: transform 0.15s linear;
    }

    /* Product photo — no box, pure floating */
    .cq2-product-photo {
      width: 100%; max-width: 480px;
      height: auto; object-fit: contain;
      filter:
        drop-shadow(0 60px 50px rgba(0,0,0,0.35))
        drop-shadow(0 30px 25px rgba(0,0,0,0.2))
        drop-shadow(0 10px 15px rgba(0,0,0,0.15));
      transition: transform 0.9s cubic-bezier(.2,.8,.2,1);
      transform: scale(0.7) rotate(-8deg);
      pointer-events: auto;
    }
    .cq2-product.is-visible .cq2-product-photo {
      transform: scale(1) rotate(0deg);
    }
    .cq2-product-3d:hover .cq2-product-photo {
      transform: scale(1.08) rotate(4deg);
    }

    /* Emoji fallback (no image) */
    .cq2-product-emoji {
      font-size: clamp(8rem, 20vw, 16rem);
      filter:
        drop-shadow(0 50px 40px rgba(0,0,0,0.35))
        drop-shadow(0 20px 20px rgba(0,0,0,0.2));
      transition: transform 0.9s cubic-bezier(.2,.8,.2,1);
      transform: scale(0.7) rotate(-8deg);
      display: inline-block;
    }
    .cq2-product.is-visible .cq2-product-emoji { transform: scale(1) rotate(0deg); }
    .cq2-product-3d:hover .cq2-product-emoji { transform: scale(1.1) rotate(6deg); }

    /* Brand stamp — float in space, no card backing */
    .cq2-product-stamp {
      position: absolute;
      top: 8%; right: 8%;
      background: rgba(255,255,255,0.85);
      padding: 0.4rem 1rem;
      border-radius: 999px;
      font-family: 'Allura', cursive;
      font-size: 1.2rem;
      border: 1.5px dashed currentColor;
      backdrop-filter: blur(8px);
      transform: rotate(8deg);
      z-index: 2;
      box-shadow: 0 8px 20px rgba(0,0,0,0.1);
    }
    .cq2-product.is-reverse .cq2-product-stamp { right: auto; left: 8%; transform: rotate(-8deg); }

    /* Text block */
    .cq2-product-text { position: relative; z-index: 1; will-change: transform; }
    .cq2-product-tag {
      display: inline-flex; align-items: center; gap: 0.5rem;
      font-size: 0.7rem; letter-spacing: 3px; font-weight: 700;
      text-transform: uppercase;
      color: var(--cq-ink); opacity: 0.7;
      margin-bottom: 1rem;
    }
    .cq2-product-dot {
      display: inline-block; width: 9px; height: 9px; border-radius: 999px;
    }
    .cq2-product-name {
      font-family: 'Playfair Display', serif;
      font-size: clamp(2rem, 5vw, 3.5rem);
      font-weight: 800; line-height: 1.1; letter-spacing: -0.02em;
      margin: 0 0 1.25rem;
      color: var(--cq-ink);
    }
    .cq2-product-desc {
      font-family: 'Playfair Display', serif; font-style: italic;
      font-size: 1.05rem; line-height: 1.75;
      color: var(--cq-ink); opacity: 0.78;
      margin: 0 0 2rem;
      max-width: 480px;
    }
    .cq2-product.is-reverse .cq2-product-desc { margin-left: auto; }

    .cq2-product-price-row {
      display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap;
    }
    .cq2-product-price {
      display: flex; align-items: baseline; gap: 0.4rem;
      font-family: 'Playfair Display', serif;
      color: var(--cq-ink);
    }
    .cq2-product-price span {
      font-size: 3.5rem; font-weight: 900; font-style: italic;
      text-shadow: 2px 2px 0 rgba(216,126,45,0.18);
    }
    .cq2-product-price small {
      font-family: 'Allura', cursive;
      font-size: 1.4rem; opacity: 0.6;
      transform: rotate(-6deg) translateY(-2px);
      display: inline-block;
    }
    .cq2-product-arrow {
      display: inline-flex; align-items: center; justify-content: center;
      width: 48px; height: 48px; border-radius: 999px;
      border: 2px solid currentColor;
      font-size: 1.4rem; font-weight: 600;
      transition: transform 0.4s, background 0.3s;
      cursor: pointer;
    }
    .cq2-product-arrow:hover { transform: scale(1.15) translateX(6px); }

    /* ============ Cell photos (overlay images inside bento cards) ============ */
    .cq2-cell-photo {
      position: absolute; pointer-events: none; z-index: 2;
      filter: drop-shadow(0 20px 30px rgba(0,0,0,0.35));
      transition: transform 0.6s cubic-bezier(.2,.8,.2,1);
    }
    .cq2-bento-cell:hover .cq2-cell-photo { transform: scale(1.05) rotate(-3deg); }

    /* Brownies card — photo bottom-right oversized */
    .cq2-cell-photo-brownie {
      right: -20px; bottom: -20px;
      width: 200px; height: 200px;
      object-fit: contain;
    }
    @media (min-width: 768px) { .cq2-cell-photo-brownie { width: 240px; height: 240px; right: -10px; bottom: -10px; } }

    /* Jars card — photo dominant right side */
    .cq2-cell-photo-jars {
      right: -10px; bottom: 0;
      width: 220px; height: 220px;
      object-fit: contain;
    }
    @media (min-width: 768px) { .cq2-cell-photo-jars { width: 260px; height: 260px; bottom: 10px; right: 10px; } }

    /* Jar price tags row (replace SVG jars) */
    .cq2-jar-prices {
      display: flex; gap: 0.75rem; margin-top: auto; padding-top: 1.5rem;
      max-width: 60%;
    }
    .cq2-price-tag {
      flex: 1;
      background: rgba(255,255,255,0.85);
      border: 1.5px dashed rgba(61,40,24,0.25);
      border-radius: 14px;
      padding: 0.75rem 1rem;
      text-align: center;
      backdrop-filter: blur(6px);
      transition: transform 0.4s, background 0.3s;
    }
    .cq2-price-tag:hover { transform: translateY(-3px) rotate(-2deg); background: #FFFFFF; }
    .cq2-price-tag span {
      display: block;
      font-size: 0.7rem; letter-spacing: 2px; font-weight: 700;
      text-transform: uppercase; color: rgba(61,40,24,0.7);
    }
    .cq2-price-tag strong {
      display: block;
      font-family: 'Playfair Display', serif; font-style: italic;
      font-size: 1.75rem; font-weight: 900; color: var(--cq-orange);
      margin-top: 0.2rem;
    }
    .cq2-price-tag-hot { background: var(--cq-orange); border-color: var(--cq-orange-deep); }
    .cq2-price-tag-hot span { color: rgba(255,255,255,0.8); }
    .cq2-price-tag-hot strong { color: #FFFFFF; }

    /* Gift photo */
    .cq2-gift-photo {
      width: 100%; height: 100%;
      object-fit: cover;
      object-position: center;
      transition: transform 0.5s cubic-bezier(.2,.8,.2,1);
    }
    .cq2-gift:hover .cq2-gift-photo { transform: scale(1.08); }

    /* ============ FOUNDERS — 2 people ============ */
    .cq2-founders {
      padding: 7rem 1.5rem;
      background:
        radial-gradient(ellipse 60% 40% at 20% 20%, rgba(216,126,45,0.1) 0%, transparent 60%),
        radial-gradient(ellipse 60% 40% at 80% 80%, rgba(107,142,90,0.1) 0%, transparent 60%),
        linear-gradient(180deg, var(--cq-bg-deep) 0%, var(--cq-bg) 50%, var(--cq-bg-deep) 100%);
      position: relative; overflow: hidden;
    }
    .cq2-founders-bg {
      position: absolute; inset: 0;
      background-image: radial-gradient(rgba(74,42,18,0.04) 1px, transparent 1px);
      background-size: 4px 4px;
      pointer-events: none; opacity: 0.6;
      mix-blend-mode: multiply;
    }

    .cq2-founders-head {
      max-width: 1000px; margin: 0 auto 5rem; text-align: center;
      position: relative; z-index: 1;
    }
    .cq2-founders-head .cq2-section-label { display: inline-flex; }
    .cq2-founders-lead {
      font-family: 'Playfair Display', serif; font-style: italic;
      font-size: 1.15rem; line-height: 1.7;
      max-width: 620px; margin: 1.5rem auto 0;
      color: var(--cq-ink); opacity: 0.78;
    }

    .cq2-founders-grid {
      max-width: 1200px; margin: 0 auto;
      display: grid; grid-template-columns: 1fr; gap: 4rem;
      position: relative; z-index: 1;
    }
    @media (min-width: 900px) {
      .cq2-founders-grid { grid-template-columns: 1fr 1fr; gap: 5rem; }
    }

    /* ===== Founder card (no boundary box) ===== */
    .cq2-founder-card {
      display: grid; grid-template-columns: 1fr; gap: 2rem;
      align-items: center;
      perspective: 1400px;
      opacity: 0; transform: translateY(60px);
      transition:
        opacity 1.2s cubic-bezier(.16,1,.3,1),
        transform 1.2s cubic-bezier(.16,1,.3,1);
    }
    .cq2-founder-card.is-visible { opacity: 1; transform: translateY(0); }

    .cq2-founder-stage {
      position: relative;
      aspect-ratio: 1/1;
      display: flex; align-items: center; justify-content: center;
      transform-style: preserve-3d;
    }
    .cq2-founder-blob {
      position: absolute; inset: -10%;
      background: radial-gradient(circle, var(--blob, #D87E2D) 0%, transparent 60%);
      filter: blur(40px);
      opacity: 0.5;
      transform: translateZ(-80px);
      pointer-events: none;
    }
    .cq2-founder-stage::after {
      content: '';
      position: absolute;
      bottom: 12%; left: 25%; right: 25%;
      height: 25px;
      background: radial-gradient(ellipse, rgba(0,0,0,0.3) 0%, transparent 70%);
      filter: blur(12px);
      pointer-events: none;
    }
    .cq2-founder-3d {
      position: relative; z-index: 1;
      transform-style: preserve-3d;
      will-change: transform;
      transition: transform 0.15s linear;
    }
    .cq2-founder-portrait-emoji {
      font-size: clamp(7rem, 14vw, 11rem);
      filter:
        drop-shadow(0 40px 40px rgba(0,0,0,0.3))
        drop-shadow(0 20px 20px rgba(0,0,0,0.2));
      display: inline-block;
      transform: scale(0.85);
      transition: transform 0.9s cubic-bezier(.2,.8,.2,1);
    }
    .cq2-founder-card.is-visible .cq2-founder-portrait-emoji { transform: scale(1); }
    .cq2-founder-3d:hover .cq2-founder-portrait-emoji { transform: scale(1.08) rotate(5deg); }

    .cq2-founder-portrait-img {
      width: clamp(160px, 22vw, 260px);
      height: clamp(160px, 22vw, 260px);
      object-fit: cover;
      object-position: top center;
      border-radius: 50%;
      border: 4px solid rgba(255,255,255,0.25);
      box-shadow:
        0 30px 60px rgba(0,0,0,0.35),
        0 10px 20px rgba(0,0,0,0.2);
      display: block;
      transform: scale(0.88);
      transition: transform 0.9s cubic-bezier(.2,.8,.2,1);
    }
    .cq2-founder-card.is-visible .cq2-founder-portrait-img { transform: scale(1); }
    .cq2-founder-3d:hover .cq2-founder-portrait-img { transform: scale(1.05); }

    /* Big initial letter behind */
    .cq2-founder-initial {
      position: absolute;
      font-family: 'Allura', cursive;
      font-size: clamp(12rem, 28vw, 22rem);
      line-height: 0.85;
      opacity: 0.18;
      pointer-events: none; user-select: none;
      z-index: 0;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
    }

    .cq2-founder-info {
      position: relative; z-index: 1;
    }
    .cq2-founder-meta {
      display: inline-flex; align-items: center; gap: 0.5rem;
      font-size: 0.7rem; letter-spacing: 3px; font-weight: 700;
      text-transform: uppercase;
      opacity: 0.7; margin-bottom: 0.75rem;
    }
    .cq2-founder-dot { width: 9px; height: 9px; border-radius: 999px; }
    .cq2-founder-name {
      font-family: 'Playfair Display', serif;
      font-size: clamp(2.5rem, 5vw, 4.5rem);
      font-weight: 800; line-height: 1;
      margin: 0 0 0.5rem;
    }
    .cq2-founder-name .cq2-script-gold { font-size: 1.6em; }
    .cq2-founder-role-text {
      font-size: 0.85rem; letter-spacing: 2px;
      text-transform: uppercase; font-weight: 600;
      opacity: 0.7; margin: 0 0 1.25rem;
    }
    .cq2-founder-quote-small {
      font-family: 'Playfair Display', serif; font-style: italic;
      font-size: 1.05rem; line-height: 1.7;
      color: var(--cq-ink); opacity: 0.85;
      margin: 0 0 1.5rem; max-width: 480px;
      border-left: 2px solid currentColor;
      padding-left: 1rem;
    }
    .cq2-founder-skills {
      display: flex; flex-wrap: wrap; gap: 0.5rem;
    }
    .cq2-skill-pill {
      padding: 0.35rem 0.9rem;
      border-radius: 999px;
      background: rgba(255,255,255,0.5);
      border: 1.5px dashed;
      font-size: 0.75rem; font-weight: 700;
      letter-spacing: 1px; text-transform: uppercase;
      color: var(--cq-ink);
      backdrop-filter: blur(6px);
    }

    .cq2-founders-together {
      display: flex; align-items: center; justify-content: center; gap: 1rem;
      margin: 5rem auto 0;
      flex-wrap: wrap;
      position: relative; z-index: 1;
    }
    .cq2-together-text {
      font-size: clamp(3rem, 6vw, 5rem);
      line-height: 1;
    }
    .cq2-together-plus {
      font-family: 'Playfair Display', serif; font-style: italic;
      font-size: 2.5rem; font-weight: 700;
      color: var(--cq-ink); opacity: 0.4;
    }

    /* ============ PROCESS ============ */
    .cq2-process { padding: 7rem 1.5rem; background: var(--cq-bg); }
    .cq2-process-head { max-width: 1300px; margin: 0 auto 4rem; text-align: center; }
    .cq2-process-head .cq2-section-label { display: inline-flex; }
    .cq2-process-head .cq2-h-big { max-width: 800px; margin-left: auto; margin-right: auto; }
    .cq2-process-grid { max-width: 1300px; margin: 0 auto; display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
    @media (min-width: 768px) { .cq2-process-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 1100px) { .cq2-process-grid { grid-template-columns: repeat(4, 1fr); } }
    .cq2-process-step { position: relative; padding: 2.5rem 1.75rem; border-radius: 22px; background: var(--cq-cream); border: 1px solid rgba(26,20,16,0.05); transition: transform 0.5s, box-shadow 0.5s, background 0.4s; }
    .cq2-process-step:hover { transform: translateY(-8px); background: #FFFFFF; box-shadow: 0 25px 60px rgba(184,92,22,0.15); }
    .cq2-process-num { font-family: 'Playfair Display', serif; font-style: italic; font-weight: 800; font-size: 4rem; color: var(--cq-orange); opacity: 0.18; line-height: 1; position: absolute; top: 1.25rem; right: 1.5rem; }
    .cq2-process-icon { font-size: 2.8rem; margin-bottom: 1rem; filter: drop-shadow(0 8px 15px rgba(0,0,0,0.15)); }
    .cq2-process-title { font-family: 'Playfair Display', serif; font-size: 1.4rem; font-weight: 800; margin: 0 0 0.75rem; color: var(--cq-ink); }
    .cq2-process-desc { font-size: 0.9rem; line-height: 1.6; opacity: 0.75; margin: 0; }
    .cq2-process-line { display: none; }
    @media (min-width: 1100px) {
      .cq2-process-line { display: block; position: absolute; top: 50%; right: -1.5rem; width: 1.5rem; height: 2px; background: repeating-linear-gradient(to right, var(--cq-orange) 0 6px, transparent 6px 12px); }
    }

    /* ============ OCCASIONS ============ */
    .cq2-occasions { padding: 7rem 1.5rem; background: var(--cq-cream); }
    .cq2-occasions-head { max-width: 1300px; margin: 0 auto 4rem; text-align: center; }
    .cq2-occasions-lead { font-family: 'Playfair Display', serif; font-style: italic; font-size: 1.1rem; opacity: 0.75; margin: 0; max-width: 540px; margin-left: auto; margin-right: auto; }
    .cq2-occasions-grid { max-width: 1300px; margin: 0 auto; display: grid; grid-template-columns: 1fr; gap: 1.25rem; }
    @media (min-width: 640px) { .cq2-occasions-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 1024px) { .cq2-occasions-grid { grid-template-columns: repeat(3, 1fr); } }
    .cq2-occasion { padding: 2rem 1.75rem; border-radius: 20px; background: #FFFFFF; transition: transform 0.4s, box-shadow 0.4s; cursor: pointer; border-left: 4px solid var(--cq-orange); }
    .cq2-occasion:hover { transform: translateX(8px); box-shadow: 0 20px 50px rgba(0,0,0,0.08); }
    .cq2-occasion-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
    .cq2-occasion-name { font-family: 'Playfair Display', serif; font-size: 1.4rem; font-weight: 800; margin: 0 0 0.5rem; }
    .cq2-occasion-desc { font-size: 0.9rem; line-height: 1.6; opacity: 0.7; margin: 0; }

    /* ============ TESTIMONIALS ============ */
    .cq2-testimonials { padding: 7rem 1.5rem; background: var(--cq-ink); color: var(--cq-bg); position: relative; overflow: hidden; }
    .cq2-testimonials::before { content: '"'; position: absolute; top: -3rem; left: 2rem; font-family: 'Playfair Display', serif; font-size: 30rem; color: var(--cq-orange); opacity: 0.08; line-height: 1; font-weight: 900; pointer-events: none; }
    .cq2-testimonials-head { max-width: 1300px; margin: 0 auto 4rem; position: relative; }
    .cq2-testimonials-grid { max-width: 1300px; margin: 0 auto; display: grid; grid-template-columns: 1fr; gap: 1.5rem; position: relative; z-index: 1; }
    @media (min-width: 640px) { .cq2-testimonials-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 1100px) { .cq2-testimonials-grid { grid-template-columns: repeat(4, 1fr); } }
    .cq2-testi { padding: 2rem 1.75rem; border-radius: 22px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); display: flex; flex-direction: column; gap: 1rem; transition: background 0.4s, transform 0.5s; }
    .cq2-testi:hover { background: rgba(255,255,255,0.08); transform: translateY(-6px); }
    .cq2-testi-stars { color: var(--cq-orange); font-size: 1rem; letter-spacing: 2px; }
    .cq2-testi-quote { font-family: 'Playfair Display', serif; font-style: italic; font-size: 1.05rem; line-height: 1.6; flex: 1; margin: 0; opacity: 0.92; }
    .cq2-testi-meta { display: flex; align-items: center; gap: 0.75rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1); }
    .cq2-testi-avatar { width: 40px; height: 40px; border-radius: 999px; background: var(--cq-orange); display: flex; align-items: center; justify-content: center; font-weight: 800; color: #FFFFFF; font-size: 0.95rem; }
    .cq2-testi-name { font-weight: 700; font-size: 0.9rem; }
    .cq2-testi-role { font-size: 0.75rem; opacity: 0.6; letter-spacing: 1px; }

    /* ============ HOW TO ORDER ============ */
    .cq2-how { padding: 7rem 1.5rem; background: var(--cq-bg); position: relative; }
    .cq2-how-head { max-width: 1200px; margin: 0 auto 4rem; text-align: center; }
    .cq2-how-grid { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr; gap: 1.5rem; counter-reset: step; }
    @media (min-width: 768px) { .cq2-how-grid { grid-template-columns: repeat(3, 1fr); } }
    .cq2-how-step { position: relative; padding: 3rem 2rem 2.5rem; border-radius: 24px; background: linear-gradient(160deg, #FFFFFF 0%, var(--cq-cream) 100%); border: 1px solid rgba(26,20,16,0.06); text-align: center; transition: transform 0.5s, box-shadow 0.5s; }
    .cq2-how-step:hover { transform: translateY(-10px); box-shadow: 0 30px 70px rgba(184,92,22,0.18); }
    .cq2-how-emoji { font-size: 4rem; margin-bottom: 0.5rem; filter: drop-shadow(0 12px 20px rgba(0,0,0,0.2)); display: inline-block; animation: cq2Float 6s ease-in-out infinite; }
    .cq2-how-num { font-family: 'Playfair Display', serif; font-style: italic; font-weight: 800; font-size: 1.2rem; color: var(--cq-orange); letter-spacing: 2px; margin: 0.5rem 0; }
    .cq2-how-title { font-family: 'Playfair Display', serif; font-size: 1.6rem; font-weight: 800; margin: 0 0 0.75rem; }
    .cq2-how-desc { font-size: 0.95rem; line-height: 1.6; opacity: 0.75; margin: 0; }

    /* ============ INSTAGRAM ============ */
    .cq2-ig { padding: 7rem 1.5rem; background: var(--cq-cream); }
    .cq2-ig-head { max-width: 1200px; margin: 0 auto 3rem; text-align: center; }
    .cq2-ig-lead { font-family: 'Playfair Display', serif; font-style: italic; font-size: 1.1rem; opacity: 0.75; margin: 0; }
    .cq2-ig-grid { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
    @media (min-width: 640px) { .cq2-ig-grid { grid-template-columns: repeat(4, 1fr); gap: 1rem; } }
    .cq2-ig-post { position: relative; aspect-ratio: 1/1; border-radius: 16px; overflow: hidden; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.4s; }
    .cq2-ig-post:hover { transform: scale(1.03); }
    .cq2-ig-emoji { font-size: 4rem; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.25)); transition: transform 0.4s; }
    .cq2-ig-post:hover .cq2-ig-emoji { transform: scale(1.2); }
    .cq2-ig-label { position: absolute; top: 0.75rem; left: 0.75rem; background: rgba(255,255,255,0.92); padding: 0.25rem 0.6rem; border-radius: 999px; font-size: 0.65rem; font-weight: 700; letter-spacing: 1px; color: var(--cq-ink); }
    .cq2-ig-overlay { position: absolute; inset: 0; background: rgba(26,20,16,0.7); color: #FFFFFF; display: flex; align-items: center; justify-content: center; gap: 1.5rem; font-size: 0.9rem; font-weight: 700; opacity: 0; transition: opacity 0.3s; }
    .cq2-ig-post:hover .cq2-ig-overlay { opacity: 1; }
    .cq2-ig-cta { display: flex; justify-content: center; margin-top: 3rem; }

    /* ============ FAQ ============ */
    .cq2-faq { padding: 7rem 1.5rem; background: var(--cq-bg); }
    .cq2-faq-head { max-width: 900px; margin: 0 auto 3rem; text-align: center; }
    .cq2-faq-list { max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 0.75rem; }
    .cq2-faq-item { width: 100%; text-align: left; padding: 1.5rem 1.75rem; border-radius: 18px; background: var(--cq-cream); border: 1px solid rgba(26,20,16,0.06); cursor: pointer; transition: all 0.4s; position: relative; }
    .cq2-faq-item:hover { background: #FFFFFF; }
    .cq2-faq-item.is-open { background: #FFFFFF; box-shadow: 0 20px 50px rgba(184,92,22,0.12); }
    .cq2-faq-q { display: flex; align-items: center; gap: 1rem; font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: 700; padding-right: 2.5rem; }
    .cq2-faq-num { font-style: italic; font-weight: 800; color: var(--cq-orange); font-size: 0.95rem; opacity: 0.7; min-width: 28px; }
    .cq2-faq-toggle { position: absolute; top: 50%; right: 1.75rem; transform: translateY(-50%); font-size: 1.5rem; color: var(--cq-orange); font-weight: 300; transition: transform 0.3s; line-height: 1; }
    .cq2-faq-item.is-open .cq2-faq-toggle { transform: translateY(-50%) rotate(180deg); }
    .cq2-faq-a { display: block; max-height: 0; overflow: hidden; transition: max-height 0.5s cubic-bezier(.2,.8,.2,1), padding 0.4s; font-size: 0.95rem; line-height: 1.7; color: var(--cq-ink); opacity: 0; }
    .cq2-faq-item.is-open .cq2-faq-a { max-height: 300px; padding-top: 1rem; opacity: 0.82; }

    /* ============ NEWSLETTER ============ */
    .cq2-news { padding: 7rem 1.5rem; background: var(--cq-orange); color: #FFFFFF; position: relative; overflow: hidden; }
    .cq2-news::before { content: ''; position: absolute; inset: 0; background-image: radial-gradient(circle at 20% 30%, rgba(255,255,255,0.15) 0%, transparent 35%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.1) 0%, transparent 35%); pointer-events: none; }
    .cq2-news-inner { max-width: 700px; margin: 0 auto; text-align: center; position: relative; z-index: 1; }
    .cq2-news-head { font-family: 'Playfair Display', serif; font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 800; line-height: 1.15; margin: 0 0 2.5rem; }
    .cq2-news-head .cq2-script-gold { color: #FFFFFF; font-size: 1.3em; }
    .cq2-news-form { display: flex; gap: 0.5rem; max-width: 500px; margin: 0 auto; flex-wrap: wrap; background: rgba(255,255,255,0.1); padding: 0.5rem; border-radius: 999px; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.25); }
    .cq2-news-input { flex: 1; min-width: 200px; padding: 0.85rem 1.25rem; border: none; outline: none; background: transparent; color: #FFFFFF; font-size: 0.95rem; font-family: inherit; }
    .cq2-news-input::placeholder { color: rgba(255,255,255,0.6); }
    .cq2-news-btn { padding: 0.85rem 1.75rem; border: none; border-radius: 999px; background: var(--cq-ink); color: var(--cq-orange); font-weight: 700; cursor: pointer; transition: background 0.3s, color 0.3s; font-family: inherit; font-size: 0.9rem; }
    .cq2-news-btn:hover { background: #FFFFFF; color: var(--cq-orange); }
    .cq2-news-btn:disabled { background: rgba(255,255,255,0.95); color: var(--cq-sage); cursor: default; }
    .cq2-news-fine { font-size: 0.8rem; opacity: 0.75; margin-top: 1.5rem; }

    /* ============ THEME TOGGLE BUTTON ============ */
    .cq2-theme-toggle {
      position: fixed;
      top: 1.5rem; right: 1.5rem;
      z-index: 60;
      background: none; border: none; padding: 0;
      cursor: pointer;
      transition: transform 0.3s;
    }
    .cq2-theme-toggle:hover { transform: scale(1.05); }
    .cq2-theme-track {
      position: relative;
      display: flex; align-items: center; justify-content: space-between;
      width: 64px; height: 32px;
      border-radius: 999px;
      padding: 0 0.5rem;
      background: rgba(26,20,16,0.12);
      border: 1.5px solid rgba(26,20,16,0.18);
      backdrop-filter: blur(10px);
      transition: background 0.3s, border-color 0.3s;
    }
    .cq2-theme-track.is-dark {
      background: rgba(245,235,219,0.15);
      border-color: rgba(245,235,219,0.25);
    }
    .cq2-theme-icon {
      font-size: 0.85rem; line-height: 1; z-index: 1;
      transition: opacity 0.3s;
    }
    .cq2-theme-sun { color: #D87E2D; opacity: 1; }
    .cq2-theme-moon { color: #F5EBDB; opacity: 0.55; }
    .cq2-theme-track.is-dark .cq2-theme-sun { opacity: 0.5; }
    .cq2-theme-track.is-dark .cq2-theme-moon { opacity: 1; }
    .cq2-theme-thumb {
      position: absolute;
      top: 50%; left: 3px;
      width: 24px; height: 24px;
      border-radius: 999px;
      background: linear-gradient(160deg, #FFFFFF 0%, #FFE3B8 100%);
      box-shadow: 0 3px 8px rgba(0,0,0,0.2);
      transform: translateY(-50%);
      transition: left 0.4s cubic-bezier(.2,.8,.2,1), background 0.3s;
    }
    .cq2-theme-track.is-dark .cq2-theme-thumb {
      left: calc(100% - 27px);
      background: linear-gradient(160deg, #2A1810 0%, #5C3520 100%);
    }
    @media (max-width: 640px) {
      .cq2-theme-toggle { top: 1rem; right: 1rem; }
    }

    /* ============ DARK MODE OVERRIDES ============ */
    .cq2-dark {
      --cq-bg: #1A1208;
      --cq-bg-deep: #0F0A04;
      --cq-ink: #F5EBDB;
      --cq-orange: #E89456;
      --cq-orange-deep: #D87E2D;
      --cq-gold: #E5BC73;
      --cq-cream: #2A1F12;
      --cq-sage: #8FA77B;
    }

    /* Section bg overrides for dark mode (some hardcoded gradients) */
    .cq2-dark .cq2-hero {
      background: linear-gradient(180deg, var(--cq-bg-deep) 0%, var(--cq-bg) 60%, var(--cq-bg-deep) 100%);
    }
    .cq2-dark .cq2-hero-grid {
      background-image:
        linear-gradient(to right, rgba(245,235,219,0.06) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(245,235,219,0.06) 1px, transparent 1px);
    }
    .cq2-dark .cq2-stats { background: var(--cq-bg-deep); }
    .cq2-dark .cq2-founders {
      background:
        radial-gradient(ellipse 60% 40% at 20% 20%, rgba(232,148,86,0.12) 0%, transparent 60%),
        radial-gradient(ellipse 60% 40% at 80% 80%, rgba(143,167,123,0.1) 0%, transparent 60%),
        linear-gradient(180deg, var(--cq-bg-deep) 0%, var(--cq-bg) 50%, var(--cq-bg-deep) 100%);
    }
    .cq2-dark .cq2-story { background: var(--cq-bg); }
    .cq2-dark .cq2-process { background: var(--cq-bg); }
    .cq2-dark .cq2-occasions { background: var(--cq-cream); }
    .cq2-dark .cq2-how { background: var(--cq-bg); }
    .cq2-dark .cq2-ig { background: var(--cq-cream); }
    .cq2-dark .cq2-faq { background: var(--cq-bg); }
    .cq2-dark .cq2-cta {
      background: linear-gradient(135deg, var(--cq-bg-deep) 0%, var(--cq-cream) 100%);
    }
    .cq2-dark .cq2-cta-grid {
      background-image:
        linear-gradient(to right, rgba(245,235,219,0.04) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(245,235,219,0.04) 1px, transparent 1px);
    }
    .cq2-dark .cq2-showcase {
      background:
        radial-gradient(ellipse 80% 50% at 50% 0%, rgba(232,148,86,0.08) 0%, transparent 60%),
        radial-gradient(ellipse 80% 50% at 50% 100%, rgba(143,167,123,0.06) 0%, transparent 60%),
        linear-gradient(180deg, var(--cq-bg) 0%, var(--cq-bg-deep) 50%, var(--cq-bg) 100%);
    }
    .cq2-dark .cq2-gift-showcase {
      background:
        radial-gradient(ellipse 70% 40% at 30% 10%, rgba(212,165,116,0.15) 0%, transparent 60%),
        radial-gradient(ellipse 70% 40% at 70% 90%, rgba(232,164,164,0.12) 0%, transparent 60%),
        linear-gradient(180deg, var(--cq-bg) 0%, var(--cq-bg-deep) 50%, var(--cq-bg) 100%);
    }
    .cq2-dark .cq2-showcase::before,
    .cq2-dark .cq2-gift-showcase::before,
    .cq2-dark .cq2-founders-bg {
      background-image: radial-gradient(rgba(245,235,219,0.04) 1px, transparent 1px);
      mix-blend-mode: screen;
    }
    .cq2-dark .cq2-bento-cell::before {
      background-image: radial-gradient(rgba(245,235,219,0.04) 1px, transparent 1px);
      mix-blend-mode: screen;
    }
    .cq2-dark .cq2-bento-section { background: var(--cq-cream); }

    /* Hero blob colors stay warm */
    .cq2-dark .cq2-hero-eyebrow,
    .cq2-dark .cq2-nav-brand,
    .cq2-dark .cq2-nav-links a { color: var(--cq-ink); }
    .cq2-dark .cq2-line { background: var(--cq-ink); opacity: 0.3; }

    /* Headline outline in dark */
    .cq2-dark .cq2-h-word-outline {
      -webkit-text-stroke-color: var(--cq-ink);
    }
    .cq2-dark .cq2-hero-headline { color: var(--cq-ink); }

    /* Pills + cards in dark */
    .cq2-dark .cq2-pill { background: rgba(245,235,219,0.06); border-color: rgba(245,235,219,0.12); }
    .cq2-dark .cq2-pill:hover { background: var(--cq-orange); color: var(--cq-bg-deep); }

    .cq2-dark .cq2-process-step { background: rgba(245,235,219,0.04); border-color: rgba(245,235,219,0.08); }
    .cq2-dark .cq2-process-step:hover { background: rgba(245,235,219,0.08); box-shadow: 0 25px 60px rgba(0,0,0,0.4); }

    .cq2-dark .cq2-occasion { background: rgba(245,235,219,0.04); border-left-color: var(--cq-orange); }
    .cq2-dark .cq2-occasion:hover { background: rgba(245,235,219,0.08); }

    .cq2-dark .cq2-how-step {
      background: linear-gradient(160deg, rgba(245,235,219,0.06) 0%, rgba(245,235,219,0.02) 100%);
      border-color: rgba(245,235,219,0.1);
    }
    .cq2-dark .cq2-ig-post .cq2-ig-label { background: rgba(26,20,16,0.85); color: var(--cq-ink); }

    .cq2-dark .cq2-faq-item { background: rgba(245,235,219,0.04); border-color: rgba(245,235,219,0.08); }
    .cq2-dark .cq2-faq-item:hover,
    .cq2-dark .cq2-faq-item.is-open { background: rgba(245,235,219,0.08); }

    /* News form pill */
    .cq2-dark .cq2-news { background: var(--cq-orange-deep); }
    .cq2-dark .cq2-news-form { background: rgba(0,0,0,0.25); border-color: rgba(255,255,255,0.2); }

    /* Magnetic buttons */
    .cq2-dark .cq-magbtn-ghost { color: var(--cq-ink); border-color: var(--cq-ink); }
    .cq2-dark .cq-magbtn-ghost:hover { background: var(--cq-ink); color: var(--cq-bg); }
    .cq2-dark .cq-magbtn-dark { background: var(--cq-ink); color: var(--cq-bg); }
    .cq2-dark .cq-magbtn-dark:hover { background: var(--cq-orange); color: var(--cq-bg-deep); }

    /* Skill pills + combo tags + price tags */
    .cq2-dark .cq2-skill-pill { background: rgba(245,235,219,0.06); color: var(--cq-ink); }
    .cq2-dark .cq2-combo-tag { background: rgba(245,235,219,0.06); border-color: rgba(245,235,219,0.18); }
    .cq2-dark .cq2-combo-tag:hover { background: rgba(245,235,219,0.12); }
    .cq2-dark .cq2-combo-tag span { color: rgba(245,235,219,0.8); }
    .cq2-dark .cq2-combo-tag strong { color: var(--cq-orange); }

    /* Bento cell title colors fix */
    .cq2-dark .cq2-cell-title { color: var(--cq-ink); }
    .cq2-dark .cq2-cell-text { color: rgba(245,235,219,0.7); }
    .cq2-dark .cq2-mini-name { color: rgba(245,235,219,0.75); }
    .cq2-dark .cq2-mini-price { color: var(--cq-orange); text-shadow: 1.5px 1.5px 0 rgba(0,0,0,0.4); }
    .cq2-dark .cq2-cell-tag { background: rgba(245,235,219,0.1); color: var(--cq-ink); border-color: rgba(245,235,219,0.2); }

    /* Product photo shadows softer in dark */
    .cq2-dark .cq2-product-photo,
    .cq2-dark .cq2-product-emoji {
      filter:
        drop-shadow(0 60px 50px rgba(0,0,0,0.6))
        drop-shadow(0 30px 25px rgba(0,0,0,0.4))
        drop-shadow(0 10px 15px rgba(0,0,0,0.3));
    }

    /* Cookie tone gradients in dark mode — slightly darkened */
    .cq2-dark .cq2-tone-a { background: linear-gradient(160deg, #4A3520 0%, #2A1810 100%); }
    .cq2-dark .cq2-tone-b { background: linear-gradient(160deg, #4A3D2A 0%, #2A2218 100%); }
    .cq2-dark .cq2-tone-c { background: linear-gradient(160deg, #3D4A30 0%, #1F2818 100%); }
    .cq2-dark .cq2-tone-d { background: linear-gradient(160deg, #4A2828 0%, #2A1A1A 100%); }

    /* Section grid texture in dark */
    .cq2-dark .cq2-hero-blob-1 { background: #5C3520; opacity: 0.4; }
    .cq2-dark .cq2-hero-blob-2 { background: #B25C16; opacity: 0.4; }

    /* Stamp + tag adapt */
    .cq2-dark .cq2-product-stamp { background: rgba(245,235,219,0.85); }
    .cq2-dark .cq2-trad-name { background: rgba(245,235,219,0.92); color: var(--cq-bg-deep); }

    /* Spotlight cursor blend mode reversed in dark */
    .cq2-dark .cq-spotlight {
      mix-blend-mode: screen;
      background: radial-gradient(circle, rgba(232,148,86,0.25) 0%, rgba(232,148,86,0) 60%);
    }
  `}</style>
);

export default Styles;
