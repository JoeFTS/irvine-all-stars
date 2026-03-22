#!/usr/bin/env node
/**
 * Seed 50 dummy tryout registrations across all 12 divisions.
 * Uses Supabase Management API (SQL endpoint) since anon key lacks insert perms.
 */

const SUPABASE_REF = "owuempqaheupjyslkjlg";
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.error("Set SUPABASE_ACCESS_TOKEN in env (check ~/.zshrc)");
  process.exit(1);
}

const divisions = [
  "5U-Shetland", "6U-Shetland",
  "7U MP-Pinto", "7U KP-Pinto",
  "8U MP-Pinto", "8U KP-Pinto",
  "9U-Mustang", "10U-Mustang",
  "11U-Bronco", "12U-Bronco",
  "13U-Pony", "14U-Pony",
];

// Age ranges per division (birth year for 2026 season)
const divisionBirthYears = {
  "5U-Shetland": [2021, 2022], "6U-Shetland": [2020, 2021],
  "7U MP-Pinto": [2019, 2020], "7U KP-Pinto": [2019, 2020],
  "8U MP-Pinto": [2018, 2019], "8U KP-Pinto": [2018, 2019],
  "9U-Mustang": [2017, 2018], "10U-Mustang": [2016, 2017],
  "11U-Bronco": [2015, 2016], "12U-Bronco": [2014, 2015],
  "13U-Pony": [2013, 2014], "14U-Pony": [2012, 2013],
};

const firstNames = [
  "Ethan", "Liam", "Noah", "Oliver", "James", "Lucas", "Mason", "Logan",
  "Alexander", "Henry", "Sebastian", "Jack", "Daniel", "Owen", "Samuel",
  "Ryan", "Nathan", "Caleb", "Dylan", "Luke", "Andrew", "Isaac", "Joshua",
  "Christopher", "Aiden", "Matthew", "David", "Joseph", "Carter", "Jayden",
  "Gabriel", "Anthony", "Tyler", "Austin", "Brandon", "Kevin", "Marcus",
  "Jake", "Connor", "Cameron", "Chase", "Cole", "Derek", "Evan", "Hunter",
  "Kyle", "Max", "Riley", "Trevor", "Wyatt", "Blake", "Brady", "Bryce",
  "Cody", "Colton", "Dominic", "Elijah", "Finn", "Grant", "Gavin",
  "Harrison", "Ian", "Jace", "Kai", "Landon", "Leo", "Miles", "Nolan",
  "Parker", "Preston", "Quentin", "Roman", "Sawyer", "Spencer", "Tanner",
  "Vincent", "Wesley", "Zane", "Zach", "Adrian", "Bennett", "Brooks",
  "Cruz", "Damian", "Declan", "Emilio", "Felix", "Griffin", "Hugo",
  "Jaxon", "Kaden", "Lincoln", "Maddox", "Nico", "Oscar", "Phoenix",
  "Ryder", "Silas", "Theo", "Tristan", "Weston", "Xavier",
];

const lastNames = [
  "Anderson", "Baker", "Chen", "Davis", "Edwards", "Foster", "Garcia",
  "Harris", "Ito", "Johnson", "Kim", "Lee", "Martinez", "Nguyen", "O-Brien",
  "Patel", "Quinn", "Rodriguez", "Smith", "Thompson", "Ueda", "Vasquez",
  "Williams", "Xu", "Yamamoto", "Zhang", "Rivera", "Park", "Santos",
  "Mitchell", "Cooper", "Morgan", "Reed", "Sullivan", "Murphy", "Brooks",
  "Cruz", "Gomez", "Reyes", "Flores", "Ortiz", "Diaz", "Morales",
  "Jimenez", "Ruiz", "Torres", "Ramos", "Medina", "Castillo", "Herrera",
  "Alvarez", "Bautista", "Cabrera", "Delgado", "Espinoza", "Fernandez",
  "Guerrero", "Hernandez", "Ibarra", "Juarez", "Kang", "Luna", "Maldonado",
  "Navarro", "Ochoa", "Perez", "Ramirez", "Salazar", "Tran", "Valdez",
  "Wang", "Young", "Zimmerman", "Abbott", "Black", "Clarke", "Dunn",
  "Ellis", "Fox", "Gray", "Hunt", "Jensen", "Kelly", "Long", "Moore",
  "Nelson", "Palmer", "Ross", "Shaw", "Stone", "Turner", "Walsh",
];

const positions = [
  "Pitcher", "Catcher", "First Base", "Second Base", "Shortstop",
  "Third Base", "Left Field", "Center Field", "Right Field",
];

const teams = [
  "Dodgers", "Angels", "Giants", "Padres", "Cubs", "Yankees",
  "Mets", "Red Sox", "Braves", "Cardinals", "Tigers", "Astros",
];

function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function randomDob(birthYears) {
  const year = randomItem(birthYears);
  const month = randomInt(1, 12);
  const day = randomInt(1, 28);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatPhone() {
  return `(949) ${randomInt(200, 999)}-${String(randomInt(1000, 9999))}`;
}

// Top up each division to 50 (adding what's needed beyond existing data)
const kidCounts = {
  "5U-Shetland": 47, "6U-Shetland": 47,
  "7U MP-Pinto": 47, "7U KP-Pinto": 47,
  "8U MP-Pinto": 46, "8U KP-Pinto": 46,
  "9U-Mustang": 45, "10U-Mustang": 45,
  "11U-Bronco": 44, "12U-Bronco": 44,
  "13U-Pony": 46, "14U-Pony": 46,
};

const usedNames = new Set();
const kids = [];

for (const div of divisions) {
  const count = kidCounts[div];
  for (let i = 0; i < count; i++) {
    let first, last, fullKey;
    do {
      first = randomItem(firstNames);
      last = randomItem(lastNames);
      fullKey = `${first}-${last}`;
    } while (usedNames.has(fullKey));
    usedNames.add(fullKey);

    const parentFirst = randomItem(["Mike", "Sarah", "David", "Jennifer", "Chris", "Lisa", "Tom", "Amy", "Dan", "Rachel", "Steve", "Karen", "Jeff", "Maria", "Brian"]);
    const parentLast = last;
    const dob = randomDob(divisionBirthYears[div]);
    const pos1 = randomItem(positions);
    let pos2;
    do { pos2 = randomItem(positions); } while (pos2 === pos1);

    kids.push({
      parent_name: `${parentFirst} ${parentLast}`,
      parent_email: `${parentFirst.toLowerCase()}.${parentLast.toLowerCase()}@example.com`,
      parent_phone: formatPhone(),
      player_first_name: first,
      player_last_name: last,
      player_date_of_birth: dob,
      division: div,
      primary_position: pos1,
      secondary_position: pos2,
      bats: randomItem(["right", "left", "switch"]),
      throws: randomItem(["right", "left"]),
      current_team: randomItem(teams),
      jersey_number: String(randomInt(1, 99)),
      emergency_contact_name: `${randomItem(["Mike", "Sarah", "David", "Jennifer", "Chris"])} ${parentLast}`,
      emergency_contact_phone: formatPhone(),
      photo_release_consent: true,
      liability_waiver_consent: true,
      parent_code_of_conduct: true,
      status: "registered",
    });
  }
}

// Build SQL
const columns = [
  "parent_name", "parent_email", "parent_phone",
  "player_first_name", "player_last_name", "player_date_of_birth",
  "division", "primary_position", "secondary_position",
  "bats", "throws", "current_team", "jersey_number",
  "emergency_contact_name", "emergency_contact_phone",
  "photo_release_consent", "liability_waiver_consent", "parent_code_of_conduct",
  "status",
];

function escSql(v) {
  if (v === true) return "true";
  if (v === false) return "false";
  if (v === null) return "NULL";
  return `'${String(v).replace(/'/g, "''")}'`;
}

const values = kids.map(k =>
  `(${columns.map(c => escSql(k[c])).join(", ")})`
).join(",\n");

const sql = `INSERT INTO irvine_allstars.tryout_registrations (${columns.join(", ")})
VALUES
${values};`;

console.log(`Inserting ${kids.length} tryout registrations...`);

const res = await fetch(`https://api.supabase.com/v1/projects/${SUPABASE_REF}/database/query`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query: sql }),
});

if (!res.ok) {
  const text = await res.text();
  console.error(`Failed (${res.status}):`, text);
  process.exit(1);
}

const result = await res.json();
console.log(`✅ Successfully inserted ${kids.length} tryout kids across ${divisions.length} divisions`);

// Print summary
for (const div of divisions) {
  const count = kids.filter(k => k.division === div).length;
  console.log(`  ${div}: ${count} players`);
}
