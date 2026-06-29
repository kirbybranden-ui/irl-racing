export const TOURNAMENT = {
  enabled: true,
  name: "2026 Budweiser Cup In-Season Tournament",
  startRace: "Las Vegas",
  currentRound: "Play-In",
};

export const TOURNAMENT_PAYOUTS = {
  automaticBye: {
    team: 30000,
    driver: 20000,
  },

  playIn: {
    team: 25000,
    driver: 10000,
  },

  roundOf16: {
    team: 50000,
    driver: 25000,
  },

  quarterfinals: {
    team: 100000,
    driver: 50000,
  },

  semifinals: {
    team: 250000,
    driver: 100000,
  },

  championship: {
    team: 500000,
    driver: 250000,
  },
};
