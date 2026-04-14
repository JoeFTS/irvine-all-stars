#!/usr/bin/env python3
"""Generate the Irvine All-Stars Admin Portal Guide PDF using fpdf2."""

import os
from fpdf import FPDF

# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SCREENSHOTS_DIR = os.path.join(SCRIPT_DIR, "screenshots", "admin")
OUTPUT_PATH = os.path.join(os.path.dirname(SCRIPT_DIR), "Admin-Portal-Guide.pdf")

# Colors
FLAG_BLUE = (27, 58, 107)
FLAG_RED = (178, 34, 52)
STAR_GOLD = (212, 168, 67)
CHARCOAL = (44, 44, 44)
WHITE = (255, 255, 255)
LIGHT_GRAY = (200, 200, 200)
CAPTION_GRAY = (120, 120, 120)


class AdminGuide(FPDF):
    def __init__(self):
        super().__init__(orientation="P", unit="mm", format="Letter")
        self.set_auto_page_break(auto=True, margin=20)
        self.set_margins(20, 15, 20)
        self._is_title_page = False
        self._toc_entries = []
        self._toc_placeholder_page = None

    def header(self):
        if self._is_title_page:
            return
        # Stripe bar: red / blue / red at very top
        y = 0
        for color in [FLAG_RED, FLAG_BLUE, FLAG_RED]:
            self.set_fill_color(*color)
            self.rect(0, y, self.w, 1, "F")
            y += 1
        self.set_y(15)

    def footer(self):
        if self._is_title_page:
            return
        self.set_y(-15)
        self.set_font("Helvetica", "", 9)
        self.set_text_color(*LIGHT_GRAY)
        self.cell(0, 10, f"Page {self.page_no()}", align="C")

    # ── Helpers ──

    def _chapter_title(self, number, title):
        self.set_font("Helvetica", "B", 24)
        self.set_text_color(*FLAG_BLUE)
        # Chapter number in red
        num_text = f"Chapter {number}: "
        num_w = self.get_string_width(num_text)
        x_start = self.get_x()
        self.set_text_color(*FLAG_RED)
        self.cell(num_w, 12, num_text, new_x="END")
        self.set_text_color(*FLAG_BLUE)
        self.cell(0, 12, title, new_x="LMARGIN", new_y="NEXT")
        # Thin blue line
        self.set_draw_color(*FLAG_BLUE)
        self.set_line_width(0.5)
        self.line(20, self.get_y() + 2, self.w - 20, self.get_y() + 2)
        self.ln(8)

    def _section_header(self, text):
        self.set_font("Helvetica", "B", 16)
        self.set_text_color(*FLAG_BLUE)
        self.cell(0, 10, text, new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def _body(self, text):
        self.set_font("Helvetica", "", 11)
        self.set_text_color(*CHARCOAL)
        self.multi_cell(0, 6, text)
        self.ln(3)

    def _bullet(self, text):
        self.set_font("Helvetica", "", 11)
        self.set_text_color(*CHARCOAL)
        x = self.get_x()
        self.cell(6, 6, "-", new_x="END")
        self.multi_cell(0, 6, text)
        self.ln(1)

    def _screenshot(self, filename, caption):
        path = os.path.join(SCREENSHOTS_DIR, filename)
        if not os.path.exists(path):
            self.set_font("Helvetica", "I", 9)
            self.set_text_color(*CAPTION_GRAY)
            self.cell(0, 6, f"[Screenshot not found: {filename}]", new_x="LMARGIN", new_y="NEXT")
            self.ln(3)
            return
        # Calculate image width at 85% of content width
        content_w = self.w - 40  # 20mm margins each side
        img_w = content_w * 0.85
        img_x = 20 + (content_w - img_w) / 2

        # Check if we need a page break (estimate image height)
        # Load image to get aspect ratio
        from PIL import Image
        with Image.open(path) as img:
            w_px, h_px = img.size
        img_h = img_w * (h_px / w_px)

        # If it won't fit, add a page
        space_left = self.h - self.get_y() - 30  # 30mm for caption + margin
        if img_h > space_left:
            self.add_page()

        # Light gray border
        border_pad = 1
        self.set_draw_color(*LIGHT_GRAY)
        self.set_line_width(0.3)
        self.rect(img_x - border_pad, self.get_y() - border_pad,
                  img_w + 2 * border_pad, img_h + 2 * border_pad)

        self.image(path, x=img_x, w=img_w)
        self.ln(2)
        # Caption
        self.set_font("Helvetica", "I", 9)
        self.set_text_color(*CAPTION_GRAY)
        self.cell(0, 5, caption, align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(5)

    # ── Pages ──

    def title_page(self):
        self._is_title_page = True
        self.add_page()

        # Gold stars and org name
        self.ln(40)
        self.set_font("Helvetica", "B", 28)
        self.set_text_color(*STAR_GOLD)
        self.cell(0, 15, "*  IRVINE ALL-STARS  *", align="C", new_x="LMARGIN", new_y="NEXT")

        # Decorative gold line
        self.set_draw_color(*STAR_GOLD)
        self.set_line_width(0.8)
        cx = self.w / 2
        self.line(cx - 60, self.get_y() + 5, cx + 60, self.get_y() + 5)
        self.ln(15)

        # Main title
        self.set_font("Helvetica", "B", 42)
        self.set_text_color(*FLAG_BLUE)
        self.cell(0, 20, "Admin Portal", align="C", new_x="LMARGIN", new_y="NEXT")
        self.cell(0, 20, "Guide", align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(10)

        # Subtitle
        self.set_font("Helvetica", "", 18)
        self.set_text_color(*CHARCOAL)
        self.cell(0, 10, "2026 All-Stars Season", align="C", new_x="LMARGIN", new_y="NEXT")

        # Red accent line
        self.set_draw_color(*FLAG_RED)
        self.set_line_width(0.5)
        self.line(cx - 40, self.get_y() + 8, cx + 40, self.get_y() + 8)
        self.ln(20)

        # Bottom org name
        self.set_y(-50)
        self.set_font("Helvetica", "", 14)
        self.set_text_color(*FLAG_BLUE)
        self.cell(0, 10, "Irvine Pony Baseball", align="C", new_x="LMARGIN", new_y="NEXT")

        self._is_title_page = False

    def table_of_contents(self):
        self.add_page()
        self.set_font("Helvetica", "B", 28)
        self.set_text_color(*FLAG_BLUE)
        self.cell(0, 15, "Table of Contents", align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(*FLAG_BLUE)
        self.set_line_width(0.5)
        cx = self.w / 2
        self.line(cx - 50, self.get_y() + 2, cx + 50, self.get_y() + 2)
        self.ln(10)
        self._toc_placeholder_page = self.page_no()

    def _render_toc_entries(self):
        """Fill in the TOC page after all chapters are added."""
        # We need to go back and draw on the TOC page
        # fpdf2 supports this via the page property
        current_page = self.page
        self.page = self._toc_placeholder_page

        self.set_y(55)  # after heading
        for entry in self._toc_entries:
            ch_num, title, pg = entry
            self.set_font("Helvetica", "B", 13)
            self.set_text_color(*FLAG_RED)
            num_str = f"Chapter {ch_num}"
            self.cell(35, 8, num_str, new_x="END")
            self.set_text_color(*CHARCOAL)
            self.set_font("Helvetica", "", 13)
            title_w = self.w - 40 - 35 - 15
            self.cell(title_w, 8, title)
            self.set_text_color(*FLAG_BLUE)
            self.cell(15, 8, str(pg), align="R", new_x="LMARGIN", new_y="NEXT")
            self.ln(2)

        self.page = current_page

    def start_chapter(self, number, title):
        self.add_page()
        self._toc_entries.append((number, title, self.page_no()))
        self._chapter_title(number, title)

    def back_page(self):
        self.add_page()
        self.ln(60)
        self.set_font("Helvetica", "B", 36)
        self.set_text_color(*FLAG_BLUE)
        self.cell(0, 20, "Go All-Stars! ", align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(10)
        self.set_font("Helvetica", "", 18)
        self.set_text_color(*STAR_GOLD)
        self.cell(0, 10, "irvineallstars.com", align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(15)
        self.set_draw_color(*FLAG_RED)
        self.set_line_width(0.5)
        cx = self.w / 2
        self.line(cx - 50, self.get_y(), cx + 50, self.get_y())
        self.ln(10)
        self.set_font("Helvetica", "", 14)
        self.set_text_color(*CHARCOAL)
        self.cell(0, 10, "Irvine Pony Baseball -- 2026 All-Stars Season", align="C",
                  new_x="LMARGIN", new_y="NEXT")


def build_guide():
    pdf = AdminGuide()

    # Title page
    pdf.title_page()

    # Table of contents (placeholder, filled in later)
    pdf.table_of_contents()

    # ── Chapter 1: Getting Started ──
    pdf.start_chapter(1, "Getting Started")
    pdf._section_header("Welcome")
    pdf._body(
        "Welcome to the Irvine All-Stars Admin Portal! This guide covers everything you need "
        "to manage the All-Stars program -- from player registrations to tournament compliance tracking."
    )
    pdf._section_header("How to Access")
    pdf._body(
        "Go to irvineallstars.com and sign in with your admin credentials. "
        "You will be taken directly to the admin dashboard."
    )
    pdf._section_header("Dashboard Overview")
    pdf._body(
        "Summary cards show coach applications and player registrations at a glance. "
        "The registrations-by-division grid shows distribution across all 12 divisions. "
        "Recent applications and registrations are shown at the bottom of the dashboard."
    )
    pdf._screenshot("dashboard-top.png", "Admin dashboard overview")
    pdf._screenshot("dashboard.png", "Full admin dashboard")

    # ── Chapter 2: Managing Registrations (Tryouts) ──
    pdf.start_chapter(2, "Managing Registrations")
    pdf._body(
        "The Tryouts page lets you view all player registrations with powerful filtering options."
    )
    pdf._bullet("Division filter buttons and status filter buttons at the top of the page")
    pdf._bullet("Player cards show: name, division, status badge, parent name, position, and registration date")
    pdf._bullet("Click a player card to expand and see full details including contact info, emergency contact, "
                "second parent information, positions, and medical info")
    pdf._bullet('Bulk selection with the "Select All" checkbox for batch operations')
    pdf.ln(2)
    pdf._section_header("Status Options")
    pdf._body(
        "Each player can be assigned one of the following statuses: Registered, Invited, Confirmed, "
        "Tryout Complete, Selected, Not Selected, Alternate, or Withdrawn."
    )
    pdf._screenshot("tryouts.png", "Player registrations list")
    pdf._screenshot("tryouts-expanded.png", "Expanded player details")

    # ── Chapter 3: Coach Applications ──
    pdf.start_chapter(3, "Coach Applications")
    pdf._body(
        "View and manage coach candidacy applications submitted through the portal. "
        "Each application shows the coach's name, requested division, experience level, and contact information."
    )
    pdf._screenshot("applications.png", "Coach applications")

    # ── Chapter 4: Scores ──
    pdf.start_chapter(4, "Scores")
    pdf._body(
        "View and manage tryout evaluation scores submitted by coaches and evaluators. "
        "This page provides a centralized view of all player evaluations to assist with team selection decisions."
    )
    pdf._screenshot("scores.png", "Score management")

    # ── Chapter 5: Team Management ──
    pdf.start_chapter(5, "Team Management")
    pdf._body(
        "After tryouts are complete, use the Team Management page to organize players into teams "
        "and assign coaches to their respective divisions."
    )
    pdf._screenshot("teams.png", "Team management")

    # ── Chapter 6: Sending Invites ──
    pdf.start_chapter(6, "Sending Invites")
    pdf._body(
        "Send registration invitations to parents via email. Each invite includes a magic link "
        "for easy account creation -- no passwords required."
    )
    pdf._bullet("Invite individual parents or send invitations in bulk")
    pdf._bullet("Support for sibling registrations -- one invite can cover multiple players in the same family")
    pdf._bullet("Track invite status to see which parents have registered")
    pdf._screenshot("invites.png", "Invite management")

    # ── Chapter 7: Announcements ──
    pdf.start_chapter(7, "Announcements")
    pdf._body(
        "Create and manage announcements visible to parents and coaches through their portals."
    )
    pdf._bullet("Announcements can be general (all divisions) or division-specific")
    pdf._bullet("Tournament announcements are auto-generated from tournament discovery")
    pdf._bullet("Set publish dates and expiration for time-sensitive announcements")
    pdf._screenshot("announcements.png", "Announcements management")

    # ── Chapter 8: Tournament Management ──
    pdf.start_chapter(8, "Tournament Management")
    pdf._body(
        "View and manage discovered tournaments for the All-Stars season."
    )
    pdf._bullet("Tournament cards show: name, dates, location, host organization, eligible divisions, and registration link")
    pdf._bullet("Control publish/draft status to determine visibility to parents and coaches")
    pdf._bullet("Upload flyers for tournament promotional materials")
    pdf._screenshot("tournaments.png", "Tournament management")

    # ── Chapter 9: Documents ──
    pdf.start_chapter(9, "Documents")
    pdf._body(
        "Track document uploads across all registered players to ensure tournament readiness."
    )
    pdf._bullet("View birth certificates, player photos, and medical releases")
    pdf._bullet("Filter by document type and completion status")
    pdf._bullet("Quickly identify which players are missing required documents")
    pdf._screenshot("documents.png", "Document tracking")

    # ── Chapter 10: Compliance ──
    pdf.start_chapter(10, "Compliance")
    pdf._body(
        "The compliance dashboard provides an overall view of tournament readiness across all players."
    )
    pdf._bullet("Track which players have completed all requirements")
    pdf._bullet("Items tracked: birth certificate, player photo, signed contract, and medical release")
    pdf._bullet("Filter and sort to prioritize follow-ups with incomplete players")
    pdf._screenshot("compliance.png", "Compliance tracking")

    # ── Chapter 11: Help ──
    pdf.start_chapter(11, "Help")
    pdf._body(
        "The admin Help page provides a comprehensive FAQ covering all admin features in detail. "
        "Use this as a quick reference for any questions that come up during the season."
    )
    pdf._screenshot("help.png", "Admin Help & Guides")
    pdf._section_header("Contact")
    pdf._body("For additional support, email AllStars@irvinepony.com")

    # Back page
    pdf.back_page()

    # Fill in TOC now that we know all page numbers
    pdf._render_toc_entries()

    # Output
    pdf.output(OUTPUT_PATH)
    size_kb = os.path.getsize(OUTPUT_PATH) / 1024
    print(f"PDF generated: {OUTPUT_PATH}")
    print(f"File size: {size_kb:.0f} KB ({size_kb/1024:.1f} MB)")


if __name__ == "__main__":
    build_guide()
