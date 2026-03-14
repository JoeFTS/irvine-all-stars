export interface Division {
  id: string;
  name: string;
  ageGroup: string;
  ponyName: string;
  rosterSize: number;
  tryoutDate: string;
}

export const divisions: Division[] = [
  {
    id: "7u",
    name: "7U",
    ageGroup: "Ages 6-7",
    ponyName: "Shetland",
    rosterSize: 12,
    tryoutDate: "May 10",
  },
  {
    id: "8u",
    name: "8U",
    ageGroup: "Ages 7-8",
    ponyName: "Pinto",
    rosterSize: 12,
    tryoutDate: "May 10",
  },
  {
    id: "9u",
    name: "9U",
    ageGroup: "Ages 8-9",
    ponyName: "",
    rosterSize: 12,
    tryoutDate: "May 11",
  },
  {
    id: "10u",
    name: "10U",
    ageGroup: "Ages 9-10",
    ponyName: "Mustang",
    rosterSize: 12,
    tryoutDate: "May 11",
  },
  {
    id: "11u",
    name: "11U",
    ageGroup: "Ages 10-11",
    ponyName: "Bronco",
    rosterSize: 12,
    tryoutDate: "May 12",
  },
  {
    id: "12u",
    name: "12U",
    ageGroup: "Ages 11-12",
    ponyName: "Pony",
    rosterSize: 12,
    tryoutDate: "May 12",
  },
];
