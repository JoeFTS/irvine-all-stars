#!/usr/bin/env python3
"""Generate Coach Portal Guide PDF for Irvine All-Stars."""

import os
from fpdf import FPDF

# Colors
FLAG_BLUE = (27, 58, 107)
FLAG_RED = (178, 34, 52)
STAR_GOLD = (212, 168, 67)
CHARCOAL = (44, 44, 44)
WHITE = (255, 255, 255)
LIGHT_GRAY = (200, 200, 200)
CAPTION_GRAY = (120, 120, 120)

SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), "screenshots", "coach")
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "Coach-Portal-Guide.pdf")


class CoachGuide(FPDF):
    def __init__(self):
        super().__init__(format="letter")
        self.set_auto_page_break(auto=True, margin=20)
        self.is_title_page = False
        self.chapter_pages = []  # (title, page_number)

    def header(self):
        if self.page_no() == 0:
            return
        # Red/blue/red stripe bar at top
        y = 0
        self.set_draw_color(*FLAG_RED)
        self.set_line_width(0.8)
        self.line(0, y + 1, self.w, y + 1)
        self.set_draw_color(*FLAG_BLUE)
        self.line(0, y + 2.5, self.w, y + 2.5)
        self.set_draw_color(*FLAG_RED)
        self.line(0, y + 4, self.w, y + 4)

    def footer(self):
        if self.is_title_page:
            return
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(*CAPTION_GRAY)
        self.cell(0, 10, f"Page {self.page_no()}", align="C")

    def add_title_page(self):
        self.is_title_page = True
        self.add_page()
        self.ln(40)
        # Gold stars + org name
        self.set_font("Helvetica", "B", 22)
        self.set_text_color(*STAR_GOLD)
        self.cell(0, 12, "*  IRVINE ALL-STARS  *", align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(20)
        # Title
        self.set_font("Helvetica", "B", 40)
        self.set_text_color(*FLAG_BLUE)
        self.cell(0, 18, "Coach Portal", align="C", new_x="LMARGIN", new_y="NEXT")
        self.cell(0, 18, "Guide", align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(15)
        # Subtitle
        self.set_font("Helvetica", "", 16)
        self.set_text_color(*CHARCOAL)
        self.cell(0, 10, "2026 All-Stars Season", align="C", new_x="LMARGIN", new_y="NEXT")
        # Decorative line
        self.ln(10)
        cx = self.w / 2
        self.set_draw_color(*STAR_GOLD)
        self.set_line_width(0.8)
        self.line(cx - 40, self.get_y(), cx + 40, self.get_y())
        self.ln(60)
        # Bottom
        self.set_font("Helvetica", "", 14)
        self.set_text_color(*FLAG_BLUE)
        self.cell(0, 10, "Irvine Pony Baseball", align="C", new_x="LMARGIN", new_y="NEXT")
        self.is_title_page = False

    def add_toc_page(self, chapters):
        self.add_page()
        self.set_font("Helvetica", "B", 24)
        self.set_text_color(*FLAG_BLUE)
        self.cell(0, 12, "Table of Contents", new_x="LMARGIN", new_y="NEXT")
        # Blue line
        self.set_draw_color(*FLAG_BLUE)
        self.set_line_width(0.5)
        self.line(self.l_margin, self.get_y() + 2, self.w - self.r_margin, self.get_y() + 2)
        self.ln(10)

        self.set_font("Helvetica", "", 12)
        self.set_text_color(*CHARCOAL)
        for i, title in enumerate(chapters, 1):
            self.set_font("Helvetica", "B", 12)
            self.set_text_color(*FLAG_RED)
            self.cell(20, 8, f"{i}.")
            self.set_font("Helvetica", "", 12)
            self.set_text_color(*CHARCOAL)
            self.cell(0, 8, title, new_x="LMARGIN", new_y="NEXT")
            self.ln(1)

    def start_chapter(self, number, title):
        self.add_page()
        # Chapter number in red
        self.set_font("Helvetica", "B", 14)
        self.set_text_color(*FLAG_RED)
        self.cell(0, 8, f"CHAPTER {number}", new_x="LMARGIN", new_y="NEXT")
        self.ln(2)
        # Chapter title in blue
        self.set_font("Helvetica", "B", 24)
        self.set_text_color(*FLAG_BLUE)
        self.cell(0, 12, title, new_x="LMARGIN", new_y="NEXT")
        # Blue line
        self.set_draw_color(*FLAG_BLUE)
        self.set_line_width(0.5)
        self.line(self.l_margin, self.get_y() + 2, self.w - self.r_margin, self.get_y() + 2)
        self.ln(8)

    def body_text(self, text):
        self.set_font("Helvetica", "", 11)
        self.set_text_color(*CHARCOAL)
        self.multi_cell(0, 6, text)
        self.ln(3)

    def section_header(self, text):
        self.ln(2)
        self.set_font("Helvetica", "B", 16)
        self.set_text_color(*FLAG_BLUE)
        self.cell(0, 9, text, new_x="LMARGIN", new_y="NEXT")
        self.ln(3)

    def bullet(self, text):
        self.set_font("Helvetica", "", 11)
        self.set_text_color(*CHARCOAL)
        x = self.get_x()
        self.cell(8, 6, "-")
        self.multi_cell(0, 6, text)
        self.ln(1)

    def add_screenshot(self, filename, caption):
        filepath = os.path.join(SCREENSHOT_DIR, filename)
        if not os.path.exists(filepath):
            self.set_font("Helvetica", "I", 9)
            self.set_text_color(*CAPTION_GRAY)
            self.cell(0, 6, f"[Screenshot not available: {filename}]", align="C", new_x="LMARGIN", new_y="NEXT")
            self.ln(3)
            return

        # Calculate dimensions — 85% of content width
        content_w = self.w - self.l_margin - self.r_margin
        img_w = content_w * 0.85
        img_x = self.l_margin + (content_w - img_w) / 2

        # Check if we need a page break (estimate image height)
        # Read image to get aspect ratio
        from PIL import Image
        with Image.open(filepath) as im:
            w_px, h_px = im.size
        aspect = h_px / w_px
        img_h = img_w * aspect

        # Cap image height to avoid overflowing a page
        max_h = self.h - self.get_y() - 30  # leave room for caption + footer
        if img_h > max_h:
            if max_h < 40:
                self.add_page()
                max_h = self.h - self.get_y() - 30
            if img_h > max_h:
                img_h = max_h
                img_w = img_h / aspect

        img_x = self.l_margin + (content_w - img_w) / 2

        # Light gray border
        self.set_draw_color(*LIGHT_GRAY)
        self.set_line_width(0.3)
        border_pad = 1.5
        self.rect(img_x - border_pad, self.get_y() - border_pad,
                  img_w + 2 * border_pad, img_h + 2 * border_pad)

        self.image(filepath, x=img_x, y=self.get_y(), w=img_w, h=img_h)
        self.set_y(self.get_y() + img_h + 3)

        # Caption
        self.set_font("Helvetica", "I", 9)
        self.set_text_color(*CAPTION_GRAY)
        self.cell(0, 5, caption, align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(5)

    def add_back_page(self):
        self.add_page()
        self.ln(70)
        self.set_font("Helvetica", "B", 28)
        self.set_text_color(*FLAG_BLUE)
        self.cell(0, 14, "Go All-Stars!", align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(15)
        self.set_font("Helvetica", "", 16)
        self.set_text_color(*STAR_GOLD)
        self.cell(0, 10, "irvineallstars.com", align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(10)
        # Decorative line
        cx = self.w / 2
        self.set_draw_color(*STAR_GOLD)
        self.set_line_width(0.8)
        self.line(cx - 40, self.get_y(), cx + 40, self.get_y())
        self.ln(15)
        self.set_font("Helvetica", "", 12)
        self.set_text_color(*CHARCOAL)
        self.cell(0, 8, "Irvine Pony Baseball -- 2026 All-Stars Season", align="C", new_x="LMARGIN", new_y="NEXT")


def build_guide():
    pdf = CoachGuide()
    pdf.set_margins(20, 15, 20)

    chapters = [
        "Getting Started",
        "Tryouts",
        "Entering Scores",
        "Team Roster",
        "Binder Checklist",
        "Pitching Log",
        "Contracts",
        "Certifications",
        "Tournament Rules",
        "Tournaments",
        "Updates & Help",
    ]

    # Title page
    pdf.add_title_page()

    # Table of Contents
    pdf.add_toc_page(chapters)

    # Chapter 1: Getting Started
    pdf.start_chapter(1, "Getting Started")
    pdf.section_header("Welcome")
    pdf.body_text(
        "Welcome to the Irvine All-Stars Coach Portal! This guide covers everything "
        "you need to manage your team -- from tryout scores to tournament compliance."
    )
    pdf.section_header("How to Access")
    pdf.body_text(
        "Go to irvineallstars.com and sign in with your coach credentials. "
        "You will be directed to your Coach Portal dashboard."
    )
    pdf.section_header("Dashboard Overview")
    pdf.body_text(
        "Your dashboard shows your division, compliance progress, action items, "
        "upcoming dates, announcements, and quick links to all portal sections."
    )
    pdf.add_screenshot("dashboard-top.png", "Coach dashboard overview")
    pdf.section_header("Sidebar Navigation")
    pdf.body_text(
        "All portal sections are accessible from the left sidebar. Click any item "
        "to navigate directly to that section."
    )
    pdf.section_header("Action Items")
    pdf.body_text(
        "Red badges on your dashboard show what needs your attention, such as "
        "incomplete certifications or unacknowledged tournament rules."
    )
    pdf.add_screenshot("dashboard-actions.png", "Action items requiring attention")

    # Chapter 2: Tryouts
    pdf.start_chapter(2, "Tryouts")
    pdf.body_text(
        "The Tryouts page shows all registered players for your division. "
        "Each player card displays the player's name, preferred position, and parent contact information."
    )
    pdf.add_screenshot("tryouts.png", "Tryout registrations")

    # Chapter 3: Entering Scores
    pdf.start_chapter(3, "Entering Scores")
    pdf.body_text(
        "Score players during tryouts using the evaluation form. Enter scores for "
        "each player across the following categories:"
    )
    pdf.bullet("Hitting")
    pdf.bullet("Fielding")
    pdf.bullet("Throwing")
    pdf.bullet("Speed")
    pdf.bullet("Baseball IQ")
    pdf.body_text(
        "Scores help the coaching staff make informed decisions about team selection."
    )
    pdf.add_screenshot("scores.png", "Score entry page")

    # Chapter 4: Team Roster
    pdf.start_chapter(4, "Team Roster")
    pdf.body_text(
        "After players are selected, the Roster page shows your full team. "
        "Each player card includes detailed information to help you manage your roster."
    )
    pdf.section_header("Player Information")
    pdf.bullet("Name, division, jersey number")
    pdf.bullet("Positions, bat/throw preference")
    pdf.section_header("Contact Information")
    pdf.bullet("Parent name, email, and phone number")
    pdf.bullet("Emergency contact")
    pdf.bullet("Second parent (if provided)")
    pdf.section_header("Compliance Badges")
    pdf.body_text(
        "Each player card shows compliance badges for: birth certificate, photo, "
        "contract, and medical release. When all documents are complete, the player "
        'receives a "Tournament Ready" badge.'
    )
    pdf.add_screenshot("roster.png", "Team roster with player cards")

    # Chapter 5: Binder Checklist
    pdf.start_chapter(5, "Binder Checklist")
    pdf.body_text(
        "The Binder Checklist tracks everything needed for your tournament binder. "
        "This must be 100% complete before your pre-tournament manager meeting."
    )
    pdf.section_header("Required Items")
    pdf.bullet("Team roster")
    pdf.bullet("Medical forms")
    pdf.bullet("Birth certificates")
    pdf.bullet("Insurance documentation")
    pdf.bullet("Coaching certifications")
    pdf.add_screenshot("checklist.png", "Binder checklist")

    # Chapter 6: Pitching Log
    pdf.start_chapter(6, "Pitching Log")
    pdf.body_text(
        "Track pitch counts per player per game using the Pitching Log. "
        "PONY rules limit pitch counts by age -- the log helps you stay compliant "
        "and avoid rule violations during tournaments."
    )
    pdf.add_screenshot("pitching-log.png", "Pitching log")

    # Chapter 7: Contracts
    pdf.start_chapter(7, "Contracts")
    pdf.body_text(
        "The Contracts page shows which parents have signed the player contract. "
        "Use this page to track contract completion across your entire team."
    )
    pdf.add_screenshot("contracts.png", "Contract tracking")

    # Chapter 8: Certifications
    pdf.start_chapter(8, "Certifications")
    pdf.body_text(
        "Upload your required coaching certifications directly from this page."
    )
    pdf.section_header("Required Certifications")
    pdf.bullet("Concussion certification")
    pdf.bullet("Cardiac arrest certification")
    pdf.body_text(
        "Upload your certificates as soon as possible to ensure your compliance "
        "status is up to date before tournament season begins."
    )
    pdf.add_screenshot("certifications.png", "Certification uploads")

    # Chapter 9: Tournament Rules
    pdf.start_chapter(9, "Tournament Rules")
    pdf.body_text(
        "Review and acknowledge PONY tournament rules before your first tournament. "
        "The rules cover:"
    )
    pdf.bullet("Player eligibility requirements")
    pdf.bullet("Pitch count regulations")
    pdf.bullet("Roster rules")
    pdf.bullet("Protest procedures")
    pdf.add_screenshot("tournament-rules.png", "Tournament rules")

    # Chapter 10: Tournaments
    pdf.start_chapter(10, "Tournaments")
    pdf.body_text(
        "View upcoming tournaments for your division. Each tournament card shows "
        "dates, location, host organization, and registration links."
    )
    pdf.add_screenshot("tournaments.png", "Upcoming tournaments")

    # Chapter 11: Updates & Help
    pdf.start_chapter(11, "Updates & Help")
    pdf.section_header("Updates")
    pdf.body_text(
        "The Updates page shows all announcements in one place. Check here "
        "regularly for important information from the All-Stars board."
    )
    pdf.add_screenshot("updates.png", "Updates page")
    pdf.section_header("Help & Guides")
    pdf.body_text(
        "The Help page provides a comprehensive FAQ with accordion sections "
        "covering all coach portal features."
    )
    pdf.add_screenshot("help.png", "Help & Guides page")
    pdf.section_header("Quick Links")
    pdf.body_text(
        "Quick links on your dashboard provide fast access to key sections "
        "of the portal."
    )
    pdf.add_screenshot("dashboard-quicklinks.png", "Quick links")
    pdf.section_header("Contact")
    pdf.body_text(
        "For questions or support, email AllStars@irvinepony.com."
    )

    # Back page
    pdf.add_back_page()

    # Save
    output = os.path.abspath(OUTPUT_PATH)
    pdf.output(output)
    size_kb = os.path.getsize(output) / 1024
    print(f"PDF created: {output}")
    print(f"File size: {size_kb:.1f} KB ({size_kb/1024:.2f} MB)")
    print(f"Pages: {pdf.pages_count}")


if __name__ == "__main__":
    build_guide()
