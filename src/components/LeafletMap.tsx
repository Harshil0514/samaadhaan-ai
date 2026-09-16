import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Problem, ProblemCluster } from '../types';

interface LeafletMapProps {
  problems?: Problem[];
  clusters?: ProblemCluster[];
  selectedProblemId?: string | null;
  onSelectProblem?: (problem: Problem) => void;
  isPicker?: boolean;
  pickedLocation?: { lat: number; lng: number } | null;
  onPickLocation?: (loc: { lat: number; lng: number }) => void;
  center?: [number, number];
  zoom?: number;
  height?: string;
  className?: string;
  showClusters?: boolean;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  problems = [],
  clusters = [],
  selectedProblemId,
  onSelectProblem,
  isPicker = false,
  pickedLocation,
  onPickLocation,
  center = [22.5937, 78.9629], // Center of India
  zoom = 5,
  height = '450px',
  className = '',
  showClusters = true
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const clustersGroupRef = useRef<L.LayerGroup | null>(null);
  const pickerMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [center[0], center[1]] as L.LatLngTuple,
        zoom: zoom,
        zoomControl: true,
        attributionControl: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // Attribution bottom right
      L.control.attribution({ position: 'bottomright' })
        .addAttribution('&copy; <a href="https://openstreetmap.org">OSM</a> | CivicSetu')
        .addTo(map);

      markersGroupRef.current = L.layerGroup().addTo(map);
      clustersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      // Handle map click for picker
      map.on('click', (e: L.LeafletMouseEvent) => {
        if (isPicker && onPickLocation) {
          onPickLocation({ lat: +e.latlng.lat.toFixed(5), lng: +e.latlng.lng.toFixed(5) });
        }
      });
    }

    return () => {
      // Clean up on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Center / Zoom when props change
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView(center, zoom);
    }
  }, [center[0], center[1], zoom]);

  // Update Markers & Clusters
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current || !clustersGroupRef.current) return;

    markersGroupRef.current.clearLayers();
    clustersGroupRef.current.clearLayers();

    // 1. Render Cluster Circles if enabled
    if (showClusters && clusters.length > 0) {
      clusters.forEach(cluster => {
        const radiusMeters = (cluster.radius_km || 2.0) * 1000;
        const cScore = cluster.priority_score ?? 70;
        const color = cScore >= 80 ? '#EF4444' : cScore >= 60 ? '#F97316' : cScore >= 40 ? '#EAB308' : '#16A34A';

        const circle = L.circle([cluster.center_latitude, cluster.center_longitude], {
          radius: radiusMeters,
          color: color,
          fillColor: color,
          fillOpacity: 0.12,
          weight: 2,
          dashArray: '5, 8'
        });

        circle.bindTooltip(`
          <div class="px-2 py-1 text-xs font-semibold">
            <span class="text-indigo-600 font-bold">${cluster.name}</span><br/>
            <span class="text-slate-500">${cluster.total_reports} reports in ${cluster.radius_km}km radius</span>
          </div>
        `, { sticky: true });

        clustersGroupRef.current?.addLayer(circle);
      });
    }

    // 2. Render Problem Markers
    problems.forEach(problem => {
      const isSelected = problem.id === selectedProblemId;
      const score = problem.priority_score ?? 50;
      const isCritical = score >= 80 || problem.urgency === 'critical';
      const isHigh = !isCritical && (score >= 60 || problem.urgency === 'high');
      const isMedium = !isCritical && !isHigh && (score >= 40 || problem.urgency === 'medium');

      const colorBg = isCritical ? 'bg-red-500' : isHigh ? 'bg-orange-500' : isMedium ? 'bg-yellow-500' : 'bg-green-600';
      const colorBorder = isCritical ? 'border-red-600' : isHigh ? 'border-orange-600' : isMedium ? 'border-yellow-600' : 'border-green-700';
      const pulseHtml = isCritical ? '<div class="absolute -inset-1.5 rounded-full bg-red-400 opacity-75 animate-ping"></div>' : '';

      const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer transition-transform hover:scale-125 ${isSelected ? 'scale-125 z-30' : ''}">
            ${pulseHtml}
            <div class="w-8 h-8 rounded-full ${colorBg} text-white flex items-center justify-center font-bold text-xs shadow-lg border-2 ${colorBorder} ring-2 ring-white">
              ${problem.priority_score}
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
      });

      const marker = L.marker([problem.latitude, problem.longitude], { icon: customIcon });

      // Popup card
      const popupHtml = document.createElement('div');
      popupHtml.className = 'p-3 max-w-[260px] text-left';
      popupHtml.innerHTML = `
        <div class="flex items-center justify-between gap-2 mb-1.5">
          <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            isCritical ? 'bg-red-100 text-red-700' : isHigh ? 'bg-orange-100 text-orange-700' : isMedium ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-700'
          }">${problem.category_name || 'Community Issue'}</span>
          <span class="text-xs font-extrabold ${isCritical ? 'text-red-600' : isHigh ? 'text-orange-600' : isMedium ? 'text-yellow-700' : 'text-green-700'}">Priority ${problem.priority_score}/100</span>
        </div>
        <h4 class="font-bold text-slate-900 text-sm leading-snug line-clamp-2 mb-1">${problem.title}</h4>
        <p class="text-xs text-slate-600 line-clamp-2 mb-2">${problem.description}</p>
        <div class="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
          <span>📍 ${problem.address?.split(',')[0] || 'Local Area'}</span>
          <span class="font-semibold text-emerald-600">👍 ${problem.supports_count} voices</span>
        </div>
      `;

      // Action button in popup
      const btn = document.createElement('button');
      btn.className = 'w-full mt-2 py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition-colors text-center block';
      btn.innerText = 'View Challenge Details';
      btn.onclick = () => {
        if (onSelectProblem) onSelectProblem(problem);
      };
      popupHtml.appendChild(btn);

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        if (onSelectProblem) onSelectProblem(problem);
      });

      markersGroupRef.current?.addLayer(marker);
    });
  }, [problems, clusters, selectedProblemId, showClusters]);

  // Handle Location Picker marker
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (isPicker && pickedLocation) {
      if (pickerMarkerRef.current) {
        pickerMarkerRef.current.setLatLng([pickedLocation.lat, pickedLocation.lng]);
      } else {
        const pickerIcon = L.divIcon({
          className: 'picker-marker',
          html: `
            <div class="relative flex items-center justify-center">
              <div class="w-6 h-6 rounded-full bg-emerald-500 border-4 border-white shadow-xl animate-bounce"></div>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 24]
        });

        pickerMarkerRef.current = L.marker([pickedLocation.lat, pickedLocation.lng], {
          icon: pickerIcon,
          draggable: true
        }).addTo(mapInstanceRef.current);

        pickerMarkerRef.current.on('dragend', (e) => {
          const pos = e.target.getLatLng();
          if (onPickLocation) {
            onPickLocation({ lat: +pos.lat.toFixed(5), lng: +pos.lng.toFixed(5) });
          }
        });
      }
    } else if (!isPicker && pickerMarkerRef.current) {
      pickerMarkerRef.current.remove();
      pickerMarkerRef.current = null;
    }
  }, [isPicker, pickedLocation?.lat, pickedLocation?.lng]);

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden shadow-inner border border-slate-200 ${className}`} style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full" />
      {isPicker && (
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 shadow-md pointer-events-none z-[1000] flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Click on map to drop problem pin or drag marker
        </div>
      )}
    </div>
  );
};
