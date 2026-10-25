export type MemberStatus = "active" | "invited" | "suspended";

export interface Member {
  id: number;
  name: string;
  email: string;
  role: string;
  team: string;
  location: string;
  status: MemberStatus;
  projects: number;
  joined: string; // ISO date
  lastActive: string; // ISO date
}

const FIRST = [
  "Ada",
  "Linus",
  "Grace",
  "Alan",
  "Margaret",
  "Dennis",
  "Barbara",
  "Ken",
  "Frances",
  "Tim",
  "Radia",
  "Guido",
  "Hedy",
  "Bjarne",
  "Sophie",
  "Donald",
  "Annie",
  "Vint",
  "Karen",
  "John",
];
const LAST = [
  "Lovelace",
  "Torvalds",
  "Hopper",
  "Turing",
  "Hamilton",
  "Ritchie",
  "Liskov",
  "Thompson",
  "Allen",
  "Berners-Lee",
  "Perlman",
  "van Rossum",
  "Lamarr",
  "Stroustrup",
  "Wilson",
  "Knuth",
  "Easley",
  "Cerf",
  "Spärck Jones",
  "Backus",
];
const ROLES = [
  "Engineer",
  "Designer",
  "Product manager",
  "Data analyst",
  "Support lead",
  "Engineering manager",
];
const TEAMS = ["Platform", "Payments", "Growth", "Mobile", "Insights", "Support"];
const CITIES = [
  "Baku",
  "Berlin",
  "Lisbon",
  "Toronto",
  "Tallinn",
  "Singapore",
  "Austin",
  "Kraków",
];
const STATUSES: MemberStatus[] = [
  "active",
  "active",
  "active",
  "invited",
  "active",
  "suspended",
];

// Deterministic, so every visitor sees the same rows
export const MEMBERS: Member[] = Array.from({ length: 57 }, (_, i) => {
  const first = FIRST[i % FIRST.length];
  const last = LAST[(i * 7) % LAST.length];
  const joined = new Date(Date.UTC(2022, (i * 5) % 12, 1 + ((i * 11) % 27)));
  const lastActive = new Date(Date.UTC(2026, 9, 25 - ((i * 3) % 40)));
  return {
    id: i + 1,
    name: `${first} ${last}`,
    email: `${first}.${last}`.toLowerCase().replace(/[^a-z.]/g, "") + "@example.com",
    role: ROLES[(i * 3) % ROLES.length],
    team: TEAMS[(i * 5) % TEAMS.length],
    location: CITIES[(i * 7) % CITIES.length],
    status: STATUSES[(i * 5) % STATUSES.length],
    projects: (i * 13) % 17,
    joined: joined.toISOString(),
    lastActive: lastActive.toISOString(),
  };
});
