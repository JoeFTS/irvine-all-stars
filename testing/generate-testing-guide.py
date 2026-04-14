#!/usr/bin/env python3
"""Generate the Irvine All-Stars Beta Testing Guide PDF."""

from fpdf import FPDF, XPos, YPos

# Brand colors
NAVY = (10, 35, 66)       # #0A2342
RED = (193, 18, 31)       # #C1121F
GOLD = (244, 180, 0)      # #F4B400
WHITE = (255, 255, 255)
LIGHT_GRAY = (245, 245, 245)
DARK_GRAY = (75, 85, 99)
BLACK = (30, 30, 30)


class TestingGuidePDF(FPDF):
    def header(self):
        if self.page_no() == 1:
            return  # Skip header on cover page
        self.set_fill_color(*NAVY)
        self.rect(0, 0, 210, 12, "F")
        self.set_font("Helvetica", "I", 7)
        self.set_text_color(*WHITE)
        self.set_y(3)
        self.cell(0, 6, "Irvine All-Stars  |  Beta Testing Guide  |  irvineallstars.com", align="C")
        self.set_text_color(*BLACK)
        self.ln(12)

    def footer(self):
        if self.page_no() == 1:
            return
        self.set_y(-12)
        self.set_font("Helvetica", "I", 7)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10, f"Page {self.page_no()}", align="C")

    def section_title(self, title):
        self.set_font("Helvetica", "B", 14)
        self.set_text_color(*NAVY)
        self.cell(0, 10, title, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_draw_color(*RED)
        self.set_line_width(0.8)
        self.line(10, self.get_y(), 80, self.get_y())
        self.ln(4)

    def sub_title(self, title):
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(*NAVY)
        self.cell(0, 8, title, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(1)

    def body_text(self, text):
        self.set_font("Helvetica", "", 9.5)
        self.set_text_color(*DARK_GRAY)
        self.multi_cell(0, 5.5, text, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(2)

    def bullet(self, text, indent=15):
        x = self.get_x()
        self.set_font("Helvetica", "", 9.5)
        self.set_text_color(*DARK_GRAY)
        self.set_x(indent)
        self.cell(5, 5.5, "-")
        self.multi_cell(0, 5.5, text, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    def numbered(self, num, text, indent=15):
        self.set_font("Helvetica", "B", 9.5)
        self.set_text_color(*RED)
        self.set_x(indent)
        self.cell(8, 5.5, f"{num}.")
        self.set_font("Helvetica", "", 9.5)
        self.set_text_color(*DARK_GRAY)
        self.multi_cell(0, 5.5, text, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    def info_box(self, title, text):
        self.set_fill_color(255, 248, 225)
        self.set_draw_color(*GOLD)
        y = self.get_y()
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(*NAVY)
        # Calculate height
        self.rect(10, y, 190, 5, "")  # placeholder
        self.set_xy(14, y + 3)
        self.cell(0, 5, title)
        self.set_xy(14, y + 9)
        self.set_font("Helvetica", "", 9)
        self.set_text_color(*DARK_GRAY)
        self.multi_cell(182, 5, text, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        end_y = self.get_y() + 3
        self.set_fill_color(255, 248, 225)
        self.set_draw_color(*GOLD)
        self.rect(10, y, 190, end_y - y, "D")
        self.set_fill_color(255, 248, 225)
        self.rect(10, y, 3, end_y - y, "F")
        self.set_y(end_y + 4)


def build_pdf():
    pdf = TestingGuidePDF()
    pdf.set_auto_page_break(auto=True, margin=18)

    # ========== COVER PAGE ==========
    pdf.add_page()
    pdf.set_fill_color(*NAVY)
    pdf.rect(0, 0, 210, 297, "F")

    # Stars
    pdf.set_font("Helvetica", "", 24)
    pdf.set_text_color(*GOLD)
    pdf.set_y(70)
    pdf.cell(0, 15, "* * *", align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    # Title
    pdf.set_font("Helvetica", "B", 32)
    pdf.set_text_color(*WHITE)
    pdf.cell(0, 15, "IRVINE ALL-STARS", align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    pdf.set_font("Helvetica", "", 24)
    pdf.set_text_color(*GOLD)
    pdf.cell(0, 15, "* * *", align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    # Red bar
    pdf.ln(5)
    pdf.set_fill_color(*RED)
    pdf.rect(60, pdf.get_y(), 90, 3, "F")
    pdf.ln(15)

    # Subtitle
    pdf.set_font("Helvetica", "", 16)
    pdf.set_text_color(*WHITE)
    pdf.cell(0, 10, "Beta Testing Guide", align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(5)
    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(180, 190, 200)
    pdf.cell(0, 8, "For Board Members & Volunteer Testers", align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(3)
    pdf.cell(0, 8, "irvineallstars.com", align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    pdf.ln(20)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(120, 130, 140)
    pdf.cell(0, 6, "2026 All-Stars Season", align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    # ========== PAGE 2: OVERVIEW ==========
    pdf.add_page()
    pdf.section_title("What is irvineallstars.com?")
    pdf.body_text(
        "irvineallstars.com is the official web application for managing Irvine PONY Baseball All-Stars. "
        "It handles the entire All-Stars workflow: player registration, tryout scheduling, evaluator scoring, "
        "team selection, parent notifications, coach binder compliance, and tournament readiness."
    )
    pdf.body_text(
        "The site has four main portals, each designed for a specific user role:"
    )

    pdf.sub_title("1. Parent Portal")
    pdf.body_text(
        "Where parents register their players for tryouts, accept selection notifications, sign contracts, "
        "upload birth certificates and photos, and complete medical release forms."
    )

    pdf.sub_title("2. Coach Portal")
    pdf.body_text(
        "Where head coaches manage their team's tournament binder: track player compliance (contracts, birth certs, photos), "
        "upload coaching certifications (concussion + cardiac arrest training), manage assistant coaches, "
        "download pitching logs, and view tournament rules."
    )

    pdf.sub_title("3. Admin Portal")
    pdf.body_text(
        "Where the All-Stars coordinator manages the entire program: review coach applications, create teams, "
        "manage tryout sessions, select players, send notification emails, post announcements, "
        "upload insurance and tournament rules, and track overall tournament compliance."
    )

    pdf.sub_title("4. Evaluator Interface")
    pdf.body_text(
        "A mobile-optimized scoring interface for independent evaluators to score players during tryouts "
        "across 6 categories (Hitting, Fielding, Throwing, Running, Effort, Attitude)."
    )

    pdf.ln(3)
    pdf.section_title("How You Can Help")
    pdf.body_text(
        "We need board members to test the site from different perspectives before we go live. "
        "Each tester will be assigned a role (Parent, Coach, or Admin) and will follow the test flows "
        "described in this guide. Your job is to try to use the site as a real user would, and report "
        "anything that seems broken, confusing, or could be improved."
    )

    pdf.info_box("IMPORTANT", "Please test on BOTH your phone and your computer. The site should work well on both. If something looks broken on mobile, that's a bug we need to know about.")

    # ========== PAGE 3: GETTING STARTED ==========
    pdf.add_page()
    pdf.section_title("Getting Started")

    pdf.sub_title("Step 1: Request Access (Invite Only)")
    pdf.body_text(
        "The site is invite-only. You cannot sign up on your own. "
        "To get access, email Joe at AllStars@irvinepony.com with the email address "
        "you'd like to use. Joe will send you an invite link to create your account."
    )
    pdf.numbered(1, "Email Joe with the email address you want to use")
    pdf.numbered(2, "You'll receive an invite link - click it to set your password")
    pdf.numbered(3, "Log in at irvineallstars.com with your new credentials")
    pdf.ln(2)

    pdf.sub_title("Step 2: What Role Are You Testing?")
    pdf.body_text("Your role determines what you can see and do on the site:")
    pdf.ln(1)

    # Role table
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_fill_color(*NAVY)
    pdf.set_text_color(*WHITE)
    pdf.cell(30, 7, " Role", border=1, fill=True)
    pdf.cell(45, 7, " How to Get It", border=1, fill=True)
    pdf.cell(115, 7, " What You Can Do", border=1, fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    rows = [
        ("Parent", "Invite from Joe", "Register players, accept selections, sign contracts, upload docs"),
        ("Coach", "Ask Joe to upgrade", "Manage team binder, upload certs, view roster, pitching logs"),
        ("Admin", "Ask Joe (limited)", "Full control: teams, tryouts, selections, compliance, announcements"),
    ]
    for i, (role, how, what) in enumerate(rows):
        bg = LIGHT_GRAY if i % 2 == 0 else WHITE
        pdf.set_fill_color(*bg)
        pdf.set_text_color(*BLACK)
        pdf.set_font("Helvetica", "B", 9)
        pdf.cell(30, 7, f" {role}", border=1, fill=True)
        pdf.set_font("Helvetica", "", 9)
        pdf.cell(45, 7, f" {how}", border=1, fill=True)
        pdf.cell(115, 7, f" {what}", border=1, fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    pdf.ln(4)
    pdf.info_box("NOTE", "We only need 1-2 extra admins (board president + VP). Everyone else should test as a Parent or Coach. Email Joe at AllStars@irvinepony.com to request a role upgrade.")

    # ========== PARENT TESTING ==========
    pdf.add_page()
    pdf.section_title("Testing as a Parent")
    pdf.body_text("Goal: Walk through the complete parent journey, from registration to tournament-ready.")
    pdf.ln(2)

    pdf.sub_title("Flow 1: Register a Player for Tryouts")
    pdf.numbered(1, "Go to irvineallstars.com/apply/player")
    pdf.numbered(2, "Fill out the registration form with a test player's information")
    pdf.numbered(3, "Select a division (use any division you like)")
    pdf.numbered(4, "Complete the parent info, emergency contact, and consent checkboxes")
    pdf.numbered(5, "Submit the form")
    pdf.body_text("What to check: Does the form work smoothly? Are error messages clear? Does it confirm your registration?")
    pdf.ln(1)

    pdf.sub_title("Flow 2: Accept Your Player's Selection")
    pdf.body_text("(Joe will select your test player after you register, so you can test this flow)")
    pdf.numbered(1, "Log in and go to the Parent Portal (irvineallstars.com/portal)")
    pdf.numbered(2, "You should see your player listed with a 'Selected' status")
    pdf.numbered(3, "Click 'Accept Selection' to confirm your player's spot")
    pdf.body_text("What to check: Is the acceptance flow clear? Do you understand what you're agreeing to?")
    pdf.ln(1)

    pdf.sub_title("Flow 3: Sign the Player Contract")
    pdf.numbered(1, "After accepting, go to the Contract page from your portal")
    pdf.numbered(2, "Read through the contract terms")
    pdf.numbered(3, "Fill in the required fields and submit your electronic signature")
    pdf.body_text("What to check: Is the contract readable? Is the signing process intuitive?")
    pdf.ln(1)

    pdf.sub_title("Flow 4: Upload Documents")
    pdf.numbered(1, "Go to the Documents page from your portal")
    pdf.numbered(2, "Upload a test birth certificate (any image or PDF)")
    pdf.numbered(3, "Upload a test player photo (any image)")
    pdf.body_text("What to check: Does the upload work? Can you see what you uploaded? Can you replace a file?")
    pdf.ln(1)

    pdf.sub_title("Flow 5: Complete the Medical Release")
    pdf.numbered(1, "Go to the Medical Release page from your portal")
    pdf.numbered(2, "Fill out the emergency contact, medical conditions, and insurance info")
    pdf.numbered(3, "Check the authorization box and sign")
    pdf.numbered(4, "Submit the form")
    pdf.body_text("What to check: Are the form fields clear? Does the authorization text make sense?")

    # ========== COACH TESTING ==========
    pdf.add_page()
    pdf.section_title("Testing as a Coach")
    pdf.body_text("Goal: Prepare your team's tournament binder and verify all compliance items are tracked.")
    pdf.ln(2)

    pdf.sub_title("Flow 1: Review Your Dashboard")
    pdf.numbered(1, "Log in and go to the Coach Portal (irvineallstars.com/coach)")
    pdf.numbered(2, "Check your team assignment and compliance progress")
    pdf.numbered(3, "Review the action items list - does it accurately show what's missing?")
    pdf.body_text("What to check: Is the dashboard helpful? Do the numbers make sense?")
    pdf.ln(1)

    pdf.sub_title("Flow 2: Binder Checklist")
    pdf.numbered(1, "Go to Binder Checklist from the sidebar (or bottom nav on mobile)")
    pdf.numbered(2, "Review each section: Contracts, Insurance, Medical Releases, Birth Certs, Certifications")
    pdf.numbered(3, "Try downloading the Medical Release Sign-Off Sheet")
    pdf.numbered(4, "Try uploading a signed release sheet (any test file)")
    pdf.body_text("What to check: Does each section show the right status? Can you view uploaded documents?")
    pdf.ln(1)

    pdf.sub_title("Flow 3: Upload Coaching Certifications")
    pdf.numbered(1, "Go to Certifications from the sidebar")
    pdf.numbered(2, "Upload a test Concussion Training certificate (any image or PDF)")
    pdf.numbered(3, "Upload a test Cardiac Arrest certificate")
    pdf.numbered(4, "Try the View/Print button after uploading")
    pdf.numbered(5, "Try adding an Assistant Coach and uploading their certs too")
    pdf.body_text("What to check: Do uploads work? Can you view what you uploaded? Does the status update?")
    pdf.ln(1)

    pdf.sub_title("Flow 4: Check the Pitching Log")
    pdf.numbered(1, "Go to Pitching Log from the sidebar")
    pdf.numbered(2, "Switch between divisions using the dropdown")
    pdf.numbered(3, "Try the 'Print This Page' button")
    pdf.numbered(4, "Try the 'Official PONY Pitching Log' button (should open a PDF)")
    pdf.body_text("What to check: Do the pitching rules look correct? Does printing work?")
    pdf.ln(1)

    pdf.sub_title("Flow 5: View Your Roster")
    pdf.numbered(1, "Go to Roster from the sidebar")
    pdf.numbered(2, "Check that your players are listed correctly")
    pdf.numbered(3, "Click on the document badges (Birth Cert, Photo, Contract, Medical) to view uploads")
    pdf.body_text("What to check: Is the roster accurate? Can you view the documents?")

    # ========== ADMIN TESTING ==========
    pdf.add_page()
    pdf.section_title("Testing as an Admin")
    pdf.body_text("Goal: Manage the full All-Stars program workflow from coach applications to tournament readiness.")
    pdf.ln(2)

    pdf.sub_title("Flow 1: Review Coach Applications")
    pdf.numbered(1, "Go to Coach Applications in the admin sidebar")
    pdf.numbered(2, "Click on an application to expand it")
    pdf.numbered(3, "Try changing the status (Submitted -> Under Review -> Accepted)")
    pdf.body_text("What to check: Can you see all the application details? Does the status update?")
    pdf.ln(1)

    pdf.sub_title("Flow 2: Create a Team")
    pdf.numbered(1, "Go to Teams in the admin sidebar")
    pdf.numbered(2, "Select a coach from the dropdown (only accepted coaches appear)")
    pdf.numbered(3, "Notice the division auto-fills based on the coach's preference")
    pdf.numbered(4, "Enter a team name and click Create Team")
    pdf.numbered(5, "Try renaming the team using the pencil icon")
    pdf.body_text("What to check: Does the coach dropdown work? Does auto-fill work? Can you rename?")
    pdf.ln(1)

    pdf.sub_title("Flow 3: Manage Tryouts & Select Players")
    pdf.numbered(1, "Go to Tryouts in the admin sidebar")
    pdf.numbered(2, "Use the division and status filters to find players")
    pdf.numbered(3, "Expand a player to see their details")
    pdf.numbered(4, "Try changing a player's status (e.g., to 'Selected')")
    pdf.numbered(5, "Try sending a selection notification email")
    pdf.body_text("What to check: Do filters work? Can you see Coach Pick badges? Does email sending work?")
    pdf.ln(1)

    pdf.sub_title("Flow 4: Post an Announcement")
    pdf.numbered(1, "Go to Announcements in the admin sidebar")
    pdf.numbered(2, "Type a title and body, then click Post Announcement")
    pdf.numbered(3, "Verify the green success banner appears")
    pdf.numbered(4, "Check that the announcement shows up in the list below")
    pdf.numbered(5, "Try editing and deleting the announcement")
    pdf.body_text("What to check: Does posting work? Does the success message appear? Can you edit/delete?")
    pdf.ln(1)

    pdf.sub_title("Flow 5: Check Tournament Compliance")
    pdf.numbered(1, "Go to Compliance in the admin sidebar")
    pdf.numbered(2, "Check the overall readiness percentage")
    pdf.numbered(3, "Expand a division to see individual player compliance")
    pdf.numbered(4, "Check the coach certifications section at the bottom")
    pdf.body_text("What to check: Are the stats accurate? Does it show the coach's name (not email)?")

    # ========== REPORTING ==========
    pdf.add_page()
    pdf.section_title("How to Report Issues")
    pdf.body_text(
        "When you find something that seems wrong or could be better, please report it. "
        "Even small things matter - if something confused you for a moment, it will confuse parents too."
    )
    pdf.ln(2)

    pdf.sub_title("What to Report")
    pdf.bullet("Anything that doesn't work (buttons, forms, uploads, etc.)")
    pdf.bullet("Anything that looks broken on your phone")
    pdf.bullet("Text that's confusing or unclear")
    pdf.bullet("Pages that load slowly")
    pdf.bullet("Missing information or features you'd expect to see")
    pdf.bullet("Things that worked but felt clunky or unintuitive")
    pdf.ln(2)

    pdf.sub_title("How to Report")
    pdf.body_text("Send an email to AllStars@irvinepony.com with:")
    pdf.numbered(1, "What you were trying to do")
    pdf.numbered(2, "What happened instead")
    pdf.numbered(3, "A screenshot if possible (especially for mobile issues)")
    pdf.numbered(4, "What device/browser you were using (iPhone, Chrome, etc.)")
    pdf.ln(2)

    pdf.info_box("TIP", "Screenshots are the most helpful thing you can send. On iPhone, press the side button + volume up. On Android, press power + volume down. On desktop, use Cmd+Shift+4 (Mac) or Win+Shift+S (Windows).")

    pdf.ln(4)
    pdf.section_title("Thank You!")
    pdf.body_text(
        "Your help testing the site is invaluable. This platform will make the All-Stars experience "
        "smoother for every family, coach, and volunteer involved. The more issues we catch now, "
        "the better it will be when we go live."
    )
    pdf.ln(3)
    pdf.body_text(
        "Questions? Contact Joe Hernandez at AllStars@irvinepony.com"
    )

    # Output
    pdf.output("/Users/joe/irvine-all-stars/testing/Irvine-AllStars-Testing-Guide.pdf")
    print("PDF generated: testing/Irvine-AllStars-Testing-Guide.pdf")


if __name__ == "__main__":
    build_pdf()
