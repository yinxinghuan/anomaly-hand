#!/usr/bin/env python3
"""Build a temporary img2img reference: approved card language around one identity cutout.

The output is only a private generation aid. It is never imported by the game.
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageOps


ROOT = Path(__file__).resolve().parents[1]
STYLE_FILES = {
    "lacquer-war-chronicle": ROOT / "_artifacts/heroes/style-a-las-reference.png",
    "astral-reliquary": ROOT / "_artifacts/heroes/style-b-las-reference.png",
    "anomaly-dossier": ROOT / "_artifacts/heroes/style-c-smith-reference.png",
}


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("Usage: build-style-identity-ref.py <hero-id> <style-id>")

    hero_id, style_id = sys.argv[1:]
    style_path = STYLE_FILES.get(style_id)
    if style_path is None:
        raise SystemExit(f"Unknown style: {style_id}")
    cutout_path = ROOT / f"src/AnomalyHand/img/heroes/cutouts/{hero_id}.png"
    if not cutout_path.exists():
        raise SystemExit(f"Missing cutout: {cutout_path}")

    size = (768, 960)
    style = Image.open(style_path).convert("RGB")
    # The C exploration card was photographed against a pale paper surround. It is
    # useful in the board, but not part of the finished C system; crop it out before
    # it is used as a model reference so the output stays full-bleed charcoal.
    if style_id == "anomaly-dossier":
        width, height = style.size
        style = style.crop((round(width * 0.075), round(height * 0.045), round(width * 0.925), round(height * 0.955)))
    canvas = ImageOps.fit(style, size, method=Image.Resampling.LANCZOS)
    canvas = ImageEnhance.Brightness(canvas).enhance(0.62).convert("RGBA")

    # Keep only the reference's outer edge language. The old character and its symbol
    # band must be fully erased: leaving them visible makes the image model treat them
    # as a second character or as pseudo-writing in the finished card.
    overlay = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    draw.polygon([(54, 86), (714, 86), (714, 892), (650, 926), (54, 926)], fill=(9, 12, 14, 252))
    canvas.alpha_composite(overlay)

    cutout = Image.open(cutout_path).convert("RGBA")
    cutout.thumbnail((620, 760), Image.Resampling.LANCZOS)
    x = (size[0] - cutout.width) // 2
    y = 92 + max(0, (706 - cutout.height) // 2)
    canvas.alpha_composite(cutout, (x, y))

    output_dir = ROOT / "_artifacts/heroes/combined-refs"
    output_dir.mkdir(parents=True, exist_ok=True)
    output = output_dir / f"{hero_id}-{style_id}.png"
    canvas.convert("RGB").save(output, "PNG", optimize=True)
    print(output)


if __name__ == "__main__":
    main()
