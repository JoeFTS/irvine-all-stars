export interface Division {
  id: string;
  name: string;
  ageGroup: string;
  ponyName: string;
  rosterSize: number;
  tryoutDate: string;
  ruleFamily: RuleFamilyKey;
}

export type RuleFamilyKey =
  | "shetland"
  | "pinto_mp"
  | "pinto_kp"
  | "mustang"
  | "bronco"
  | "pony";

export interface RuleFamily {
  key: RuleFamilyKey;
  label: string;
  ponyDivision: string;
  diamondFeet: number;
  pitchingDistance: string;
  gameInnings: string;
  mercyRule: string;
  pitchType: string;
  leadOffsAndSteals: string;
  dailyPitchMax: string;
  quickRules: string[];
}

export const ruleFamilies: Record<RuleFamilyKey, RuleFamily> = {
  shetland: {
    key: "shetland",
    label: "Shetland",
    ponyDivision: "Shetland 6U",
    diamondFeet: 50,
    pitchingDistance: "No pitching (tee ball)",
    gameInnings: "6 innings",
    mercyRule: "15 runs after 3 innings / 10 runs after 4",
    pitchType: "Tee ball; players hit off a batting tee",
    leadOffsAndSteals: "Not permitted",
    dailyPitchMax: "N/A (no pitching)",
    quickRules: [
      "Entire roster bats in the lineup; ten players in the field with four outfielders",
      "No bunting, no soft swings — batter must take a full swing",
      "Five-run-per-inning cap except in the last inning",
      "Base runners may not advance on an overthrow",
      "Focus is on instruction; coaches encouraged to remain on the field",
    ],
  },
  pinto_mp: {
    key: "pinto_mp",
    label: "Pinto (Machine Pitch)",
    ponyDivision: "Pinto 8U Machine Pitch",
    diamondFeet: 60,
    pitchingDistance: "38 ft (pitching machine)",
    gameInnings: "6 innings",
    mercyRule: "15 runs after 3 innings / 10 runs after 4",
    pitchType: "Pitching machine delivers all pitches",
    leadOffsAndSteals: "Not permitted",
    dailyPitchMax: "N/A (machine pitch)",
    quickRules: [
      "Batter is out after six pitches unless the sixth pitch is fouled off",
      "Infielders must stay at least 45 feet from home plate until the ball is hit",
      "No bunting or soft swings",
      "Five-run-per-inning cap except in the last inning",
      "Coach pitchers and machine operators may not direct or coach on offense",
    ],
  },
  pinto_kp: {
    key: "pinto_kp",
    label: "Pinto (Kid Pitch / Player Pitch)",
    ponyDivision: "Pinto 8U Player Pitch",
    diamondFeet: 60,
    pitchingDistance: "40 ft (player pitch)",
    gameInnings: "6 innings",
    mercyRule: "15 runs after 3 innings / 10 runs after 4",
    pitchType: "Player-pitched",
    leadOffsAndSteals: "Not permitted",
    dailyPitchMax: "1-20 pitches: 0 days rest · 21-35: 1 day · 36-50: 2 days · 51-65: 3 days · 66+: 4 days",
    quickRules: [
      "Batter is out after three swinging strikes or a third-strike foul tip",
      "Infielders must stay at least 45 feet from home plate until the ball is hit",
      "No bunting in Pinto KP",
      "Five-run-per-inning cap except in the last inning",
      "Pitcher who reaches the daily max must be removed before the next batter",
    ],
  },
  mustang: {
    key: "mustang",
    label: "Mustang",
    ponyDivision: "Mustang 10U",
    diamondFeet: 60,
    pitchingDistance: "46 ft",
    gameInnings: "7 innings",
    mercyRule: "15 runs after 3 innings / 10 runs after 4",
    pitchType: "Player-pitched",
    leadOffsAndSteals: "Lead-offs and steals allowed under Mustang 10U Tournament Rule 1 (MLB rules)",
    dailyPitchMax: "Ages 9-10: 75 pitches/day · 1-20: 0 rest · 21-35: 1 day · 36-50: 2 · 51-65: 3 · 66+: 4",
    quickRules: [
      "Rule 1 for Mustang 10U tournament play governed by Official Rules of Major League Baseball",
      "Runners may lead off and steal once the pitcher releases the ball",
      "Substituted pitchers may not return to pitch once removed in the same game",
      "15-run mercy after 3 innings; 10-run mercy after 4 innings",
      "No inning shall begin after 9:00 p.m. local time in local league play",
    ],
  },
  bronco: {
    key: "bronco",
    label: "Bronco",
    ponyDivision: "Bronco 12U",
    diamondFeet: 70,
    pitchingDistance: "50 ft",
    gameInnings: "7 innings",
    mercyRule: "15 runs after 4 innings / 10 runs after 5",
    pitchType: "Player-pitched",
    leadOffsAndSteals: "Full MLB rules — lead-offs and steals permitted",
    dailyPitchMax: "Ages 11-12: 85 pitches/day · 1-20: 0 rest · 21-35: 1 · 36-50: 2 · 51-65: 3 · 66+: 4",
    quickRules: [
      "Full MLB playing rules with PONY exceptions",
      "Uniform required: shirt, pants, cap, and socks alike for all players",
      "Substituted pitchers may not return to the mound in the same game",
      "15-run mercy after 4 innings; 10-run mercy after 5 innings",
      "No inning shall begin after 8:30 p.m. local time in local league play",
    ],
  },
  pony: {
    key: "pony",
    label: "Pony",
    ponyDivision: "Pony 14U",
    diamondFeet: 80,
    pitchingDistance: "54 ft",
    gameInnings: "7 innings",
    mercyRule: "15 runs after 4 innings / 10 runs after 5",
    pitchType: "Player-pitched",
    leadOffsAndSteals: "Full MLB rules — lead-offs and steals permitted",
    dailyPitchMax: "Ages 13-14: 95 pitches/day · 1-20: 0 rest · 21-35: 1 · 36-50: 2 · 51-65: 3 · 66+: 4",
    quickRules: [
      "Full MLB playing rules with PONY exceptions",
      "Uniform required: shirt, pants, cap, and socks alike for all players",
      "Substituted pitchers may not return to the mound in the same game",
      "15-run mercy after 4 innings; 10-run mercy after 5 innings",
      "No inning shall begin after 9:30 p.m. local time in local league play",
    ],
  },
};

export const divisions: Division[] = [
  { id: "5u", name: "5U", ageGroup: "Ages 4-5", ponyName: "Shetland", rosterSize: 12, tryoutDate: "April 12", ruleFamily: "shetland" },
  { id: "6u", name: "6U", ageGroup: "Ages 5-6", ponyName: "Shetland", rosterSize: 12, tryoutDate: "April 12", ruleFamily: "shetland" },
  { id: "7u-mp", name: "7U MP", ageGroup: "Ages 6-7", ponyName: "Pinto Machine Pitch", rosterSize: 12, tryoutDate: "April 12", ruleFamily: "pinto_mp" },
  { id: "7u-kp", name: "7U KP", ageGroup: "Ages 6-7", ponyName: "Pinto Kid Pitch", rosterSize: 12, tryoutDate: "April 12", ruleFamily: "pinto_kp" },
  { id: "8u-mp", name: "8U MP", ageGroup: "Ages 7-8", ponyName: "Pinto Machine Pitch", rosterSize: 12, tryoutDate: "April 12", ruleFamily: "pinto_mp" },
  { id: "8u-kp", name: "8U KP", ageGroup: "Ages 7-8", ponyName: "Pinto Kid Pitch", rosterSize: 12, tryoutDate: "April 12", ruleFamily: "pinto_kp" },
  { id: "9u", name: "9U", ageGroup: "Ages 8-9", ponyName: "Mustang", rosterSize: 12, tryoutDate: "April 12", ruleFamily: "mustang" },
  { id: "10u", name: "10U", ageGroup: "Ages 9-10", ponyName: "Mustang", rosterSize: 12, tryoutDate: "April 12", ruleFamily: "mustang" },
  { id: "11u", name: "11U", ageGroup: "Ages 10-11", ponyName: "Bronco", rosterSize: 12, tryoutDate: "April 12", ruleFamily: "bronco" },
  { id: "12u", name: "12U", ageGroup: "Ages 11-12", ponyName: "Bronco", rosterSize: 12, tryoutDate: "April 12", ruleFamily: "bronco" },
  { id: "13u", name: "13U", ageGroup: "Ages 12-13", ponyName: "Pony", rosterSize: 12, tryoutDate: "April 12", ruleFamily: "pony" },
  { id: "14u", name: "14U", ageGroup: "Ages 13-14", ponyName: "Pony", rosterSize: 12, tryoutDate: "April 12", ruleFamily: "pony" },
];

// Loose matcher used when the coach's stored division string is inconsistent
// (e.g. "12U-Bronco", "12U Bronco", "Bronco 12U"). Returns the rule family key.
export function matchRuleFamily(division: string | null | undefined): RuleFamilyKey | null {
  if (!division) return null;
  const d = division.toLowerCase();
  if (d.includes("shetland") || d.includes("5u") || d.includes("6u")) return "shetland";
  if ((d.includes("pinto") && (d.includes("mp") || d.includes("machine"))) || d.includes("7u mp") || d.includes("8u mp")) return "pinto_mp";
  if ((d.includes("pinto") && (d.includes("kp") || d.includes("kid") || d.includes("player"))) || d.includes("7u kp") || d.includes("8u kp")) return "pinto_kp";
  if (d.includes("mustang") || d.includes("9u") || d.includes("10u")) return "mustang";
  if (d.includes("bronco") || d.includes("11u") || d.includes("12u")) return "bronco";
  if (d.includes("pony") || d.includes("13u") || d.includes("14u")) return "pony";
  return null;
}
