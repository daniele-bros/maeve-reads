#!/usr/bin/env python3
"""Generate phoneme and word clips with edge-tts. Not used at runtime."""

import asyncio
import os
import subprocess
import sys

VOICE = "en-US-JennyNeural"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PHONEMES = {
    "s": "sssss",
    "a": "aaa",
    "t": "tt",
    "p": "pp",
    "i": "iii",
    "n": "nnnn",
    "k": "k",
    "m": "mmmm",
    "d": "d",
    "g": "g",
    "h": "hhh",
    "b": "b",
    "f": "ffff",
    "u": "uh",
    "o": "aw",
    "at": "at",
    "og": "og",
    "un": "un",
    "ig": "ig",
    "us": "us",
    "e": "eh",
    "r": "rrr",
}

WORDS = """
cat hat bat dog log sun bun pig wig bee tree moon spoon fish dish ball cake
snake sock mouse bus nest book car apple tiger igloo nose sat pat tap pin tin
nap sip pan ant frog star fan
cap can pet pen ten net hen rat ran ram mat map mad dad sad ham kid sit bed
red sam hit the a is
""".split()

WORD_TEXT = {"a": "uh"}


async def save(text, path):
    import edge_tts

    last = None
    for kwargs in (
        {"rate": "-8%", "pitch": "+2Hz"},
        {"rate": "-8%"},
        {},
    ):
        try:
            comm = edge_tts.Communicate(text, VOICE, **kwargs)
            await comm.save(path)
            return
        except TypeError as exc:
            last = exc
            continue
        except Exception as exc:
            last = exc
            break
    raise RuntimeError(f"{path}: {last}")


async def main():
    jobs = []
    ph_dir = os.path.join(ROOT, "audio", "phonemes")
    w_dir = os.path.join(ROOT, "audio", "words")
    os.makedirs(ph_dir, exist_ok=True)
    os.makedirs(w_dir, exist_ok=True)
    for key, text in PHONEMES.items():
        jobs.append((text, os.path.join(ph_dir, key + ".mp3")))
    for word in WORDS:
        jobs.append((WORD_TEXT.get(word, word), os.path.join(w_dir, word + ".mp3")))

    sem = asyncio.Semaphore(6)
    made = []

    async def one(text, path):
        async with sem:
            if os.path.exists(path) and os.path.getsize(path) > 500:
                return
            await save(text, path)
            made.append(path)
            print("saved", os.path.relpath(path, ROOT), flush=True)

    await asyncio.gather(*(one(t, p) for t, p in jobs))

    for path in made:
        trimmed = path + ".trim.mp3"
        cmd = [
            "ffmpeg", "-y", "-loglevel", "error", "-i", path,
            "-af",
            "silenceremove=start_periods=1:start_silence=0.02:start_threshold=-45dB,"
            "areverse,silenceremove=start_periods=1:start_silence=0.04:start_threshold=-45dB,areverse",
            "-ac", "1", "-b:a", "64k", trimmed,
        ]
        subprocess.check_call(cmd)
        os.replace(trimmed, path)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as exc:
        print("AUDIO FAILED", exc, file=sys.stderr)
        sys.exit(1)
