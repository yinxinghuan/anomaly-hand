#!/usr/bin/env python3
"""Raster finishing for the transit-generated Anomaly Hand key art."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "_artifacts" / "poster" / "poster-1784233999125.png"
SOURCE_RESULT_URL = "https://cdn.aiwaves.tech/prod/telegram/avatar/0/1784233986379666.webp"
OUTPUT = ROOT / "public" / "poster.png"
THUMB = ROOT / "_artifacts" / "poster" / "poster-160.png"
RECORD = ROOT / "doc" / "poster-generation.json"
FONT = ROOT / "src" / "fonts" / "OstrichSans-AH.otf"


def normalize_spot_colors(image: Image.Image) -> Image.Image:
    """Map violet/magenta contamination into the established vermilion ink."""
    hsv = image.convert("HSV")
    pixels = hsv.load()
    width, height = hsv.size
    for y in range(height):
        for x in range(width):
            hue, saturation, value = pixels[x, y]
            # PIL hue: 0..255. Magenta/violet occupies roughly 190..235.
            if 188 <= hue <= 238 and saturation >= 80:
                pixels[x, y] = (250, min(255, saturation + 12), value)
    rgb = hsv.convert("RGB")
    rgb_pixels = rgb.load()
    for y in range(height):
        for x in range(width):
            red, green, blue = rgb_pixels[x, y]
            if red >= 110 and blue >= 90 and green < min(red, blue) * 0.72:
                luminance = max(red, blue)
                rgb_pixels[x, y] = (luminance, min(86, green), min(68, blue // 3))
    return rgb


def fit_font(draw: ImageDraw.ImageDraw, text: str, max_width: int) -> ImageFont.FreeTypeFont:
    size = 154
    while size >= 90:
        font = ImageFont.truetype(str(FONT), size)
        box = draw.textbbox((0, 0), text, font=font, stroke_width=0)
        if box[2] - box[0] <= max_width:
            return font
        size -= 2
    return ImageFont.truetype(str(FONT), 90)


def main() -> None:
    if not SOURCE.exists():
        raise FileNotFoundError(SOURCE)

    image = normalize_spot_colors(Image.open(SOURCE).convert("RGB"))
    width, height = image.size

    # Cover the model's clipped title with a material title band.
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    band_bottom = 220
    for y in range(band_bottom):
        alpha = 246 if y < 174 else int(246 * (1 - (y - 174) / (band_bottom - 174)))
        overlay_draw.rectangle((0, y, width, y), fill=(9, 11, 12, max(0, alpha)))
    # Sparse registration wear, still raster finishing rather than UI artwork.
    for x in range(32, width, 39):
        overlay_draw.line((x, 22, x + 12, 22), fill=(231, 222, 202, 28), width=1)
    image = Image.alpha_composite(image.convert("RGBA"), overlay)

    title_layer = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(title_layer)
    title = "ANOMALY HAND"
    font = fit_font(draw, title, width - 112)
    box = draw.textbbox((0, 0), title, font=font)
    title_width = box[2] - box[0]
    title_height = box[3] - box[1]
    x = (width - title_width) // 2 - box[0]
    y = 56 - box[1]

    # Hard registration offsets match the game's print system.
    draw.text((x - 4, y + 2), title, font=font, fill=(240, 75, 53, 220))
    draw.text((x + 4, y - 1), title, font=font, fill=(25, 201, 195, 210))
    draw.text((x, y), title, font=font, fill=(244, 239, 227, 255))
    draw.line((56, y + title_height + 20, width - 56, y + title_height + 20), fill=(231, 222, 202, 90), width=1)

    final = Image.alpha_composite(image, title_layer).convert("RGB")
    final.save(OUTPUT, "PNG", optimize=True)
    final.resize((160, 160), Image.Resampling.LANCZOS).save(THUMB, "PNG", optimize=True)

    record = json.loads(RECORD.read_text(encoding="utf-8"))
    record.update(
        {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "file": "public/poster.png",
            "candidate": str(SOURCE.relative_to(ROOT)),
            "result_url": SOURCE_RESULT_URL,
            "finishing": {
                "type": "raster color normalization and exact title typesetting",
                "font": "Ostrich Sans Heavy",
                "title_safe_area": "top 22%",
                "thumbnail": str(THUMB.relative_to(ROOT)),
            },
            "source_type": "Aigram transit raster generation with raster typographic finishing",
        }
    )
    RECORD.write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"saved {OUTPUT}")
    print(f"saved {THUMB}")


if __name__ == "__main__":
    main()
