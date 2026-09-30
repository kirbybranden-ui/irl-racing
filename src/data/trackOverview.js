import { normalizeTrackName } from "../utils/raceHelpers";

// One shared catalog for facts, photos and 50% / 3× / 3× guidance.
export const trackOverviewData = {
  "Michigan": {
    "name": "Michigan International Speedway",
    "location": "Brooklyn, Michigan",
    "type": "D-shaped oval",
    "length": "2.0 miles",
    "turns": "4",
    "banking": "18° turns, 12° frontstretch, 5° backstretch",
    "pitSpeed": "45 mph",
    "restartZone": "Frontstretch restart zone before the start/finish line",
    "tireWear": "Moderate. Drivers can use several lanes, but long green-flag runs reward smooth throttle and clean corner exits.",
    "notes": "Drafting and momentum are huge. The preferred lane can change as tires fall off.",
    "imageUrl": "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/michigan.jpg"
  },
  "Dover": {
    "name": "Dover Motor Speedway",
    "location": "Dover, Delaware",
    "type": "Concrete oval",
    "length": "1.0 mile",
    "turns": "4",
    "banking": "24° turns, 9° straights",
    "pitSpeed": "35 mph",
    "restartZone": "Frontstretch restart zone before the start/finish line",
    "tireWear": "High. Drivers need to protect corner exit and avoid abusing the right front.",
    "notes": "The Monster Mile rewards rhythm, discipline, and clean traffic management.",
    "imageUrl": "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/dover.jpg"
  },
  "EchoPark Speedway": {
    "name": "EchoPark Speedway",
    "location": "Hampton, Georgia",
    "type": "Intermediate quad-oval",
    "length": "1.54 miles",
    "turns": "4",
    "banking": "24° turns, 5° straights",
    "pitSpeed": "45 mph",
    "restartZone": "Frontstretch restart zone before the start/finish line",
    "tireWear": "Moderate to high. Tire saving matters once the field stretches out, but draft runs can create big swings on restarts.",
    "notes": "Drivers need to balance aggression with tire management. The outside lane can build momentum, but mistakes in traffic are costly.",
    "imageUrl": "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/echoparkspeedway.jpg"
  },
  "Daytona (Night)": {
    "name": "Daytona International Speedway",
    "location": "Daytona Beach, Florida",
    "type": "Superspeedway tri-oval",
    "length": "2.5 miles",
    "turns": "4",
    "banking": "31° turns, 18° tri-oval, 3° backstretch",
    "pitSpeed": "55 mph",
    "restartZone": "Frontstretch restart zone before the start/finish line",
    "tireWear": "Low to moderate. Drafting, lane discipline, and pushing technique matter more than tire falloff.",
    "notes": "Pack racing with huge runs. Survival, patience, and timing are key.",
    "imageUrl": "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/daytona.jpg"
  },
  "Charlotte": {
    "name": "Charlotte Motor Speedway",
    "location": "Concord, North Carolina",
    "type": "Quad-oval intermediate",
    "length": "1.5 miles",
    "turns": "4",
    "banking": "24° turns, 5° straights",
    "pitSpeed": "45 mph",
    "restartZone": "Frontstretch restart zone before the start/finish line",
    "tireWear": "Moderate to high. Long-run speed depends on keeping the car stable in dirty air and saving right-side tires.",
    "notes": "Clean air and momentum are important. Charlotte has 3 stage points in your league format.",
    "imageUrl": "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/charlotte.jpg"
  },
  "Nashville": {
    "name": "Nashville Superspeedway",
    "location": "Lebanon, Tennessee",
    "type": "Concrete D-shaped oval",
    "length": "1.333 miles",
    "turns": "4",
    "banking": "14° turns, 9° frontstretch, 6° backstretch",
    "pitSpeed": "45 mph",
    "restartZone": "Frontstretch restart zone before the start/finish line",
    "tireWear": "Moderate. Concrete grip and traffic make throttle control important.",
    "notes": "Momentum track with long corners and tricky traffic transitions.",
    "imageUrl": "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/nashville.jpg"
  },
  "Pocono": {
    "name": "Pocono Raceway",
    "location": "Long Pond, Pennsylvania",
    "type": "Triangular superspeedway",
    "length": "2.5 miles",
    "turns": "3",
    "banking": "14° turn 1, 8° turn 2, 6° turn 3",
    "pitSpeed": "55 mph",
    "restartZone": "Frontstretch restart zone before the start/finish line",
    "tireWear": "Moderate. Each corner needs a different compromise, especially braking and exit drive.",
    "notes": "Three unique corners. Turn 3 exit is critical for frontstretch speed.",
    "imageUrl": "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/pocono.jpg"
  },
  "Bristol (Night)": {
    "name": "Bristol Motor Speedway",
    "location": "Bristol, Tennessee",
    "type": "Concrete short track",
    "length": "0.533 miles",
    "turns": "4",
    "banking": "24°-28° turns, 5°-9° straights",
    "pitSpeed": "30 mph",
    "restartZone": "Frontstretch restart zone before the start/finish line",
    "tireWear": "High. Traffic, wheel spin, and overdriving corner entry can use tires up fast.",
    "notes": "Short-track chaos. Rhythm, patience, and clean bumper discipline matter.",
    "imageUrl": "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/bristol.jpg"
  },
  "Las Vegas": {
    "name": "Las Vegas Motor Speedway",
    "location": "Las Vegas, Nevada",
    "type": "Intermediate oval",
    "length": "1.5 miles",
    "turns": "4",
    "banking": "20° turns, 9° frontstretch, 9° backstretch",
    "pitSpeed": "45 mph",
    "restartZone": "Frontstretch restart zone before the start/finish line",
    "tireWear": "Moderate. Long-run balance and clean air make a big difference.",
    "notes": "Momentum-based intermediate with multiple lanes as the run develops.",
    "imageUrl": "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/lasvegas.jpg"
  },
  "Talladega": {
    "name": "Talladega Superspeedway",
    "location": "Talladega, Alabama",
    "type": "Superspeedway tri-oval",
    "length": "2.66 miles",
    "turns": "4",
    "banking": "33° turns, 16.5° tri-oval, 3° backstretch",
    "pitSpeed": "55 mph",
    "restartZone": "Frontstretch restart zone before the start/finish line",
    "tireWear": "Low. Drafting, pushing, lane choice, and avoiding mistakes matter most.",
    "notes": "Huge pack-racing track. Runs form quickly and decision-making is everything.",
    "imageUrl": "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/talladega.jpg"
  },
  "North Wilkesboro": {
    "name": "North Wilkesboro Speedway",
    "location": "North Wilkesboro, North Carolina",
    "type": "Short track oval",
    "length": "0.625 miles",
    "turns": "4",
    "banking": "13° turns",
    "pitSpeed": "30 mph",
    "restartZone": "Frontstretch restart zone before the start/finish line",
    "tireWear": "High. Tire conservation and throttle control are major factors.",
    "notes": "Old-school short track with heavy braking, low grip, and tough passing.",
    "imageUrl": "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/northwilkesboro.jpg"
  },
  "Indianapolis": {
    "name": "Indianapolis Motor Speedway",
    "location": "Speedway, Indiana",
    "type": "Rectangular oval",
    "length": "2.5 miles",
    "turns": "4",
    "banking": "9°12′ turns, nearly flat straights",
    "pitSpeed": "55 mph",
    "restartZone": "Frontstretch restart zone before the start/finish line",
    "tireWear": "Moderate. Braking stability and exit speed are critical because the corners are flat and narrow.",
    "notes": "Precision track. Mistakes on corner exit cost speed for a long straightaway.",
    "imageUrl": "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/indianapolis.jpg"
  },
  "New Hampshire": {
    "name": "New Hampshire Motor Speedway",
    "location": "Loudon, New Hampshire",
    "type": "Flat oval",
    "length": "1.058 miles",
    "turns": "4",
    "banking": "2°-7° turns, 1° straights",
    "pitSpeed": "45 mph",
    "restartZone": "Frontstretch restart zone before the start/finish line",
    "tireWear": "Moderate to high. Flat corners reward smooth braking and throttle pickup.",
    "notes": "Track position and braking discipline are key. Passing can be difficult without a run.",
    "imageUrl": "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/newhampshire.jpg"
  },
  "Phoenix": {
    "name": "Phoenix Raceway",
    "location": "Avondale, Arizona",
    "type": "Dogleg oval",
    "length": "1.0 mile",
    "turns": "4",
    "banking": "8°-11° turns, 3° backstretch, 10°-11° dogleg",
    "pitSpeed": "45 mph",
    "restartZone": "Frontstretch restart zone before the start/finish line",
    "tireWear": "Moderate. Drivers need to manage rear grip off the flat corners.",
    "notes": "Restarts can get aggressive through the dogleg. Track position matters.",
    "imageUrl": "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/phoenix.jpg"
  },
  "Richmond": {
    "name": "Richmond Raceway",
    "location": "Richmond, Virginia",
    "type": "Short track D-shaped oval",
    "length": "0.75 miles",
    "turns": "4",
    "banking": "14° turns, 8° frontstretch, 2° backstretch",
    "pitSpeed": "40 mph",
    "restartZone": "Frontstretch restart zone before the start/finish line",
    "tireWear": "High. Long-run tire saving is one of the biggest keys.",
    "notes": "Short-track strategy race. Smoothness and tire management create passing chances.",
    "imageUrl": "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/richmond.jpg"
  },
  "Kansas": {
    "name": "Kansas Speedway",
    "location": "Kansas City, Kansas",
    "type": "Intermediate tri-oval",
    "length": "1.5 miles",
    "turns": "4",
    "banking": "17°-20° progressive turns, 9°-11° frontstretch, 5° backstretch",
    "pitSpeed": "45 mph",
    "restartZone": "Frontstretch restart zone before the start/finish line",
    "tireWear": "Moderate. Multiple grooves open up, but dirty air still matters.",
    "notes": "Progressive banking makes lane choice important over a long run.",
    "imageUrl": "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/kansas.jpg"
  },
  "Texas": {
    "name": "Texas Motor Speedway",
    "location": "Fort Worth, Texas",
    "type": "Intermediate oval",
    "length": "1.5 miles",
    "turns": "4",
    "banking": "20° turns 1-2, 24° turns 3-4",
    "pitSpeed": "45 mph",
    "restartZone": "Frontstretch restart zone before the start/finish line",
    "tireWear": "Moderate. The two ends can feel different, so setup compromise matters.",
    "notes": "Momentum and clean air are major. Restarts can decide track position quickly.",
    "imageUrl": "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/texas.jpg"
  },
  "Iowa": {
    "name": "Iowa Speedway",
    "location": "Newton, Iowa",
    "type": "Short oval",
    "length": "0.875 miles",
    "turns": "4",
    "banking": "12°-14° progressive turns, 10° frontstretch, 4° backstretch",
    "pitSpeed": "40 mph",
    "restartZone": "Frontstretch restart zone before the start/finish line",
    "tireWear": "High. Progressive banking helps passing, but overdriving will burn tires quickly.",
    "notes": "Short-track/intermediate mix with multiple lanes and heavy tire strategy.",
    "imageUrl": "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/iowa.jpg"
  },
  "Homestead": {
    "name": "Homestead-Miami Speedway",
    "location": "Homestead, Florida",
    "type": "Intermediate oval",
    "length": "1.5 miles",
    "turns": "4",
    "banking": "18°-20° progressive turns, 4° straights",
    "pitSpeed": "45 mph",
    "restartZone": "Frontstretch restart zone before the start/finish line",
    "tireWear": "High. The wall lane is fast, but tire saving and throttle control still matter.",
    "notes": "Multiple grooves with major long-run falloff. Drivers can search for grip from bottom to wall.",
    "imageUrl": "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/homestead.jpg"
  },
  "Dover Motor Speedway": {
    "name": "Dover Motor Speedway",
    "location": "Dover, Delaware",
    "type": "Concrete oval",
    "length": "1 miles",
    "turns": "4",
    "banking": "24° turns, 9° straights",
    "pitSpeed": "35 mph",
    "restartZone": "Frontstretch restart zone before the start/finish line",
    "tireWear": "High. Drivers need to protect corner exit and avoid abusing the right front.",
    "notes": "The Monster Mile rewards rhythm, discipline, and clean traffic management.",
    "imageUrl": "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/dover.jpg",
    "lengthMiles": 1,
    "referenceFullLaps": 400,
    "surface": "concrete",
    "kind": "short",
    "preferredLine": "Start with the lower groove and a smooth center; try a higher lane if rubber and traffic make it faster over several laps.",
    "savingGuidance": "Ease entry speed and unwind the steering before applying full throttle. Protect the right front over the compressed 3× stint.",
    "watchFor": "Concrete grip can change through a run. Judge a line by average stint pace, not one quick lap.",
    "referenceNote": "Based on the 2025 400-lap points race; the 2026 All-Star format is different. Confirm NASCAR 26 lap count.",
    "sources": [
      {
        "label": "NASCAR 2026 Cup track specifications",
        "url": "https://www.jayski.com/wp-content/uploads/sites/31/2026/2/6/2026-RACETRACK-SPECIFICATIONS-NCS_REVB.pdf"
      },
      {
        "label": "NASCAR: fuel strategy",
        "url": "https://www.nascar.com/news-media/2025/08/29/cup-series-playoffs-2025-fuel-saving-strategy/"
      },
      {
        "label": "NASCAR: temperature and grip",
        "url": "https://www.nascar.com/news-media/2018/08/20/temperature-factor-racing-heres/"
      },
      {
        "label": "NASCAR 26: dynamic track system",
        "url": "https://nascar26.com/nascar-and-iracing-studios-debut-official-gameplay-trailer-open-pre-orders-for-nascar-26/"
      },
      {
        "label": "Dover 2025 reference race",
        "url": "https://www.nascar.com/2025/autotrader-echopark-automotive-400"
      }
    ]
  },
  "Atlanta - Echopark Speedway": {
    "name": "Atlanta - Echopark Speedway",
    "location": "Hampton, Georgia",
    "type": "Intermediate quad-oval",
    "length": "1.54 miles",
    "turns": "4",
    "banking": "24° turns, 5° straights",
    "pitSpeed": "90 / 45 mph",
    "restartZone": "Frontstretch restart zone before the start/finish line",
    "tireWear": "Moderate to high. Tire saving matters once the field stretches out, but draft runs can create big swings on restarts.",
    "notes": "Drivers need to balance aggression with tire management. The outside lane can build momentum, but mistakes in traffic are costly.",
    "imageUrl": "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/echoparkspeedway.jpg",
    "lengthMiles": 1.54,
    "referenceFullLaps": 260,
    "surface": "asphalt",
    "kind": "draft",
    "preferredLine": "Follow the most coordinated drafting lane. Choose a groove that keeps you connected rather than making repeated solo lane changes.",
    "savingGuidance": "Use the draft to reduce throttle gently; judge saving against the risk of losing the pack.",
    "watchFor": "The real-world pit route uses separate 90 and 45 mph zones. Confirm the game enforcement points and limits before race night.",
    "referenceNote": "Real-world reference; 50% lap estimate may differ from the game. Confirm the in-game race length and layout.",
    "sources": [
      {
        "label": "NASCAR 2026 Cup track specifications",
        "url": "https://www.jayski.com/wp-content/uploads/sites/31/2026/2/6/2026-RACETRACK-SPECIFICATIONS-NCS_REVB.pdf"
      },
      {
        "label": "NASCAR: fuel strategy",
        "url": "https://www.nascar.com/news-media/2025/08/29/cup-series-playoffs-2025-fuel-saving-strategy/"
      },
      {
        "label": "NASCAR: temperature and grip",
        "url": "https://www.nascar.com/news-media/2018/08/20/temperature-factor-racing-heres/"
      },
      {
        "label": "NASCAR 26: dynamic track system",
        "url": "https://nascar26.com/nascar-and-iracing-studios-debut-official-gameplay-trailer-open-pre-orders-for-nascar-26/"
      }
    ]
  },
  "Daytona International Speedway": {
    "name": "Daytona International Speedway",
    "location": "Daytona Beach, Florida",
    "type": "Superspeedway tri-oval",
    "length": "2.5 miles",
    "turns": "4",
    "banking": "31° turns, 18° tri-oval, 3° backstretch",
    "pitSpeed": "55 mph",
    "restartZone": "Frontstretch restart zone before the start/finish line",
    "tireWear": "Low to moderate. Drafting, lane discipline, and pushing technique matter more than tire falloff.",
    "notes": "Pack racing with huge runs. Survival, patience, and timing are key.",
    "imageUrl": "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/daytona.jpg",
    "lengthMiles": 2.5,
    "referenceFullLaps": 200,
    "surface": "asphalt",
    "kind": "draft",
    "preferredLine": "Hold the lane with the strongest organized draft; momentum and connected cars matter more than a fixed low or high groove.",
    "savingGuidance": "Stay tucked into a stable draft and make small throttle reductions. Do not lose the pack to chase a fuel number.",
    "watchFor": "Avoid sudden checks when saving. Announce coordinated pit entry and avoid crossing a moving lane.",
    "referenceNote": "Real-world reference; 50% lap estimate may differ from the game. Confirm the in-game race length and layout.",
    "sources": [
      {
        "label": "NASCAR 2026 Cup track specifications",
        "url": "https://www.jayski.com/wp-content/uploads/sites/31/2026/2/6/2026-RACETRACK-SPECIFICATIONS-NCS_REVB.pdf"
      },
      {
        "label": "NASCAR: fuel strategy",
        "url": "https://www.nascar.com/news-media/2025/08/29/cup-series-playoffs-2025-fuel-saving-strategy/"
      },
      {
        "label": "NASCAR: temperature and grip",
        "url": "https://www.nascar.com/news-media/2018/08/20/temperature-factor-racing-heres/"
      },
      {
        "label": "NASCAR 26: dynamic track system",
        "url": "https://nascar26.com/nascar-and-iracing-studios-debut-official-gameplay-trailer-open-pre-orders-for-nascar-26/"
      }
    ]
  },
  "Charlotte Motor Speedway": {
    "name": "Charlotte Motor Speedway",
    "location": "Concord, North Carolina",
    "type": "Quad-oval intermediate",
    "length": "1.5 miles",
    "turns": "4",
    "banking": "24° turns, 5° straights",
    "pitSpeed": "45 mph",
    "restartZone": "Frontstretch restart zone before the start/finish line",
    "tireWear": "Moderate to high. Long-run speed depends on keeping the car stable in dirty air and saving right-side tires.",
    "notes": "Clean air and momentum are important. Charlotte has 3 stage points in your league format.",
    "imageUrl": "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/charlotte.jpg",
    "lengthMiles": 1.5,
    "referenceFullLaps": 400,
    "surface": "asphalt",
    "kind": "intermediate",
    "preferredLine": "Compare lower-to-middle grip with a higher momentum lane as the track changes. Favor the arc that holds its pace at the end of a 3× stint.",
    "savingGuidance": "Make small earlier lifts, reduce steering scrub, and protect exit traction. Recalculate both ranges after each planned stage break.",
    "watchFor": "The 400-lap reference is the Coca-Cola 600. The other oval event is 267 laps. BRL uses three scoring stages here; do not assume real NASCAR stage-ending laps.",
    "referenceNote": "400-lap reference → approximately 200 laps at 50%. Confirm the selected game event.",
    "sources": [
      {
        "label": "NASCAR 2026 Cup track specifications",
        "url": "https://www.jayski.com/wp-content/uploads/sites/31/2026/2/6/2026-RACETRACK-SPECIFICATIONS-NCS_REVB.pdf"
      },
      {
        "label": "NASCAR: fuel strategy",
        "url": "https://www.nascar.com/news-media/2025/08/29/cup-series-playoffs-2025-fuel-saving-strategy/"
      },
      {
        "label": "NASCAR: temperature and grip",
        "url": "https://www.nascar.com/news-media/2018/08/20/temperature-factor-racing-heres/"
      },
      {
        "label": "NASCAR 26: dynamic track system",
        "url": "https://nascar26.com/nascar-and-iracing-studios-debut-official-gameplay-trailer-open-pre-orders-for-nascar-26/"
      }
    ]
  },
  "Nashville Superspeedway": {
    "name": "Nashville Superspeedway",
    "location": "Lebanon, Tennessee",
    "type": "Concrete D-shaped oval",
    "length": "1.33 miles",
    "turns": "4",
    "banking": "14° turns, 9° frontstretch, 6° backstretch",
    "pitSpeed": "45 mph",
    "restartZone": "Frontstretch restart zone before the start/finish line",
    "tireWear": "Moderate. Concrete grip and traffic make throttle control important.",
    "notes": "Momentum track with long corners and tricky traffic transitions.",
    "imageUrl": "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/nashville.jpg",
    "lengthMiles": 1.33,
    "referenceFullLaps": 300,
    "surface": "concrete",
    "kind": "intermediate",
    "preferredLine": "Start with a consistent lower-to-middle arc. Test a higher lane as the surface changes instead of forcing a tight car down to the bottom.",
    "savingGuidance": "Lift before entry and avoid scrubbing the front tires in the center. Use progressive throttle to protect rear grip.",
    "watchFor": "Avoid using braking to compensate for excessive entry speed throughout a 3× tire stint.",
    "referenceNote": "Real-world reference; 50% lap estimate may differ from the game. Confirm the in-game race length and layout.",
    "sources": [
      {
        "label": "NASCAR 2026 Cup track specifications",
        "url": "https://www.jayski.com/wp-content/uploads/sites/31/2026/2/6/2026-RACETRACK-SPECIFICATIONS-NCS_REVB.pdf"
      },
      {
        "label": "NASCAR: fuel strategy",
        "url": "https://www.nascar.com/news-media/2025/08/29/cup-series-playoffs-2025-fuel-saving-strategy/"
      },
      {
        "label": "NASCAR: temperature and grip",
        "url": "https://www.nascar.com/news-media/2018/08/20/temperature-factor-racing-heres/"
      },
      {
        "label": "NASCAR 26: dynamic track system",
        "url": "https://nascar26.com/nascar-and-iracing-studios-debut-official-gameplay-trailer-open-pre-orders-for-nascar-26/"
      }
    ]
  },
  "Pocono Raceway": {
    "name": "Pocono Raceway",
    "location": "Long Pond, Pennsylvania",
    "type": "Triangular superspeedway",
    "length": "2.5 miles",
    "turns": "3",
    "banking": "14° turn 1, 8° turn 2, 6° turn 3",
    "pitSpeed": "55 mph",
    "restartZone": "Frontstretch restart zone before the start/finish line",
    "tireWear": "Moderate. Each corner needs a different compromise, especially braking and exit drive.",
    "notes": "Three unique corners. Turn 3 exit is critical for frontstretch speed.",
    "imageUrl": "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/pocono.jpg",
    "lengthMiles": 2.5,
    "referenceFullLaps": 160,
    "surface": "asphalt",
    "kind": "asymmetric",
    "preferredLine": "Use a different approach for each of the three turns. Protect the last corner exit because it leads onto the longest straight.",
    "savingGuidance": "Lift earlier into the heavier braking zones while preserving exit speed. Check whether saving actually avoids a stop in the shortened race.",
    "watchFor": "Three different corners create a compromise; a one-corner setup or line can lose more time elsewhere.",
    "referenceNote": "Real-world reference; 50% lap estimate may differ from the game. Confirm the in-game race length and layout.",
    "sources": [
      {
        "label": "NASCAR 2026 Cup track specifications",
        "url": "https://www.jayski.com/wp-content/uploads/sites/31/2026/2/6/2026-RACETRACK-SPECIFICATIONS-NCS_REVB.pdf"
      },
      {
        "label": "NASCAR: fuel strategy",
        "url": "https://www.nascar.com/news-media/2025/08/29/cup-series-playoffs-2025-fuel-saving-strategy/"
      },
      {
        "label": "NASCAR: temperature and grip",
        "url": "https://www.nascar.com/news-media/2018/08/20/temperature-factor-racing-heres/"
      },
      {
        "label": "NASCAR 26: dynamic track system",
        "url": "https://nascar26.com/nascar-and-iracing-studios-debut-official-gameplay-trailer-open-pre-orders-for-nascar-26/"
      }
    ]
  },
  "Bristol Motor Speedway": {
    "name": "Bristol Motor Speedway",
    "location": "Bristol, Tennessee",
    "type": "Concrete short track",
    "length": "0.533 miles",
    "turns": "4",
    "banking": "24°-28° turns, 5°-9° straights",
    "pitSpeed": "30 mph",
    "restartZone": "Frontstretch restart zone before the start/finish line",
    "tireWear": "High. Traffic, wheel spin, and overdriving corner entry can use tires up fast.",
    "notes": "Short-track chaos. Rhythm, patience, and clean bumper discipline matter.",
    "imageUrl": "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/bristol.jpg",
    "lengthMiles": 0.533,
    "referenceFullLaps": 500,
    "surface": "concrete",
    "kind": "short",
    "preferredLine": "Compare the lower groove with the upper lane as rubber develops. The fastest lane may migrate through the run.",
    "savingGuidance": "Keep the arc smooth and avoid scrubbing the right front. Save subtly so nearby cars can anticipate your pace.",
    "watchFor": "Short laps compress decision time at 3×; plan pit entry early and confirm the front/back pit-road rules in-game.",
    "referenceNote": "Real-world reference; 50% lap estimate may differ from the game. Confirm the in-game race length and layout.",
    "sources": [
      {
        "label": "NASCAR 2026 Cup track specifications",
        "url": "https://www.jayski.com/wp-content/uploads/sites/31/2026/2/6/2026-RACETRACK-SPECIFICATIONS-NCS_REVB.pdf"
      },
      {
        "label": "NASCAR: fuel strategy",
        "url": "https://www.nascar.com/news-media/2025/08/29/cup-series-playoffs-2025-fuel-saving-strategy/"
      },
      {
        "label": "NASCAR: temperature and grip",
        "url": "https://www.nascar.com/news-media/2018/08/20/temperature-factor-racing-heres/"
      },
      {
        "label": "NASCAR 26: dynamic track system",
        "url": "https://nascar26.com/nascar-and-iracing-studios-debut-official-gameplay-trailer-open-pre-orders-for-nascar-26/"
      }
    ]
  },
  "Las Vegas Motor Speedway": {
    "name": "Las Vegas Motor Speedway",
    "location": "Las Vegas, Nevada",
    "type": "Intermediate oval",
    "length": "1.5 miles",
    "turns": "4",
    "banking": "20° turns, 9° frontstretch, 9° backstretch",
    "pitSpeed": "45 mph",
    "restartZone": "Frontstretch restart zone before the start/finish line",
    "tireWear": "Moderate. Long-run balance and clean air make a big difference.",
    "notes": "Momentum-based intermediate with multiple lanes as the run develops.",
    "imageUrl": "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/lasvegas.jpg",
    "lengthMiles": 1.5,
    "referenceFullLaps": 267,
    "surface": "asphalt",
    "kind": "intermediate",
    "preferredLine": "Test low-to-middle early and compare a higher momentum lane as grip and tire balance change.",
    "savingGuidance": "Make a small earlier lift and keep the arc smooth. Save without repeatedly correcting the car on exit.",
    "watchFor": "Pitting early only helps if fresh-tire gains beat pit loss and you have enough laps to use them.",
    "referenceNote": "Real-world reference; 50% lap estimate may differ from the game. Confirm the in-game race length and layout.",
    "sources": [
      {
        "label": "NASCAR 2026 Cup track specifications",
        "url": "https://www.jayski.com/wp-content/uploads/sites/31/2026/2/6/2026-RACETRACK-SPECIFICATIONS-NCS_REVB.pdf"
      },
      {
        "label": "NASCAR: fuel strategy",
        "url": "https://www.nascar.com/news-media/2025/08/29/cup-series-playoffs-2025-fuel-saving-strategy/"
      },
      {
        "label": "NASCAR: temperature and grip",
        "url": "https://www.nascar.com/news-media/2018/08/20/temperature-factor-racing-heres/"
      },
      {
        "label": "NASCAR 26: dynamic track system",
        "url": "https://nascar26.com/nascar-and-iracing-studios-debut-official-gameplay-trailer-open-pre-orders-for-nascar-26/"
      }
    ]
  },
  "Talladega Superspeedway": {
    "name": "Talladega Superspeedway",
    "location": "Talladega, Alabama",
    "type": "Superspeedway tri-oval",
    "length": "2.66 miles",
    "turns": "4",
    "banking": "33° turns, 16.5° tri-oval, 3° backstretch",
    "pitSpeed": "55 mph",
    "restartZone": "Frontstretch restart zone before the start/finish line",
    "tireWear": "Low. Drafting, pushing, lane choice, and avoiding mistakes matter most.",
    "notes": "Huge pack-racing track. Runs form quickly and decision-making is everything.",
    "imageUrl": "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/talladega.jpg",
    "lengthMiles": 2.66,
    "referenceFullLaps": 188,
    "surface": "asphalt",
    "kind": "draft",
    "preferredLine": "Choose the best-supported drafting lane and stay connected. A passing lane needs help to remain fast.",
    "savingGuidance": "Make small throttle reductions in the draft and coordinate stops. Avoid lifting abruptly in front of another car.",
    "watchFor": "Saving too hard can disconnect you from the pack, making a theoretical fuel advantage irrelevant.",
    "referenceNote": "Real-world reference; 50% lap estimate may differ from the game. Confirm the in-game race length and layout.",
    "sources": [
      {
        "label": "NASCAR 2026 Cup track specifications",
        "url": "https://www.jayski.com/wp-content/uploads/sites/31/2026/2/6/2026-RACETRACK-SPECIFICATIONS-NCS_REVB.pdf"
      },
      {
        "label": "NASCAR: fuel strategy",
        "url": "https://www.nascar.com/news-media/2025/08/29/cup-series-playoffs-2025-fuel-saving-strategy/"
      },
      {
        "label": "NASCAR: temperature and grip",
        "url": "https://www.nascar.com/news-media/2018/08/20/temperature-factor-racing-heres/"
      },
      {
        "label": "NASCAR 26: dynamic track system",
        "url": "https://nascar26.com/nascar-and-iracing-studios-debut-official-gameplay-trailer-open-pre-orders-for-nascar-26/"
      }
    ]
  },
  "North Wilkesboro Speedway": {
    "name": "North Wilkesboro Speedway",
    "location": "North Wilkesboro, North Carolina",
    "type": "Short track oval",
    "length": "0.625 miles",
    "turns": "4",
    "banking": "13° turns",
    "pitSpeed": "30 mph",
    "restartZone": "Frontstretch restart zone before the start/finish line",
    "tireWear": "High. Tire conservation and throttle control are major factors.",
    "notes": "Old-school short track with heavy braking, low grip, and tough passing.",
    "imageUrl": "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/northwilkesboro.jpg",
    "lengthMiles": 0.625,
    "referenceFullLaps": 450,
    "surface": "asphalt",
    "kind": "short",
    "preferredLine": "Start with a low, rounded arc and compare a lane higher as grip develops. Prioritize a settled rear end on exit.",
    "savingGuidance": "Lift earlier and roll through the center; abrupt braking and spinning the rear tires can waste the fuel and grip you are trying to save.",
    "watchFor": "Track position matters. A tire stop must recover its pit-road loss over the remaining laps.",
    "referenceNote": "Real-world reference; 50% lap estimate may differ from the game. Confirm the in-game race length and layout.",
    "sources": [
      {
        "label": "NASCAR 2026 Cup track specifications",
        "url": "https://www.jayski.com/wp-content/uploads/sites/31/2026/2/6/2026-RACETRACK-SPECIFICATIONS-NCS_REVB.pdf"
      },
      {
        "label": "NASCAR: fuel strategy",
        "url": "https://www.nascar.com/news-media/2025/08/29/cup-series-playoffs-2025-fuel-saving-strategy/"
      },
      {
        "label": "NASCAR: temperature and grip",
        "url": "https://www.nascar.com/news-media/2018/08/20/temperature-factor-racing-heres/"
      },
      {
        "label": "NASCAR 26: dynamic track system",
        "url": "https://nascar26.com/nascar-and-iracing-studios-debut-official-gameplay-trailer-open-pre-orders-for-nascar-26/"
      }
    ]
  },
  "Indianapolis Motor Speedway": {
    "name": "Indianapolis Motor Speedway",
    "location": "Speedway, Indiana",
    "type": "Rectangular oval",
    "length": "2.5 miles",
    "turns": "4",
    "banking": "9°12′ turns, nearly flat straights",
    "pitSpeed": "45 mph",
    "restartZone": "Frontstretch restart zone before the start/finish line",
    "tireWear": "Moderate. Braking stability and exit speed are critical because the corners are flat and narrow.",
    "notes": "Precision track. Mistakes on corner exit cost speed for a long straightaway.",
    "imageUrl": "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/indianapolis.jpg",
    "lengthMiles": 2.5,
    "referenceFullLaps": 160,
    "surface": "asphalt",
    "kind": "asymmetric",
    "preferredLine": "Keep a precise, consistent arc through each flat corner and prioritize clean air plus the exit onto the straights.",
    "savingGuidance": "Use earlier lift into the turns while avoiding a large exit-speed loss. Small repeated gains can matter over a long lap.",
    "watchFor": "Track position is valuable; saving is worthwhile when it prevents a stop or improves the final pit cycle.",
    "referenceNote": "Real-world reference; 50% lap estimate may differ from the game. Confirm the in-game race length and layout.",
    "sources": [
      {
        "label": "NASCAR 2026 Cup track specifications",
        "url": "https://www.jayski.com/wp-content/uploads/sites/31/2026/2/6/2026-RACETRACK-SPECIFICATIONS-NCS_REVB.pdf"
      },
      {
        "label": "NASCAR: fuel strategy",
        "url": "https://www.nascar.com/news-media/2025/08/29/cup-series-playoffs-2025-fuel-saving-strategy/"
      },
      {
        "label": "NASCAR: temperature and grip",
        "url": "https://www.nascar.com/news-media/2018/08/20/temperature-factor-racing-heres/"
      },
      {
        "label": "NASCAR 26: dynamic track system",
        "url": "https://nascar26.com/nascar-and-iracing-studios-debut-official-gameplay-trailer-open-pre-orders-for-nascar-26/"
      }
    ]
  },
  "Phoenix Raceway": {
    "name": "Phoenix Raceway",
    "location": "Avondale, Arizona",
    "type": "Dogleg oval",
    "length": "1 miles",
    "turns": "4",
    "banking": "8°-11° turns, 3° backstretch, 10°-11° dogleg",
    "pitSpeed": "45 mph",
    "restartZone": "Frontstretch restart zone before the start/finish line",
    "tireWear": "Moderate. Drivers need to manage rear grip off the flat corners.",
    "notes": "Restarts can get aggressive through the dogleg. Track position matters.",
    "imageUrl": "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/phoenix.jpg",
    "lengthMiles": 1,
    "referenceFullLaps": 312,
    "surface": "asphalt",
    "kind": "short",
    "preferredLine": "Use a smooth lower-to-middle corner arc. Confirm the league rules for the dogleg and restart boundaries.",
    "savingGuidance": "Back up entry, keep the car rotating, and apply throttle progressively to limit rear-wheel spin.",
    "watchFor": "Evaluate track position against tire advantage before giving up a restart position.",
    "referenceNote": "Real-world reference; 50% lap estimate may differ from the game. Confirm the in-game race length and layout.",
    "sources": [
      {
        "label": "NASCAR 2026 Cup track specifications",
        "url": "https://www.jayski.com/wp-content/uploads/sites/31/2026/2/6/2026-RACETRACK-SPECIFICATIONS-NCS_REVB.pdf"
      },
      {
        "label": "NASCAR: fuel strategy",
        "url": "https://www.nascar.com/news-media/2025/08/29/cup-series-playoffs-2025-fuel-saving-strategy/"
      },
      {
        "label": "NASCAR: temperature and grip",
        "url": "https://www.nascar.com/news-media/2018/08/20/temperature-factor-racing-heres/"
      },
      {
        "label": "NASCAR 26: dynamic track system",
        "url": "https://nascar26.com/nascar-and-iracing-studios-debut-official-gameplay-trailer-open-pre-orders-for-nascar-26/"
      }
    ]
  },
  "Richmond Raceway": {
    "name": "Richmond Raceway",
    "location": "Richmond, Virginia",
    "type": "Short track D-shaped oval",
    "length": "0.75 miles",
    "turns": "4",
    "banking": "14° turns, 8° frontstretch, 2° backstretch",
    "pitSpeed": "40 mph",
    "restartZone": "Frontstretch restart zone before the start/finish line",
    "tireWear": "High. Long-run tire saving is one of the biggest keys.",
    "notes": "Short-track strategy race. Smoothness and tire management create passing chances.",
    "imageUrl": "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/richmond.jpg",
    "lengthMiles": 0.75,
    "referenceFullLaps": 400,
    "surface": "asphalt",
    "kind": "short",
    "preferredLine": "Start low with a patient entry and clean exit. Move your arc if the rear tires lose drive or the bottom stops rotating.",
    "savingGuidance": "Earlier lift and gentle throttle application can protect both fuel and rear grip. Avoid trying to recover all the saved time at corner exit.",
    "watchFor": "Compare tire falloff with green-flag pit loss before choosing an extra stop.",
    "referenceNote": "Real-world reference; 50% lap estimate may differ from the game. Confirm the in-game race length and layout.",
    "sources": [
      {
        "label": "NASCAR 2026 Cup track specifications",
        "url": "https://www.jayski.com/wp-content/uploads/sites/31/2026/2/6/2026-RACETRACK-SPECIFICATIONS-NCS_REVB.pdf"
      },
      {
        "label": "NASCAR: fuel strategy",
        "url": "https://www.nascar.com/news-media/2025/08/29/cup-series-playoffs-2025-fuel-saving-strategy/"
      },
      {
        "label": "NASCAR: temperature and grip",
        "url": "https://www.nascar.com/news-media/2018/08/20/temperature-factor-racing-heres/"
      },
      {
        "label": "NASCAR 26: dynamic track system",
        "url": "https://nascar26.com/nascar-and-iracing-studios-debut-official-gameplay-trailer-open-pre-orders-for-nascar-26/"
      }
    ]
  },
  "Kansas Speedway": {
    "name": "Kansas Speedway",
    "location": "Kansas City, Kansas",
    "type": "Intermediate tri-oval",
    "length": "1.5 miles",
    "turns": "4",
    "banking": "17°-20° progressive turns, 9°-11° frontstretch, 5° backstretch",
    "pitSpeed": "45 mph",
    "restartZone": "Frontstretch restart zone before the start/finish line",
    "tireWear": "Moderate. Multiple grooves open up, but dirty air still matters.",
    "notes": "Progressive banking makes lane choice important over a long run.",
    "imageUrl": "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/kansas.jpg",
    "lengthMiles": 1.5,
    "referenceFullLaps": 267,
    "surface": "asphalt",
    "kind": "intermediate",
    "preferredLine": "Compare the middle and upper grooves for momentum; use the lower lane when it offers a clear passing opportunity.",
    "savingGuidance": "Reduce entry speed slightly and keep steering smooth. Compare the extra distance of the high line with the fuel saved by carrying speed.",
    "watchFor": "A high line is not automatically a fuel-saving line. Compare fuel per lap and average pace at 3×.",
    "referenceNote": "Real-world reference; 50% lap estimate may differ from the game. Confirm the in-game race length and layout.",
    "sources": [
      {
        "label": "NASCAR 2026 Cup track specifications",
        "url": "https://www.jayski.com/wp-content/uploads/sites/31/2026/2/6/2026-RACETRACK-SPECIFICATIONS-NCS_REVB.pdf"
      },
      {
        "label": "NASCAR: fuel strategy",
        "url": "https://www.nascar.com/news-media/2025/08/29/cup-series-playoffs-2025-fuel-saving-strategy/"
      },
      {
        "label": "NASCAR: temperature and grip",
        "url": "https://www.nascar.com/news-media/2018/08/20/temperature-factor-racing-heres/"
      },
      {
        "label": "NASCAR 26: dynamic track system",
        "url": "https://nascar26.com/nascar-and-iracing-studios-debut-official-gameplay-trailer-open-pre-orders-for-nascar-26/"
      }
    ]
  },
  "Texas Motor Speedway": {
    "name": "Texas Motor Speedway",
    "location": "Fort Worth, Texas",
    "type": "Intermediate oval",
    "length": "1.5 miles",
    "turns": "4",
    "banking": "20° turns 1-2, 24° turns 3-4",
    "pitSpeed": "45 mph",
    "restartZone": "Frontstretch restart zone before the start/finish line",
    "tireWear": "Moderate. The two ends can feel different, so setup compromise matters.",
    "notes": "Momentum and clean air are major. Restarts can decide track position quickly.",
    "imageUrl": "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/texas.jpg",
    "lengthMiles": 1.5,
    "referenceFullLaps": 267,
    "surface": "asphalt",
    "kind": "intermediate",
    "preferredLine": "Treat the two ends separately: a patient entry at one end may support a wider momentum arc at the other.",
    "savingGuidance": "Lift before the car begins to push and protect the exit. Do not use extra steering to force a line that the tires can no longer hold.",
    "watchFor": "With 3× wear, a line that needs fewer corrections may beat a faster qualifying arc over the stint.",
    "referenceNote": "Real-world reference; 50% lap estimate may differ from the game. Confirm the in-game race length and layout.",
    "sources": [
      {
        "label": "NASCAR 2026 Cup track specifications",
        "url": "https://www.jayski.com/wp-content/uploads/sites/31/2026/2/6/2026-RACETRACK-SPECIFICATIONS-NCS_REVB.pdf"
      },
      {
        "label": "NASCAR: fuel strategy",
        "url": "https://www.nascar.com/news-media/2025/08/29/cup-series-playoffs-2025-fuel-saving-strategy/"
      },
      {
        "label": "NASCAR: temperature and grip",
        "url": "https://www.nascar.com/news-media/2018/08/20/temperature-factor-racing-heres/"
      },
      {
        "label": "NASCAR 26: dynamic track system",
        "url": "https://nascar26.com/nascar-and-iracing-studios-debut-official-gameplay-trailer-open-pre-orders-for-nascar-26/"
      }
    ]
  },
  "Homestead-Miami Speedway": {
    "name": "Homestead-Miami Speedway",
    "location": "Homestead, Florida",
    "type": "Intermediate oval",
    "length": "1.5 miles",
    "turns": "4",
    "banking": "18°-20° progressive turns, 4° straights",
    "pitSpeed": "45 mph",
    "restartZone": "Frontstretch restart zone before the start/finish line",
    "tireWear": "High. The wall lane is fast, but tire saving and throttle control still matter.",
    "notes": "Multiple grooves with major long-run falloff. Drivers can search for grip from bottom to wall.",
    "imageUrl": "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/homestead.jpg",
    "lengthMiles": 1.5,
    "referenceFullLaps": 267,
    "surface": "asphalt",
    "kind": "abrasive",
    "preferredLine": "Compare the high momentum groove with a lower, shorter line. Leave a safe wall margin and judge the last laps of the stint.",
    "savingGuidance": "Protect tire life from lap one. Smooth entry and throttle can preserve pace, but extra distance up high may offset fuel savings.",
    "watchFor": "With 3× tire wear, a fuel-only strategy may lose to a tire-focused stop. Compare both constraints.",
    "referenceNote": "Real-world reference; 50% lap estimate may differ from the game. Confirm the in-game race length and layout.",
    "sources": [
      {
        "label": "NASCAR 2026 Cup track specifications",
        "url": "https://www.jayski.com/wp-content/uploads/sites/31/2026/2/6/2026-RACETRACK-SPECIFICATIONS-NCS_REVB.pdf"
      },
      {
        "label": "NASCAR: fuel strategy",
        "url": "https://www.nascar.com/news-media/2025/08/29/cup-series-playoffs-2025-fuel-saving-strategy/"
      },
      {
        "label": "NASCAR: temperature and grip",
        "url": "https://www.nascar.com/news-media/2018/08/20/temperature-factor-racing-heres/"
      },
      {
        "label": "NASCAR 26: dynamic track system",
        "url": "https://nascar26.com/nascar-and-iracing-studios-debut-official-gameplay-trailer-open-pre-orders-for-nascar-26/"
      }
    ]
  },
  "Sonoma Raceway": {
    "name": "Sonoma Raceway",
    "lengthMiles": 1.99,
    "referenceFullLaps": 110,
    "pitSpeed": "40 mph",
    "surface": "asphalt",
    "kind": "road",
    "preferredLine": "Use a late apex where it improves acceleration onto the next straight; prioritize exit speed over deep braking.",
    "savingGuidance": "Lift before heavy braking zones and shorten full-throttle time without compromising a safe exit. Coast while staying on a predictable line.",
    "watchFor": "Rear-wheel spin and curb strikes can erase any benefit from saving fuel.",
    "referenceNote": "Real-world reference; 50% lap estimate may differ from the game. Confirm the in-game race length and layout.",
    "sources": [
      {
        "label": "NASCAR 2026 Cup track specifications",
        "url": "https://www.jayski.com/wp-content/uploads/sites/31/2026/2/6/2026-RACETRACK-SPECIFICATIONS-NCS_REVB.pdf"
      },
      {
        "label": "NASCAR: fuel strategy",
        "url": "https://www.nascar.com/news-media/2025/08/29/cup-series-playoffs-2025-fuel-saving-strategy/"
      },
      {
        "label": "NASCAR: temperature and grip",
        "url": "https://www.nascar.com/news-media/2018/08/20/temperature-factor-racing-heres/"
      },
      {
        "label": "NASCAR 26: dynamic track system",
        "url": "https://nascar26.com/nascar-and-iracing-studios-debut-official-gameplay-trailer-open-pre-orders-for-nascar-26/"
      }
    ],
    "length": "1.99 miles"
  },
  "Qualcomm Circuit at Naval Base Coronado": {
    "name": "Qualcomm Circuit at Naval Base Coronado",
    "lengthMiles": 3.4,
    "referenceFullLaps": 75,
    "pitSpeed": "40 mph",
    "surface": "street-course pavement",
    "kind": "road",
    "preferredLine": "Build the lap around clean braking and exits; use conservative curb approaches until practice confirms grip.",
    "savingGuidance": "Coast ahead of the larger braking zones while keeping entry predictable. Favor clean exits over aggressive throttle spikes.",
    "watchFor": "Walls and narrow sections reduce recovery options. Treat this as a new-course guide to validate in practice.",
    "referenceNote": "Real-world reference; 50% lap estimate may differ from the game. Confirm the in-game race length and layout.",
    "sources": [
      {
        "label": "NASCAR 2026 Cup track specifications",
        "url": "https://www.jayski.com/wp-content/uploads/sites/31/2026/2/6/2026-RACETRACK-SPECIFICATIONS-NCS_REVB.pdf"
      },
      {
        "label": "NASCAR: fuel strategy",
        "url": "https://www.nascar.com/news-media/2025/08/29/cup-series-playoffs-2025-fuel-saving-strategy/"
      },
      {
        "label": "NASCAR: temperature and grip",
        "url": "https://www.nascar.com/news-media/2018/08/20/temperature-factor-racing-heres/"
      },
      {
        "label": "NASCAR 26: dynamic track system",
        "url": "https://nascar26.com/nascar-and-iracing-studios-debut-official-gameplay-trailer-open-pre-orders-for-nascar-26/"
      }
    ],
    "length": "3.4 miles"
  },
  "Watkins Glen International": {
    "name": "Watkins Glen International",
    "lengthMiles": 2.45,
    "referenceFullLaps": 100,
    "pitSpeed": "40 mph",
    "surface": "asphalt",
    "kind": "road",
    "preferredLine": "Prioritize clean exits and a settled car through the Esses and bus stop. Test curb usage rather than assuming every curb is faster.",
    "savingGuidance": "Lift before heavy braking and stay smooth through direction changes; do not sacrifice exit speed onto the long straights unnecessarily.",
    "watchFor": "Pit timing can determine track position. Do not import real NASCAR stage-caution rules into the league plan.",
    "referenceNote": "Real-world reference; 50% lap estimate may differ from the game. Confirm the in-game race length and layout.",
    "sources": [
      {
        "label": "NASCAR 2026 Cup track specifications",
        "url": "https://www.jayski.com/wp-content/uploads/sites/31/2026/2/6/2026-RACETRACK-SPECIFICATIONS-NCS_REVB.pdf"
      },
      {
        "label": "NASCAR: fuel strategy",
        "url": "https://www.nascar.com/news-media/2025/08/29/cup-series-playoffs-2025-fuel-saving-strategy/"
      },
      {
        "label": "NASCAR: temperature and grip",
        "url": "https://www.nascar.com/news-media/2018/08/20/temperature-factor-racing-heres/"
      },
      {
        "label": "NASCAR 26: dynamic track system",
        "url": "https://nascar26.com/nascar-and-iracing-studios-debut-official-gameplay-trailer-open-pre-orders-for-nascar-26/"
      }
    ],
    "length": "2.45 miles"
  },
  "Chicagoland Speedway": {
    "name": "Chicagoland Speedway",
    "lengthMiles": 1.5,
    "referenceFullLaps": 267,
    "pitSpeed": "45 mph",
    "surface": "asphalt",
    "kind": "intermediate",
    "preferredLine": "Compare a lower, shorter route with a higher momentum arc. Let long-run grip decide rather than committing to one lane.",
    "savingGuidance": "Reduce front-tire scrub and throttle spikes. Compare your final stint laps as well as the opening laps.",
    "watchFor": "At 3×, a short qualifying advantage may disappear before the pit window.",
    "referenceNote": "Real-world reference; 50% lap estimate may differ from the game. Confirm the in-game race length and layout.",
    "sources": [
      {
        "label": "NASCAR 2026 Cup track specifications",
        "url": "https://www.jayski.com/wp-content/uploads/sites/31/2026/2/6/2026-RACETRACK-SPECIFICATIONS-NCS_REVB.pdf"
      },
      {
        "label": "NASCAR: fuel strategy",
        "url": "https://www.nascar.com/news-media/2025/08/29/cup-series-playoffs-2025-fuel-saving-strategy/"
      },
      {
        "label": "NASCAR: temperature and grip",
        "url": "https://www.nascar.com/news-media/2018/08/20/temperature-factor-racing-heres/"
      },
      {
        "label": "NASCAR 26: dynamic track system",
        "url": "https://nascar26.com/nascar-and-iracing-studios-debut-official-gameplay-trailer-open-pre-orders-for-nascar-26/"
      }
    ],
    "length": "1.5 miles"
  },
  "Darlington Raceway": {
    "name": "Darlington Raceway",
    "lengthMiles": 1.366,
    "referenceFullLaps": 293,
    "pitSpeed": "45 mph",
    "surface": "asphalt",
    "kind": "abrasive",
    "preferredLine": "Test the higher momentum line with a safe wall margin; treat the two ends differently and avoid pinching the exit.",
    "savingGuidance": "Manage the tires from the start: less entry aggression and smoother steering can protect late-stint pace at 3×.",
    "watchFor": "A fuel stretch is not a win if worn tires cost more time than the stop you avoid. Evaluate fresh-tire recovery carefully.",
    "referenceNote": "293-lap spring reference; the Southern 500 uses 367 laps. Select the game event length before planning.",
    "sources": [
      {
        "label": "NASCAR 2026 Cup track specifications",
        "url": "https://www.jayski.com/wp-content/uploads/sites/31/2026/2/6/2026-RACETRACK-SPECIFICATIONS-NCS_REVB.pdf"
      },
      {
        "label": "NASCAR: fuel strategy",
        "url": "https://www.nascar.com/news-media/2025/08/29/cup-series-playoffs-2025-fuel-saving-strategy/"
      },
      {
        "label": "NASCAR: temperature and grip",
        "url": "https://www.nascar.com/news-media/2018/08/20/temperature-factor-racing-heres/"
      },
      {
        "label": "NASCAR 26: dynamic track system",
        "url": "https://nascar26.com/nascar-and-iracing-studios-debut-official-gameplay-trailer-open-pre-orders-for-nascar-26/"
      }
    ],
    "length": "1.366 miles"
  },
  "Circuit of the Americas": {
    "name": "Circuit of the Americas",
    "lengthMiles": 2.4,
    "referenceFullLaps": 95,
    "pitSpeed": "40 mph",
    "surface": "asphalt",
    "kind": "road",
    "preferredLine": "Link late apexes to strong straightaway exits; protect grip through the slower corners and rapid direction changes.",
    "savingGuidance": "Coast before the heaviest braking zones and limit unnecessary throttle bursts between closely spaced turns.",
    "watchFor": "The reference is the 2026 2.40-mile NASCAR layout. Verify the game layout before treating lap estimates as exact.",
    "referenceNote": "Real-world reference; 50% lap estimate may differ from the game. Confirm the in-game race length and layout.",
    "sources": [
      {
        "label": "NASCAR 2026 Cup track specifications",
        "url": "https://www.jayski.com/wp-content/uploads/sites/31/2026/2/6/2026-RACETRACK-SPECIFICATIONS-NCS_REVB.pdf"
      },
      {
        "label": "NASCAR: fuel strategy",
        "url": "https://www.nascar.com/news-media/2025/08/29/cup-series-playoffs-2025-fuel-saving-strategy/"
      },
      {
        "label": "NASCAR: temperature and grip",
        "url": "https://www.nascar.com/news-media/2018/08/20/temperature-factor-racing-heres/"
      },
      {
        "label": "NASCAR 26: dynamic track system",
        "url": "https://nascar26.com/nascar-and-iracing-studios-debut-official-gameplay-trailer-open-pre-orders-for-nascar-26/"
      }
    ],
    "length": "2.4 miles"
  },
  "World Wide Technology Raceway": {
    "name": "World Wide Technology Raceway",
    "lengthMiles": 1.25,
    "referenceFullLaps": 240,
    "pitSpeed": "40 mph",
    "surface": "asphalt",
    "kind": "asymmetric",
    "preferredLine": "Treat Turns 1–2 and 3–4 separately. Use controlled braking, clean rotation, and a strong exit at each end.",
    "savingGuidance": "Lift before the heavier braking end and keep the car settled. Compare the effect on both brake demand and fuel use.",
    "watchFor": "This is Gateway in Madison, Illinois, not Atlanta. Protect tires and brakes while managing its unequal corner shapes.",
    "referenceNote": "Real-world reference; 50% lap estimate may differ from the game. Confirm the in-game race length and layout.",
    "sources": [
      {
        "label": "NASCAR 2026 Cup track specifications",
        "url": "https://www.jayski.com/wp-content/uploads/sites/31/2026/2/6/2026-RACETRACK-SPECIFICATIONS-NCS_REVB.pdf"
      },
      {
        "label": "NASCAR: fuel strategy",
        "url": "https://www.nascar.com/news-media/2025/08/29/cup-series-playoffs-2025-fuel-saving-strategy/"
      },
      {
        "label": "NASCAR: temperature and grip",
        "url": "https://www.nascar.com/news-media/2018/08/20/temperature-factor-racing-heres/"
      },
      {
        "label": "NASCAR 26: dynamic track system",
        "url": "https://nascar26.com/nascar-and-iracing-studios-debut-official-gameplay-trailer-open-pre-orders-for-nascar-26/"
      }
    ],
    "length": "1.25 miles"
  },
  "Martinsville Speedway": {
    "name": "Martinsville Speedway",
    "lengthMiles": 0.526,
    "referenceFullLaps": 400,
    "pitSpeed": "30 mph",
    "surface": "asphalt with concrete corners",
    "kind": "short",
    "preferredLine": "Use a patient low-line entry, rotate without excessive steering, and maximize exit traction.",
    "savingGuidance": "Lift before braking and apply throttle progressively. Rear-wheel spin is a poor trade for a brief straightaway gain.",
    "watchFor": "Do not extend a fuel run past useful rear-tire life. Braking discipline and pit-road execution matter.",
    "referenceNote": "400-lap spring reference; the fall race uses 500 laps. Confirm the game event length.",
    "sources": [
      {
        "label": "NASCAR 2026 Cup track specifications",
        "url": "https://www.jayski.com/wp-content/uploads/sites/31/2026/2/6/2026-RACETRACK-SPECIFICATIONS-NCS_REVB.pdf"
      },
      {
        "label": "NASCAR: fuel strategy",
        "url": "https://www.nascar.com/news-media/2025/08/29/cup-series-playoffs-2025-fuel-saving-strategy/"
      },
      {
        "label": "NASCAR: temperature and grip",
        "url": "https://www.nascar.com/news-media/2018/08/20/temperature-factor-racing-heres/"
      },
      {
        "label": "NASCAR 26: dynamic track system",
        "url": "https://nascar26.com/nascar-and-iracing-studios-debut-official-gameplay-trailer-open-pre-orders-for-nascar-26/"
      }
    ],
    "length": "0.526 miles"
  }
};

for (const [key, record] of Object.entries(trackOverviewData)) {
  const name = normalizeTrackName(key).replace(/^Preseason - /i, "");
  if (!trackOverviewData[name]) trackOverviewData[name] = record;
  trackOverviewData[key] = trackOverviewData[name];
}
for (const [name, record] of Object.entries(trackOverviewData)) {
  if (!name.startsWith("Preseason - ")) trackOverviewData["Preseason - " + name] = record;
}

export function getTrackOverview(track) {
  const name = normalizeTrackName(typeof track === "string" ? track : track?.name).replace(/^Preseason - /i, "");
  const base = trackOverviewData[name] || {};
  const custom = typeof track === "object" && track?.overview && typeof track.overview === "object" ? track.overview : {};
  return { name, kind: "intermediate", surface: "", sources: [], preferredLine: "Compare available grooves over a 3× stint. Favor consistent entries and exits over a single fast lap.", savingGuidance: "Compare lift-and-coast with your pushing pace, accounting for both 3× fuel consumption and 3× useful tire life.", watchFor: "Confirm the game layout, pit limit and 50% lap count before racing.", referenceNote: "Use the admin-confirmed race settings for this track.", ...base, ...custom, length: custom.lengthMiles ? `${custom.lengthMiles} miles` : base.length || "" };
}
