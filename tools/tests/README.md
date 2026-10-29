# Noodle checks

Run these from the repo root before every release:

- `node tools/tests/check.js`: checks every move, animation, instruction and path stone. It builds about 600 workouts (every moment, level, energy, length, mood and safety setting) and renders every screen. It takes a few seconds.
- `python3 tools/tests/smoke.py`: opens the real app in a browser, in portrait and landscape, and taps through first launch, a workout, "Just 2 minutes", Paths, You and Settings. It fails on any error or any button that can't be tapped. It takes about a minute.

`tools/build_variant.py` (it builds the personal and friends copies) won't run unless `check.js` passes.
