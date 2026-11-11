import React, { forwardRef, useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { GOOGLE_MAPS_API_KEY } from '../../config/appConfig.js';
import { colors } from '../../theme/index.js';

let NativeMapView = null;
let NativeMarker = null;
let NativePolyline = null;
let NativeUrlTile = null;
let NATIVE_PROVIDER_DEFAULT = null;
let NATIVE_PROVIDER_GOOGLE = null;

if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  NativeMapView = Maps.default || Maps.MapView;
  NativeMarker = Maps.Marker;
  NativePolyline = Maps.Polyline;
  NativeUrlTile = Maps.UrlTile;
  NATIVE_PROVIDER_DEFAULT = Maps.PROVIDER_DEFAULT;
  NATIVE_PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
}

export const PROVIDER_DEFAULT =
  Platform.OS === 'android' && GOOGLE_MAPS_API_KEY
    ? NATIVE_PROVIDER_GOOGLE
    : NATIVE_PROVIDER_DEFAULT;

/**
 * Builds an interactive Google Maps JavaScript API HTML document when GOOGLE_MAPS_API_KEY is set,
 * or falls back to Leaflet + OpenStreetMap when no API key is configured yet.
 */
function buildWebMapHtml({ centerLat, centerLng, markers, polylines, googleApiKey }) {
  const markersJson = JSON.stringify(markers);
  const polylinesJson = JSON.stringify(polylines);

  if (googleApiKey) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #e8efe9; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    function initMap() {
      const center = { lat: ${centerLat}, lng: ${centerLng} };
      const map = new google.maps.Map(document.getElementById('map'), {
        center,
        zoom: 14,
        disableDefaultUI: true,
        zoomControl: true,
      });

      const bounds = new google.maps.LatLngBounds();
      let pointCount = 0;

      const markers = ${markersJson};
      markers.forEach((m) => {
        if (typeof m.lat !== 'number' || typeof m.lng !== 'number') return;
        const pos = { lat: m.lat, lng: m.lng };
        bounds.extend(pos);
        pointCount++;
        new google.maps.Marker({
          position: pos,
          map,
          title: m.title || '',
          label: m.isDriver ? '🚗' : undefined,
        });
      });

      const polylines = ${polylinesJson};
      polylines.forEach((p) => {
        if (!Array.isArray(p.coords) || p.coords.length < 2) return;
        const path = p.coords.map((c) => {
          const pt = { lat: c.latitude, lng: c.longitude };
          bounds.extend(pt);
          pointCount++;
          return pt;
        });
        new google.maps.Polyline({
          path,
          geodesic: true,
          strokeColor: p.strokeColor || '#1B7F3B',
          strokeOpacity: 1.0,
          strokeWeight: p.strokeWidth || 4,
          map,
        });
      });

      if (pointCount >= 2) {
        map.fitBounds(bounds, 70);
      }
    }
  </script>
  <script async defer src="https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&libraries=places,geometry&callback=initMap"></script>
</body>
</html>`;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #e8efe9; }
    .driver-pin {
      width: 34px; height: 34px; border-radius: 17px;
      background: #1B7F3B; border: 3px solid #fff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 16px;
    }
    .point-pin {
      width: 22px; height: 22px; border-radius: 11px;
      border: 3px solid #fff;
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map', { zoomControl: false }).setView([${centerLat}, ${centerLng}], 14);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    const boundsPoints = [];
    const markers = ${markersJson};
    markers.forEach((m) => {
      if (typeof m.lat !== 'number' || typeof m.lng !== 'number') return;
      boundsPoints.push([m.lat, m.lng]);
      let icon;
      if (m.isDriver) {
        icon = L.divIcon({
          className: '',
          html: '<div class="driver-pin">🚗</div>',
          iconSize: [34, 34],
          iconAnchor: [17, 17]
        });
      } else {
        const bg = m.pinColor || '#1B7F3B';
        icon = L.divIcon({
          className: '',
          html: '<div class="point-pin" style="background:' + bg + '"></div>',
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });
      }
      const marker = L.marker([m.lat, m.lng], { icon }).addTo(map);
      if (m.title) {
        marker.bindPopup('<b>' + m.title + '</b>' + (m.description ? '<br/>' + m.description : ''));
      }
    });

    const polylines = ${polylinesJson};
    polylines.forEach((p) => {
      if (!Array.isArray(p.coords) || p.coords.length < 2) return;
      const latlngs = p.coords.map((c) => [c.latitude, c.longitude]);
      latlngs.forEach((pt) => boundsPoints.push(pt));
      L.polyline(latlngs, {
        color: p.strokeColor || '#1B7F3B',
        weight: p.strokeWidth || 4
      }).addTo(map);
    });

    if (boundsPoints.length >= 2) {
      map.fitBounds(boundsPoints, { padding: [70, 70], maxZoom: 16 });
    } else if (boundsPoints.length === 1) {
      map.setView(boundsPoints[0], 15);
    }
  </script>
</body>
</html>`;
}

function WebFallbackMap({ style, initialRegion, region, children }) {
  const { centerLat, centerLng, markers, polylines } = useMemo(() => {
    const activeRegion = region || initialRegion || { latitude: 6.2442, longitude: -75.5812 };
    const extractedMarkers = [];
    const extractedPolylines = [];

    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return;
      const p = child.props || {};
      if (p.coordinate && typeof p.coordinate.latitude === 'number') {
        extractedMarkers.push({
          lat: p.coordinate.latitude,
          lng: p.coordinate.longitude,
          title: p.title || '',
          description: p.description || '',
          pinColor: p.pinColor || colors.primary,
          isDriver: Boolean(p.children),
        });
      } else if (Array.isArray(p.coordinates) && p.coordinates.length >= 2) {
        extractedPolylines.push({
          coords: p.coordinates,
          strokeColor: p.strokeColor || colors.primary,
          strokeWidth: p.strokeWidth || 4,
        });
      }
    });

    return {
      centerLat: activeRegion.latitude || 6.2442,
      centerLng: activeRegion.longitude || -75.5812,
      markers: extractedMarkers,
      polylines: extractedPolylines,
    };
  }, [initialRegion, region, children]);

  const html = useMemo(
    () =>
      buildWebMapHtml({
        centerLat,
        centerLng,
        markers,
        polylines,
        googleApiKey: GOOGLE_MAPS_API_KEY,
      }),
    [centerLat, centerLng, markers, polylines]
  );

  return (
    <View style={[styles.mapFill, style]}>
      {React.createElement('iframe', {
        srcDoc: html,
        title: 'Medellin Map',
        style: {
          width: '100%',
          height: '100%',
          border: 'none',
        },
      })}
    </View>
  );
}

export const SafeMapView = forwardRef(function SafeMapView({ style, children, ...props }, ref) {
  if (Platform.OS !== 'web' && NativeMapView) {
    return (
      <NativeMapView ref={ref} style={[styles.mapFill, style]} {...props}>
        {!GOOGLE_MAPS_API_KEY && NativeUrlTile ? (
          <NativeUrlTile
            urlTemplate="https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
            maximumZ={19}
            flipY={false}
          />
        ) : null}
        {children}
      </NativeMapView>
    );
  }

  return (
    <WebFallbackMap style={style} {...props}>
      {children}
    </WebFallbackMap>
  );
});

export const SafeMarker =
  Platform.OS !== 'web' && NativeMarker
    ? NativeMarker
    : function WebMarker() {
      return null;
    };

export const SafePolyline =
  Platform.OS !== 'web' && NativePolyline
    ? NativePolyline
    : function WebPolyline() {
      return null;
    };

const styles = StyleSheet.create({
  mapFill: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
});
