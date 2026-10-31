/* OPEN / NOTES — human mascot, adapted from the supplied v2 SVG rig.
   Slim human pilot inside a compact cockpit; finite site-controlled poses, no autoplay. */
(function (root) {
  'use strict';
  const PALETTE = Object.freeze({
    paper: '#FAF9F7', ink: '#27232C', lilac: '#AE91E8', light: '#D8C8F3',
    skin: '#E9BE9D', skinLight: '#F4D2B4', skinShade: '#C89276',
    hair: '#E9E1AB', hairShade: '#BAB486', jacket: '#202026',
    jacketLight: '#34343D', trousers: '#303039', chair: '#BCA797',
    chairLight: '#DED2C5', green: '#B8D8A7', orange: '#E9AE76'
  });
  const STATES = Object.freeze(['thinking', 'confused', 'eureka', 'idle', 'happy', 'skeptical', 'sad', 'wave']);
  const VIEWS = Object.freeze(['front', 'three-quarter', 'profile', 'back']);
  // [upper-body lean, gaze x, gaze y, eyebrow lift, smile amount, raised-hand blend]
  const POSES = Object.freeze({
    thinking: [-7, 1, -2, 0, 0, 0], confused: [3, -1, 0, 5, -1, 0],
    eureka: [0, 2, -1, 3, 4, 1], idle: [-2, 0, 0, 0, 0, 0],
    happy: [-1, 0, 0, 1, 5, 0], skeptical: [-5, -2, 0, 6, -1, 0],
    sad: [4, 0, 2, 2, -4, 0], wave: [-1, 0, 0, 1, 4, 1]
  });
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const ease = t => t * t * (3 - 2 * t);
  const mix = (a, b, t) => a + (b - a) * t;
  const pt = (a, b, t) => a.map((v, i) => mix(v, b[i], t));
  function createMascot(host, options = {}) {
    if (!host || typeof host.replaceChildren !== 'function') throw new TypeError('A DOM host is required');
    if (!options || typeof options !== 'object') throw new TypeError('Options must be an object');
    const {state = 'thinking', view = 'three-quarter', motion = false, autoPlay = false} = options;
    if (!STATES.includes(state) || !VIEWS.includes(view)) throw new RangeError('Unknown state or view');
    if (typeof motion !== 'boolean' || typeof autoPlay !== 'boolean') throw new TypeError('motion and autoPlay must be boolean');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '100 105 420 415'); svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Uzay aracındaki insan maskot');
    svg.style.cssText = 'display:block;width:100%;height:100%';
    host.replaceChildren(svg);
    const reduced = typeof root.matchMedia === 'function' ? root.matchMedia('(prefers-reduced-motion: reduce)') : {matches: false};
    let current = state, angle = view, disposed = false, frame = null, last = null;
    let elapsed = 0, phase = 1, from = POSES[state].slice(), target = POSES[state].slice(), active = target.slice();
    let playing = autoPlay;
    const ensureAlive = () => { if (disposed) throw new Error('Mascot instance has been destroyed'); };
    const animated = () => motion && !reduced.matches;
    function eye(x, y, width, gazeX, gazeY, blink) {
      const lid = blink ? 0.5 : 3;
      return `<g fill="none" stroke-width="1.6"><path d="M${x-width} ${y} Q${x} ${y-lid} ${x+width} ${y}"/></g>` +
        (blink ? '' : `<ellipse cx="${x+gazeX*.6}" cy="${y+gazeY*.35}" rx="1.9" ry="2.7" fill="${PALETTE.ink}" stroke="none"/>`);
    }
    function head(p, blink) {
      const [, gx, gy, brow, smile] = p;
      const mouth = `<path d="M344 218 Q352 ${220+smile} 359 217" fill="none" stroke-width="1.8"/>`;
      if (angle === 'back') return `<g data-part="head-back"><path d="M267 232 L268 263 L318 268 L321 229" fill="${PALETTE.skin}" stroke-width="3"/><path d="M247 190 C236 143 260 116 302 118 C345 119 358 152 345 199 L330 232 Q290 253 261 224 Z" fill="${PALETTE.hairShade}" stroke-width="3.5"/><path d="M245 173 C242 129 282 112 315 124 Q345 133 349 167 Q294 151 245 173" fill="${PALETTE.hair}" stroke-width="2"/><path d="M259 175 L265 198 M273 167 L278 195 M287 162 L291 190 M302 160 L306 191 M318 162 L320 195 M333 170 L332 197" fill="none" stroke="${PALETTE.hairShade}" stroke-width="2"/></g>`;
      if (angle === 'front') return `<g data-part="head-front"><path d="M269 232 L266 267 L326 267 L321 232" fill="${PALETTE.skinShade}" stroke-width="3"/><path d="M247 176 Q238 174 240 196 Q241 214 253 213 M340 177 Q350 176 348 198 Q346 214 335 214" fill="${PALETTE.skin}" stroke-width="2.5"/><path d="M250 163 Q251 125 293 125 Q334 125 338 163 L336 211 Q329 238 296 250 Q264 239 253 214 Z" fill="${PALETTE.skinLight}" stroke-width="3.5"/><path d="M249 179 L245 155 Q244 118 292 118 Q337 117 342 153 L337 180 L329 154 Q289 142 259 156 L255 182 Z" fill="${PALETTE.hair}" stroke-width="3"/><path d="M259 142 Q292 127 328 141 M258 148 Q292 135 331 149" fill="none" stroke="${PALETTE.hairShade}" stroke-width="2"/><path d="M293 180 L286 205 Q294 211 302 204" fill="none" stroke="${PALETTE.skinShade}" stroke-width="2"/>${eye(272,182,8,gx,gy,blink)}${eye(318,182,8,gx,gy,blink)}<g fill="none" stroke-width="2"><rect x="254" y="171" width="35" height="23" rx="7"/><rect x="302" y="171" width="35" height="23" rx="7"/><path d="M289 178 Q296 174 302 178 M255 173 L248 171 M337 173 L342 171 M258 ${162-brow} Q271 ${158-brow} 282 162 M307 162 Q319 158 331 162 M279 221 Q295 ${223+smile} 310 220"/></g></g>`;
      const profile = angle === 'profile';
      return `<g data-part="head-${angle}"><path d="M276 229 L269 264 L318 281 L325 239" fill="${PALETTE.skin}" stroke-width="3"/><path d="M257 165 C258 132 294 117 325 132 Q344 140 350 164 L350 178 L${profile?374:368} 195 Q${profile?376:370} 201 359 204 L363 216 L358 221 Q360 237 344 247 Q318 252 293 228 L267 210 Z" fill="${PALETTE.skinLight}" stroke-width="3.5"/><path d="M260 198 C245 178 243 151 258 133 Q279 112 309 121 Q336 125 343 145 Q306 135 281 155 L279 186 L274 205 Z" fill="${PALETTE.hair}" stroke-width="3"/><path d="M253 156 Q266 131 299 130 M254 163 Q274 140 310 138 M257 170 Q271 151 284 150" fill="none" stroke="${PALETTE.hairShade}" stroke-width="2"/><path d="M279 187 Q264 172 260 190 Q258 208 277 213 L284 207" fill="${PALETTE.skin}" stroke-width="2.5"/><path d="M272 191 Q265 187 267 198 L274 202" fill="none" stroke="${PALETTE.skinShade}" stroke-width="2"/><path d="M293 225 Q314 247 342 244" fill="none" stroke="${PALETTE.skinShade}" stroke-width="2"/>${eye(337,178,7,gx,gy,blink)}${profile?'':eye(353,175,3,gx*.5,gy,blink)}<g fill="none" stroke-width="2"><path d="M322 ${164-brow} Q334 ${159-brow} 345 163 M317 169 L346 166 L350 187 L322 190 Z M347 169 L357 167 L361 181 L351 185 M318 173 L275 185 M346 172 L350 172"/></g>${mouth}</g>`;
    }
    function render(time) {
      const p = active;
      const breathe = animated() ? Math.sin(time * Math.PI / 2) * .7 : 0;
      const blink = animated() && time % 4.7 > 4.52;
      const raise = p[5];
      // Hand anchored to chin, interpolated continuously to the idea gesture.
      const chin = angle === 'front' ? [303,242] : angle === 'back' ? [336,256] : [352,244];
      const hand = pt(chin, [406,185], raise);
      const elbow = pt([371,337], [414,287], raise);
      const back = angle === 'back';
      const sleevePath = `M327 302 L${elbow[0]} ${elbow[1]} L${hand[0]+2} ${hand[1]+35}`;
      const sleeve = `<g data-part="sleeve-near" fill="none"><path d="${sleevePath}" stroke="${PALETTE.ink}" stroke-width="24"/><path d="${sleevePath}" stroke="${PALETTE.jacketLight}" stroke-width="18"/></g>`;
      const fingers = `<g data-part="hand" transform="translate(${hand[0]} ${hand[1]}) rotate(${mix(-12,8,raise)})"><path d="${current==='wave'?'M-7 35 L-14 18 Q-18 10 -13 8 Q-10 7 -7 15 L-6 -3 Q-6 -9 -2 -9 Q2 -9 2 -3 L3 10 L5 -10 Q6 -16 10 -15 Q14 -14 13 -8 L12 11 L16 -4 Q18 -9 22 -7 Q25 -5 23 1 L20 20 Q19 30 12 38 Z':'M-7 35 L-9 17 Q-12 9 -7 7 Q-3 7 -1 15 L1 5 Q0 -5 5 -5 Q10 -4 9 5 L9 16 Q16 9 20 14 L18 29 L12 39 Z'}" fill="${PALETTE.skinLight}" stroke-width="2.4"/><path d="M1 15 L3 26 M9 17 L9 27" fill="none" stroke="${PALETTE.skinShade}" stroke-width="1.4"/></g>`;
      const torso = `<path data-part="jacket" d="M270 255 Q244 252 229 276 Q211 302 219 337 L236 395 Q255 419 282 421 L341 411 Q356 408 350 390 L333 332 Q329 301 309 279 L291 268 Z" fill="${PALETTE.jacket}" stroke-width="4"/><path d="M269 258 L293 278 L310 272 L316 287 L289 291 Z" fill="${PALETTE.jacketLight}" stroke-width="2.5"/><path d="M240 285 Q226 322 244 358 M253 394 Q286 402 325 394" fill="none" stroke="${PALETTE.jacketLight}" stroke-width="3"/>`;
      svg.innerHTML = `<title>Uzay aracındaki insan maskot — ${current}, ${angle}</title><g stroke="${PALETTE.ink}" stroke-linecap="round" stroke-linejoin="round">
        <ellipse cx="310" cy="498" rx="142" ry="6" fill="${PALETTE.ink}" opacity=".06" stroke="none"/>
        <g data-part="cockpit"><path d="M193 378 C166 274 197 128 304 125 C412 121 454 266 426 378 Z" fill="var(--mascot-glass,#AE91E80C)" stroke="var(--mascot-canopy,#C2A9EA)" stroke-width="2.4"/><path d="M207 249 Q208 181 249 156" fill="none" stroke="var(--mascot-canopy,#C2A9EA)" opacity=".55" stroke-width="2"/><ellipse cx="310" cy="378" rx="144" ry="23" fill="var(--mascot-recess,#E8E0F1)" stroke="var(--mascot-outline,#27232C)" stroke-width="2.4"/></g>
        <svg data-part="pilot" x="190" y="105" width="270" height="279" viewBox="190 105 270 279" overflow="hidden"><g data-part="upper" transform="rotate(${p[0]+breathe} 270 402)">${torso}${head(p,blink)}${back?'':`<g data-part="greeting-arm">${sleeve}${fingers}</g>`}${raise>.1&&current!=='wave'?`<g data-part="idea" opacity="${raise}" stroke="${PALETTE.lilac}" stroke-width="3" fill="none"><path d="M401 153 L400 139 M420 159 L432 149 M384 160 L376 150"/></g>`:''}</g></svg>
        <g data-part="craft" stroke="var(--mascot-outline,#27232C)" stroke-width="2.6"><path d="M170 394 Q133 373 111 410 L167 428 M450 394 Q487 373 509 410 L453 428" fill="var(--mascot-recess,#E8E0F1)"/><ellipse cx="310" cy="407" rx="183" ry="40" fill="var(--mascot-hull,#F0EBF8)"/><ellipse cx="310" cy="419" rx="143" ry="21" fill="var(--mascot-recess,#E8E0F1)" stroke="none"/><path d="M145 398 Q310 445 475 398" fill="none" stroke="var(--mascot-gold,#8A630C)" stroke-width="2"/><ellipse cx="310" cy="410" rx="21" ry="12" fill="#51BA93"/><ellipse cx="303" cy="406" rx="5" ry="2" fill="#FAF9F7A0" stroke="none"/><g fill="#FF975E" stroke="none"><ellipse cx="220" cy="404" rx="6" ry="4"/><ellipse cx="400" cy="404" rx="6" ry="4"/></g><path d="M237 442 L228 461 M383 442 L392 461" fill="none" stroke-width="3"/><g data-part="thrusters" fill="#FF975E" stroke="none"><path d="M239 443 Q250 489 261 443 Z M359 443 Q370 489 381 443 Z"/></g></g>
      </g>`;
    }
    function stop() { if (frame !== null) root.cancelAnimationFrame(frame); frame = null; last = null; }
    function tick(now) {
      if (disposed || !playing) return;
      const dt = last === null ? 0 : clamp((now-last)/1000, 0, .05); last = now; elapsed += dt;
      phase = animated() ? clamp(phase + dt/.38, 0, 1) : 1;
      active = from.map((v,i) => mix(v,target[i],ease(phase)));
      render(elapsed); frame = root.requestAnimationFrame(tick);
    }
    function start() { if (frame === null && playing && !disposed) frame = root.requestAnimationFrame(tick); }
    render(0); start();
    return Object.freeze({
      setState(next) {
        ensureAlive(); if (!STATES.includes(next)) throw new RangeError('Unknown state: '+next);
        from=active.slice(); target=POSES[next].slice(); current=next;
        phase=animated()&&playing?0:1; if(phase===1)active=target.slice(); render(elapsed);
      },
      setView(next) { ensureAlive(); if(!VIEWS.includes(next))throw new RangeError('Unknown view: '+next); angle=next;render(elapsed); },
      pause() { ensureAlive();playing=false;stop(); },
      play() { ensureAlive();playing=true;start(); },
      renderAt(seconds) {
        ensureAlive();if(!Number.isFinite(seconds)||seconds<0)throw new RangeError('Time must be finite and nonnegative');
        playing=false;stop();elapsed=seconds;phase=1;active=target.slice();from=target.slice();render(seconds);
      },
      destroy() { if(disposed)return;disposed=true;playing=false;stop();host.replaceChildren(); }
    });
  }
  root.NoteMascot=Object.freeze({VERSION:'2.2.0-site',create:createMascot,PALETTE,STATES,VIEWS});
})(window);
