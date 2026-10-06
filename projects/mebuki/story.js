// story.js (mebuki): which scene plays when. 137 bpm, 8-bar phrases.
// The first half is scheduled by bar number; the second half follows the timed lyric lines
// (line = 0-based index into lyrics.json), snapped back to the bar line.
const PILOT = [
  { bar: 0, fn: sc_cover },                          // line 1, first half: the cover prints itself
  { bar: 4, fn: sc_road, tr: 'page' },               // line 1 second half, lines 2-3: the road, then the unprinted distance
  { bar: 16, fn: sc_clock, tr: 'page' },             // line 4: the clock-world
  { bar: 24, fn: sc_days },                          // line 5: the same day, again and again
  { bar: 32, fn: sc_sprout, tr: 'page' },            // chorus, line 6: the seedling opens on bar 33
  { bar: 36, fn: sc_field },                         //   ...and the whole field answers
  { bar: 40, fn: sc_together, tr: 'fade' },          // line 7: hilltop at golden hour
];
const STORY_PILOT = [...PILOT, { bar: 48, fn: sc_end, tr: 'page' }];
const STORY_FULL = [
  ...PILOT,
  { bar: 48, fn: sc_chapter2, tr: 'page' },                                                   // interlude
  { line: 7, fn: (P, t, t0) => sc_lineage(P, t, t0, { dur: sinceLine(9, t0) }), tr: 'page' },     // verse 2: hands across time
  { line: 9, fn: (P, t, t0) => sc_umbrella(P, t, t0, { dur: sinceLine(11, t0) }), tr: 'page' },   //   keeping a small thing dry
  { line: 11, fn: sc_bloom, tr: 'page' },                                                     // chorus 2: the field in flower
  { line: 12, fn: (P, t, t0) => sc_world(P, t, t0, { dur: sinceLine(13, t0) }), tr: 'fade' },    //   the little world, grown
  { line: 13, fn: (P, t, t0) => sc_treasures(P, t, t0, { half: sinceLine(14, t0) }), tr: 'page' }, // bridge: more and more treasures
  { line: 15, fn: (P, t, t0) => sc_rays(P, t, t0, { dur: sinceLine(17, t0) }), tr: 'page' },     //   ordinary, beautiful light
  { line: 17, fn: sc_memories, tr: 'fade' },                                                  // last section: happy days flick past
  { line: 18, fn: (P, t, t0) => sc_night(P, t, t0, { glowFrom: sinceLine(19, t0) }), tr: 'fade' }, //   night rain, then sprouts light up
  { line: 20, fn: (P, t, t0) => sc_finalRoad(P, t, t0, { dur: (LY[21] ? LY[21].t1 : lineT(20) + 20) - t0 }), tr: 'page' }, // onward
  { after: 21, fn: sc_fin, tr: 'page' },                                                      // last page
];
// the full cut needs every line timed; otherwise this plays the 92-second pilot
function STORY() {
  return SONG.dur > 100 && LY.length >= 22 && LY.slice(7, 22).every(l => l.t0 >= 0) ? STORY_FULL : STORY_PILOT;
}
