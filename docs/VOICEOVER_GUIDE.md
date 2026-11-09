# Voiceover Guide (ElevenLabs)

Every spoken line in the game has a stable **file name**. If a matching MP3 exists, the game plays it. If it doesn't, the line shows as text only, or is read by the browser voice if the student turns on "Read lines aloud" in Settings.

## 1. Get the script

The full script is in **`assets/audio/vo_script.csv`** (open it in Google Sheets or Excel). It has four columns:

| file | character | voice_notes | text |
|---|---|---|---|
| `rivka.why.2.mp3` | Rivka Abramowitz | Girl, about 16. Jewish, from near Kiev… | Mobs attacked Jewish towns… |

The current script has **292 lines** across **34 voices**, including the narrator. The `voice_notes` column is a casting note for picking or designing each ElevenLabs voice.

If you change any dialogue, regenerate the CSV:

```bash
node tools/export-vo-script.mjs
```

## 2. Generate in ElevenLabs

1. Create one voice per character, using the casting notes. Keep the same voice for a character across all their lines.
2. For each row, paste the `text` into ElevenLabs Text to Speech and download the MP3.
3. **Rename the file exactly** to the `file` column, e.g. `rivka.why.2.mp3`.
4. Put it in **`assets/audio/vo/`**.

Tips:
- Use MP3 at 64–96 kbps, mono. That's plenty for speech and keeps the game fast on Chromebooks.
- For accents, describe them in the voice design prompt, e.g. "light Yiddish accent". Avoid exaggerated caricature.
- Lines from `narrator` (title cards `card.*` and documents `doc.*`) are the Editor / narrator voice.
- For bulk generation, the ElevenLabs API can read the CSV row by row. Ask Claude for a script if you want this.

## 3. How file names work

`<conversation>.<node>.<line number>`, e.g. `moishe.work.3` is the 3rd line of the `work` part of Moishe's conversation.

**If you add, remove, or reorder lines in `js/data/dialogue.js`, the numbers can shift.** Re-export the CSV and rename or re-record the affected files.

## 4. Optional ambient sound

Drop a looping recording at `assets/audio/amb_<zone>.mp3` (`amb_ship`, `amb_castle`, `amb_les`, `amb_city`) and it replaces the built-in synthesized background noise. ElevenLabs Sound Effects works well for this (e.g. "creaking wooden ship hold, waves, murmuring passengers").
