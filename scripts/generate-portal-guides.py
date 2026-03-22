#!/usr/bin/env python3
"""
Generate themed PDF guides for the Irvine All-Stars portal system.
Produces 3 PDFs: Admin Guide, Coach Guide, Parent Guide.
"""

import os
from fpdf import FPDF, XPos, YPos

# Brand colors
FLAG_BLUE = (0, 40, 104)
FLAG_RED = (178, 34, 52)
WHITE = (255, 255, 255)
CHARCOAL = (28, 28, 28)
OFF_WHITE = (250, 250, 248)
CREAM = (245, 241, 235)
STAR_GOLD = (212, 168, 67)
GRAY_400 = (156, 163, 175)
GRAY_600 = (75, 85, 99)
LIGHT_BLUE = (230, 238, 250)
LIGHT_RED = (252, 235, 237)
LIGHT_GREEN = (220, 252, 231)
LIGHT_AMBER = (254, 243, 199)

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "docs")
os.makedirs(OUTPUT_DIR, exist_ok=True)


class AllStarsPDF(FPDF):
    """Custom PDF with Irvine All-Stars branding."""

    def __init__(self, title: str, subtitle: str):
        super().__init__()
        self._title = title
        self._subtitle = subtitle
        self.set_auto_page_break(auto=True, margin=20)

    def header(self):
        # Blue bar at top
        self.set_fill_color(*FLAG_BLUE)
        self.rect(0, 0, 210, 14, "F")
        # Stars + title in header bar
        self.set_y(2)
        self.set_font("Helvetica", "B", 8)
        self.set_text_color(*WHITE)
        self.cell(0, 10, "*** IRVINE ALL-STARS ***   |   " + self._subtitle, align="C")
        # Gold accent line
        self.set_fill_color(*STAR_GOLD)
        self.rect(0, 14, 210, 1.5, "F")
        self.set_y(20)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 7)
        self.set_text_color(*GRAY_400)
        self.cell(0, 10, f"irvineallstars.com  |  2026 All-Star Season  |  Page {self.page_no()}", align="C")

    def add_cover_section(self, title: str, subtitle: str):
        """Big title block at top of first page."""
        self.set_font("Helvetica", "B", 28)
        self.set_text_color(*FLAG_BLUE)
        self.cell(0, 14, title, align="L", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_font("Helvetica", "", 11)
        self.set_text_color(*GRAY_600)
        self.multi_cell(0, 5.5, subtitle, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(4)
        # Red divider
        self.set_fill_color(*FLAG_RED)
        self.rect(10, self.get_y(), 60, 1, "F")
        self.ln(6)

    def section_header(self, text: str):
        """Blue section header with left accent."""
        y = self.get_y()
        self.set_fill_color(*FLAG_BLUE)
        self.rect(10, y, 3, 8, "F")
        self.set_x(16)
        self.set_font("Helvetica", "B", 13)
        self.set_text_color(*FLAG_BLUE)
        self.cell(0, 8, text, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(2)

    def subsection(self, text: str):
        """Smaller bold subsection."""
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(*CHARCOAL)
        self.cell(0, 6, text, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(1)

    def body_text(self, text: str):
        self.set_font("Helvetica", "", 9.5)
        self.set_text_color(*CHARCOAL)
        self.multi_cell(0, 5, text, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(2)

    def bullet(self, text: str, indent: int = 14):
        self.set_x(indent)
        self.set_font("Helvetica", "", 9)
        self.set_text_color(*CHARCOAL)
        self.cell(5, 5, "-", new_x=XPos.RIGHT, new_y=YPos.TOP)
        width = 210 - indent - 5 - 10  # page width minus indent, bullet, right margin
        self.multi_cell(width, 5, text, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(1)

    def numbered_step(self, num: int, title: str, desc: str):
        """Numbered step with blue circle and description."""
        y = self.get_y()
        # Blue circle with number
        self.set_fill_color(*FLAG_BLUE)
        self.ellipse(12, y, 7, 7, "F")
        self.set_xy(12, y + 0.5)
        self.set_font("Helvetica", "B", 7)
        self.set_text_color(*WHITE)
        self.cell(7, 6, str(num), align="C")
        # Title and description
        self.set_xy(22, y)
        self.set_font("Helvetica", "B", 9.5)
        self.set_text_color(*CHARCOAL)
        self.cell(0, 6, title, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_x(22)
        self.set_font("Helvetica", "", 8.5)
        self.set_text_color(*GRAY_600)
        self.multi_cell(165, 4.5, desc, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(2)

    def info_box(self, text: str, color=LIGHT_BLUE):
        """Colored info box."""
        y = self.get_y()
        self.set_fill_color(*color)
        w = 190
        # Estimate height
        self.set_font("Helvetica", "", 8.5)
        lines = len(text) / 85 + 1
        h = max(12, lines * 5 + 6)
        self.rect(10, y, w, h, "F")
        self.set_xy(14, y + 3)
        self.set_text_color(*CHARCOAL)
        self.multi_cell(w --8, 4.5, text, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(3)

    def url_box(self, url: str):
        """Prominent URL display."""
        y = self.get_y()
        self.set_fill_color(*FLAG_BLUE)
        self.rect(10, y, 190, 10, "F")
        self.set_xy(10, y + 1)
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(*WHITE)
        self.cell(190, 8, url, align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(4)


def generate_admin_guide():
    pdf = AllStarsPDF("Admin Portal Guide", "ADMIN PORTAL GUIDE")
    pdf.add_page()

    pdf.add_cover_section(
        "Admin Portal Guide",
        "A complete guide to managing the Irvine All-Stars system. The admin portal lets you manage coach applications, player registrations, evaluator scores, team selections, and all tournament compliance documents."
    )

    pdf.url_box("irvineallstars.com/admin")

    # Getting Started
    pdf.section_header("Getting Started")
    pdf.body_text("Log in at irvineallstars.com/auth/login with your admin account (allstars@irvinepony.com). The admin sidebar gives you access to all management tools.")

    # Dashboard
    pdf.section_header("Dashboard Overview")
    pdf.body_text("The dashboard shows at-a-glance stats: total coach applications, player registrations, and recent submissions. Use it as your daily command center.")

    # Applications
    pdf.section_header("Managing Coach Applications")
    pdf.numbered_step(1, "Review Applications", "Go to Applications in the sidebar. Filter by status (Pending, Accepted, Rejected). Expand any application to see full details.")
    pdf.numbered_step(2, "Accept or Reject", "Click Accept or Reject on each application. Accepted coaches receive access to the Coach Portal.")
    pdf.numbered_step(3, "Send Invites", "Use the Invites page to send login credentials to accepted coaches via email.")

    # Players
    pdf.section_header("Player Registrations & Tryouts")
    pdf.numbered_step(1, "View Registrations", "The Tryouts page shows all registered players by division. Filter by division or search by name.")
    pdf.numbered_step(2, "Review Scores", "The Scores page aggregates evaluator scores by division, sorted by total (max 54 points across 6 categories).")
    pdf.numbered_step(3, "Select Players", "On the Tryouts page, select players for each division team. Use bulk-select for efficiency. Selected players and parents are notified by email.")

    # page 2
    pdf.add_page()

    # Documents
    pdf.section_header("Documents & Compliance")
    pdf.body_text("The Documents page has two sections:")
    pdf.subsection("Shared Team Documents (Top Section)")
    pdf.bullet("Upload the Certificate of Liability Insurance --shared with all coaches")
    pdf.bullet("Upload Pre-Tournament Rules / Coach's Agreement --shared with all coaches")
    pdf.bullet("These appear in every coach's Binder Checklist automatically")

    pdf.subsection("Player Documents (Main Section)")
    pdf.bullet("View uploaded birth certificates and player photos")
    pdf.bullet("Approve or reject pending documents")
    pdf.bullet("Filter by division, search by player or parent name")
    pdf.bullet("Preview images directly in the admin panel")

    # Compliance
    pdf.section_header("Compliance Tracking")
    pdf.body_text("The Compliance page shows tournament readiness per division: contracts signed, birth certs uploaded, photos uploaded, medical releases completed, and coach certifications.")

    # Announcements
    pdf.section_header("Announcements")
    pdf.body_text("Create announcements that appear on the coach and parent portals. Target specific divisions or send to all. Announcements can be edited or deleted at any time.")

    pdf.info_box("TIP: Upload the insurance certificate and tournament rules early so coaches can start assembling their binders right away.", LIGHT_AMBER)

    pdf.output(os.path.join(OUTPUT_DIR, "Admin-Portal-Guide.pdf"))
    print("Generated: Admin-Portal-Guide.pdf")


def generate_coach_guide():
    pdf = AllStarsPDF("Coach Portal Guide", "COACH PORTAL GUIDE")
    pdf.add_page()

    pdf.add_cover_section(
        "Coach Portal Guide",
        "Your guide to the Irvine All-Stars coach portal. Manage your team roster, assemble your tournament binder, track compliance, and access all the tools you need for the 2026 season."
    )

    pdf.url_box("irvineallstars.com/coach")

    # Dashboard
    pdf.section_header("Dashboard")
    pdf.body_text("Your dashboard shows your assigned division, team size, compliance progress, and action items. Complete all items to reach 100% tournament readiness before your first game.")

    # Binder Checklist
    pdf.section_header("Binder Checklist (Tournament Binder)")
    pdf.body_text("The Binder Checklist mirrors your physical tournament binder. It's organized in the exact order your binder should be assembled:")

    pdf.numbered_step(1, "Tournament Pitching Log", "Print blank pitching log forms from the Pitching Log page. Division-specific pitch count limits and rest day charts included. Prints as one landscape page.")
    pdf.numbered_step(2, "Pre-Tournament Rules / Coach's Agreement", "View and print the tournament rules uploaded by admin. Review before your first game.")
    pdf.numbered_step(3, "Certificate of Liability Insurance", "View and print the insurance certificate uploaded by admin.")
    pdf.numbered_step(4, "Medical Releases", "Track which parents have completed their medical release forms in the parent portal. Contact parents directly if items are missing.")
    pdf.numbered_step(5, "Birth Certificates & Player Photos", "View uploaded birth certificates and player photos. Click the blue buttons to open each document.")
    pdf.numbered_step(6, "Concussion Training Certificate", "Upload your certificate from the Certifications page. Required by California AB-379.")
    pdf.numbered_step(7, "Sudden Cardiac Arrest Certificate", "Upload your certificate from the Certifications page. Required by California AB-379.")

    # page 2
    pdf.add_page()

    # Pitching Log
    pdf.section_header("Pitching Log")
    pdf.body_text("The Pitching Log page generates a printable, division-specific form with:")
    pdf.bullet("Your division's max pitch count and rest day requirements")
    pdf.bullet("Universal PONY pitching rules (no 3 consecutive days, 41+ pitches = can't catch)")
    pdf.bullet("Blank recording table with 12 rows for games")
    pdf.info_box("Select your division from the dropdown, then click 'Print This Page'. It prints as a single landscape page --perfect for your binder.", LIGHT_BLUE)

    # Roster
    pdf.section_header("Team Roster")
    pdf.body_text("View your selected and alternate players with their registration details. Filter by division if you coach multiple teams.")

    # Certifications
    pdf.section_header("Certifications")
    pdf.body_text("Upload your coaching certifications:")
    pdf.bullet("Concussion Protocol Certificate (CIF Sports Medicine / CDC Heads Up)")
    pdf.bullet("Sudden Cardiac Arrest Prevention Certificate (CIF SCA / NFHS Learn)")
    pdf.body_text("At least one coaching staff member must have both certificates before the binder can be signed off.")

    # Tryouts & Scores
    pdf.section_header("Tryouts & Score Entry")
    pdf.body_text("During tryout season, use these tools to view players in your division, enter evaluation scores, and submit player recommendations to admin.")

    # Tournament Rules
    pdf.section_header("Tournament Rules & Updates")
    pdf.body_text("Review tournament rules and acknowledge them before your first game. Check the Updates page for the latest announcements from the league.")

    pdf.info_box("IMPORTANT: Your binder must be 100% complete before the pre-tournament manager meeting. Use the Binder Checklist to track progress.", LIGHT_RED)

    pdf.output(os.path.join(OUTPUT_DIR, "Coach-Portal-Guide.pdf"))
    print("Generated: Coach-Portal-Guide.pdf")


def generate_parent_guide():
    pdf = AllStarsPDF("Parent Portal Guide", "PARENT PORTAL GUIDE")
    pdf.add_page()

    pdf.add_cover_section(
        "Parent Portal Guide",
        "Welcome to the Irvine All-Stars parent portal! This guide walks you through every step --from accepting your child's selection to completing all required documents for tournament play."
    )

    pdf.url_box("irvineallstars.com/portal")

    # Getting Started
    pdf.section_header("Getting Started")
    pdf.numbered_step(1, "Create Your Account", "Go to irvineallstars.com/auth/signup and create an account using the same email you registered your child with.")
    pdf.numbered_step(2, "Log In", "Once your account is confirmed via email, log in at irvineallstars.com/auth/login. You'll be taken to the Parent Portal.")

    # Selection Flow
    pdf.section_header("When Your Child Is Selected")
    pdf.body_text("If your child is selected for an All-Star team, you'll receive an email notification. Here's what happens next:")

    pdf.numbered_step(1, "Accept or Decline", "Log in to the Parent Portal. You'll see a prominent card asking you to Accept or Decline the selection. You must accept before any other steps unlock.")
    pdf.numbered_step(2, "Sign the Player Contract", "After accepting, the contract page unlocks. Read and sign the player contract electronically by typing your name.")
    pdf.numbered_step(3, "Upload Documents", "After signing the contract, upload your child's birth certificate and a current player photo.")
    pdf.numbered_step(4, "Complete Medical Release", "Fill out the medical release form with allergies, medications, insurance info, physician details, and emergency authorization.")

    pdf.info_box("All four steps must be completed before your child can participate in tournament play. The coach can track your progress from their portal.", LIGHT_AMBER)

    # Document Details
    pdf.section_header("Document Requirements")

    pdf.subsection("Birth Certificate")
    pdf.bullet("Upload a clear photo or scan of your child's birth certificate")
    pdf.bullet("IMPORTANT: The name on the birth certificate MUST match the affidavit exactly")
    pdf.bullet("Do NOT leave out middle names, Jr, III, etc.")

    pdf.subsection("Player Photo")
    pdf.bullet("Upload a recent, clear headshot photo of your child")
    pdf.bullet("Accepted formats: JPG, PNG, or PDF")

    pdf.subsection("Medical Release")
    pdf.bullet("Allergies and current medications")
    pdf.bullet("Medical conditions the coaching staff should know about")
    pdf.bullet("Health insurance information")
    pdf.bullet("Physician name and phone number")
    pdf.bullet("Emergency medical authorization (electronic signature)")

    # What You'll See
    pdf.section_header("Portal Features")
    pdf.bullet("Player status cards showing your child's division and compliance progress")
    pdf.bullet("Color-coded badges: green = complete, red = action needed")
    pdf.bullet("Division-specific announcements from the league")
    pdf.bullet("Key dates for the 2026 season (tryouts, tournaments, deadlines)")
    pdf.bullet("Quick links to all required forms and documents")

    pdf.info_box("Questions? Contact the All-Star coordinator at allstars@irvinepony.com", LIGHT_BLUE)

    pdf.output(os.path.join(OUTPUT_DIR, "Parent-Portal-Guide.pdf"))
    print("Generated: Parent-Portal-Guide.pdf")


if __name__ == "__main__":
    generate_admin_guide()
    generate_coach_guide()
    generate_parent_guide()
    print(f"\nAll PDFs saved to: {OUTPUT_DIR}/")
