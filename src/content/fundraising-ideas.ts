// Fundraising playbooks shown on /coach/corner/fundraising.
// The page renders the summary fields; the full stepByStep/tips/whatYouNeed
// content is used by scripts/generate-fundraising-playbooks.py to build the
// printable branded PDFs in public/fundraising/.

export type EffortLevel = "Low" | "Low-Medium" | "Medium" | "High";

export interface FundraisingIdea {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  typicalYield: string;
  effort: EffortLevel;
  timeline: string;
  people: string;
  quickSteps: string[]; // 5 punchy bullets shown on the web page
  whatYouNeed: string[]; // checklist for the PDF
  stepByStep: Array<{ title: string; detail: string }>; // 8-12 steps for the PDF
  tips: string[]; // 3 tips for the PDF
}

export const fundraisingIdeas: FundraisingIdea[] = [
  {
    slug: "hit-a-thon",
    name: "Hit-a-Thon",
    tagline: "Per-hit pledges at a one-day team event",
    description:
      "Every player gets a set number of pitches and supporters pledge a dollar amount per hit. Low overhead, high participation, and the math is easy enough to explain to grandma. The flagship fundraiser for most travel ball teams because it works.",
    typicalYield: "$500-$2,000 per team",
    effort: "Low",
    timeline: "3 weeks lead time, one-day event",
    people: "One coach lead plus parent volunteers",
    quickSteps: [
      "Pick a date and reserve a field or batting cage for two hours.",
      "Hand out pledge sheets three weeks before the event.",
      "Players collect per-hit pledges from family and friends.",
      "Run the event: 10 to 20 pitches per player, count every hit.",
      "Collect pledges within one week and deposit to the team account.",
    ],
    whatYouNeed: [
      "Field, cage, or open space with a backstop (2 hours)",
      "Pitching machine or a parent who can throw strikes",
      "Buckets of baseballs and safety gear for catcher",
      "Printed pledge sheets, one per player",
      "Score sheet to track hits per player",
      "Snacks and water for the team",
    ],
    stepByStep: [
      {
        title: "Set a team goal and pick a date",
        detail:
          "Decide what the money is for: tournament fees, travel, uniforms. Put a dollar figure on it. Choose a Saturday three weeks out so families have time to collect pledges.",
      },
      {
        title: "Reserve a field or cage",
        detail:
          "Book two hours at your home field, a community park, or a batting cage. Confirm you can bring buckets of balls and run a pitching machine if needed.",
      },
      {
        title: "Print pledge sheets",
        detail:
          "One sheet per player. Include the player name, team name, goal, event date, and columns for pledger name, phone, and pledge amount per hit. Leave space for 15 to 20 pledgers.",
      },
      {
        title: "Kick off with a team meeting",
        detail:
          "Hand out sheets three weeks before the event. Explain the goal, show families how to ask for pledges, and give each player a target (for example, secure 15 pledges at an average of three dollars per hit).",
      },
      {
        title: "Coach families on the pitch",
        detail:
          "Grandparents, aunts, uncles, coworkers, and neighbors are the best targets. Practice the ask: 'Our team is raising money for our June tournament. I get 15 swings on April 30. Would you pledge a dollar per hit?'",
      },
      {
        title: "Send a midweek reminder",
        detail:
          "One week before the event, text parents to collect any final pledges. Remind them every player participates regardless of pledges gathered.",
      },
      {
        title: "Run the event",
        detail:
          "Each player takes 10 to 20 pitches. Track hits on a simple score sheet: any ball put in play counts, home runs count as two. Keep it moving so the event stays under two hours.",
      },
      {
        title: "Celebrate the results",
        detail:
          "Announce team totals at the end of the session. Recognize top hitters and top fundraisers. Take a team photo for social media and to send to pledgers.",
      },
      {
        title: "Collect pledges within a week",
        detail:
          "Pledgers should pay within seven days. Families collect cash or checks, or send a Venmo link. Parents turn totals in to the team treasurer at the next practice.",
      },
      {
        title: "Deposit and report",
        detail:
          "Total everything, deposit into the team account, and send a thank-you note to every pledger. A quick text with the final number and a team photo goes a long way.",
      },
    ],
    tips: [
      "Cap pledges at a reasonable per-hit amount ($5 to $10) so no one gets a surprise $200 bill. Offer flat pledge amounts as an easier alternative.",
      "Have a second station running at the same time — one pitching machine, one coach-pitch — to double your throughput.",
      "Hit totals look smaller on paper than you think. If a player gets 12 hits at $3 per pledge from 10 pledgers, that is $360 from a single player.",
    ],
  },
  {
    slug: "home-run-derby",
    name: "Home Run Derby Night",
    tagline: "Spectator event with admission, pledges, and concessions",
    description:
      "Turn a home run derby into a full community event. Sell admission, run concessions, collect per-home-run pledges, and offer sponsor-a-hitter slots for local businesses. More production than a hit-a-thon, but the ceiling is much higher and it doubles as team bonding.",
    typicalYield: "$1,500-$5,000 per team",
    effort: "Medium",
    timeline: "6 weeks lead time, one evening event",
    people: "Coach lead plus 6-8 parent volunteers",
    quickSteps: [
      "Book a field with lights for a Friday or Saturday evening.",
      "Sell tickets, sponsor-a-hitter slots, and per-home-run pledges.",
      "Run concessions and a 50/50 raffle at the event.",
      "Host the derby: bracket, rounds, timer, finals.",
      "Collect all pledges and settle concessions within one week.",
    ],
    whatYouNeed: [
      "Field with lights and a functional backstop",
      "Pitching machine or coach pitcher for the derby",
      "PA system or Bluetooth speaker",
      "Printed tickets, sponsor forms, and pledge sheets",
      "Concession stand supplies (hot dogs, water, snacks, drinks)",
      "Cash box and a Venmo or Square account",
      "Volunteer signup for ticket, concessions, and scoring",
    ],
    stepByStep: [
      {
        title: "Lock a date and reserve the field",
        detail:
          "Pick a Friday or Saturday evening about six weeks out. Confirm field lights are available. Build in a rain date two days later.",
      },
      {
        title: "Set ticket pricing and sponsorship tiers",
        detail:
          "Suggested: $5 admission (kids under 6 free), $50 to sponsor one hitter (your logo on their back), $200 to sponsor the event (PA shoutouts plus banner). Price the concessions at a 3x markup.",
      },
      {
        title: "Build a simple flyer",
        detail:
          "Include date, time, location, entry price, what the money funds, and contact info. Post in neighborhood Facebook groups, Nextdoor, and at the team's league.",
      },
      {
        title: "Recruit parent volunteers",
        detail:
          "You need roles for ticket table, concession grill, scoreboard, PA announcer, and cleanup. Create a SignUpGenius or shared spreadsheet.",
      },
      {
        title: "Sell advance tickets and sponsorships",
        detail:
          "Start four weeks out. Advance tickets reduce event-day friction and lock in revenue. Sponsor asks should go to businesses the families already frequent (coffee shops, car washes, dentists).",
      },
      {
        title: "Collect per-home-run pledges",
        detail:
          "Each player takes pledge sheets home: $1, $5, or $10 per home run. Cap pledges at 20 home runs so no one gets surprise bills.",
      },
      {
        title: "Stock concessions the day before",
        detail:
          "Hot dogs, buns, chips, water, Gatorade, candy. Keep it simple. Borrow a grill and cambro from a parent or the snack bar. Target 60% food profit margin.",
      },
      {
        title: "Run the event",
        detail:
          "Format: two one-minute rounds per player, top four advance to semifinals, top two to finals. Announce sponsors between rounds. Play walk-up music. Keep it fast and fun.",
      },
      {
        title: "Run a 50/50 raffle during the derby",
        detail:
          "Sell tickets during the first hour ($5 each, 5 for $20). Draw the winner during the finals. 50% to the winner, 50% to the team. Pure margin.",
      },
      {
        title: "Wrap with a team photo and thank-you",
        detail:
          "Announce totals raised at the end. Take a team photo. Thank volunteers, sponsors, and pledgers publicly. Post photos to social media within 24 hours.",
      },
      {
        title: "Collect and reconcile",
        detail:
          "Turn in all cash, Venmo receipts, and pledges to the treasurer within one week. Send personalized thank-you notes to sponsors with the final total raised.",
      },
    ],
    tips: [
      "The MC matters. Pick a parent with energy and a sense of humor to run the PA — dead air kills the vibe and the sponsor shoutouts get lost.",
      "Announce the running fundraising total every 15 minutes. Momentum drives late-event donations and people love seeing the number climb.",
      "Concessions often out-earn ticket sales. Don't skimp on stocking food and drinks. Sell them until the very last pitch.",
    ],
  },
  {
    slug: "sponsor-a-banner",
    name: "Sponsor-a-Banner",
    tagline: "Tiered local business outfield and dugout banners",
    description:
      "Sell outfield or dugout banners to Irvine businesses in tiered packages. The highest-margin option on this list because the cost to deliver is near zero — just a vinyl banner and a zip-tie. Great for coaches who are comfortable with a sales ask and have local business connections.",
    typicalYield: "$1,000-$5,000 per team",
    effort: "Medium",
    timeline: "4-6 weeks lead time, one-season banner display",
    people: "Coach lead plus 2-3 parents with business contacts",
    quickSteps: [
      "Confirm your league allows outfield and dugout banners.",
      "Set three sponsorship tiers with clear perks for each level.",
      "Build a one-page sponsorship packet and target list.",
      "Have parents reach out to their business contacts first.",
      "Order banners once sponsors commit, install before opening day.",
    ],
    whatYouNeed: [
      "League approval for banner placement and sizes",
      "A vinyl banner vendor (local print shop or online)",
      "A one-page PDF sponsorship packet with tiers and perks",
      "List of local businesses to approach",
      "Zip-ties or grommets and someone to install the banners",
      "An invoice template and payment method (check or Stripe)",
    ],
    stepByStep: [
      {
        title: "Confirm banner rules with your league",
        detail:
          "Ask your division coordinator what's allowed: banner sizes, placement (outfield, dugout, scoreboard), content restrictions. Get this in writing so you don't waste sponsor money on a banner that gets taken down.",
      },
      {
        title: "Set three sponsorship tiers",
        detail:
          "Suggested: Bronze $150 (small banner on dugout, name on team website), Silver $350 (medium banner on outfield, name + link on team website, social shoutout), Gold $750 (large banner on outfield, everything above, plus a banner at every home game and a team thank-you event invite).",
      },
      {
        title: "Create a one-page sponsorship packet",
        detail:
          "Include the team story, the goal, the three tiers, the perks for each, a payment link or check address, and a contact person. Keep it to one page. Use the Irvine All-Stars branding.",
      },
      {
        title: "Build a target list",
        detail:
          "Every parent writes down three local businesses they already frequent: dentist, orthodontist, coffee shop, car wash, chiropractor, real estate agent, restaurant, contractor. You'll have 30+ warm targets in 20 minutes.",
      },
      {
        title: "Warm intros beat cold calls",
        detail:
          "Parents should ask their own contacts first. A 'Hi, our kid plays for Irvine All-Stars and I wanted to see if you'd be interested in sponsoring' from an existing customer converts at 30-50%. Cold outreach converts at 2-5%.",
      },
      {
        title: "Follow up within a week",
        detail:
          "Businesses are busy. Send one reminder email after five days if you haven't heard back. Most yeses come from the follow-up, not the first ask.",
      },
      {
        title: "Collect the money first, banners second",
        detail:
          "Get the payment before ordering the banner. Checks, Venmo, or a Stripe link. Never front the cost of a banner hoping a business will pay later.",
      },
      {
        title: "Order banners in one batch",
        detail:
          "Once you have 4-6 sponsors confirmed, order all banners together to save on print and shipping costs. Typical cost is $30-60 per banner for a 3x5 foot vinyl.",
      },
      {
        title: "Install before opening day",
        detail:
          "Install banners at least one week before your first home game so sponsors see them in place. Take a photo of each banner and text it to the sponsor with a thank-you.",
      },
      {
        title: "Deliver the promised perks",
        detail:
          "Add sponsor names to the team website. Post the shoutouts on social. Mention Gold sponsors in team newsletters. Sponsors that feel appreciated come back next year — and raise their tier.",
      },
      {
        title: "Send a year-end thank-you and renewal ask",
        detail:
          "At the end of the season, send a thank-you note with season highlights and photos. Ask if they want to renew for next year. Renewal rate for sponsored teams that follow through is typically 60-80%.",
      },
    ],
    tips: [
      "Gold is a better anchor than 'basic.' Lead the packet with your Gold tier. Most businesses choose Silver because it feels like a smart middle choice, and your revenue doubles versus leading with Bronze.",
      "Businesses love photo proof. Send the sponsor a text with a photo of their banner up at the field the moment it is installed. This is what makes them renew.",
      "Don't undersell the inventory. Most youth baseball fields have 4-6 good banner spots. That is $2,000-$4,500 in Gold sponsorships alone before you count Bronze and Silver.",
    ],
  },
  {
    slug: "crowdfunding",
    name: "Online Crowdfunding Blast",
    tagline: "Automated email campaign to every family's extended network",
    description:
      "The modern travel ball fundraiser. Use a platform like Snap! Raise (or a DIY GoFundMe) where each player uploads 15-20 extended family and friend email addresses. The platform sends personalized donation asks over a 2-4 week campaign. Highest yield on this list and almost no coach logistics.",
    typicalYield: "$5,000-$25,000 per team",
    effort: "Low",
    timeline: "1 week setup, 2-4 week campaign",
    people: "Coach lead plus parent reminders",
    quickSteps: [
      "Pick a platform (Snap! Raise paid or GoFundMe free).",
      "Record a 30-second phone video and set the team goal.",
      "Text parents to upload 15-20 contact emails per player.",
      "Let the platform run the automated 2-4 week campaign.",
      "Collect funds at the end and send thank-you notes.",
    ],
    whatYouNeed: [
      "A team account with Snap! Raise, FlipGive, or GoFundMe",
      "A 30-second phone video from the coach",
      "A clear fundraising goal and purpose",
      "Parent commitment to upload contact emails",
      "A team email or treasurer for fund disbursement",
    ],
    stepByStep: [
      {
        title: "Decide: paid platform or DIY",
        detail:
          "Snap! Raise and FlipGive handle everything (automated emails, tax receipts, platform fee of 15-25%) and yield dramatically more. GoFundMe is free but requires parents to manually share — yields 20-30% of what a platform campaign does. If your team can afford the fee, pick the paid platform.",
      },
      {
        title: "Create the team campaign",
        detail:
          "Sign up at snap-raise.com or flipgive.com. Enter team name, coach name, and choose your division. Set a clear dollar goal and campaign dates.",
      },
      {
        title: "Record a short video",
        detail:
          "30 to 60 seconds on your phone. Say hi, introduce the team, explain what the money funds (tournament fees, travel, uniforms), and thank people for considering. Keep it casual — authenticity beats polish.",
      },
      {
        title: "Set the goal and timeline",
        detail:
          "Aim high. A realistic goal for a 12-player team is $500-$1,000 per player. Run the campaign for 21 days — long enough to reach everyone, short enough to create urgency.",
      },
      {
        title: "Brief the parents",
        detail:
          "Send a text or email: 'We are running a team crowdfunding campaign from April 15 to May 6. Please upload 15 to 20 contact emails for your player by April 18. This is the only thing we need from you.'",
      },
      {
        title: "Collect the contacts",
        detail:
          "Grandparents, aunts, uncles, godparents, family friends, coworkers, neighbors. Contacts who will open an email from a platform on behalf of a kid they know. The more contacts, the higher the yield.",
      },
      {
        title: "Launch the campaign",
        detail:
          "The platform sends the first email blast on day one with the coach video and goal. Subsequent automated emails arrive on days 4, 7, 14, and 21. Parents don't have to do anything once contacts are uploaded.",
      },
      {
        title: "Boost midweek on social",
        detail:
          "Post the campaign link to the team's Facebook group, parent group chats, and personal social media. Share the running total and any milestones.",
      },
      {
        title: "Send a mid-campaign update",
        detail:
          "Around day 10, email parents an update with the current total, top donors, and how much is left to the goal. This drives a second wave from parents who were waiting.",
      },
      {
        title: "Close strong",
        detail:
          "In the final 72 hours, post a 'last chance' update. Platforms typically see 30% of the total donations in the final three days. Momentum is real.",
      },
      {
        title: "Thank every donor personally",
        detail:
          "The platform handles tax receipts automatically, but a handwritten thank-you from the coach or a team photo text message makes donors give again next year.",
      },
      {
        title: "Receive funds and report",
        detail:
          "Platform typically deposits within 5-14 days of campaign close. Report the final total back to parents and donors. Transparent reporting builds trust for next year.",
      },
    ],
    tips: [
      "Contacts per player is the biggest lever. A team averaging 20 contacts per player raises roughly double what a team averaging 10 contacts raises. Push parents to hit 15 minimum.",
      "Don't skip the coach video. Campaigns with a personal video from the coach raise 40% more on average than campaigns without one. Phone quality is fine.",
      "Use the platform fee as a feature, not a bug. The fee pays for the automated outreach engine that raises 10x what you could raise through a GoFundMe link. A 20% fee on $10,000 still nets $8,000.",
    ],
  },
  {
    slug: "team-raffle",
    name: "Team Raffle with Donated Prizes",
    tagline: "Zero-cost raffle powered by local business prize donations",
    description:
      "Collect donated prizes from local businesses (gift cards, memorabilia, experiences), then sell raffle tickets before and during home games. The entire cost is zero because the prizes are donated — it's pure margin. Pairs beautifully with a home run derby or team BBQ as the 'draw the winners' moment.",
    typicalYield: "$500-$3,000 per team",
    effort: "Low-Medium",
    timeline: "4-6 weeks lead time, ongoing ticket sales",
    people: "Coach lead plus 2-3 parents for prize collection and ticket sales",
    quickSteps: [
      "Ask 10-15 local businesses for prize donations.",
      "Print raffle tickets in bundle pricing ($5/$20/$50).",
      "Sell tickets at tryouts, practices, and home games.",
      "Draw winners at a scheduled team event.",
      "Deliver prizes and thank donor businesses publicly.",
    ],
    whatYouNeed: [
      "A list of 15+ local businesses willing to donate prizes",
      "A donation request letter (one page, on letterhead if possible)",
      "Raffle tickets (print at home or order online for $20)",
      "A lockable ticket bucket and a clear prize display board",
      "A draw date locked in, ideally tied to a team event",
      "Cash box and a Venmo or Square account",
      "Thank-you cards and small framed photos for donors",
    ],
    stepByStep: [
      {
        title: "Build the donor ask",
        detail:
          "Write a one-page letter: who the team is, what the money funds, what the business gets (name on raffle sheet, social media shoutout, photo with winner). Print on letterhead if you can — it looks serious and converts better.",
      },
      {
        title: "Target 15-20 businesses",
        detail:
          "Each parent writes down 3 businesses they already frequent. Restaurants, coffee shops, spas, car washes, golf courses, hair salons, orthodontists, local attractions. Aim to collect prizes worth $50-$500 each.",
      },
      {
        title: "Make warm asks first",
        detail:
          "Go to the business in person with the donation letter. A 5-minute conversation with the owner converts at 40%+; an email at 5-10%. Bring a photo of the team.",
      },
      {
        title: "Follow up and collect the prizes",
        detail:
          "Most donations land within a week of the ask. Follow up by phone once after five days. Pick up physical prizes promptly so businesses don't lose the donation in a drawer.",
      },
      {
        title: "Assemble prize bundles",
        detail:
          "Group individual prizes into 5-10 themed bundles: 'Family Night Out' (restaurant + movie tickets), 'Date Night' (restaurant + wine), 'Spa Day' (massage + nail salon + hair). Bundles are more attractive than single prizes and reduce the number of winners to coordinate.",
      },
      {
        title: "Set up tickets and pricing",
        detail:
          "Print tickets in books of 10. Price structure: $5 for 1 ticket, $20 for 5 tickets, $50 for 15 tickets. The bundle pricing drives average ticket sale up 2-3x.",
      },
      {
        title: "Start selling early",
        detail:
          "Begin selling tickets 3-4 weeks before the draw date. Sell at practices, tryouts, home games, and team events. Every parent gets a book and a target of 15 sold.",
      },
      {
        title: "Promote the prizes visibly",
        detail:
          "Set up a prize display board at the team table: photos, descriptions, and values of each bundle. People buy more tickets when they can see what they're buying a shot at.",
      },
      {
        title: "Run the draw at a team event",
        detail:
          "Draw winners at the home run derby, a team scrimmage, or the season-end BBQ. Announce each winner and take a photo with them holding the prize.",
      },
      {
        title: "Notify winners who aren't present",
        detail:
          "Call or text within 24 hours. Arrange pickup or delivery within the week. Post winner photos to social media (with permission).",
      },
      {
        title: "Thank the donor businesses",
        detail:
          "Send a thank-you card with a team photo to every business. Tag them in the winner photos on social media. This is what turns one-time donations into recurring sponsorships.",
      },
    ],
    tips: [
      "Bundle prizes into themes. A $50 restaurant gift card is forgettable; a $150 'Family Night Out' bundle with restaurant + movie + dessert is exciting and commands more ticket sales.",
      "Display board beats a printed list. People buy more tickets when they can see photos of the prizes in person. Set up the board at every practice and game.",
      "Do the draw at a team event, not by text. Announcing winners in person creates a moment, makes the video-worthy for social media, and proves to donors their prize was received.",
    ],
  },
  {
    slug: "pie-the-coach",
    name: "Pie-the-Coach / Dunk Tank",
    tagline: "Fun event add-on at an existing team gathering",
    description:
      "Bolt this onto a team scrimmage, practice, or end-of-season BBQ. Charge $5 per pie or $10 per dunk tank throw. Kids love it, coaches take one for the team, and the photos are gold for future sponsorship asks. Yield is modest but effort is near zero when piggybacking on an existing event.",
    typicalYield: "$200-$800 per event",
    effort: "Low",
    timeline: "2 weeks lead time, 1-2 hours of the event",
    people: "Coach lead plus 2 parent volunteers and a willing target",
    quickSteps: [
      "Pick an existing team event to bolt this onto.",
      "Recruit a willing coach target (or rotate coaches).",
      "Buy supplies: whipped cream, pie tins, towels (or rent a dunk tank).",
      "Charge $5 per pie or $10 per dunk at the event.",
      "Take lots of photos for social media and sponsor asks.",
    ],
    whatYouNeed: [
      "A coach willing to get pied or dunked",
      "20+ aluminum pie tins",
      "4-6 cans of whipped cream (or shaving cream for dunk tank)",
      "A stack of towels and a change of clothes for the coach",
      "Cash box or Venmo QR code for payments",
      "A waterproof tarp or drop cloth for cleanup",
      "Optional: a rented dunk tank ($150-$250 for a day)",
      "A camera or parent photographer",
    ],
    stepByStep: [
      {
        title: "Pick the event to bolt onto",
        detail:
          "Look at your season calendar for an event where parents will already be present: the opening day BBQ, a team scrimmage, the end-of-season picnic. Bolting onto an existing event means zero incremental setup.",
      },
      {
        title: "Recruit your willing victim",
        detail:
          "Every team has at least one coach who will take one for the team. Ask publicly at a parent meeting. Rotating three coaches keeps the line long and makes it feel like a show.",
      },
      {
        title: "Decide: pie or dunk tank",
        detail:
          "Pie is cheaper and easier ($30 in supplies). Dunk tank is a bigger spectacle but requires a rental ($150-$250) and a water source. Pie converts at $5 each; dunk tank at $10 each.",
      },
      {
        title: "Source the supplies",
        detail:
          "For pie: Dollar Tree or Smart & Final sells pie tins in bulk. Costco or Smart & Final for whipped cream. One can of whipped cream fills about 4 pies. Budget $30-$50 for 20 pies.",
      },
      {
        title: "Promote it the week before",
        detail:
          "Text parents: 'Coach [Name] is getting pied at Saturday's BBQ. Bring cash — $5 per pie throw. All money goes to the team tournament fund.' Kids tell kids, pies sell out fast.",
      },
      {
        title: "Set up a visible station",
        detail:
          "Tarp under a chair, pie tins on a table, cash box next to them. Put the station where everyone walks by. Add a handmade sign: 'PIE THE COACH — $5.' Visibility drives impulse buys.",
      },
      {
        title: "Run the pieing",
        detail:
          "Each kid pays $5, gets a pie, and winds up. Short throw distance (3-5 feet). Keep the line moving. Take a photo of every kid with the coach after their throw — photos are the real product.",
      },
      {
        title: "Let the kids bid on the final pie",
        detail:
          "Save one pie. Auction it to the highest bidder at the end. This routinely triples the revenue of a normal throw. One kid will pay $40 for the final pie if it means they get the money shot.",
      },
      {
        title: "Clean up quickly",
        detail:
          "Hose down the chair, wipe the tarp, trash the pie tins. Fifteen-minute cleanup. Coach takes a long shower.",
      },
      {
        title: "Post the photos that evening",
        detail:
          "The photos are the fundraiser's second job. Post them to the team's social media and the parent group chat. They generate goodwill, get shared, and become the exact content you need for future sponsor asks.",
      },
    ],
    tips: [
      "The photos are worth more than the money. A $400 pie-the-coach event produces 50 photos that power your sponsorship asks and crowdfunding campaigns for the rest of the year.",
      "Auctioning the last pie is free money. You already have the setup. A single final bidder will beat $40 almost every time when the crowd is hyped.",
      "Don't skip the tarp. The mess is non-trivial and cleanup without a tarp will cost you the goodwill of whoever owns the facility you borrowed.",
    ],
  },
];
