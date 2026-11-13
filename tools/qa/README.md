# Quality checks

These scripts walk the whole game automatically. They are for whoever maintains the game, not for students.

They need Node and Playwright (`npm i playwright`), and the game served locally:

```bash
python3 -m http.server 8123
```

Then, from the repository folder:

| Command | What it checks |
|---|---|
| `node tools/qa/data.mjs "$PWD"` | Story data: every conversation link, speaker, document, keepsake and photo subject. |
| `node tools/qa/scenes.cjs` | Every scene: that each person, object, exit, photo subject, goal marker and curiosity can be reached on foot, that walkers and vehicles stay out of buildings, and that using each thing causes no error. |
| `node tools/qa/moving.cjs` | Scripted movement: the family's walks, Kessler leaving, wagons and walkers over four minutes of game time. |
| `node tools/qa/travel.cjs` | Out-of-order travel: early exits and the two-way trips between places. |

In `scenes.cjs`, the first Castle Garden run lists the people outside the fence as unreachable. That is expected: the gate is still shut. The `castle+gate` run opens it.

The same reachability check is available in the browser: add `?dev` to the game's address and run `dev.qa()` in the console.
