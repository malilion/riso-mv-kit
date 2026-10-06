// story.js: which scene plays when. Entries: { bar | line | after | at, fn, tr: 'page' | 'fade' }
// (see engine/timeline.js). Bars are counted from the first downbeat ("phase" in song.json).
const STORY = [
  { bar: 0, fn: sc_title },                  // intro: the cover prints itself drum by drum
  { bar: 4, fn: sc_meadow, tr: 'page' },     // verse: walking through the meadow
  { bar: 12, fn: sc_rainy, tr: 'page' },     // a quieter part: rain, an umbrella over a seedling
  { bar: 20, fn: sc_sprouts, tr: 'fade' },   // chorus: the whole field sprouts on the beat
  { bar: 28, fn: sc_last, tr: 'page' },      // last page
];
