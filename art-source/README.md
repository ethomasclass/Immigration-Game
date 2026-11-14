# Art sources

Your original images from Google Flow, renamed to the file id the game uses. The game does **not** load these: it loads the prepared copies in `assets/art/`.

## Adding or replacing a character picture

1. Upload the picture from Flow anywhere in the repository (the top folder is fine), or save it here as `characters/portrait_<id>.jpg` (ids are listed in `docs/CHARACTER_ART_PROMPTS.md`).
2. If you uploaded it with Flow's own file name, add a line for it to `MAP` in `tools/prep-art.py`, pointing at its id.
3. Run:

```bash
python3 tools/prep-art.py --sort
```

The script moves any listed uploads into `characters/`, then for every picture removes the green background, trims to the figure, shrinks it, and writes `assets/art/portrait_<id>.webp`. It needs Python with Pillow and numpy. Processing all 78 pictures takes about three minutes.

If you cannot run the script, a green-screen JPG or PNG saved straight into `assets/art/` as `portrait_<id>.jpg` still works: the game removes the background itself when it loads. The prepared `.webp` files are smaller and look sharper.

## Still missing

- `portrait_girl` (Sarah, full body). Her two close-ups are here, so she has faces in conversations, but in the 3D world she still shows the plain stand-in figure.
