# The Other Half: A Photographer's Passage

A 3D exploration game about the immigrant experience in 1888 New York, for middle-school social studies. Students play a newspaper photographer who crosses the Atlantic in steerage, passes through Castle Garden, and documents life on the Lower East Side. Their photographs become evidence for the question *"Was America a land of opportunity for newcomers?"* An optional Chapter IV covers urbanization and political machines.

- Runs in Chrome on **Chromebooks**: plain web files, no install, no build step, no server.
- Built with [three.js](https://threejs.org) (included in `lib/`, so it works even if CDNs are blocked).
- Tarot-style 2D characters with per-character animations; drop your illustrations into `assets/art/`.
- Environments rebuilt from 1880s maps, photographs and records.
- Voiceover ready: drop ElevenLabs MP3s into `assets/audio/vo/`.

## Guides

- **[Teacher Guide](docs/TEACHER_GUIDE.md):** timing, controls, answer key, history notes
- **[Art Guide](docs/ART_GUIDE.md):** every texture name, and sizes for your tarot art
- **[Voiceover Guide](docs/VOICEOVER_GUIDE.md):** ElevenLabs workflow; the script is in `assets/audio/vo_script.csv`
- **[Character Art Prompts](docs/CHARACTER_ART_PROMPTS.md):** Google Flow prompts for every character, in the tarot style
- **[Historical Reference](docs/HISTORICAL_REFERENCE.md):** what 1888 New York looked like, with sources

## Publish on GitHub Pages

1. Merge this branch into `main`.
2. On GitHub, open **Settings → Pages**, choose **Deploy from a branch**, select `main` and `/ (root)`, then click **Save**.
3. After a minute, students can play at `https://<your-username>.github.io/<repo-name>/`.

## Run locally

Browsers block ES modules from `file://`, so serve the folder:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Where things live

| Path | What |
|---|---|
| `js/data/dialogue.js` | **All dialogue**, documents, and title cards. Edit text here. |
| `js/data/characters.js` | Cast list and voice casting notes |
| `js/data/evidence.js` | Photo subjects, evidence-chart columns, supporting questions |
| `js/data/glossary.js` | Word Bank vocabulary |
| `js/zones/*.js` | The 3D levels: `ship`, `castle`, `les`, `city` |
| `js/engine/` | Controls, art loader, audio |
| `js/ui/` | Dialogue box, camera, journal, wrap-up |
| `tools/export-vo-script.mjs` | Regenerates the voiceover CSV |
