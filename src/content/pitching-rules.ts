export interface RestThreshold {
  label: string;
  min: number;
  max: number;
  days: number;
  plusGame?: boolean;
}

export interface PitchingRule {
  group: string; // "Shetland", "Pinto", "Mustang", "Bronco", "Pony"
  hasPitching: boolean;
  maxPitches: number;
  restThresholds: RestThreshold[];
}

export const pitchingRules: Record<string, PitchingRule> = {
  Shetland: {
    group: "Shetland",
    hasPitching: false,
    maxPitches: 0,
    restThresholds: [],
  },
  "Pinto Machine Pitch": {
    group: "Pinto Machine Pitch",
    hasPitching: false,
    maxPitches: 0,
    restThresholds: [],
  },
  "Pinto Kid Pitch": {
    group: "Pinto Kid Pitch",
    hasPitching: true,
    maxPitches: 50,
    restThresholds: [
      { label: "1–20", min: 1, max: 20, days: 0 },
      { label: "21–35", min: 21, max: 35, days: 1 },
      { label: "36–50", min: 36, max: 50, days: 2 },
    ],
  },
  Mustang: {
    group: "Mustang",
    hasPitching: true,
    maxPitches: 75,
    restThresholds: [
      { label: "1–20", min: 1, max: 20, days: 0 },
      { label: "21–35", min: 21, max: 35, days: 1 },
      { label: "36–50", min: 36, max: 50, days: 2 },
      { label: "51–65", min: 51, max: 65, days: 3 },
      { label: "66–75", min: 66, max: 75, days: 4 },
    ],
  },
  Bronco: {
    group: "Bronco",
    hasPitching: true,
    maxPitches: 85,
    restThresholds: [
      { label: "1–20", min: 1, max: 20, days: 0 },
      { label: "21–35", min: 21, max: 35, days: 1 },
      { label: "36–50", min: 36, max: 50, days: 2 },
      { label: "51–65", min: 51, max: 65, days: 3 },
      { label: "66–85", min: 66, max: 85, days: 4 },
    ],
  },
  Pony: {
    group: "Pony",
    hasPitching: true,
    maxPitches: 95,
    restThresholds: [
      { label: "1–20", min: 1, max: 20, days: 0 },
      { label: "21–35", min: 21, max: 35, days: 1 },
      { label: "36–50", min: 36, max: 50, days: 2 },
      { label: "51–65", min: 51, max: 65, days: 3 },
      { label: "66–95", min: 66, max: 95, days: 4 },
    ],
  },
};

/** Additional rules that apply to all divisions with pitching */
export const universalPitchingRules = [
  "No pitcher may appear as a pitcher for three (3) consecutive days, regardless of pitch count.",
  "A pitcher who throws 41 or more pitches in a game cannot play catcher for the remainder of that day.",
  "A catcher who catches 4+ innings cannot pitch in that game.",
  "A pitcher removed from the mound cannot return to pitch in the same game.",
  "A pitcher who reaches the daily max mid-at-bat may finish that batter before being removed.",
];

/** Map a division's ponyName to the pitching rules key */
export function getPitchingRuleForDivision(ponyName: string): PitchingRule | null {
  return pitchingRules[ponyName] ?? null;
}
