export const summarizeTrip = (events) => {
  const start = events.find(e => e.event_type === "trip_started");
  const completed = events.find(e => e.event_type === "trip_completed");
  const cancelled = events.find(e => e.event_type === "trip_cancelled");

  const tripId = start?.trip_id || events[0]?.trip_id;
  const vehicleId = start?.vehicle_id || events[0]?.vehicle_id;

  const startTime = new Date(start?.timestamp);
  const endTime = new Date((completed || cancelled || events.at(-1))?.timestamp);
  const durationMin = (endTime - startTime) / 60000;

  const distance = completed?.total_distance_km ?? Math.max(...events.map(e => e.distance_travelled_km || 0));
  const overspeedCount = events.filter(e => e.overspeed).length;
  const signalLostCount = events.filter(e => e.event_type === "signal_lost").length;
  const avgSpeed = (
    events
      .filter(e => e.movement?.speed_kmh)
      .reduce((a, b) => a + b.movement.speed_kmh, 0) / events.length
  ).toFixed(2);

  return {
    tripId,
    vehicleId,
    durationMin,
    distance,
    overspeedCount,
    signalLostCount,
    avgSpeed,
    status: completed ? "completed" : cancelled ? "cancelled" : "active"
  };
};
