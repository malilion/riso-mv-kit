// riso.js: every frame is printed like a risograph run.
// Scenes paint ink *densities* (canvas alpha) on separate drums: k (line/key drum) and spot drums a..d.
// print() loads an ink colour on each drum, screens tints as halftone at per-drum angles, misregisters
// the drums slightly differently on every print (re-rolled on twos), then multiplies the inks over paper.
const INK = {
  // risograph spot inks (approximate swatches)
  midnight: '#435060', spruce: '#2E3B37', brown: '#925F52', black: '#2A2522',
  kelly: '#67B346', grass: '#397E58', emerald: '#19975D', mist: '#D5E4C0', lime: '#E3ED55',
  yellow: '#FFE800', sunflower: '#FFB511', melon: '#FFAE3B', apricot: '#F6A04D',
  bubblegum: '#F984CA', mauve: '#E6B5C9', bisque: '#F2CDCF', coral: '#FF8E91', flpink: '#FF48B0',
  cornflower: '#62A8E5', aqua: '#5EC8E5', sky: '#4982CF', lake: '#235BA8', mint: '#82D8D5', seafoam: '#62C2B1',
  paper: '#F4EEE1',
};
const hex2rgb = h => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
const dens = d => `rgba(0,0,0,${clamp(d)})`;

const RISO = (() => {
  const DRUMS = ['k', 'a', 'b', 'c', 'd'];
  const cv = {}, cx = {};
  for (const n of [...DRUMS, 'base']) { const c = document.createElement('canvas'); c.width = W; c.height = H; cv[n] = c; cx[n] = c.getContext('2d'); }

  // ---- plate set handed to scenes
  const P = {
    ...cx, drums: DRUMS,
    each(fn, names = DRUMS) { for (const n of names) fn(cx[n], n); },
    save() { DRUMS.forEach(n => cx[n].save()); }, restore() { DRUMS.forEach(n => cx[n].restore()); },
    translate(x, y) { DRUMS.forEach(n => cx[n].translate(x, y)); }, scale(x, y = x) { DRUMS.forEach(n => cx[n].scale(x, y)); },
    rotate(a) { DRUMS.forEach(n => cx[n].rotate(a)); },
    // opaque paint: knock every drum out inside the path, then lay the given densities {a: .7, c: .3}
    paint(path, d = {}, rule = 'nonzero') { this.erase(path, DRUMS, rule); this.add(path, d, rule); },
    // overprint: add densities without knocking anything out
    add(path, d = {}, rule = 'nonzero') { for (const n in d) { if (!(d[n] > 0)) continue; const c = cx[n]; c.fillStyle = dens(d[n]); c.fill(path, rule); } },
    erase(path, names = DRUMS, rule = 'nonzero') { for (const n of names) { const c = cx[n]; c.save(); c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000'; c.fill(path, rule); c.restore(); } },
    // lines print solid (a half-density line would be screened into dots); only faint lines stay as tints
    stroke(path, n = 'k', lw = 3, d = 1, o = {}) { const c = cx[n]; c.save(); c.lineWidth = lw; c.lineCap = o.cap || 'round'; c.lineJoin = 'round'; c.strokeStyle = dens(d >= .6 ? 1 : d); if (o.dash) c.setLineDash(o.dash); c.stroke(path); c.restore(); },
    // silhouette only: for unions of overlapping shapes (clouds, canopies) — inner overlaps get no line
    outline(path, n = 'k', lw = 3, d = 1) { this.stroke(path, n, lw * 2, d); this.erase(path, [n]); },
    // linear density ramp on one drum, clipped to path (prints as a halftone gradient)
    ramp(path, n, x0, y0, d0, x1, y1, d1, knock = false) {
      if (knock) this.erase(path); const c = cx[n], g = c.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, dens(d0)); g.addColorStop(1, dens(d1)); c.fillStyle = g; c.fill(path);
    },
    radial(path, n, x, y, r0, d0, r1, d1) { const c = cx[n], g = c.createRadialGradient(x, y, r0, x, y, r1); g.addColorStop(0, dens(d0)); g.addColorStop(1, dens(d1)); c.fillStyle = g; c.fill(path); },
  };
  function begin() {
    for (const n in cx) { const c = cx[n]; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none'; c.clearRect(0, 0, W, H); }
    cx.base.fillStyle = '#FFFFFF'; cx.base.fillRect(0, 0, W, H);
    return P;
  }

  // ---- GL print pass
  // the press prints into an offscreen GL canvas; the timeline composites prints onto the visible canvas
  const out = document.createElement('canvas'); out.width = W; out.height = H;
  const gl = out.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false });
  const NOISE = `
  float h21(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
  float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y); }
  float fbm(vec2 p){ float s=0., a=.5; for(int i=0;i<4;i++){ s+=a*vn(p); p*=2.03; a*=.5; } return s; }`;
  const VS = `#version 300 es
  in vec2 p; out vec2 uv; void main(){ uv = p*.5+.5; gl_Position = vec4(p,0.,1.); }`;
  const FS = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o;
  uniform sampler2D P0, P1, P2, P3, P4, BASE;
  uniform vec3 ink[5]; uniform vec2 mis[5]; uniform vec3 scr[5]; uniform float on[5];
  uniform float useBase, seed, grainAmt, vig, flash, texAmt, fiber; uniform vec2 res, shift; uniform vec3 paper;
  ${NOISE}
  // AM halftone: round dots that merge into holes as the tint deepens
  float am(float d, vec2 fr, float ang, float cell){
    float c = cos(ang), s = sin(ang); vec2 p = mat2(c, s, -s, c) * fr / cell;
    float v = .5 + .25*(cos(6.2831853*p.x) + cos(6.2831853*p.y));
    float th = 1. - d; float w = 1.2/cell; // analytic AA width: v spans 0..1 over half a cell
    return smoothstep(th - w, th + w, v);
  }
  // FM / grain screen: stochastic speckle, the cheap-riso look
  float fm(float d, vec2 fr, float sd){ return step(h21(floor(fr*.42) + sd), d); }
  float plate(sampler2D S, vec2 q, vec2 fr, vec2 m, vec3 sc, float k){
    float d = texture(S, q + m/res).a;
    if (d < .004) return 0.;
    vec2 f = fr + m; float c = d;
    if (sc.z > .5 && sc.z < 1.5) c = mix(am(d, f, sc.x, sc.y), d, smoothstep(.9, .985, d));
    else if (sc.z > 1.5) c = mix(fm(d, f, seed*3.1 + k*17.), d, smoothstep(.93, .99, d));
    // uneven laydown: mottling + starved speckles, re-rolled on every print
    float mot = fbm(f*.012 + vec2(k*7.3, seed*.37));
    float spk = step(.986, h21(floor(f*.55) + vec2(seed*1.7, k*5.1)));
    c *= 1. - texAmt*(.2*smoothstep(.5, .82, mot) + .6*spk);
    return clamp(c, 0., 1.);
  }
  void main(){
    vec2 q = vec2(uv.x, 1.-uv.y); vec2 fr = q*res + shift;
    float fb = fbm(fr*vec2(.004,.02))*.6 + fbm(fr*.05)*.4; float tooth = vn(fr*.9);
    vec3 col = paper * mix(1., .93 + .09*fb, fiber) * (1. - .03*fiber*smoothstep(.55,.95,tooth));
    if (useBase > .5) col *= texture(BASE, q).rgb;
    if (on[1] > 0.) col *= mix(vec3(1.), ink[1], plate(P1, q, fr, mis[1], scr[1], 1.) * on[1]);
    if (on[2] > 0.) col *= mix(vec3(1.), ink[2], plate(P2, q, fr, mis[2], scr[2], 2.) * on[2]);
    if (on[3] > 0.) col *= mix(vec3(1.), ink[3], plate(P3, q, fr, mis[3], scr[3], 3.) * on[3]);
    if (on[4] > 0.) col *= mix(vec3(1.), ink[4], plate(P4, q, fr, mis[4], scr[4], 4.) * on[4]);
    if (on[0] > 0.) col *= mix(vec3(1.), ink[0], plate(P0, q, fr, mis[0], scr[0], 0.) * on[0]);
    col += (h21(fr + seed*13.1) - .5) * grainAmt;
    vec2 dd = q - .5; col *= 1. - vig*dot(dd,dd)*1.4;
    col = mix(col, vec3(1.), flash);
    o = vec4(col, 1.);
  }`;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = n => gl.getUniformLocation(prog, n);
  const texs = [...DRUMS, 'base'].map((n, i) => {
    const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, t);
    [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach(k => gl.texParameteri(gl.TEXTURE_2D, k, gl.LINEAR));
    [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(k => gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE));
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
    return t;
  });
  ['P0', 'P1', 'P2', 'P3', 'P4', 'BASE'].forEach((n, i) => gl.uniform1i(U(n), i));

  // drum defaults: [screen angle deg, cell px, mode 0 solid / 1 halftone / 2 grain]; registration drift per drum
  const SCREEN = { k: [45, 6, 1], a: [15, 7, 1], b: [75, 7, 1], c: [0, 7, 1], d: [30, 7, 1] };
  const DRIFT = { k: [0, 0], a: [2.4, -1.4], b: [-2.0, 1.3], c: [1.3, 2.2], d: [-2.6, -.9] };

  // cfg (returned by the scene): { inks: {k:'#..', a:'#..'}, screens: {a:[ang,cell,mode]}, mis, paper, grain, vig, flash, tex, base }
  function print(t, cfg = {}) {
    const inks = { k: INK.spruce, ...(cfg.inks || {}) }, seed = boilSeed(t) % 997, mis = cfg.mis ?? 1;
    gl.viewport(0, 0, W, H);
    const onA = [], inkA = [], misA = [], scrA = [];
    DRUMS.forEach((n, i) => {
      const used = !!inks[n] && cfg.off?.[n] !== true; onA.push(used ? (cfg.opacity?.[n] ?? 1) : 0);
      inkA.push(...hex2rgb(inks[n] || '#FFFFFF'));
      const dr = DRIFT[n], jx = (hash(seed, i * 2 + 1) - .5) * 1.2, jy = (hash(seed, i * 2 + 2) - .5) * 1.2;
      misA.push((dr[0] + jx) * mis, (dr[1] + jy) * mis);
      const s = cfg.screens?.[n] || SCREEN[n]; scrA.push(s[0] * Math.PI / 180, s[1], s[2]);
      if (used) { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, texs[i]); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv[n]); }
    });
    if (cfg.base) { gl.activeTexture(gl.TEXTURE5); gl.bindTexture(gl.TEXTURE_2D, texs[5]); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv.base); }
    gl.uniform1fv(U('on'), onA); gl.uniform3fv(U('ink'), inkA); gl.uniform2fv(U('mis'), misA); gl.uniform3fv(U('scr'), scrA);
    gl.uniform1f(U('useBase'), cfg.base ? 1 : 0); gl.uniform1f(U('seed'), seed);
    gl.uniform1f(U('grainAmt'), cfg.grain ?? .045); gl.uniform1f(U('vig'), cfg.vig ?? .2); gl.uniform1f(U('flash'), cfg.flash ?? 0);
    gl.uniform1f(U('texAmt'), cfg.tex ?? 1); gl.uniform1f(U('fiber'), cfg.fiber ?? .8);
    gl.uniform2f(U('res'), W, H); gl.uniform2f(U('shift'), (hash(seed, 91) - .5) * 1.4 * mis, (hash(seed, 92) - .5) * 1.4 * mis);
    gl.uniform3fv(U('paper'), hex2rgb(cfg.paper || INK.paper));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    return out;
  }
  // a half-size copy of every drum after drawing fn — lets a scene reprint earlier pages as small cards.
  // Call it before drawing the current scene (it uses and then clears the plates).
  const SNAP = new Map();
  async function snapshot(key, fn) {
    if (SNAP.has(key)) return SNAP.get(key);
    const P = begin(); P.save(); await fn(P); P.restore();
    const out = {}; for (const n of DRUMS) { const c = document.createElement('canvas'); c.width = W / 2; c.height = H / 2; c.getContext('2d').drawImage(cv[n], 0, 0, W / 2, H / 2); out[n] = c; }
    begin(); SNAP.set(key, out); return out;
  }
  return { begin, print, snapshot, P, canvases: cv };
})();
