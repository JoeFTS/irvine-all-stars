#!/usr/bin/env python3
"""Generate the Irvine All-Stars Parent Portal Guide PDF using fpdf2."""

import os
from fpdf import FPDF

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SCREENSHOTS = os.path.join(SCRIPT_DIR, "screenshots")
OUTPUT_PDF = os.path.join(SCRIPT_DIR, "..", "Parent-Portal-Guide.pdf")

# ---------------------------------------------------------------------------
# Colors
# ---------------------------------------------------------------------------
FLAG_BLUE = (27, 58, 107)
FLAG_RED = (178, 34, 52)
STAR_GOLD = (212, 168, 67)
CHARCOAL = (44, 44, 44)
LIGHT_GRAY = (200, 200, 200)
CAPTION_GRAY = (120, 120, 120)
WHITE = (255, 255, 255)


# ---------------------------------------------------------------------------
# PDF subclass
# ---------------------------------------------------------------------------
class ParentGuide(FPDF):
    show_page_number = True
    chapter_pages: dict  # filled after first pass

    def header(self):
        """Stripe bar at top of every page: red / blue / red."""
        y = 2
        for color in [FLAG_RED, FLAG_BLUE, FLAG_RED]:
            self.set_draw_color(*color)
            self.set_line_width(0.7)
            self.line(0, y, self.w, y)
            y += 2

    def footer(self):
        if not self.show_page_number:
            return
        self.set_y(-15)
        self.set_font("Helvetica", "", 9)
        self.set_text_color(*CAPTION_GRAY)
        self.cell(0, 10, f"Page {self.page_no()}", align="C")

    # -- helpers -----------------------------------------------------------

    def _blue_line(self):
        self.set_draw_color(*FLAG_BLUE)
        self.set_line_width(0.5)
        self.line(self.l_margin, self.get_y(), self.w - self.r_margin, self.get_y())
        self.ln(4)

    def chapter_title(self, number: int, title: str):
        self.set_font("Helvetica", "B", 14)
        self.set_text_color(*FLAG_RED)
        self.cell(0, 10, f"Chapter {number}", new_x="LMARGIN", new_y="NEXT")
        self.set_font("Helvetica", "B", 24)
        self.set_text_color(*FLAG_BLUE)
        self.cell(0, 12, title, new_x="LMARGIN", new_y="NEXT")
        self.ln(2)
        self._blue_line()
        self.ln(2)

    def section_header(self, text: str):
        self.set_font("Helvetica", "B", 16)
        self.set_text_color(*FLAG_BLUE)
        self.cell(0, 10, text, new_x="LMARGIN", new_y="NEXT")
        self.ln(1)

    def body(self, text: str):
        self.set_font("Helvetica", "", 11)
        self.set_text_color(*CHARCOAL)
        self.multi_cell(0, 6, text)
        self.ln(2)

    def bullet(self, text: str):
        self.set_font("Helvetica", "", 11)
        self.set_text_color(*CHARCOAL)
        x = self.l_margin
        self.set_x(x + 4)
        self.cell(5, 6, "-")
        self.multi_cell(0, 6, text)
        self.ln(1)

    def numbered_item(self, num: int, text: str):
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(*FLAG_RED)
        x = self.l_margin
        self.set_x(x + 4)
        self.cell(8, 6, f"{num}.")
        self.set_font("Helvetica", "", 11)
        self.set_text_color(*CHARCOAL)
        self.multi_cell(0, 6, text)
        self.ln(1)

    def screenshot(self, rel_path: str, caption: str):
        """Add a centered screenshot with gray border and caption."""
        full = os.path.join(SCREENSHOTS, rel_path)
        if not os.path.isfile(full):
            self.set_font("Helvetica", "I", 9)
            self.set_text_color(*CAPTION_GRAY)
            self.cell(0, 6, f"[Screenshot not found: {rel_path}]", new_x="LMARGIN", new_y="NEXT")
            self.ln(2)
            return

        usable_w = self.w - self.l_margin - self.r_margin
        img_w = usable_w * 0.85
        x = self.l_margin + (usable_w - img_w) / 2

        # Check if we need a page break (estimate image height)
        # Use a temporary approach: place image, if it overflows fpdf2 handles it
        y_before = self.get_y()

        # Need enough space — if less than 60mm left, new page
        if self.get_y() > self.h - 80:
            self.add_page()
            y_before = self.get_y()

        self.image(full, x=x, w=img_w)
        y_after = self.get_y()
        img_h = y_after - y_before

        # Draw border around image
        self.set_draw_color(*LIGHT_GRAY)
        self.set_line_width(0.3)
        self.rect(x - 1, y_before - 1, img_w + 2, img_h + 2)

        self.ln(2)
        # Caption
        self.set_font("Helvetica", "I", 9)
        self.set_text_color(*CAPTION_GRAY)
        self.cell(0, 5, caption, align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(4)


# ---------------------------------------------------------------------------
# Build the PDF
# ---------------------------------------------------------------------------
def build():
    pdf = ParentGuide()
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.set_margins(20, 15, 20)

    # ── Title Page ────────────────────────────────────────────────────────
    pdf.show_page_number = False
    pdf.add_page()

    pdf.ln(50)
    pdf.set_font("Helvetica", "B", 20)
    pdf.set_text_color(*STAR_GOLD)
    pdf.cell(0, 12, "*  IRVINE ALL-STARS  *", align="C",
             new_x="LMARGIN", new_y="NEXT")

    pdf.ln(10)
    pdf.set_font("Helvetica", "B", 36)
    pdf.set_text_color(*FLAG_BLUE)
    pdf.cell(0, 18, "Parent Portal Guide", align="C",
             new_x="LMARGIN", new_y="NEXT")

    pdf.ln(6)
    pdf.set_font("Helvetica", "", 16)
    pdf.set_text_color(*CHARCOAL)
    pdf.cell(0, 10, "2026 All-Stars Season", align="C",
             new_x="LMARGIN", new_y="NEXT")

    pdf.ln(60)
    pdf.set_font("Helvetica", "", 14)
    pdf.set_text_color(*FLAG_BLUE)
    pdf.cell(0, 10, "Irvine Pony Baseball", align="C",
             new_x="LMARGIN", new_y="NEXT")

    # ── Table of Contents ────────────────────────────────────────────────
    pdf.show_page_number = True
    pdf.add_page()

    pdf.set_font("Helvetica", "B", 28)
    pdf.set_text_color(*FLAG_BLUE)
    pdf.cell(0, 14, "Table of Contents", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)
    pdf._blue_line()
    pdf.ln(6)

    chapters = [
        (1, "Getting Started"),
        (2, "Your Player's Status"),
        (3, "Second Parent / Guardian"),
        (4, "Tournament Readiness"),
        (5, "Documents & Uploads"),
        (6, "Player Contract"),
        (7, "Tournaments & Announcements"),
        (8, "Quick Links & Help"),
    ]

    # We'll fill page numbers after building — use placeholders for now.
    # Since fpdf2 doesn't support forward references easily, we do a
    # simple approach: record the link targets, then rebuild.  For
    # simplicity, just list them without real page numbers on first pass,
    # then we know them.  Actually, let's just build the content first
    # to get page numbers, then insert.  Easier: build content, note
    # pages, rebuild.  Let's do two-pass.

    toc_page = pdf.page_no()  # page 2

    # Placeholder TOC entries (we'll overwrite after we know pages)
    toc_y_start = pdf.get_y()
    for num, title in chapters:
        pdf.set_font("Helvetica", "", 13)
        pdf.set_text_color(*CHARCOAL)
        pdf.cell(0, 9, f"  {num}.   {title}", new_x="LMARGIN", new_y="NEXT")
    toc_y_end = pdf.get_y()

    # ── Chapter 1: Getting Started ───────────────────────────────────────
    pdf.add_page()
    ch1_page = pdf.page_no()
    pdf.chapter_title(1, "Getting Started")

    pdf.body(
        "Welcome to the Irvine All-Stars Parent Portal! This guide will walk you "
        "through everything you need to manage your player's All-Stars journey "
        "-- from registration to tournament readiness."
    )

    pdf.section_header("How to Access the Portal")
    pdf.body(
        "Go to irvineallstars.com and click \"Sign In\" or \"Parent Portal\" "
        "from the navigation menu."
    )

    pdf.section_header("Signing In")
    pdf.body(
        "Use the email and password from your invitation to sign in. "
        "If you haven't received an invitation, contact your league coordinator."
    )
    pdf.screenshot("public/login.png", "The sign-in page")

    pdf.section_header("What You'll See")
    pdf.body(
        "After signing in, you'll land on your Parent Portal dashboard. "
        "This is your home base for managing everything related to your "
        "player's All-Stars season."
    )
    pdf.screenshot("parent/dashboard-hero.png", "Your Parent Portal dashboard")

    # ── Chapter 2: Your Player's Status ──────────────────────────────────
    pdf.add_page()
    ch2_page = pdf.page_no()
    pdf.chapter_title(2, "Your Player's Status")

    pdf.body(
        "Your registration card shows your player's name, division, position, "
        "status badge, and submission date at a glance."
    )

    pdf.section_header("Status Badges")
    pdf.body("Your player's status will be one of the following:")
    for badge in ["Registered", "Confirmed", "Selected", "Not Selected", "Alternate"]:
        pdf.bullet(badge)
    pdf.ln(2)

    pdf.screenshot("parent/dashboard-registration.png", "Player registration card with status")

    pdf.section_header("Tryout Assignment")
    pdf.body(
        "Once assigned, your tryout date, time, and location will appear on the "
        "registration card. A \"Confirm Attendance\" button appears when your "
        "tryout is assigned."
    )

    # ── Chapter 3: Second Parent / Guardian ──────────────────────────────
    pdf.add_page()
    ch3_page = pdf.page_no()
    pdf.chapter_title(3, "Second Parent / Guardian")

    pdf.body(
        "You can add a second parent or guardian so they can also access the portal. "
        "The second parent gets full access -- they can view status, upload documents, "
        "and sign contracts."
    )

    pdf.section_header("Adding During Registration")
    pdf.body(
        "Click \"+ Add a second parent / guardian\" on the registration form to "
        "expand the second parent fields."
    )
    pdf.screenshot("parent/reg-second-parent.png", "Adding a second parent during registration")

    pdf.section_header("Adding or Editing from the Dashboard")
    pdf.body(
        "From the dashboard, click the edit pencil icon on the Second Parent card, "
        "or the \"Add a second parent\" link."
    )

    pdf.body(
        "If you provide their email, they can sign in with that email to see everything."
    )

    # ── Chapter 4: Tournament Readiness ──────────────────────────────────
    pdf.add_page()
    ch4_page = pdf.page_no()
    pdf.chapter_title(4, "Tournament Readiness")

    pdf.body(
        "The tournament readiness checklist tracks the 6 steps required to be "
        "game-ready. Steps unlock progressively -- you can't skip ahead."
    )

    pdf.section_header("The 6 Steps")
    steps = [
        "Register for tryouts",
        "Accept selection",
        "Sign contract",
        "Upload photo",
        "Upload birth certificate",
        "Complete medical release",
    ]
    for i, step in enumerate(steps, 1):
        pdf.numbered_item(i, step)
    pdf.ln(2)

    pdf.screenshot("parent/dashboard-compliance.png", "Tournament readiness checklist")

    pdf.body(
        "The progress bar shows your completion percentage. An \"All Complete\" "
        "badge appears when everything is done."
    )

    # ── Chapter 5: Documents & Uploads ───────────────────────────────────
    pdf.add_page()
    ch5_page = pdf.page_no()
    pdf.chapter_title(5, "Documents & Uploads")

    pdf.body(
        "Two documents are required: a player photo and a birth certificate. "
        "These unlock after you sign the player contract."
    )

    pdf.section_header("How to Upload")
    pdf.body(
        "Navigate via the dashboard quick link or the compliance checklist. "
        "Click the upload area to select your file."
    )
    pdf.screenshot("parent/documents.png", "Document upload page")

    pdf.section_header("Accepted Formats")
    pdf.bullet("Player photo: JPEG, PNG")
    pdf.bullet("Birth certificate: JPEG, PNG, PDF")

    # ── Chapter 6: Player Contract ───────────────────────────────────────
    pdf.add_page()
    ch6_page = pdf.page_no()
    pdf.chapter_title(6, "Player Contract")

    pdf.body(
        "The player contract is a commitment agreement for the All-Stars season. "
        "It becomes available after your player is selected and you accept the selection."
    )

    pdf.section_header("What's Included")
    pdf.bullet("Vacation conflicts")
    pdf.bullet("Eligibility acknowledgment")
    pdf.bullet("Code of conduct")
    pdf.bullet("Signature")
    pdf.ln(2)

    pdf.body("Navigate from the dashboard checklist to access the contract.")
    pdf.screenshot("parent/contract.png", "Player contract page")

    # ── Chapter 7: Tournaments & Announcements ───────────────────────────
    pdf.add_page()
    ch7_page = pdf.page_no()
    pdf.chapter_title(7, "Tournaments & Announcements")

    pdf.body(
        "The Tournaments page shows upcoming tournaments filtered to your player's "
        "division. Each tournament card shows the date, location, host, and "
        "registration links."
    )

    pdf.section_header("Announcements")
    pdf.body(
        "The announcements section on your dashboard shows important updates "
        "from your league coordinator."
    )
    pdf.screenshot("parent/dashboard-announcements.png", "Announcements on your dashboard")
    pdf.screenshot("parent/tournaments.png", "Tournaments page")

    # ── Chapter 8: Quick Links & Help ────────────────────────────────────
    pdf.add_page()
    ch8_page = pdf.page_no()
    pdf.chapter_title(8, "Quick Links & Help")

    pdf.section_header("Quick Links")
    pdf.body(
        "The quick links section on your dashboard gives you one-click access to:"
    )
    pdf.bullet("Tournaments")
    pdf.bullet("Help")
    pdf.bullet("Documents")
    pdf.bullet("Contact Coordinator")
    pdf.ln(2)
    pdf.screenshot("parent/dashboard-links.png", "Quick links section")

    pdf.section_header("Help & FAQ")
    pdf.body(
        "The Help page provides a comprehensive FAQ with accordion sections "
        "covering common questions."
    )
    pdf.screenshot("parent/help.png", "Help & Guides page")

    pdf.section_header("Contact")
    pdf.body(
        "For any questions, email AllStars@irvinepony.com and your league "
        "coordinator will get back to you."
    )

    # ── Back Page ────────────────────────────────────────────────────────
    pdf.add_page()
    pdf.show_page_number = False

    pdf.ln(70)
    pdf.set_font("Helvetica", "B", 28)
    pdf.set_text_color(*FLAG_BLUE)
    pdf.cell(0, 14, "Go All-Stars!", align="C",
             new_x="LMARGIN", new_y="NEXT")

    pdf.ln(8)
    pdf.set_font("Helvetica", "", 16)
    pdf.set_text_color(*STAR_GOLD)
    pdf.cell(0, 10, "irvineallstars.com", align="C",
             new_x="LMARGIN", new_y="NEXT")

    pdf.ln(6)
    pdf.set_font("Helvetica", "", 13)
    pdf.set_text_color(*CHARCOAL)
    pdf.cell(0, 10, "Irvine Pony Baseball -- 2026 All-Stars Season", align="C",
             new_x="LMARGIN", new_y="NEXT")

    # ── Rewrite TOC with real page numbers ───────────────────────────────
    page_numbers = [
        ch1_page, ch2_page, ch3_page, ch4_page,
        ch5_page, ch6_page, ch7_page, ch8_page,
    ]

    # Go back to TOC page and overwrite
    pdf.page = toc_page
    pdf.set_y(toc_y_start)

    # White-out the old TOC text
    pdf.set_fill_color(*WHITE)
    pdf.rect(pdf.l_margin, toc_y_start, pdf.w - pdf.l_margin - pdf.r_margin,
             toc_y_end - toc_y_start, "F")

    usable = pdf.w - pdf.l_margin - pdf.r_margin

    for (num, title), pg in zip(chapters, page_numbers):
        pdf.set_font("Helvetica", "", 13)
        pdf.set_text_color(*CHARCOAL)

        left_text = f"  {num}.   {title}"
        right_text = str(pg)

        left_w = pdf.get_string_width(left_text)
        right_w = pdf.get_string_width(right_text)
        dots_w = usable - left_w - right_w - 4

        dot_char_w = pdf.get_string_width(".")
        n_dots = max(0, int(dots_w / dot_char_w))
        dots = " " + "." * n_dots + " "

        pdf.cell(left_w, 9, left_text)
        pdf.set_text_color(*LIGHT_GRAY)
        pdf.cell(dots_w + 4 - right_w, 9, dots)
        pdf.set_text_color(*FLAG_BLUE)
        pdf.set_font("Helvetica", "B", 13)
        pdf.cell(right_w, 9, right_text, new_x="LMARGIN", new_y="NEXT")

    # Reset page pointer to last page so output works
    pdf.page = pdf.pages.__len__()

    # ── Output ───────────────────────────────────────────────────────────
    os.makedirs(os.path.dirname(os.path.abspath(OUTPUT_PDF)), exist_ok=True)
    pdf.output(OUTPUT_PDF)
    size_kb = os.path.getsize(OUTPUT_PDF) / 1024
    print(f"PDF saved to: {os.path.abspath(OUTPUT_PDF)}")
    print(f"File size: {size_kb:.0f} KB ({pdf.pages.__len__()} pages)")


if __name__ == "__main__":
    build()
