export interface DocumentSection {
  heading: string;
  content: string;
}

export interface Document {
  slug: string;
  title: string;
  description: string;
  category: "parents" | "coaches";
  sections: DocumentSection[];
}

export const documents: Document[] = [
  {
    slug: "parent-info",
    title: "Parent Information Packet",
    description:
      "Everything families need to know about All-Stars — what it is, how tryouts work, commitment expectations, and key contacts.",
    category: "parents",
    sections: [
      {
        heading: "What is All-Stars?",
        content:
          "All-Stars are elite summer tournament teams that represent Irvine Pony Baseball in inter-league competition. These teams are separate from the regular season — players are selected through a tryout process to form the most competitive roster possible in each age division. All-Stars is a chance for standout players to test themselves against the best from other leagues across Southern California and beyond.",
      },
      {
        heading: "Divisions",
        content:
          "Irvine All-Stars fields 12 divisions:\n\n• 5U Shetland\n• 6U Shetland\n• 7U Pinto Machine Pitch\n• 7U Pinto Kid Pitch\n• 8U Pinto Machine Pitch\n• 8U Pinto Kid Pitch\n• 9U Mustang\n• 10U Mustang\n• 11U Bronco\n• 12U Bronco\n• 13U Pony\n• 14U Pony\n\nEach division has its own coaching staff, practice schedule, and tournament calendar.",
      },
      {
        heading: "Roster Size",
        content:
          "Each All-Stars team carries a roster of 12 players. Rosters are built to be balanced and competitive, with selections based entirely on tryout evaluations and regular-season performance.",
      },
      {
        heading: "Tryout Process",
        content:
          "Every player who registers for tryouts is evaluated by independent evaluators using a standardized rubric. Evaluators score each player across 6 categories on a 1–9 scale:\n\n• Hitting — bat speed, contact, mechanics, plate discipline\n• Fielding — glove work, footwork, range, consistency\n• Throwing — arm strength, accuracy, mechanics, release\n• Running / Speed — base running, first-step quickness, overall athleticism\n• Effort — hustle, intensity, competing hard on every play\n• Attitude — sportsmanship, coachability, enthusiasm\n\nMultiple evaluators score each player independently, and scores are averaged for fairness. The maximum possible score is 54 points.",
      },
      {
        heading: "Commitment Expectations",
        content:
          "All-Stars is a significant commitment for the entire family. Expect:\n\n• Practices 2–3 times per week (weeknight evenings, 1.5–2 hours)\n• Tournaments most weekends from May through August\n• Travel to away tournaments within Southern California\n• Full attendance at all practices and games unless excused in advance\n\nPlease discuss the time commitment as a family before registering for tryouts.",
      },
      {
        heading: "Equipment",
        content:
          "Players are responsible for providing their own:\n\n• Bat (must meet division-specific regulations)\n• Glove\n• Cleats\n• Batting gloves and protective gear\n\nThe team provides the official uniform (jersey, pants, hat, socks). Uniform fees are included in the All-Stars participation cost.",
      },
      {
        heading: "Communication",
        content:
          "All schedule updates, announcements, and team information will be communicated through the parent portal at irvineallstars.com/portal. Parents are expected to check the portal regularly and keep their contact information up to date.",
      },
      {
        heading: "Key Contacts",
        content:
          "For questions about All-Stars, reach out to the coordinator:\n\n• Email: allstars@irvinepony.com\n• Website: irvineallstars.com\n\nWe do our best to respond within 24 hours during the season.",
      },
    ],
  },
  {
    slug: "evaluation-rubric",
    title: "Tryout Evaluation Rubric",
    description:
      "The standardized 54-point scoring rubric used by independent evaluators to assess players across 6 categories.",
    category: "parents",
    sections: [
      {
        heading: "Overview",
        content:
          "Every player who tries out for All-Stars is evaluated using this standardized rubric. The rubric is designed to assess the complete player across 6 categories, each scored on a 1–9 scale. Multiple independent evaluators score each player, and scores are averaged to ensure fairness and reduce bias.\n\nMaximum possible score: 54 points (6 categories × 9 points each).",
      },
      {
        heading: "Category 1: Hitting",
        content:
          "Evaluates the player's offensive ability at the plate.\n\n• Bat speed — how quickly the player gets the bat through the zone\n• Contact — ability to make consistent, solid contact\n• Mechanics — proper stance, load, stride, and swing path\n• Plate discipline — pitch selection, ability to lay off bad pitches",
      },
      {
        heading: "Category 2: Fielding",
        content:
          "Evaluates the player's defensive ability in the field.\n\n• Glove work — soft hands, clean receiving, secure transfers\n• Footwork — proper positioning and movement to the ball\n• Range — ability to cover ground laterally and forward/back\n• Consistency — reliability on routine plays under pressure",
      },
      {
        heading: "Category 3: Throwing",
        content:
          "Evaluates the player's arm and throwing mechanics.\n\n• Arm strength — velocity and carry on throws\n• Accuracy — ability to hit targets consistently\n• Mechanics — proper arm path, follow-through, and body alignment\n• Release — quick transfer and clean release point",
      },
      {
        heading: "Category 4: Running / Speed",
        content:
          "Evaluates the player's athleticism and base running.\n\n• Base running — technique and instincts on the bases\n• First-step quickness — reaction time and acceleration\n• Overall athleticism — coordination, agility, and body control",
      },
      {
        heading: "Category 5: Effort",
        content:
          "Evaluates the player's hustle and intensity.\n\n• Hustle — running out every play, sprinting on and off the field\n• Intensity — competing hard during every drill and evaluation\n• Consistency — maintaining high effort throughout the entire tryout, not just early on",
      },
      {
        heading: "Category 6: Attitude",
        content:
          "Evaluates the player's character and demeanor.\n\n• Sportsmanship — positive demeanor, respect for opponents and officials\n• Coachability — ability to listen, process, and apply coaching feedback\n• Enthusiasm — team-first mentality, encouraging teammates, love for the game",
      },
      {
        heading: "Score Ranges",
        content:
          "Each category is scored on a 1–9 scale with three tiers:\n\n• 1–3: Developing — fundamentals are still being built; player shows potential but needs more reps and instruction\n• 4–6: Solid — demonstrates competency and consistency; meets the standard expected for the division\n• 7–9: Elite — exceptional ability that stands out; performs at a level above the typical player in the division",
      },
      {
        heading: "Scoring Process",
        content:
          "• Multiple evaluators score each player independently — evaluators do not discuss scores during tryouts\n• Scores are averaged across all evaluators to produce a final composite score\n• The evaluation is designed to minimize subjectivity and ensure every player gets a fair assessment\n• Evaluators are trained on the rubric before tryouts begin",
      },
    ],
  },
  {
    slug: "code-of-conduct",
    title: "Code of Conduct",
    description:
      "Behavioral expectations for coaches, players, and parents. Zero tolerance policy adapted from PONY Baseball.",
    category: "parents",
    sections: [
      {
        heading: "Zero Tolerance Policy",
        content:
          "Irvine Pony Baseball All-Stars maintains a ZERO TOLERANCE policy for unsportsmanlike behavior, adapted from PONY Baseball's national standards. All participants — players, parents, spectators, and coaches — are expected to conduct themselves with respect, integrity, and good sportsmanship at all times.\n\nViolations of this code may result in immediate removal from the facility and further disciplinary action.",
      },
      {
        heading: "Parent & Spectator Expectations",
        content:
          "• Display good sportsmanship at all times — cheer positively, never negatively\n• Respect coaches, umpires, opposing players, and opposing parents\n• No coaching from the stands — let the coaching staff do their job\n• No negative comments about any player, whether your child or someone else's\n• Stay behind fences and barriers during games — do not enter the field of play\n• Only players, managers, and coaches are allowed in the dugout\n• If an issue arises, follow the proper chain of resolution:\n  1. Speak to the team manager privately after the game (never during)\n  2. If unresolved, contact the division director\n  3. If still unresolved, escalate to the All-Stars board",
      },
      {
        heading: "Player Expectations",
        content:
          "• Respect teammates, coaches, umpires, and opponents at all times\n• Give full effort at every practice and every game\n• Attend all practices and games unless excused in advance by the head coach\n• Wear the full team uniform at all games\n• Be on time and prepared — arrive with all equipment and a positive attitude\n• Represent Irvine Pony Baseball with pride and class",
      },
      {
        heading: "Coach Expectations",
        content:
          "• Prioritize player development and safety above winning\n• Model good sportsmanship — coaches set the tone for the entire team\n• Communicate schedule changes, cancellations, and updates promptly\n• Play all players per PONY Baseball minimum play rules\n• Complete all required background checks and coaching certifications before the first practice\n• Treat all players fairly and with respect regardless of ability level",
      },
      {
        heading: "Violation & Discipline Process",
        content:
          "Violations of the Code of Conduct are handled through a progressive discipline process:\n\n• First offense: Verbal warning from the head coach or division director\n• Second offense: Game suspension — the individual must leave the facility for the remainder of the game\n• Third offense: Season removal — permanent dismissal from All-Stars activities for the remainder of the season\n\nSevere violations (threats, physical altercations, abuse of officials) may result in immediate season removal without prior warnings.",
      },
    ],
  },
  {
    slug: "background-checks",
    title: "Background Check Information",
    description:
      "Requirements, process, and timeline for mandatory coaching staff and volunteer background screenings.",
    category: "coaches",
    sections: [
      {
        heading: "Who Needs a Background Check?",
        content:
          "Background checks are required for ALL individuals who will have direct contact with players in an official capacity:\n\n• Head coaches\n• Assistant coaches\n• Team volunteers (scorekeepers, base coaches, team parents with dugout access)\n\nNo exceptions. You must have a completed and cleared background check BEFORE your first practice or team activity.",
      },
      {
        heading: "Screening Provider",
        content:
          "Background checks are conducted through JDP (Judicial Data Processing) Volunteer Screening, PONY Baseball's authorized screening partner.\n\n• Website: jdp.com/pony\n• Phone: (855) 940-3232\n• Cost: $4.12 per screening (paid by the league — no cost to you)",
      },
      {
        heading: "What the Screening Covers",
        content:
          "The JDP volunteer screening includes:\n\n• ID and Social Security number validation\n• National criminal records search\n• Sex offender registry check (all 50 states)\n• Address history verification\n\nThe screening is comprehensive and meets PONY Baseball's national requirements for youth sports organizations.",
      },
      {
        heading: "Timeline & Process",
        content:
          "1. Register at jdp.com/pony and complete the online application\n2. Provide your legal name, date of birth, and Social Security number\n3. Results are typically returned within 2–5 business days\n4. The league receives a pass/fail notification\n5. You will be cleared to participate once a passing result is confirmed\n\nIMPORTANT: Background checks must be completed BEFORE your first practice. Plan ahead — do not wait until the last minute.",
      },
      {
        heading: "Annual Rescreening",
        content:
          "Background checks are valid for one season. Annual rescreening is recommended for returning coaches and volunteers. If you were screened last season, you will need to complete a new screening for the current season.",
      },
      {
        heading: "Confidentiality",
        content:
          "All background check results are strictly confidential.\n\n• Only a pass/fail result is shared with the league — specific details are never disclosed\n• Results are handled in compliance with the Fair Credit Reporting Act (FCRA)\n• Personal information (SSN, date of birth) is processed securely by JDP and is not stored by the league\n• If a screening returns a flagged result, the individual will be contacted privately by JDP to discuss next steps",
      },
    ],
  },
  {
    slug: "season-calendar",
    title: "Season Calendar",
    description:
      "Full timeline of All-Stars events from coach selection through World Series tournament play.",
    category: "parents",
    sections: [
      {
        heading: "Coach Selection (March)",
        content:
          "• March 22: Coach candidacy deadline\n• March 23: Candidate statements distributed to voting pool\n• March 24–26: Peer coach voting and player nominations\n• March 27: All-Star coaches officially named",
      },
      {
        heading: "Scouting Period (March–April)",
        content:
          "• March 28 – April 11: Scouting period\n  — Named coaches may observe regular-season games to evaluate potential players\n  — No direct recruiting or contact with players/families during this period\n  — Coaches should attend games across the division to build familiarity",
      },
      {
        heading: "Tryouts (April)",
        content:
          "• April 12: All-Star tryouts for Bronco (11U/12U) and Pony (13U/14U) divisions\n• April 14: Players notified of selection results\n• Late April: First team practices begin\n\nTryout location and times will be announced on the website and through the parent portal.",
      },
      {
        heading: "Younger Divisions (May)",
        content:
          "• May: Shetland (5U/6U) and Pinto (7U/8U) tryouts and evaluations\n  — These divisions follow a slightly later timeline to accommodate the regular season schedule\n  — Evaluation format may differ by division (skills assessment vs. full tryout)",
      },
      {
        heading: "Tournament Season (June–August)",
        content:
          "• June 11–18: District tournaments begin\n• June–July: Section and Regional tournaments\n• July–August: World Series (qualifying teams)\n\nAll PONY Baseball tournaments use a double-elimination format.",
      },
      {
        heading: "Tournament Path",
        content:
          "Teams advance through a structured tournament bracket:\n\n1. District Tournament — local competition against nearby leagues\n2. Section Tournament — winners advance to compete against district champions\n3. Regional Tournament — section winners compete for a spot in the World Series\n4. World Series — the ultimate stage for PONY Baseball's best teams\n\nNot all teams will advance past districts — but every team competes in at least one tournament.",
      },
    ],
  },
];

export function getDocumentBySlug(slug: string): Document | undefined {
  return documents.find((doc) => doc.slug === slug);
}

export function getDocumentsByCategory(category: "parents" | "coaches"): Document[] {
  return documents.filter((doc) => doc.category === category);
}
