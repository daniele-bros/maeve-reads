# Maeve Reads

A spoken, tap-first reading game for Maeve (age 4). After Play, Pip shows the chapters. Chapter 2 (reading words) is the one marked **You are here**. Chapter 1 is the first sounds. Chapter 3 is still coming.

**Play it:** [https://daniele-bros.github.io/maeve-reads/](https://daniele-bros.github.io/maeve-reads/)

It is a static site. There is no build step, no account, and no ads. Progress (stars, stickers, and which sounds are solid) stays in this browser's `localStorage` only.

## How to play

Maeve will use a Chromebook in landscape. A tablet or phone works too. She does not need to read the instructions. Pip says them.

1. Open the site and tap the big **Play** button. Sound starts on that first touch.
2. The chapter cards are in order. The big gold one says **You are here**. Tap it to play. Tap another open chapter to switch. Chapter 3 is still locked.
3. Inside a chapter, tap the glowing game. The speaker repeats the prompt.
4. Tap a picture, a letter, or a word. On a word-building game she can tap a letter or drag it. On Chrome she can also tap the microphone and say the answer. If the browser is not sure, Pip says "Let's try tapping!" and does not count it wrong.
5. A round is about five questions, then a sticker. The house means all done. The triangle means play more. The house in the corner goes back to the chapters.
6. Inside a chapter, the next game waits until the current one is solid (about 4 of the last 5 first tries). Chapter 2 does not wait for Chapter 1.

Chapter 2 adds c, k, e, h, r, m, and d, lots of word reading, spelling by tapping letters, and tiny sentences with **a**, **the**, and **is**. It is built for a finger: big targets, no pinch-zoom, and the same games on a Chromebook touchscreen, a tablet, or a phone.

## Grown-ups

Press and hold the small leaf in the top corner. From there you can:

- See progress for each sound
- Turn the microphone on or off
- Open any game, even a locked one
- Read a few offline practice ideas
- Erase progress (tap twice)

## Microphone

Listening uses the browser's built-in speech recognition (`SpeechRecognition` / `webkitSpeechRecognition`) and only starts after she taps the microphone. The game does not record, store, or upload audio itself.

Chrome (including ChromeOS) may send that audio to Google to turn it into text. If you would rather not, turn the microphone off in the grown-up corner. Tapping always works.

## Run it on this computer

```bash
python3 -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000). Use the local server or the GitHub Pages site so the microphone is allowed. Opening the file directly can block the mic.

## GitHub Pages

The site is published from `main` by [`.github/workflows/pages.yml`](.github/workflows/pages.yml). It runs on every push to `main` and can also be started by hand (`workflow_dispatch`). Asset paths are relative, so the game works at `/maeve-reads/`.

If that address does not load, a repo admin needs to set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**.

Why the lessons are in this order is written in [LEARNING.md](LEARNING.md).
