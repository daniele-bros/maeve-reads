#!/usr/bin/env python3
"""Replace letter-name clips with short phoneme bursts, and cap every phoneme at 0.55s."""

import math
import os
import random
import struct
import subprocess
import wave

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PH = os.path.join(ROOT, "audio", "phonemes")
SR = 22050


def write_wav(path, samples):
    peak = max(1e-6, max(abs(s) for s in samples))
    gain = 0.82 / peak
    frames = b"".join(struct.pack("<h", max(-32767, min(32767, int(s * gain * 32767)))) for s in samples)
    with wave.open(path, "wb") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(SR)
        handle.writeframes(frames)


def burst(dur, brightness):
    n = int(SR * dur)
    out = []
    prev = 0.0
    for i in range(n):
        t = i / SR
        env = math.exp(-t * 28) * (1 if t > 0.012 else t / 0.012)
        noise = random.uniform(-1, 1)
        # high-pass so it stays a puff, not a vowel
        prev = noise - prev * (0.2 + brightness)
        out.append(prev * env * (0.4 + brightness))
    return out


def main():
    os.makedirs(PH, exist_ok=True)
    stops = {
        "k": (0.09, 0.85),
        "t": (0.07, 0.95),
        "p": (0.08, 0.35),
        "d": (0.09, 0.7),
        "b": (0.08, 0.3),
        "g": (0.09, 0.55),
    }
    for name, (dur, bright) in stops.items():
        wav = os.path.join(PH, name + ".wav")
        mp3 = os.path.join(PH, name + ".mp3")
        write_wav(wav, burst(dur, bright))
        subprocess.check_call(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-b:a", "64k", mp3])
        os.remove(wav)
        print("burst", name)

    for name in os.listdir(PH):
        if not name.endswith(".mp3"):
            continue
        src = os.path.join(PH, name)
        if name[:-4] in stops:
            continue
        out = src + ".cap.mp3"
        subprocess.check_call([
            "ffmpeg", "-y", "-loglevel", "error", "-i", src, "-t", "0.5",
            "-af", "afade=t=out:st=0.38:d=0.12",
            "-b:a", "64k", out,
        ])
        os.replace(out, src)
        print("trim", name)


if __name__ == "__main__":
    main()
