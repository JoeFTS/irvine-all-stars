#!/usr/bin/env python3
"""
Generate printable one-pager fundraising playbook PDFs for Irvine All-Stars.
Outputs 6 PDFs in public/fundraising/ matching the portal guide branding.

Run:  python3 scripts/generate-fundraising-playbooks.py
"""

import os
import re
import json
from fpdf import FPDF, XPos, YPos

# ------------------------------------------------------------------ #
#  Brand palette (matches scripts/generate-portal-guides.py)          #
# ------------------------------------------------------------------ #
FLAG_BLUE = (0, 40, 104)
FLAG_RED = (178, 34, 52)
WHITE = (255, 255, 255)
CHARCOAL = (28, 28, 28)
STAR_GOLD = (212, 168, 67)
GRAY_400 = (156, 163, 175)
GRAY_500 = (107, 114, 128)
GRAY_600 = (75, 85, 99)
GRAY_200 = (229, 231, 235)
LIGHT_BLUE = (230, 238, 250)
LIGHT_GOLD = (254, 243, 199)
LIGHT_RED = (252, 235, 237)
LIGHT_GREEN = (220, 252, 231)
OFF_WHITE = (250, 250, 248)

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "fundraising")
DATA_FILE = os.path.join(
    os.path.dirname(__file__), "..", "src", "content", "fundraising-ideas.generated.json"
)
os.makedirs(OUTPUT_DIR, exist_ok=True)


# ------------------------------------------------------------------ #
#  Data loader — reads JSON dumped from the TS source of truth        #
# ------------------------------------------------------------------ #
def _sanitize_text(value: str) -> str:
    """Replace smart quotes and other Unicode characters fpdf2's default
    core fonts can't render with plain ASCII equivalents."""
    replacements = {
        "\u2018": "'",
        "\u2019": "'",
        "\u201c": '"',
        "\u201d": '"',
        "\u2013": "-",
        "\u2014": "--",
        "\u2026": "...",
        "\u00a0": " ",
        "\u2022": "-",
    }
    for src, dst in replacements.items():
        value = value.replace(src, dst)
    return value


def load_ideas():
    """Load from the generated JSON file. Run
    `node scripts/dump-fundraising-ideas.mjs` first to refresh it from the TS
    source of truth in src/content/fundraising-ideas.ts."""
    if not os.path.exists(DATA_FILE):
        raise SystemExit(
            f"Missing data file {DATA_FILE}. "
            "Run `node scripts/dump-fundraising-ideas.mjs` first."
        )

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        ideas = json.load(f)

    for idea in ideas:
        for key in ("name", "tagline", "description", "typicalYield",
                    "effort", "timeline", "people"):
            if key in idea and isinstance(idea[key], str):
                idea[key] = _sanitize_text(idea[key])
        for key in ("quickSteps", "whatYouNeed", "tips"):
            if key in idea:
                idea[key] = [_sanitize_text(s) for s in idea[key]]
        if "stepByStep" in idea:
            idea["stepByStep"] = [
                {
                    "title": _sanitize_text(s["title"]),
                    "detail": _sanitize_text(s["detail"]),
                }
                for s in idea["stepByStep"]
            ]
    return ideas


# ------------------------------------------------------------------ #
#  PDF subclass                                                        #
# ------------------------------------------------------------------ #
class PlaybookPDF(FPDF):
    def __init__(self):
        super().__init__(orientation="P", unit="mm", format="Letter")
        # Letter size: 215.9mm x 279.4mm
        self.set_auto_page_break(auto=False)
        self.set_margins(12, 12, 12)
        self.page_w = 215.9
        self.page_h = 279.4

    def draw_header(self, idea):
        # Flag-blue bar
        self.set_fill_color(*FLAG_BLUE)
        self.rect(0, 0, self.page_w, 20, "F")
        # Star-gold accent stripe
        self.set_fill_color(*STAR_GOLD)
        self.rect(0, 20, self.page_w, 1.6, "F")
        # Flag-red thin stripe
        self.set_fill_color(*FLAG_RED)
        self.rect(0, 21.6, self.page_w, 0.8, "F")

        # Irvine All-Stars wordmark (left)
        self.set_xy(12, 5)
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(*WHITE)
        self.cell(100, 6, "IRVINE ALL-STARS", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_x(12)
        self.set_font("Helvetica", "", 8)
        self.set_text_color(*STAR_GOLD)
        self.cell(100, 4, "FUNDRAISING PLAYBOOK", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        # Page indicator (right)
        self.set_xy(self.page_w - 60, 7)
        self.set_font("Helvetica", "", 8)
        self.set_text_color(*WHITE)
        self.cell(48, 5, "2026 SEASON", align="R")

        # Title block
        y = 28
        self.set_xy(12, y)
        self.set_font("Helvetica", "B", 22)
        self.set_text_color(*FLAG_BLUE)
        title = idea["name"].upper()
        self.cell(0, 10, title, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        self.set_x(12)
        self.set_font("Helvetica", "I", 10)
        self.set_text_color(*GRAY_500)
        self.multi_cell(
            self.page_w - 24, 5, idea["tagline"],
            new_x=XPos.LMARGIN, new_y=YPos.NEXT
        )
        # Red divider
        self.ln(1)
        y2 = self.get_y()
        self.set_fill_color(*FLAG_RED)
        self.rect(12, y2, 40, 0.8, "F")

    def draw_footer(self):
        footer_y = self.page_h - 12
        self.set_fill_color(*FLAG_BLUE)
        self.rect(0, footer_y, self.page_w, 12, "F")
        self.set_xy(12, footer_y + 3)
        self.set_font("Helvetica", "", 7.5)
        self.set_text_color(*WHITE)
        self.cell(
            0, 4,
            "irvineallstars.com/coach   |   All fundraising must be coordinated "
            "with Irvine PONY   |   AllStars@irvinepony.com",
            align="L",
        )
        self.set_xy(12, footer_y + 7)
        self.set_font("Helvetica", "I", 6.5)
        self.set_text_color(*STAR_GOLD)
        self.cell(
            0, 4,
            "*  *  *   Irvine PONY All-Stars 2026   *  *  *",
            align="L",
        )

    def draw_at_a_glance(self, idea, x, y, width):
        """Stat box (right column)."""
        self.set_fill_color(*LIGHT_BLUE)
        self.rect(x, y, width, 48, "F")
        # Header strip
        self.set_fill_color(*FLAG_BLUE)
        self.rect(x, y, width, 7, "F")
        self.set_xy(x + 2, y + 1.2)
        self.set_font("Helvetica", "B", 8)
        self.set_text_color(*WHITE)
        self.cell(width - 4, 5, "AT A GLANCE")

        rows = [
            ("Typical yield", idea["typicalYield"]),
            ("Effort", idea["effort"]),
            ("Timeline", idea["timeline"]),
            ("People", idea["people"]),
        ]
        ry = y + 9
        for label, value in rows:
            self.set_xy(x + 3, ry)
            self.set_font("Helvetica", "B", 7)
            self.set_text_color(*FLAG_RED)
            self.cell(width - 6, 3.2, label.upper())
            self.set_xy(x + 3, ry + 3.4)
            self.set_font("Helvetica", "", 7.5)
            self.set_text_color(*CHARCOAL)
            self.multi_cell(width - 6, 3.6, value)
            ry = self.get_y() + 1.2

    def draw_what_you_need(self, items, x, y, width):
        """Checklist (right column, below stat box)."""
        # Header strip
        self.set_fill_color(*FLAG_RED)
        self.rect(x, y, width, 7, "F")
        self.set_xy(x + 2, y + 1.2)
        self.set_font("Helvetica", "B", 8)
        self.set_text_color(*WHITE)
        self.cell(width - 4, 5, "WHAT YOU NEED")

        # Box body
        box_h = max(40, 3 + len(items) * 5.2)
        self.set_fill_color(*OFF_WHITE)
        self.rect(x, y + 7, width, box_h, "F")

        ry = y + 9
        for item in items:
            self.set_xy(x + 3, ry)
            # Empty checkbox
            self.set_draw_color(*FLAG_BLUE)
            self.set_line_width(0.25)
            self.rect(x + 3, ry + 0.4, 2.4, 2.4)
            self.set_xy(x + 7, ry)
            self.set_font("Helvetica", "", 7.5)
            self.set_text_color(*CHARCOAL)
            self.multi_cell(width - 10, 3.2, item)
            ry = self.get_y() + 0.6

    def section_label(self, x, y, text, width, fill=FLAG_BLUE):
        self.set_fill_color(*fill)
        self.rect(x, y, width, 6, "F")
        self.set_xy(x + 2, y + 0.8)
        self.set_font("Helvetica", "B", 8)
        self.set_text_color(*WHITE)
        self.cell(width - 4, 4.4, text.upper())

    def draw_description(self, text, x, y, width):
        self.set_xy(x, y)
        self.set_font("Helvetica", "", 9)
        self.set_text_color(*CHARCOAL)
        self.multi_cell(width, 4.2, text)
        return self.get_y()

    def draw_steps(self, steps, x, y, width):
        current_y = y
        for i, step in enumerate(steps, 1):
            # Number circle
            self.set_fill_color(*FLAG_BLUE)
            self.ellipse(x, current_y, 5.5, 5.5, "F")
            self.set_xy(x, current_y + 0.6)
            self.set_font("Helvetica", "B", 7)
            self.set_text_color(*WHITE)
            self.cell(5.5, 4.2, str(i), align="C")

            # Title
            self.set_xy(x + 7.5, current_y)
            self.set_font("Helvetica", "B", 8.5)
            self.set_text_color(*CHARCOAL)
            self.cell(width - 9, 4.4, step["title"])

            # Detail
            self.set_xy(x + 7.5, current_y + 4.4)
            self.set_font("Helvetica", "", 7.5)
            self.set_text_color(*GRAY_600)
            self.multi_cell(width - 9, 3.4, step["detail"])

            current_y = self.get_y() + 1.4
        return current_y

    def draw_tips(self, tips, x, y, width):
        # Header strip
        self.set_fill_color(*STAR_GOLD)
        self.rect(x, y, width, 6, "F")
        self.set_xy(x + 2, y + 0.8)
        self.set_font("Helvetica", "B", 8)
        self.set_text_color(*WHITE)
        self.cell(width - 4, 4.4, "TIPS FROM EXPERIENCE")

        ry = y + 7
        for i, tip in enumerate(tips, 1):
            self.set_xy(x + 2, ry)
            self.set_font("Helvetica", "B", 7.5)
            self.set_text_color(*FLAG_RED)
            self.cell(4, 3.4, f"{i}.")
            self.set_xy(x + 6, ry)
            self.set_font("Helvetica", "", 7.5)
            self.set_text_color(*CHARCOAL)
            self.multi_cell(width - 8, 3.3, tip)
            ry = self.get_y() + 0.6
        return ry


# ------------------------------------------------------------------ #
#  Render                                                              #
# ------------------------------------------------------------------ #
def render_playbook(idea):
    pdf = PlaybookPDF()
    pdf.add_page()
    pdf.draw_header(idea)

    # Layout columns
    left_x = 12
    right_x = 135
    left_w = 118
    right_w = 68.9

    # Description under title
    y = 55
    desc_end = pdf.draw_description(idea["description"], left_x, y, left_w)

    # Steps section label
    steps_label_y = desc_end + 3
    pdf.section_label(left_x, steps_label_y, "STEP-BY-STEP PLAYBOOK", left_w)
    steps_y = steps_label_y + 9
    tips_start_y = pdf.draw_steps(idea["stepByStep"], left_x, steps_y, left_w)

    # Right column: At a Glance + What You Need
    pdf.draw_at_a_glance(idea, right_x, 55, right_w)
    pdf.draw_what_you_need(idea["whatYouNeed"], right_x, 108, right_w)

    # Tips — place at bottom of left column above footer
    tips_y = max(tips_start_y + 2, pdf.page_h - 50)
    if tips_y > pdf.page_h - 28:
        tips_y = pdf.page_h - 50
    pdf.draw_tips(idea["tips"], left_x, tips_y, left_w)

    pdf.draw_footer()

    output_path = os.path.join(OUTPUT_DIR, f"{idea['slug']}-playbook.pdf")
    pdf.output(output_path)
    print(f"  \u2713 {output_path}")


def main():
    ideas = load_ideas()
    print(f"Generating {len(ideas)} fundraising playbooks...")
    for idea in ideas:
        render_playbook(idea)
    print("Done.")


if __name__ == "__main__":
    main()
