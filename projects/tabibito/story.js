// story.js (tabibito): which scene plays when. 137 bpm, first downbeat 0.43 s (bar = 1.75 s).
// line = 0-based index into lyrics.json; scenes start on the bar line before that line is sung.
const STORY = [
  { bar: 0, fn: sc_cover },                                                                       // intro: the title page prints itself
  { bar: 3, fn: (P, t, t0) => sc_map(P, t, t0, { dur: lineT(0) - t0 }), tr: 'page' },               // the band comes in: the route is dotted across the map
  { line: 0, fn: sc_climb, tr: 'page' },                                                          // line 1: over the mountain
  { line: 1, fn: (P, t, t0) => sc_spring(P, t, t0, { dur: sinceLine(3, t0) }), tr: 'page' },        // lines 2-3: the overflowing spring
  { line: 3, fn: (P, t, t0) => sc_cloudsea(P, t, t0, { dur: sinceLine(6, t0), loveAt: sinceLine(5, t0) }), tr: 'page' }, // chorus 1: the island above the clouds
  { line: 6, fn: (P, t, t0) => sc_wind(P, t, t0, { landAt: sinceLine(7, t0) + 1.2 }), tr: 'fade' },  // verse 2: the wind, the perch
  { line: 8, fn: sc_skies, tr: 'page' },                                                          //   never the same sky twice
  { line: 10, fn: sc_campfire, tr: 'fade' },                                                      //   dozing, dreaming
  { line: 11, fn: sc_onward, tr: 'fade' },                                                        //   don't look back
  { line: 12, fn: (P, t, t0) => sc_cloudsea(P, t, t0, { dur: sinceLine(13, t0), dusk: true }), tr: 'page' }, // chorus 2
  { line: 13, fn: sc_promise, tr: 'fade' },                                                       //   the promise at the fingertips
  { after: 13, fn: (P, t, t0) => sc_chapter(P, t, t0, { num: '三' }), tr: 'page' },                 // instrumental: chapter page
  { at: barT(84), fn: sc_journey, tr: 'page' },                                                   //   the whole journey as a panorama
  { line: 14, fn: sc_lanterns, tr: 'fade' },                                                      // prayers overflow
  { line: 15, fn: (P, t, t0) => sc_farewell(P, t, t0, { byes: [lineT(15), LY[15].parts[1][0], lineT(17), LY[17].parts[1][0]].map(x => x - t0) }), tr: 'page' }, // bridge: goodbye
  { line: 19, fn: (P, t, t0) => sc_summit(P, t, t0, { dur: 24, loveAt: sinceLine(21, t0) }), tr: 'page' }, // last chorus: the summit
  { after: 21, fn: (P, t, t0) => sc_map(P, t, t0, { full: true, dur: 16 }), tr: 'page' },           // outro: the finished map
  { bar: 141, fn: sc_fin, tr: 'page' },                                                           // last page
];
