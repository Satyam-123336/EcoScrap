"""
EcoScrap Drone — mission_planner.py
Converts a pickup address or lat/lon into a complete ordered waypoint mission.
Handles geocoding (address → GPS) as fallback when coordinates are missing.

Mission Profile:
  Base → [Takeoff] → [Fly to User GPS] → [Hover+Lower bag] → [Wait for load]
       → [Raise bag] → [Fly to Depot] → [Deposit items] → [RTL to Base]
"""

import time
import math
import logging
from typing import Optional
from geopy.geocoders import Nominatim

import config

logger = logging.getLogger("MissionPlanner")


class Waypoint:
    """Represents a single GPS waypoint with purpose label."""
    def __init__(self, lat: float, lon: float, alt_m: float, purpose: str):
        self.lat     = lat
        self.lon     = lon
        self.alt_m   = alt_m
        self.purpose = purpose  # "TAKEOFF", "PICKUP", "DEPOT", "RTL"

    def __repr__(self):
        return f"Waypoint({self.purpose}: {self.lat:.6f}, {self.lon:.6f}, {self.alt_m}m)"


class MissionPlanner:
    """
    Builds the 3-point e-waste collection mission.

    INPUT:  pickup lat/lon from EcoScrap DB + configured BASE and DEPOT coords
    OUTPUT: ordered list of Waypoints with altitudes and purpose labels
    """

    def __init__(self):
        self._geocoder = Nominatim(
            user_agent=config.GEOCODING_USER_AGENT,
            timeout=config.GEOCODING_TIMEOUT_S
        )

    # ── Public API ─────────────────────────────────────────────────────────────

    def build_mission(self,
                      pickup_lat:  Optional[float],
                      pickup_lon:  Optional[float],
                      pickup_addr: Optional[str] = None) -> Optional[list]:
        """
        Build the full mission waypoint list.

        Args:
            pickup_lat:  Latitude from pickupRequests.latitude (preferred)
            pickup_lon:  Longitude from pickupRequests.longitude (preferred)
            pickup_addr: Address string (fallback if lat/lon missing/null)

        Returns:
            List of Waypoint objects in execution order, or None on failure.
        """
        # ── Step 1: Resolve pickup GPS coordinates ─────────────────────────────
        lat, lon = self._resolve_pickup_coords(pickup_lat, pickup_lon, pickup_addr)
        if lat is None or lon is None:
            logger.error("Could not determine pickup GPS coordinates")
            return None

        logger.info(f"Pickup location: {lat:.6f}, {lon:.6f}")

        # ── Step 2: Validate distances ─────────────────────────────────────────
        dist_to_pickup = self._distance_m(config.BASE_LAT, config.BASE_LON, lat, lon)
        dist_to_depot  = self._distance_m(lat, lon, config.DEPOT_LAT, config.DEPOT_LON)
        total_dist     = dist_to_pickup + dist_to_depot + self._distance_m(
                             config.DEPOT_LAT, config.DEPOT_LON,
                             config.BASE_LAT, config.BASE_LON)

        logger.info(f"Mission distances: Base→Pickup={dist_to_pickup:.0f}m, "
                    f"Pickup→Depot={dist_to_depot:.0f}m, Total≈{total_dist:.0f}m")

        if dist_to_pickup > config.GEOFENCE_RADIUS_M:
            logger.error(
                f"Pickup location {dist_to_pickup:.0f}m exceeds geofence "
                f"({config.GEOFENCE_RADIUS_M}m). Mission aborted."
            )
            return None

        # ── Step 3: Build waypoint list ────────────────────────────────────────
        waypoints = [
            Waypoint(config.BASE_LAT,  config.BASE_LON,  config.TAKEOFF_ALTITUDE_M, "TAKEOFF"),
            Waypoint(lat,              lon,               config.CRUISE_ALTITUDE_M,  "PICKUP"),
            Waypoint(config.DEPOT_LAT, config.DEPOT_LON, config.CRUISE_ALTITUDE_M,  "DEPOT"),
            Waypoint(config.BASE_LAT,  config.BASE_LON,  config.TAKEOFF_ALTITUDE_M, "RTL"),
        ]

        logger.info("Mission plan built:")
        for i, wp in enumerate(waypoints):
            logger.info(f"  WP{i}: {wp}")

        return waypoints

    def estimate_mission_time_s(self,
                                pickup_lat: float,
                                pickup_lon: float) -> int:
        """
        Estimate total mission time in seconds.
        Useful for notifying users of expected drone arrival time.
        """
        d1 = self._distance_m(config.BASE_LAT, config.BASE_LON, pickup_lat, pickup_lon)
        d2 = self._distance_m(pickup_lat, pickup_lon, config.DEPOT_LAT, config.DEPOT_LON)
        d3 = self._distance_m(config.DEPOT_LAT, config.DEPOT_LON, config.BASE_LAT, config.BASE_LON)
        total_flight_distance = d1 + d2 + d3

        flight_time_s   = total_flight_distance / config.CRUISE_SPEED_MS
        takeoff_time_s  = 20    # ~20s to reach cruise altitude
        land_time_s     = 25    # ~25s for RTL+land
        collection_time_s = (
            config.WINCH_LOWER_DURATION_S +
            config.BAG_LOAD_WAIT_S +
            config.WINCH_RAISE_DURATION_S
        )
        depot_time_s = config.DEPOT_DROP_WAIT_S + config.WINCH_LOWER_DURATION_S + config.WINCH_RAISE_DURATION_S

        total = int(flight_time_s + takeoff_time_s + land_time_s + collection_time_s + depot_time_s)
        eta_to_pickup = int((d1 / config.CRUISE_SPEED_MS) + takeoff_time_s)

        logger.info(f"Estimated mission time: {total}s | ETA to pickup: {eta_to_pickup}s")
        return total

    def get_eta_to_pickup_s(self, pickup_lat: float, pickup_lon: float) -> int:
        """Seconds from launch until drone arrives at user location."""
        d = self._distance_m(config.BASE_LAT, config.BASE_LON, pickup_lat, pickup_lon)
        return int(d / config.CRUISE_SPEED_MS) + 20  # +20s for takeoff

    # ── Geocoding ──────────────────────────────────────────────────────────────

    def address_to_gps(self, address: str) -> Optional[tuple]:
        """
        Convert a text address to (lat, lon) using OpenStreetMap Nominatim.
        Free, no API key required. Respects Nominatim ToS (1 req/second).
        Returns (lat, lon) or None on failure.
        """
        if not address or not address.strip():
            return None

        try:
            logger.info(f"Geocoding address: '{address}'")
            time.sleep(1)  # Nominatim rate limit: 1 request/second
            location = self._geocoder.geocode(address)
            if location:
                logger.info(f"Geocoded → {location.latitude:.6f}, {location.longitude:.6f}")
                return (location.latitude, location.longitude)
            else:
                logger.warning(f"Could not geocode address: '{address}'")
                return None
        except Exception as e:
            logger.error(f"Geocoding error: {e}")
            return None

    # ── Internal Helpers ───────────────────────────────────────────────────────

    def _resolve_pickup_coords(self,
                               lat: Optional[float],
                               lon: Optional[float],
                               address: Optional[str]) -> tuple:
        """
        Priority:
        1. Use lat/lon from DB if both present and non-zero
        2. Geocode address string as fallback
        3. Return (None, None) if all methods fail
        """
        if lat is not None and lon is not None:
            try:
                flat = float(lat)
                flon = float(lon)
                if flat != 0.0 and flon != 0.0:
                    return (flat, flon)
            except (ValueError, TypeError):
                pass

        if address:
            result = self.address_to_gps(address)
            if result:
                return result

        return (None, None)

    @staticmethod
    def _distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Haversine distance in meters."""
        R = 6371000
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlam = math.radians(lon2 - lon1)
        a = (math.sin(dphi / 2) ** 2 +
             math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2)
        return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
