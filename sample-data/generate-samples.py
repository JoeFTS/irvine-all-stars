#!/usr/bin/env python3
"""Generate sample documents for testing Irvine All-Stars upload flows."""

import os
from fpdf import FPDF
from datetime import date
import math

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))


def navy():
    return (10, 35, 66)

def red():
    return (193, 18, 31)

def gold():
    return (244, 180, 0)

def white():
    return (255, 255, 255)

def light_gray():
    return (240, 240, 240)


# ─── 1. Pre-Tournament Rules ───────────────────────────────────────────

def create_tournament_rules():
    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=20)

    # Header bar
    pdf.set_fill_color(*navy())
    pdf.rect(0, 0, 210, 30, "F")
    pdf.set_text_color(*white())
    pdf.set_font("Helvetica", "B", 18)
    pdf.set_y(8)
    pdf.cell(0, 14, "IRVINE PONY BASEBALL", align="C", new_x="LMARGIN", new_y="NEXT")

    # Gold stripe
    pdf.set_fill_color(*gold())
    pdf.rect(0, 30, 210, 3, "F")

    pdf.set_y(40)
    pdf.set_text_color(*navy())
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, "2026 ALL-STARS PRE-TOURNAMENT RULES", align="C", new_x="LMARGIN", new_y="NEXT")

    pdf.set_text_color(*red())
    pdf.set_font("Helvetica", "I", 10)
    pdf.cell(0, 6, "Effective for all Irvine Pony Baseball All-Star teams  |  Season 2026", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(6)

    sections = [
        ("1. ELIGIBILITY", [
            "All players must be registered with Irvine Pony Baseball for the current season.",
            "Players must meet age requirements for their respective division (Shetland through Pony).",
            "Birth certificates must be on file with the league prior to the first tournament game.",
            "Players may only participate on ONE All-Star team per season.",
        ]),
        ("2. ROSTER REQUIREMENTS", [
            "Each team shall carry a minimum of 11 and a maximum of 14 players.",
            "All roster players must be listed on the official PONY Baseball tournament roster form.",
            "Roster changes must be submitted at least 48 hours before the first tournament game.",
            "Alternate players may be activated only if a rostered player is injured or unavailable.",
        ]),
        ("3. COACH REQUIREMENTS", [
            "Head coaches must have completed the PONY Baseball coaching certification.",
            "All coaches must have current concussion protocol training (AB-379).",
            "All coaches must have current sudden cardiac arrest prevention training (AB-379).",
            "Background checks must be completed and cleared for all coaching staff.",
            "A maximum of 4 coaches (1 head coach + 3 assistants) may be in the dugout.",
        ]),
        ("4. GAME RULES", [
            "All games follow official PONY Baseball rules for the applicable division.",
            "Home team is determined by coin flip or tournament bracket assignment.",
            "Pitching limits follow PONY Baseball pitch count regulations per division.",
            "Mandatory play rules apply: every rostered player must play at least 2 innings per game.",
            "Time limits: 2 hours for pool play, no new inning after 1:45. No time limit in elimination.",
        ]),
        ("5. CONDUCT & SPORTSMANSHIP", [
            "Zero tolerance for unsportsmanlike conduct from players, coaches, or spectators.",
            "Ejected individuals must leave the facility and may face suspension for additional games.",
            "Disputes must be handled through the official protest process, not on the field.",
            "Teams are responsible for cleaning their dugout after each game.",
        ]),
        ("6. EQUIPMENT & UNIFORMS", [
            "All equipment must meet current PONY Baseball safety standards.",
            "Uniform jerseys, pants, and hats must be matching for all team members.",
            "Metal cleats are permitted only in Bronco division and above.",
            "Catchers must wear full protective gear including a dangling throat guard.",
        ]),
    ]

    pdf.set_text_color(0, 0, 0)
    for title, items in sections:
        pdf.set_font("Helvetica", "B", 12)
        pdf.set_fill_color(*light_gray())
        pdf.cell(0, 8, f"  {title}", fill=True, new_x="LMARGIN", new_y="NEXT")
        pdf.ln(2)
        pdf.set_font("Helvetica", "", 10)
        for item in items:
            pdf.set_x(15)
            pdf.multi_cell(180, 5, f"  -  {item}")
            pdf.ln(1)
        pdf.ln(3)

    # Footer
    pdf.ln(5)
    pdf.set_draw_color(*navy())
    pdf.line(15, pdf.get_y(), 195, pdf.get_y())
    pdf.ln(5)
    pdf.set_font("Helvetica", "I", 9)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 5, f"Irvine Pony Baseball  |  irvinepony.com  |  Updated {date.today().strftime('%B %Y')}", align="C")

    pdf.output(os.path.join(OUTPUT_DIR, "pre-tournament-rules.pdf"))
    print("  Created: pre-tournament-rules.pdf")


# ─── 2. Coaches Agreement ──────────────────────────────────────────────

def create_coaches_agreement():
    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=20)

    # Header
    pdf.set_fill_color(*navy())
    pdf.rect(0, 0, 210, 28, "F")
    pdf.set_text_color(*white())
    pdf.set_font("Helvetica", "B", 16)
    pdf.set_y(7)
    pdf.cell(0, 14, "IRVINE PONY BASEBALL - ALL-STARS COACHES AGREEMENT", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_fill_color(*gold())
    pdf.rect(0, 28, 210, 3, "F")

    pdf.set_y(38)
    pdf.set_text_color(0, 0, 0)
    pdf.set_font("Helvetica", "", 10)
    pdf.multi_cell(0, 5, "By signing this agreement, I acknowledge that I have read, understand, and agree to abide by the following terms and conditions as a coach for the Irvine Pony Baseball All-Stars program for the 2026 season.")
    pdf.ln(5)

    clauses = [
        ("RESPONSIBILITIES", "I agree to attend all scheduled practices, scrimmages, and tournament games. I will communicate promptly with parents, league officials, and fellow coaches regarding schedules, player development, and any concerns."),
        ("CONDUCT", "I will model good sportsmanship at all times. I will not use profanity, make disparaging comments about players, umpires, or opposing teams, or engage in any behavior that reflects poorly on Irvine Pony Baseball."),
        ("PLAYER SAFETY", "Player safety is my top priority. I will follow all PONY Baseball safety guidelines, monitor weather conditions, ensure proper warmups, and enforce pitch count limits. I will not allow injured players to participate without medical clearance."),
        ("TRAINING REQUIREMENTS", "I have completed or will complete before the first practice: (a) PONY Baseball coaching certification, (b) Youth Sports Concussion Protocol training per CA AB-379, (c) Sudden Cardiac Arrest Prevention training per CA AB-379, (d) Background check clearance."),
        ("FAIR PLAY", "I will provide all rostered players with meaningful playing time. I will follow mandatory play rules and will not prioritize winning over player development and the overall experience."),
        ("PARENT COMMUNICATION", "I will hold a mandatory parent meeting before tournament play begins. I will communicate expectations for practice schedules, game-day logistics, snack duties, and any required fees or fundraising."),
        ("EQUIPMENT & FACILITIES", "I will ensure all equipment is in safe, working condition. I will leave practice and game facilities in the same or better condition than I found them."),
        ("LEAGUE POLICIES", "I agree to follow all Irvine Pony Baseball policies, PONY Baseball national rules, and any additional tournament-specific rules. Violations may result in suspension or removal from the coaching staff."),
    ]

    for i, (title, text) in enumerate(clauses, 1):
        pdf.set_font("Helvetica", "B", 11)
        pdf.set_text_color(*navy())
        pdf.cell(0, 7, f"{i}. {title}", new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("Helvetica", "", 10)
        pdf.set_text_color(0, 0, 0)
        pdf.multi_cell(0, 5, text)
        pdf.ln(3)

    # Signature block
    pdf.ln(8)
    pdf.set_draw_color(*navy())
    pdf.line(15, pdf.get_y(), 195, pdf.get_y())
    pdf.ln(10)

    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(*navy())
    pdf.cell(0, 7, "ACKNOWLEDGMENT & SIGNATURE", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(3)

    y = pdf.get_y()
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(0, 0, 0)
    pdf.cell(95, 7, "Coach Name: ___________________________________")
    pdf.set_x(110)
    pdf.cell(85, 7, "Date: _______________", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(8)
    pdf.cell(95, 7, "Signature: ____________________________________")
    pdf.set_x(110)
    pdf.cell(85, 7, "Division: _______________", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(8)
    pdf.cell(0, 7, "Email: ________________________________________________", new_x="LMARGIN", new_y="NEXT")

    pdf.output(os.path.join(OUTPUT_DIR, "coaches-agreement.pdf"))
    print("  Created: coaches-agreement.pdf")


# ─── 3. Sample Certificate of Liability Insurance ──────────────────────

def create_liability_insurance():
    pdf = FPDF()
    pdf.add_page("L")  # Landscape

    # Border
    pdf.set_draw_color(*navy())
    pdf.set_line_width(2)
    pdf.rect(8, 8, 281 - 16, 210 - 16)
    pdf.set_line_width(0.5)
    pdf.rect(12, 12, 281 - 24, 210 - 24)

    # SAMPLE watermark
    pdf.set_font("Helvetica", "B", 72)
    pdf.set_text_color(230, 230, 230)
    pdf.text(60, 120, "SAMPLE - NOT VALID")

    # Header
    pdf.set_text_color(*navy())
    pdf.set_font("Helvetica", "B", 20)
    pdf.set_y(22)
    pdf.cell(0, 12, "CERTIFICATE OF LIABILITY INSURANCE", align="C", new_x="LMARGIN", new_y="NEXT")

    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 6, "THIS CERTIFICATE IS ISSUED AS A MATTER OF INFORMATION ONLY AND CONFERS NO RIGHTS UPON THE CERTIFICATE HOLDER.", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(8)

    # Info grid
    fields = [
        ("PRODUCER", "Sample Insurance Agency\n123 Main Street\nIrvine, CA 92618\nPhone: (949) 555-0100"),
        ("INSURED", "Irvine Pony Baseball, Inc.\n123 Example Parkway\nIrvine, CA 92620"),
        ("POLICY NUMBER", "GL-2026-SAMPLE-001"),
        ("EFFECTIVE DATE", "January 1, 2026"),
        ("EXPIRATION DATE", "December 31, 2026"),
        ("TYPE OF INSURANCE", "Commercial General Liability"),
        ("GENERAL AGGREGATE LIMIT", "$2,000,000"),
        ("EACH OCCURRENCE LIMIT", "$1,000,000"),
        ("MEDICAL EXPENSE", "$10,000 per person"),
        ("PERSONAL & ADV INJURY", "$1,000,000"),
    ]

    pdf.set_text_color(0, 0, 0)
    y_start = pdf.get_y()
    col_x = [20, 150]

    for i, (label, value) in enumerate(fields):
        col = 0 if i % 2 == 0 else 1
        if i > 0 and i % 2 == 0:
            y_start += 22

        pdf.set_xy(col_x[col], y_start)
        pdf.set_font("Helvetica", "B", 9)
        pdf.cell(60, 5, label)
        pdf.set_xy(col_x[col], y_start + 5)
        pdf.set_font("Helvetica", "", 9)
        pdf.multi_cell(120, 4, value)

    # Footer
    pdf.set_y(170)
    pdf.set_draw_color(*navy())
    pdf.line(20, 170, 261, 170)
    pdf.ln(5)
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(*red())
    pdf.cell(0, 6, "*** THIS IS A SAMPLE DOCUMENT FOR TESTING PURPOSES ONLY ***", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 5, "Not a real certificate of insurance. Do not use for any official purpose.", align="C")

    pdf.output(os.path.join(OUTPUT_DIR, "sample-liability-insurance.pdf"))
    print("  Created: sample-liability-insurance.pdf")


# ─── 4. Medical Release Forms ──────────────────────────────────────────

def create_medical_release(player_name, dob, division, parent_name, filename):
    pdf = FPDF()
    pdf.add_page()

    # Header
    pdf.set_fill_color(*navy())
    pdf.rect(0, 0, 210, 25, "F")
    pdf.set_text_color(*white())
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_y(6)
    pdf.cell(0, 12, "IRVINE PONY BASEBALL - MEDICAL RELEASE FORM", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_fill_color(*gold())
    pdf.rect(0, 25, 210, 2, "F")

    pdf.set_y(34)
    pdf.set_text_color(0, 0, 0)

    # Player info
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_fill_color(*light_gray())
    pdf.cell(0, 8, "  PLAYER INFORMATION", fill=True, new_x="LMARGIN", new_y="NEXT")
    pdf.ln(3)
    pdf.set_font("Helvetica", "", 10)

    info = [
        ("Player Name", player_name),
        ("Date of Birth", dob),
        ("Division", division),
        ("Parent/Guardian", parent_name),
    ]
    for label, val in info:
        pdf.cell(50, 7, f"{label}:")
        pdf.set_font("Helvetica", "B", 10)
        pdf.cell(0, 7, val, new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("Helvetica", "", 10)

    pdf.ln(5)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 8, "  MEDICAL INFORMATION", fill=True, new_x="LMARGIN", new_y="NEXT")
    pdf.ln(3)
    pdf.set_font("Helvetica", "", 10)

    med_fields = [
        ("Allergies", "None known"),
        ("Current Medications", "None"),
        ("Medical Conditions", "None"),
        ("Insurance Provider", "Blue Cross Blue Shield"),
        ("Policy Number", "BCB-2026-SAMPLE"),
        ("Primary Physician", "Dr. Jane Smith, (949) 555-0200"),
    ]
    for label, val in med_fields:
        pdf.cell(50, 7, f"{label}:")
        pdf.cell(0, 7, val, new_x="LMARGIN", new_y="NEXT")

    pdf.ln(5)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 8, "  EMERGENCY AUTHORIZATION", fill=True, new_x="LMARGIN", new_y="NEXT")
    pdf.ln(3)
    pdf.set_font("Helvetica", "", 10)
    pdf.multi_cell(0, 5, f"I, {parent_name}, hereby authorize the coaching staff of Irvine Pony Baseball to seek emergency medical treatment for {player_name} in the event that I cannot be reached. I understand that every effort will be made to contact me before treatment is administered.")
    pdf.ln(3)
    pdf.multi_cell(0, 5, "I acknowledge that participation in baseball involves inherent risks including but not limited to sprains, fractures, concussions, and other injuries. I accept these risks on behalf of my child.")

    # Signature
    pdf.ln(10)
    pdf.set_draw_color(*navy())
    pdf.line(15, pdf.get_y(), 195, pdf.get_y())
    pdf.ln(10)
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(50, 7, "Parent Signature:")
    pdf.set_font("Helvetica", "I", 12)
    pdf.cell(80, 7, parent_name)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 7, f"Date: {date.today().strftime('%m/%d/%Y')}", new_x="LMARGIN", new_y="NEXT")

    pdf.output(os.path.join(OUTPUT_DIR, filename))
    print(f"  Created: {filename}")


# ─── 5. Cartoon Birth Certificates ─────────────────────────────────────

def draw_star(pdf, cx, cy, r_outer, r_inner, points=5):
    """Draw a filled star shape."""
    coords = []
    for i in range(points * 2):
        angle = math.pi / 2 + i * math.pi / points
        r = r_outer if i % 2 == 0 else r_inner
        x = cx + r * math.cos(angle)
        y = cy - r * math.sin(angle)
        coords.append((x, y))

    # Draw as polygon using lines
    pdf.set_fill_color(*gold())
    pdf.set_draw_color(*gold())

    # Use polygon approximation with lines
    for i in range(len(coords)):
        x1, y1 = coords[i]
        x2, y2 = coords[(i + 1) % len(coords)]
        pdf.line(x1, y1, x2, y2)


def create_birth_certificate(child_name, dob, city, parent1, parent2, filename):
    pdf = FPDF()
    pdf.add_page()

    # Fun border - double line with rounded feel
    pdf.set_draw_color(70, 130, 180)  # Steel blue
    pdf.set_line_width(3)
    pdf.rect(10, 10, 190, 277)
    pdf.set_line_width(1)
    pdf.set_draw_color(135, 206, 250)  # Light sky blue
    pdf.rect(14, 14, 182, 269)

    # Decorative corner stars
    for x, y in [(20, 20), (190, 20), (20, 277), (190, 277)]:
        draw_star(pdf, x, y, 8, 3)

    # SAMPLE watermark
    pdf.set_font("Helvetica", "B", 60)
    pdf.set_text_color(240, 240, 240)
    pdf.text(30, 160, "SAMPLE DOCUMENT")

    # Header
    pdf.set_text_color(70, 130, 180)
    pdf.set_font("Helvetica", "B", 28)
    pdf.set_y(30)
    pdf.cell(0, 15, "CERTIFICATE", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 20)
    pdf.cell(0, 10, "of", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "B", 28)
    pdf.cell(0, 15, "BIRTH", align="C", new_x="LMARGIN", new_y="NEXT")

    # Decorative line
    pdf.set_draw_color(*gold())
    pdf.set_line_width(1.5)
    pdf.line(50, 75, 160, 75)
    pdf.set_line_width(0.5)

    # Stork / baby doodle area (text-based cartoon)
    pdf.set_y(82)
    pdf.set_font("Helvetica", "", 36)
    pdf.set_text_color(255, 182, 193)  # Pink
    pdf.cell(0, 15, "<3  <3  <3", align="C", new_x="LMARGIN", new_y="NEXT")

    # "This certifies that"
    pdf.set_y(100)
    pdf.set_font("Helvetica", "I", 14)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 10, "This is to certify that", align="C", new_x="LMARGIN", new_y="NEXT")

    # Child name - big and fun
    pdf.set_font("Helvetica", "B", 30)
    pdf.set_text_color(70, 130, 180)
    pdf.cell(0, 18, child_name, align="C", new_x="LMARGIN", new_y="NEXT")

    # Details
    pdf.ln(5)
    pdf.set_font("Helvetica", "I", 14)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 10, "was born on", align="C", new_x="LMARGIN", new_y="NEXT")

    pdf.set_font("Helvetica", "B", 22)
    pdf.set_text_color(70, 130, 180)
    pdf.cell(0, 14, dob, align="C", new_x="LMARGIN", new_y="NEXT")

    pdf.set_font("Helvetica", "I", 14)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 10, "in", align="C", new_x="LMARGIN", new_y="NEXT")

    pdf.set_font("Helvetica", "B", 18)
    pdf.set_text_color(70, 130, 180)
    pdf.cell(0, 12, city, align="C", new_x="LMARGIN", new_y="NEXT")

    # Parents
    pdf.ln(10)
    pdf.set_draw_color(200, 200, 200)
    pdf.line(30, pdf.get_y(), 180, pdf.get_y())
    pdf.ln(8)

    pdf.set_font("Helvetica", "", 12)
    pdf.set_text_color(80, 80, 80)
    pdf.cell(0, 8, f"Parent/Guardian 1:  {parent1}", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 8, f"Parent/Guardian 2:  {parent2}", align="C", new_x="LMARGIN", new_y="NEXT")

    # Fun footer
    pdf.ln(10)
    pdf.set_font("Helvetica", "", 36)
    pdf.set_text_color(255, 215, 0)  # Gold
    pdf.cell(0, 15, "*  *  *  *  *", align="C", new_x="LMARGIN", new_y="NEXT")

    # Official-looking (but fake) details
    pdf.ln(5)
    pdf.set_font("Helvetica", "I", 9)
    pdf.set_text_color(180, 180, 180)
    pdf.cell(0, 5, "State File Number: SAMPLE-2026-00000  |  This is a sample document for testing only", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 5, "Not a real birth certificate. Do not use for any official purpose.", align="C")

    pdf.output(os.path.join(OUTPUT_DIR, filename))
    print(f"  Created: {filename}")


# ─── 6. Training Certificates ──────────────────────────────────────────

def create_training_certificate(cert_type, coach_name, completion_date, filename):
    pdf = FPDF()
    pdf.add_page("L")

    if cert_type == "concussion":
        title = "YOUTH SPORTS CONCUSSION\nPROTOCOL TRAINING"
        subtitle = "California AB-379 Compliance"
        org = "Center for Disease Control and Prevention  |  Heads Up Program"
        color = (0, 100, 170)  # Blue
        accent = (0, 150, 220)
    else:
        title = "SUDDEN CARDIAC ARREST\nPREVENTION TRAINING"
        subtitle = "California AB-379 Compliance"
        org = "National Federation of State High School Associations  |  NFHS Learn"
        color = (180, 30, 30)  # Red
        accent = (220, 50, 50)

    # Border
    pdf.set_draw_color(*color)
    pdf.set_line_width(3)
    pdf.rect(10, 10, 277, 190)
    pdf.set_line_width(1)
    pdf.rect(14, 14, 269, 182)

    # SAMPLE watermark
    pdf.set_font("Helvetica", "B", 65)
    pdf.set_text_color(240, 240, 240)
    pdf.text(45, 115, "SAMPLE CERTIFICATE")

    # Header
    pdf.set_y(25)
    pdf.set_text_color(*color)
    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(0, 8, "CERTIFICATE OF COMPLETION", align="C", new_x="LMARGIN", new_y="NEXT")

    pdf.set_draw_color(*accent)
    pdf.set_line_width(1)
    pdf.line(80, pdf.get_y() + 2, 217, pdf.get_y() + 2)
    pdf.ln(8)

    # Title
    pdf.set_font("Helvetica", "B", 24)
    pdf.multi_cell(0, 14, title, align="C")
    pdf.ln(3)

    pdf.set_font("Helvetica", "I", 12)
    pdf.set_text_color(120, 120, 120)
    pdf.cell(0, 8, subtitle, align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(8)

    # "This certifies"
    pdf.set_font("Helvetica", "", 13)
    pdf.set_text_color(80, 80, 80)
    pdf.cell(0, 8, "This certifies that", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(3)

    # Coach name
    pdf.set_font("Helvetica", "B", 28)
    pdf.set_text_color(*color)
    pdf.cell(0, 16, coach_name, align="C", new_x="LMARGIN", new_y="NEXT")

    # Underline
    pdf.set_draw_color(*accent)
    pdf.line(80, pdf.get_y() + 2, 217, pdf.get_y() + 2)
    pdf.ln(8)

    # Completion text
    pdf.set_font("Helvetica", "", 12)
    pdf.set_text_color(80, 80, 80)
    if cert_type == "concussion":
        pdf.multi_cell(0, 7, f"has successfully completed the CDC Heads Up Concussion in Youth Sports\nonline training course on {completion_date}.", align="C")
    else:
        pdf.multi_cell(0, 7, f"has successfully completed the NFHS Sudden Cardiac Arrest\nonline training course on {completion_date}.", align="C")

    # Organization
    pdf.ln(8)
    pdf.set_font("Helvetica", "I", 10)
    pdf.set_text_color(150, 150, 150)
    pdf.cell(0, 6, org, align="C", new_x="LMARGIN", new_y="NEXT")

    # Footer
    pdf.set_y(175)
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(*accent)
    pdf.cell(0, 5, "*** SAMPLE DOCUMENT FOR TESTING PURPOSES ONLY ***", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(180, 180, 180)
    pdf.cell(0, 5, "This is not a real training certificate. Do not use for any official purpose.", align="C")

    pdf.output(os.path.join(OUTPUT_DIR, filename))
    print(f"  Created: {filename}")


# ─── Generate All ──────────────────────────────────────────────────────

if __name__ == "__main__":
    print("Generating sample documents for Irvine All-Stars...\n")

    print("Tournament & Coach Documents:")
    create_tournament_rules()
    create_coaches_agreement()
    create_liability_insurance()

    print("\nMedical Release Forms:")
    create_medical_release(
        "Ethan Rodriguez", "03/15/2014", "10U-Mustang",
        "Maria Rodriguez", "medical-release-ethan-rodriguez.pdf"
    )
    create_medical_release(
        "Sophia Chen", "07/22/2013", "12U-Bronco",
        "David Chen", "medical-release-sophia-chen.pdf"
    )

    print("\nBirth Certificates (cartoon-style):")
    create_birth_certificate(
        "Ethan James Rodriguez", "March 15, 2014",
        "Irvine, California",
        "Maria Rodriguez", "Carlos Rodriguez",
        "birth-certificate-ethan-rodriguez.pdf"
    )
    create_birth_certificate(
        "Sophia Lin Chen", "July 22, 2013",
        "Orange, California",
        "David Chen", "Jennifer Chen",
        "birth-certificate-sophia-chen.pdf"
    )

    print("\nTraining Certificates:")
    create_training_certificate(
        "concussion", "Coach Mike Thompson",
        "February 10, 2026", "cert-concussion-mike-thompson.pdf"
    )
    create_training_certificate(
        "cardiac_arrest", "Coach Mike Thompson",
        "February 12, 2026", "cert-cardiac-arrest-mike-thompson.pdf"
    )

    print(f"\nDone! {10} sample documents created in: {OUTPUT_DIR}")
