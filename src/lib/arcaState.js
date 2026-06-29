import { supabase } from "./supabase";

export async function loadArcaSeasonData() {
  try {
    const { data: seasonData } = await supabase
      .from("arca_seasons")
      .select("*")
      .eq("active", true)
      .single();

    if (!seasonData) {
      return { seasons: [], races: [], drivers: [], raceResults: [] };
    }

    const { data: racesData } = await supabase
      .from("arca_races")
      .select("*")
      .eq("season_id", seasonData.id)
      .order("date", { ascending: true });

    const { data: driversData } = await supabase
      .from("arca_drivers")
      .select("*")
      .order("number", { ascending: true });

    const { data: resultsData } = await supabase
      .from("arca_race_results")
      .select("*");

    return {
      seasons: [seasonData],
      races: racesData || [],
      drivers: driversData || [],
      raceResults: resultsData || [],
    };
  } catch (error) {
    console.error("Failed to load ARCA season data:", error);
    return { seasons: [], races: [], drivers: [], raceResults: [] };
  }
}

export async function saveArcaDrivers(drivers) {
  try {
    for (const driver of drivers) {
      const { error } = await supabase
        .from("arca_drivers")
        .upsert({
          id: driver.id,
          number: String(driver.number),
          name: driver.name,
          team: driver.team || null,
          manufacturer: driver.manufacturer || null,
          driver_type: driver.driver_type || "standard",
          status: driver.status || "active",
          retired: driver.retired || false,
          points: driver.points || 0,
          wins: driver.wins || 0,
          top3: driver.top3 || 0,
          top5: driver.top5 || 0,
          dnfs: driver.dnfs || 0,
        });
      if (error) console.error(`Error saving driver ${driver.number}:`, error);
    }
    return true;
  } catch (error) {
    console.error("Failed to save ARCA drivers:", error);
    return false;
  }
}

export async function saveArcaRace(seasonId, race) {
  try {
    const { data, error } = await supabase
      .from("arca_races")
      .upsert({
        id: race.id,
        season_id: seasonId,
        name: race.name,
        track: race.track,
        date: race.date || null,
        stages: race.stages || 3,
        results: race.results || [],
      })
      .select()
      .single();

    if (error) console.error("Error saving ARCA race:", error);
    return data;
  } catch (error) {
    console.error("Failed to save ARCA race:", error);
    return null;
  }
}

export async function saveArcaRaceResults(raceId, results) {
  try {
    for (const result of results) {
      const { error } = await supabase
        .from("arca_race_results")
        .upsert({
          id: result.id,
          race_id: raceId,
          driver_number: String(result.driver_number),
          position: result.position || null,
          status: result.status || "finished",
          stage_1_points: result.stage_1_points || 0,
          stage_2_points: result.stage_2_points || 0,
          stage_3_points: result.stage_3_points || 0,
          fastest_lap: result.fastest_lap || false,
          penalties: result.penalties || 0,
          notes: result.notes || null,
        });
      if (error) console.error(`Error saving result for driver ${result.driver_number}:`, error);
    }
    return true;
  } catch (error) {
    console.error("Failed to save ARCA race results:", error);
    return false;
  }
}

export async function createArcaSeason(seasonName) {
  try {
    await supabase
      .from("arca_seasons")
      .update({ active: false })
      .eq("active", true);

    const { data, error } = await supabase
      .from("arca_seasons")
      .insert({
        name: seasonName,
        active: true,
        signature: `arca_${Date.now()}`,
      })
      .select()
      .single();

    if (error) console.error("Error creating ARCA season:", error);
    return data;
  } catch (error) {
    console.error("Failed to create ARCA season:", error);
    return null;
  }
}

export async function deleteArcaRace(raceId) {
  try {
    const { error } = await supabase
      .from("arca_races")
      .delete()
      .eq("id", raceId);

    if (error) console.error("Error deleting ARCA race:", error);
    return true;
  } catch (error) {
    console.error("Failed to delete ARCA race:", error);
    return false;
  }
}

export async function getArcaRaceResults(raceId) {
  try {
    const { data, error } = await supabase
      .from("arca_race_results")
      .select("*")
      .eq("race_id", raceId)
      .order("position", { ascending: true });

    if (error) console.error("Error loading ARCA race results:", error);
    return data || [];
  } catch (error) {
    console.error("Failed to get ARCA race results:", error);
    return [];
  }
}

export async function recalculateArcaStandings(seasonId) {
  try {
    const { data: results } = await supabase
      .from("arca_race_results")
      .select("driver_number, position, stage_1_points, stage_2_points, stage_3_points, fastest_lap, penalties");

    const driverPoints = {};
    results?.forEach((result) => {
      const driverNum = result.driver_number;
      if (!driverPoints[driverNum]) {
        driverPoints[driverNum] = { points: 0, wins: 0, top3: 0, top5: 0 };
      }

      const totalPoints =
        (result.stage_1_points || 0) +
        (result.stage_2_points || 0) +
        (result.stage_3_points || 0) -
        (result.penalties || 0);

      driverPoints[driverNum].points += totalPoints;
      if (result.position === 1) driverPoints[driverNum].wins++;
      if (result.position <= 3) driverPoints[driverNum].top3++;
      if (result.position <= 5) driverPoints[driverNum].top5++;
    });

    const { data: drivers } = await supabase
      .from("arca_drivers")
      .select("*");

    for (const driver of drivers || []) {
      const driverNum = String(driver.number);
      const stats = driverPoints[driverNum] || {};

      await supabase
        .from("arca_drivers")
        .update({
          points: stats.points || 0,
          wins: stats.wins || 0,
          top3: stats.top3 || 0,
          top5: stats.top5 || 0,
        })
        .eq("id", driver.id);
    }

    return true;
  } catch (error) {
    console.error("Failed to recalculate ARCA standings:", error);
    return false;
  }
}
