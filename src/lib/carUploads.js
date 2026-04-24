import { supabase } from "./supabase";
 
export function getNextRace(tracks) {
  if (!Array.isArray(tracks) || tracks.length === 0) return null;
 
  const today = new Date();
  today.setHours(0, 0, 0, 0);
 
  const racesWithDates = tracks
    .filter(t => t.date)
    .map(t => ({ ...t, dateObj: new Date(t.date) }))
    .sort((a, b) => a.dateObj - b.dateObj);
 
  if (racesWithDates.length === 0) return null;
 
  const dayOfWeek = today.getDay();
 
  if (dayOfWeek === 0) {
    const nextWeekStart = new Date(today);
    nextWeekStart.setDate(nextWeekStart.getDate() + 1);
    const nextRace = racesWithDates.find(r => r.dateObj >= nextWeekStart);
    return nextRace || null;
  } else if (dayOfWeek > 0) {
    const nextRace = racesWithDates.find(r => r.dateObj > today);
    return nextRace || null;
  }
 
  return null;
}
 
export async function uploadCarFile(driverId, driverName, raceId, file) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${driverId}-${raceId}-${Date.now()}.${fileExt}`;
    const filePath = `car-uploads/${driverId}/${fileName}`;
 
    const { data, error } = await supabase.storage
      .from("car-uploads")
      .upload(filePath, file, { cacheControl: "3600", upsert: false });
 
    if (error) throw error;
 
    const { data: urlData } = supabase.storage
      .from("car-uploads")
      .getPublicUrl(filePath);
 
    const publicUrl = urlData.publicUrl;
 
    const { data: dbData, error: dbError } = await supabase
      .from("car_uploads")
      .insert({
        driver_id: driverId,
        driver_name: driverName,
        race_id: raceId,
        file_name: file.name,
        file_path: filePath,
        file_url: publicUrl,
        image_url: publicUrl,   // satisfies NOT NULL constraint
        file_type: file.type,
        file_size: file.size,
        uploaded_at: new Date().toISOString(),
      });
 
    if (dbError) throw dbError;
 
    return { success: true, url: publicUrl, file: data };
  } catch (error) {
    console.error("Upload error:", error);
    return { success: false, error: error.message };
  }
}
 
export async function getCarUploads(driverId = null, raceId = null) {
  try {
    let query = supabase.from("car_uploads").select("*");
 
    if (driverId) query = query.eq("driver_id", driverId);
    if (raceId) query = query.eq("race_id", raceId);
 
    const { data, error } = await query.order("uploaded_at", {
      ascending: false,
    });
 
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Fetch error:", error);
    return [];
  }
}
 
export async function deleteCarUpload(uploadId, filePath) {
  try {
    const { error: storageError } = await supabase.storage
      .from("car-uploads")
      .remove([filePath]);
 
    if (storageError) throw storageError;
 
    const { error: dbError } = await supabase
      .from("car_uploads")
      .delete()
      .eq("id", uploadId);
 
    if (dbError) throw dbError;
 
    return { success: true };
  } catch (error) {
    console.error("Delete error:", error);
    return { success: false, error: error.message };
  }
}
 
export async function getAllCarUploads(filters = {}) {
  try {
    let query = supabase.from("car_uploads").select("*");
 
    if (filters.driverId) query = query.eq("driver_id", filters.driverId);
    if (filters.raceId) query = query.eq("race_id", filters.raceId);
 
    const { data, error } = await query.order("uploaded_at", {
      ascending: false,
    });
 
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Fetch error:", error);
    return [];
  }
}
