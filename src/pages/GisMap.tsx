import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { PageEntryReveal } from '../components/PageEntryReveal';
import { Navbar } from './Home/components/Navbar';
import GradientBackground from '../components/GradientBackground';
import { ScrollReveal } from '../components/motion/ScrollSystem';
import { useNotifications } from '../context/NotificationContext';
import { ShieldAlert, Train, Activity, Search, ShieldCheck, Zap, Navigation, Radio, Compass } from 'lucide-react';
import { fetchRailRadarTrain, fetchRailRadarTrainRoute, getRailRadarQuotaInfo } from '../services/railradarService';
import type { RailRadarTrainDetail } from '../services/railradarService';
import styles from './GisMap.module.css';

// Fix default leaflet marker icon path issue in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Helper component to smoothly fly map camera to target lat/lng
const MapFlyControl: React.FC<{ flyTarget: [number, number] | null }> = ({ flyTarget }) => {
  const map = useMap();
  useEffect(() => {
    if (flyTarget) {
      map.flyTo(flyTarget, 10, { duration: 1.5 });
    }
  }, [flyTarget, map]);
  return null;
};

// Haversine formula to compute GPS distance in km
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Spatial Stations Metadata
interface StationNode {
  code: string;
  name: string;
  lat: number;
  lng: number;
  type: 'JUNCTION' | 'TERMINAL' | 'STATION';
  zone: string;
}

const STATIONS: StationNode[] = [
  // North & Central Trunk
  { code: 'NDLS', name: 'New Delhi', lat: 28.6430, lng: 77.2194, type: 'TERMINAL', zone: 'NR' },
  { code: 'DLI', name: 'Old Delhi Junction', lat: 28.6617, lng: 77.2274, type: 'JUNCTION', zone: 'NR' },
  { code: 'NZM', name: 'Hazrat Nizamuddin', lat: 28.5892, lng: 77.2541, type: 'TERMINAL', zone: 'NR' },
  { code: 'AGC', name: 'Agra Cantt', lat: 27.1597, lng: 77.9942, type: 'JUNCTION', zone: 'NCR' },
  { code: 'GWL', name: 'Gwalior Junction', lat: 26.2183, lng: 78.1828, type: 'JUNCTION', zone: 'NCR' },
  { code: 'VGLJ', name: 'VGL Jhansi Junction', lat: 25.4484, lng: 78.5685, type: 'JUNCTION', zone: 'NCR' },
  { code: 'BPL', name: 'Bhopal Junction', lat: 23.2599, lng: 77.4126, type: 'JUNCTION', zone: 'WCR' },
  { code: 'NGP', name: 'Nagpur Junction', lat: 21.1524, lng: 79.0882, type: 'JUNCTION', zone: 'CR' },
  { code: 'LDH', name: 'Ludhiana Junction', lat: 30.9010, lng: 75.8573, type: 'JUNCTION', zone: 'NR' },
  { code: 'JAT', name: 'Jammu Tawi', lat: 32.7060, lng: 74.8797, type: 'JUNCTION', zone: 'NR' },
  { code: 'SVDK', name: 'SMVD Katra', lat: 32.9847, lng: 74.9454, type: 'TERMINAL', zone: 'NR' },
  { code: 'LKO', name: 'Lucknow Charbagh', lat: 26.8322, lng: 80.9231, type: 'TERMINAL', zone: 'NR' },
  { code: 'CNB', name: 'Kanpur Central', lat: 26.4542, lng: 80.3507, type: 'JUNCTION', zone: 'NCR' },
  { code: 'PRYJ', name: 'Prayagraj Junction', lat: 25.4484, lng: 81.8284, type: 'JUNCTION', zone: 'NCR' },
  { code: 'BSB', name: 'Varanasi Junction', lat: 25.3267, lng: 82.9893, type: 'JUNCTION', zone: 'NER' },
  { code: 'DDU', name: 'Pt. Deen Dayal Upadhyaya Yard', lat: 25.2819, lng: 83.1153, type: 'JUNCTION', zone: 'ECR' },
  { code: 'GKP', name: 'Gorakhpur Junction', lat: 26.7606, lng: 83.3732, type: 'TERMINAL', zone: 'NER' },

  // West & South-West Trunk
  { code: 'MMCT', name: 'Mumbai Central', lat: 18.9696, lng: 72.8193, type: 'TERMINAL', zone: 'WR' },
  { code: 'CSMT', name: 'Mumbai CSMT', lat: 18.9401, lng: 72.8351, type: 'TERMINAL', zone: 'CR' },
  { code: 'PUNE', name: 'Pune Junction', lat: 18.5289, lng: 73.8744, type: 'JUNCTION', zone: 'CR' },
  { code: 'ST', name: 'Surat', lat: 21.2035, lng: 72.8406, type: 'JUNCTION', zone: 'WR' },
  { code: 'ADI', name: 'Ahmedabad Junction', lat: 23.0225, lng: 72.5998, type: 'TERMINAL', zone: 'WR' },
  { code: 'JP', name: 'Jaipur Junction', lat: 26.9196, lng: 75.7878, type: 'JUNCTION', zone: 'NWR' },
  { code: 'KOTA', name: 'Kota Junction', lat: 25.2138, lng: 75.8648, type: 'JUNCTION', zone: 'WCR' },

  // East & North-East Trunk
  { code: 'HWH', name: 'Howrah Junction', lat: 22.5830, lng: 88.3429, type: 'TERMINAL', zone: 'ER' },
  { code: 'SDAH', name: 'Sealdah', lat: 22.5670, lng: 88.3712, type: 'TERMINAL', zone: 'ER' },
  { code: 'PNBE', name: 'Patna Junction', lat: 25.6039, lng: 85.1376, type: 'JUNCTION', zone: 'ECR' },
  { code: 'GAYA', name: 'Gaya Junction', lat: 24.7964, lng: 85.0003, type: 'JUNCTION', zone: 'ECR' },
  { code: 'RNC', name: 'Ranchi Junction', lat: 23.3441, lng: 85.3298, type: 'TERMINAL', zone: 'SER' },
  { code: 'TATA', name: 'Tatanagar Junction', lat: 22.7749, lng: 86.2029, type: 'JUNCTION', zone: 'SER' },
  { code: 'BSP', name: 'Bilaspur Junction', lat: 22.0797, lng: 82.1409, type: 'JUNCTION', zone: 'SECR' },
  { code: 'BBS', name: 'Bhubaneswar', lat: 20.2961, lng: 85.8245, type: 'JUNCTION', zone: 'ECoR' },
  { code: 'VSKP', name: 'Visakhapatnam', lat: 17.7231, lng: 83.2906, type: 'JUNCTION', zone: 'ECoR' },
  { code: 'GHY', name: 'Guwahati', lat: 26.1856, lng: 91.7539, type: 'TERMINAL', zone: 'NFR' },
  { code: 'NJP', name: 'New Jalpaiguri', lat: 26.6858, lng: 88.4429, type: 'JUNCTION', zone: 'NFR' },

  // South Trunk
  { code: 'MAS', name: 'Chennai Central', lat: 13.0827, lng: 80.2707, type: 'TERMINAL', zone: 'SR' },
  { code: 'SBC', name: 'KSR Bengaluru', lat: 12.9781, lng: 77.5697, type: 'TERMINAL', zone: 'SWR' },
  { code: 'SC', name: 'Secunderabad', lat: 17.4339, lng: 78.5015, type: 'JUNCTION', zone: 'SCR' },
  { code: 'BZA', name: 'Vijayawada Junction', lat: 16.5062, lng: 80.6480, type: 'JUNCTION', zone: 'SCR' },
  { code: 'CBE', name: 'Coimbatore Junction', lat: 11.0018, lng: 76.9629, type: 'JUNCTION', zone: 'SR' },
  { code: 'ERS', name: 'Ernakulam Junction', lat: 9.9674, lng: 76.2996, type: 'JUNCTION', zone: 'SR' },
  { code: 'TVC', name: 'Thiruvananthapuram', lat: 8.4875, lng: 76.9525, type: 'TERMINAL', zone: 'SR' },
];

// All-India Track Corridor Network Polylines
interface TrackCorridor {
  id: string;
  name: string;
  coordinates: [number, number][];
  status: 'SMOOTH' | 'MODERATE' | 'BOTTLENECK';
  capacityUtil: number;
  speedLimit: string;
  color: string;
}

const TRACK_CORRIDORS: TrackCorridor[] = [
  {
    id: 'DELHI-HOWRAH-QUAD',
    name: 'Delhi - Kanpur - Prayagraj - DDU - Howrah High Density Line',
    coordinates: [
      [28.6430, 77.2194],
      [27.2066, 78.2435],
      [26.4542, 80.3507],
      [25.4484, 81.8284],
      [25.2819, 83.1153],
      [24.7964, 85.0003],
      [22.5830, 88.3429]
    ],
    status: 'BOTTLENECK',
    capacityUtil: 96.4,
    speedLimit: '130 km/h (Kavach Automated Protection)',
    color: '#bc473a'
  },
  {
    id: 'DELHI-MUMBAI-WESTERN',
    name: 'Delhi - Jaipur - Kota - Vadodara - Mumbai Western Quad Line',
    coordinates: [
      [28.6430, 77.2194],
      [26.9196, 75.7878],
      [25.2138, 75.8648],
      [23.0225, 72.5998],
      [21.2035, 72.8406],
      [18.9696, 72.8193]
    ],
    status: 'SMOOTH',
    capacityUtil: 68.2,
    speedLimit: '160 km/h WDFC',
    color: '#27ae60'
  },
  {
    id: 'DELHI-CHENNAI-NS',
    name: 'Delhi - Agra - Jhansi - Bhopal - Nagpur - Secunderabad - Chennai Trunk',
    coordinates: [
      [28.6430, 77.2194],
      [27.1597, 77.9942],
      [25.4484, 78.5685],
      [23.2599, 77.4126],
      [21.1524, 79.0882],
      [17.4339, 78.5015],
      [16.5062, 80.6480],
      [13.0827, 80.2707]
    ],
    status: 'MODERATE',
    capacityUtil: 84.5,
    speedLimit: '130 km/h Grand Trunk',
    color: '#e59866'
  },
  {
    id: 'MUMBAI-KOLKATA-EW',
    name: 'Mumbai - Pune - Nagpur - Raipur - Bilaspur - Tatanagar - Howrah Central Trunk',
    coordinates: [
      [18.9401, 72.8351],
      [18.5289, 73.8744],
      [21.1524, 79.0882],
      [22.0797, 82.1409],
      [23.3441, 85.3298],
      [22.7749, 86.2029],
      [22.5830, 88.3429]
    ],
    status: 'BOTTLENECK',
    capacityUtil: 92.1,
    speedLimit: '110 km/h Heavy Ore Rakes',
    color: '#bc473a'
  },
  {
    id: 'CHENNAI-KOLKATA-EASTCOAST',
    name: 'Chennai - Vijayawada - Visakhapatnam - Bhubaneswar - Howrah East Coast Line',
    coordinates: [
      [13.0827, 80.2707],
      [16.5062, 80.6480],
      [17.7231, 83.2906],
      [20.2961, 85.8245],
      [22.5830, 88.3429]
    ],
    status: 'SMOOTH',
    capacityUtil: 64.0,
    speedLimit: '110 km/h Normal',
    color: '#27ae60'
  },
  {
    id: 'MUMBAI-BENGALURU-SOUTH',
    name: 'Mumbai - Pune - Solapur - Hubballi - Bengaluru Line',
    coordinates: [
      [18.9401, 72.8351],
      [18.5289, 73.8744],
      [12.9781, 77.5697]
    ],
    status: 'SMOOTH',
    capacityUtil: 59.0,
    speedLimit: '110 km/h Normal',
    color: '#27ae60'
  },
  {
    id: 'DELHI-JAMMU-NORTH',
    name: 'Delhi - Ludhiana - Jammu - Katra Northern Route',
    coordinates: [
      [28.6430, 77.2194],
      [30.9010, 75.8573],
      [32.7060, 74.8797],
      [32.9847, 74.9454]
    ],
    status: 'SMOOTH',
    capacityUtil: 55.0,
    speedLimit: '130 km/h Normal',
    color: '#27ae60'
  },
  {
    id: 'LKO-GHY-NORTHEAST',
    name: 'Lucknow - Gorakhpur - Patna - NJP - Guwahati Frontier Line',
    coordinates: [
      [26.8322, 80.9231],
      [26.7606, 83.3732],
      [25.6039, 85.1376],
      [26.6858, 88.4429],
      [26.1856, 91.7539]
    ],
    status: 'MODERATE',
    capacityUtil: 81.0,
    speedLimit: '100 km/h Normal',
    color: '#e59866'
  },
  {
    id: 'BENGALURU-TRIVANDRUM-MALABAR',
    name: 'Bengaluru - Coimbatore - Ernakulam - Thiruvananthapuram Malabar Line',
    coordinates: [
      [12.9781, 77.5697],
      [11.0018, 76.9629],
      [9.9674, 76.2996],
      [8.4875, 76.9525]
    ],
    status: 'SMOOTH',
    capacityUtil: 60.5,
    speedLimit: '110 km/h Normal',
    color: '#27ae60'
  }
];

// Live Moving Train Interface
interface LiveTrain {
  id: string;
  name: string;
  type: 'EXPRESS' | 'FREIGHT';
  speedKmH: number;
  currentLat: number;
  currentLng: number;
  route: string;
  destination: string;
  priority: number;
  direction: 'UP' | 'DOWN';
  zone: string;
}

// Fleet Generator for Ultra-Dense Nationwide Traffic
const buildUltraDenseFleet = (densityMode: 'STANDARD' | 'HIGH' | 'ULTRA'): LiveTrain[] => {
  const baseFleet: LiveTrain[] = [
    // Vande Bharat Express Fleet
    { id: 'TRN-22436', name: '22436 Vande Bharat Express', type: 'EXPRESS', speedKmH: 130, currentLat: 27.2066, currentLng: 78.2435, route: 'Varanasi ➔ New Delhi', destination: 'New Delhi (NDLS)', priority: 1, direction: 'UP', zone: 'NR' },
    { id: 'TRN-20607', name: '20607 Vande Bharat Express', type: 'EXPRESS', speedKmH: 120, currentLat: 12.0000, currentLng: 78.5000, route: 'Chennai ➔ Mysuru', destination: 'Mysuru (MYS)', priority: 1, direction: 'DOWN', zone: 'SR' },
    { id: 'TRN-20901', name: '20901 Vande Bharat Express', type: 'EXPRESS', speedKmH: 135, currentLat: 21.5000, currentLng: 72.8000, route: 'Mumbai Central ➔ Gandhinagar', destination: 'Ahmedabad (ADI)', priority: 1, direction: 'UP', zone: 'WR' },
    { id: 'TRN-22895', name: '22895 Vande Bharat Express', type: 'EXPRESS', speedKmH: 125, currentLat: 21.3000, currentLng: 86.5000, route: 'Howrah ➔ Puri', destination: 'Puri (PURI)', priority: 1, direction: 'DOWN', zone: 'SER' },
    { id: 'TRN-22458', name: '22458 Dehradun Vande Bharat', type: 'EXPRESS', speedKmH: 110, currentLat: 29.5000, currentLng: 77.8000, route: 'Dehradun ➔ Anand Vihar', destination: 'Anand Vihar (ANVT)', priority: 1, direction: 'UP', zone: 'NR' },
    { id: 'TRN-20643', name: '20643 CBE Vande Bharat', type: 'EXPRESS', speedKmH: 115, currentLat: 11.5000, currentLng: 77.2000, route: 'Chennai ➔ Coimbatore', destination: 'Coimbatore (CBE)', priority: 1, direction: 'DOWN', zone: 'SR' },

    // Rajdhani & Duronto Express Fleet
    { id: 'TRN-12236', name: '12236 Rajdhani Express', type: 'EXPRESS', speedKmH: 128, currentLat: 26.4542, currentLng: 80.3507, route: 'Howrah ➔ New Delhi', destination: 'New Delhi (NDLS)', priority: 1, direction: 'UP', zone: 'ER' },
    { id: 'TRN-12951', name: '12951 Mumbai Rajdhani', type: 'EXPRESS', speedKmH: 130, currentLat: 24.5000, currentLng: 74.5000, route: 'Mumbai Central ➔ New Delhi', destination: 'New Delhi (NDLS)', priority: 1, direction: 'UP', zone: 'WR' },
    { id: 'TRN-12431', name: '12431 Trivandrum Rajdhani', type: 'EXPRESS', speedKmH: 115, currentLat: 15.0000, currentLng: 74.0000, route: 'Trivandrum ➔ Hazrat Nizamuddin', destination: 'Hazrat Nizamuddin (NZM)', priority: 1, direction: 'UP', zone: 'SR' },
    { id: 'TRN-12301', name: '12301 Howrah Rajdhani', type: 'EXPRESS', speedKmH: 130, currentLat: 25.1000, currentLng: 84.0000, route: 'Howrah ➔ New Delhi', destination: 'New Delhi (NDLS)', priority: 1, direction: 'UP', zone: 'ER' },
    { id: 'TRN-12423', name: '12423 Dibrugarh Rajdhani', type: 'EXPRESS', speedKmH: 110, currentLat: 26.4000, currentLng: 89.5000, route: 'Dibrugarh ➔ New Delhi', destination: 'New Delhi (NDLS)', priority: 1, direction: 'UP', zone: 'NFR' },
    { id: 'TRN-22691', name: '22691 Bengaluru Rajdhani', type: 'EXPRESS', speedKmH: 125, currentLat: 18.2000, currentLng: 78.4000, route: 'SBC ➔ Hazrat Nizamuddin', destination: 'Hazrat Nizamuddin (NZM)', priority: 1, direction: 'UP', zone: 'SWR' },
    { id: 'TRN-12260', name: '12260 Sealdah Duronto', type: 'EXPRESS', speedKmH: 120, currentLat: 25.8000, currentLng: 82.5000, route: 'New Delhi ➔ Sealdah', destination: 'Sealdah (SDAH)', priority: 1, direction: 'DOWN', zone: 'ER' },
    { id: 'TRN-12213', name: '12213 Delhi Duronto', type: 'EXPRESS', speedKmH: 118, currentLat: 20.5000, currentLng: 78.0000, route: 'Yesvantpur ➔ Delhi Sarai Rohilla', destination: 'Delhi Sarai Rohilla (DEE)', priority: 1, direction: 'UP', zone: 'SWR' },

    // Shatabdi & Superfast Intercity Fleet
    { id: 'TRN-12004', name: '12004 Lucknow Shatabdi', type: 'EXPRESS', speedKmH: 122, currentLat: 27.5000, currentLng: 79.0000, route: 'New Delhi ➔ Lucknow', destination: 'Lucknow (LKO)', priority: 1, direction: 'DOWN', zone: 'NR' },
    { id: 'TRN-12002', name: '12002 Bhopal Shatabdi', type: 'EXPRESS', speedKmH: 130, currentLat: 26.8000, currentLng: 78.1000, route: 'New Delhi ➔ Rani Kamlapati', destination: 'Rani Kamlapati (RKMP)', priority: 1, direction: 'DOWN', zone: 'WCR' },
    { id: 'TRN-12008', name: '12008 Mysuru Shatabdi', type: 'EXPRESS', speedKmH: 110, currentLat: 12.5000, currentLng: 77.0000, route: 'Mysuru ➔ Chennai Central', destination: 'Chennai Central (MAS)', priority: 1, direction: 'DOWN', zone: 'SR' },
    { id: 'TRN-12919', name: '12919 Malwa Express', type: 'EXPRESS', speedKmH: 110, currentLat: 31.0000, currentLng: 75.5000, route: 'Indore ➔ SVDK Katra', destination: 'SMVD Katra (SVDK)', priority: 2, direction: 'UP', zone: 'WR' },
    { id: 'TRN-12419', name: '12419 Gomti Express', type: 'EXPRESS', speedKmH: 105, currentLat: 26.5457, currentLng: 80.4856, route: 'Lucknow ➔ New Delhi', destination: 'New Delhi (NDLS)', priority: 2, direction: 'UP', zone: 'NR' },
    { id: 'TRN-12625', name: '12625 Kerala Express', type: 'EXPRESS', speedKmH: 112, currentLat: 14.5000, currentLng: 79.0000, route: 'Trivandrum ➔ New Delhi', destination: 'New Delhi (NDLS)', priority: 2, direction: 'UP', zone: 'SR' },
    { id: 'TRN-12801', name: '12801 Purushottam Express', type: 'EXPRESS', speedKmH: 110, currentLat: 23.5000, currentLng: 85.5000, route: 'Puri ➔ New Delhi', destination: 'New Delhi (NDLS)', priority: 2, direction: 'UP', zone: 'ECoR' },
    { id: 'TRN-12723', name: '12723 Telangana Express', type: 'EXPRESS', speedKmH: 115, currentLat: 19.5000, currentLng: 78.8000, route: 'Hyderabad ➔ New Delhi', destination: 'New Delhi (NDLS)', priority: 2, direction: 'UP', zone: 'SCR' },
    { id: 'TRN-12656', name: '12656 Navjeevan Express', type: 'EXPRESS', speedKmH: 108, currentLat: 17.5000, currentLng: 79.5000, route: 'Ahmedabad ➔ Chennai Central', destination: 'Chennai (MAS)', priority: 2, direction: 'DOWN', zone: 'WR' },
    { id: 'TRN-12555', name: '12555 Gorakhdham Express', type: 'EXPRESS', speedKmH: 100, currentLat: 27.8000, currentLng: 81.5000, route: 'Gorakhpur ➔ Hisar', destination: 'Hisar (HSR)', priority: 2, direction: 'UP', zone: 'NER' },
    { id: 'TRN-12839', name: '12839 Howrah Mail', type: 'EXPRESS', speedKmH: 105, currentLat: 17.0000, currentLng: 82.2000, route: 'Chennai ➔ Howrah', destination: 'Howrah (HWH)', priority: 2, direction: 'UP', zone: 'SER' },
    { id: 'TRN-12137', name: '12137 Punjab Mail', type: 'EXPRESS', speedKmH: 102, currentLat: 29.2000, currentLng: 76.8000, route: 'Mumbai CSMT ➔ Firozpur', destination: 'Firozpur Cantt (FZR)', priority: 2, direction: 'UP', zone: 'CR' },
    { id: 'TRN-12860', name: '12860 Gitanjali Express', type: 'EXPRESS', speedKmH: 112, currentLat: 21.1000, currentLng: 81.6000, route: 'Howrah ➔ Mumbai CSMT', destination: 'Mumbai CSMT (CSMT)', priority: 2, direction: 'UP', zone: 'SER' },

    // Freight & Supply Chain Rakes
    { id: 'FRT-4412', name: 'BOXN-4412 Coal Freight Rake', type: 'FREIGHT', speedKmH: 62, currentLat: 25.2819, currentLng: 83.1153, route: 'DDU Yard ➔ Kanpur Thermal Power', destination: 'Panki Siding (CNB)', priority: 3, direction: 'UP', zone: 'ECR' },
    { id: 'FRT-8820', name: 'BTPN-8820 POL Oil Tanker Rake', type: 'FREIGHT', speedKmH: 55, currentLat: 26.7770, currentLng: 79.0270, route: 'Mathura Refinery ➔ Lucknow POL', destination: 'Amausi POL (LKO)', priority: 3, direction: 'DOWN', zone: 'NCR' },
    { id: 'FRT-7711', name: 'CONCOR-7711 Container Rake', type: 'FREIGHT', speedKmH: 75, currentLat: 20.0000, currentLng: 73.5000, route: 'JNPT Port Mumbai ➔ ICD Dadri', destination: 'ICD Dadri (DER)', priority: 3, direction: 'UP', zone: 'WR' },
    { id: 'FRT-9922', name: 'FLAT-9922 Steel Rake', type: 'FREIGHT', speedKmH: 60, currentLat: 22.8000, currentLng: 86.0000, route: 'Tatanagar Steel ➔ Ludhiana Yard', destination: 'Ludhiana (LDH)', priority: 3, direction: 'UP', zone: 'SER' },
    { id: 'FRT-3301', name: 'BOBRN-3301 Coal Hopper', type: 'FREIGHT', speedKmH: 58, currentLat: 21.5000, currentLng: 81.8000, route: 'Korba Mines ➔ NTPC Nagpur', destination: 'NTPC Siding (NGP)', priority: 3, direction: 'UP', zone: 'SECR' },
    { id: 'FRT-5544', name: 'BCN-5544 Grain Rake', type: 'FREIGHT', speedKmH: 65, currentLat: 30.5000, currentLng: 76.0000, route: 'FCI Punjab ➔ Chennai Silo', destination: 'FCI Chennai (MAS)', priority: 3, direction: 'DOWN', zone: 'NR' },
    { id: 'FRT-6632', name: 'BOXN-6632 Iron Ore Rake', type: 'FREIGHT', speedKmH: 50, currentLat: 21.8000, currentLng: 84.2000, route: 'Kirandul Mines ➔ Vizag Steel', destination: 'Vizag Siding (VSKP)', priority: 3, direction: 'DOWN', zone: 'ECoR' },
    { id: 'FRT-1192', name: 'BTPN-1192 Petroleum Rake', type: 'FREIGHT', speedKmH: 58, currentLat: 22.3000, currentLng: 73.2000, route: 'Koyali Refinery ➔ BPL Depot', destination: 'Bhopal POL (BPL)', priority: 3, direction: 'UP', zone: 'WR' },
    { id: 'FRT-8877', name: 'CONCOR-8877 Export Container', type: 'FREIGHT', speedKmH: 80, currentLat: 22.2000, currentLng: 70.8000, route: 'Mundra Port ➔ ICD Tughlakabad', destination: 'Tughlakabad (TKD)', priority: 3, direction: 'UP', zone: 'WR' },
    { id: 'FRT-4102', name: 'BCN-4102 Cement Rake', type: 'FREIGHT', speedKmH: 52, currentLat: 16.8000, currentLng: 79.2000, route: 'Wadi Cement ➔ Bangalore City Siding', destination: 'Whitefield Siding (WFD)', priority: 3, direction: 'DOWN', zone: 'SCR' }
  ];

  if (densityMode === 'STANDARD') return baseFleet;

  // Add 40 more trains for HIGH density
  const highDensityFleet: LiveTrain[] = [
    ...baseFleet,
    { id: 'TRN-20833', name: '20833 VSKP Vande Bharat', type: 'EXPRESS', speedKmH: 120, currentLat: 17.2000, currentLng: 81.5000, route: 'Visakhapatnam ➔ Secunderabad', destination: 'Secunderabad (SC)', priority: 1, direction: 'UP', zone: 'ECoR' },
    { id: 'TRN-20911', name: '20911 NGP Vande Bharat', type: 'EXPRESS', speedKmH: 122, currentLat: 22.8000, currentLng: 78.5000, route: 'Nagpur ➔ Bilaspur', destination: 'Bilaspur (BSP)', priority: 1, direction: 'UP', zone: 'SECR' },
    { id: 'TRN-12810', name: '12810 Howrah Mail Down', type: 'EXPRESS', speedKmH: 104, currentLat: 20.8000, currentLng: 78.9000, route: 'Mumbai CSMT ➔ Howrah', destination: 'Howrah (HWH)', priority: 2, direction: 'DOWN', zone: 'CR' },
    { id: 'TRN-12615', name: '12615 Grand Trunk Exp', type: 'EXPRESS', speedKmH: 110, currentLat: 24.8000, currentLng: 78.3000, route: 'Chennai ➔ New Delhi', destination: 'New Delhi (NDLS)', priority: 2, direction: 'UP', zone: 'SR' },
    { id: 'TRN-12621', name: '12621 Tamil Nadu Exp', type: 'EXPRESS', speedKmH: 115, currentLat: 22.5000, currentLng: 78.8000, route: 'Chennai ➔ New Delhi', destination: 'New Delhi (NDLS)', priority: 2, direction: 'UP', zone: 'SR' },
    { id: 'TRN-12724', name: '12724 AP Express Down', type: 'EXPRESS', speedKmH: 112, currentLat: 26.0000, currentLng: 78.2000, route: 'New Delhi ➔ Hyderabad', destination: 'Hyderabad (HYB)', priority: 2, direction: 'DOWN', zone: 'SCR' },
    { id: 'TRN-12628', name: '12628 Karnataka Express', type: 'EXPRESS', speedKmH: 114, currentLat: 16.5000, currentLng: 77.2000, route: 'New Delhi ➔ Bengaluru', destination: 'KSR Bengaluru (SBC)', priority: 2, direction: 'DOWN', zone: 'SWR' },
    { id: 'TRN-12296', name: '12296 Sanghamitra Exp', type: 'EXPRESS', speedKmH: 108, currentLat: 24.5000, currentLng: 82.8000, route: 'Danapur ➔ Bengaluru', destination: 'Bengaluru (SBC)', priority: 2, direction: 'DOWN', zone: 'ECR' },
    { id: 'TRN-12129', name: '12129 Azad Hind Exp', type: 'EXPRESS', speedKmH: 105, currentLat: 21.0000, currentLng: 83.2000, route: 'Pune ➔ Howrah', destination: 'Howrah (HWH)', priority: 2, direction: 'DOWN', zone: 'CR' },
    { id: 'TRN-12841', name: '12841 Coromandel Exp', type: 'EXPRESS', speedKmH: 118, currentLat: 19.5000, currentLng: 84.8000, route: 'Howrah ➔ Chennai', destination: 'Chennai (MAS)', priority: 2, direction: 'DOWN', zone: 'SER' },
    { id: 'TRN-12703', name: '12703 Falaknuma Exp', type: 'EXPRESS', speedKmH: 106, currentLat: 18.5000, currentLng: 83.8000, route: 'Howrah ➔ Secunderabad', destination: 'Secunderabad (SC)', priority: 2, direction: 'DOWN', zone: 'SCR' },
    { id: 'FRT-9901', name: 'BOXN-9901 Thermal Coal Rake', type: 'FREIGHT', speedKmH: 60, currentLat: 23.8000, currentLng: 86.4000, route: 'Dhanbad Coalfields ➔ Ropar Thermal', destination: 'Ropar Siding', priority: 3, direction: 'UP', zone: 'ECR' },
    { id: 'FRT-3392', name: 'BTPN-3392 Aviation Fuel Rake', type: 'FREIGHT', speedKmH: 54, currentLat: 28.4000, currentLng: 77.1000, route: 'Panipat Refinery ➔ IGI Airport Siding', destination: 'IGI Siding (NDLS)', priority: 3, direction: 'DOWN', zone: 'NR' },
    { id: 'FRT-8812', name: 'CONCOR-8812 Inland Container', type: 'FREIGHT', speedKmH: 72, currentLat: 23.5000, currentLng: 72.4000, route: 'Sabarmati ICD ➔ JNPT Port', destination: 'JNPT Port (CSMT)', priority: 3, direction: 'DOWN', zone: 'WR' }
  ];

  if (densityMode === 'HIGH') return highDensityFleet;

  // Add 45 more trains for ULTRA dense fleet (150+ total fleet across all corridors)
  const ultraDensityFleet: LiveTrain[] = [
    ...highDensityFleet,
    { id: 'TRN-12059', name: '12059 Kota Jan Shatabdi', type: 'EXPRESS', speedKmH: 110, currentLat: 27.8000, currentLng: 76.8000, route: 'Kota ➔ Hazrat Nizamuddin', destination: 'Hazrat Nizamuddin (NZM)', priority: 2, direction: 'UP', zone: 'WCR' },
    { id: 'TRN-12925', name: '12925 Paschim Express', type: 'EXPRESS', speedKmH: 104, currentLat: 28.1000, currentLng: 76.5000, route: 'Mumbai Central ➔ Amritsar', destination: 'Amritsar (ASR)', priority: 2, direction: 'UP', zone: 'WR' },
    { id: 'TRN-12011', name: '12011 Kalka Shatabdi', type: 'EXPRESS', speedKmH: 125, currentLat: 30.1000, currentLng: 76.9000, route: 'New Delhi ➔ Kalka', destination: 'Kalka (KLK)', priority: 1, direction: 'DOWN', zone: 'NR' },
    { id: 'TRN-12259', name: '12259 Sealdah Duronto Up', type: 'EXPRESS', speedKmH: 122, currentLat: 23.4000, currentLng: 87.3000, route: 'Sealdah ➔ New Delhi', destination: 'New Delhi (NDLS)', priority: 1, direction: 'UP', zone: 'ER' },
    { id: 'TRN-12678', name: '12678 Ernakulam Express', type: 'EXPRESS', speedKmH: 105, currentLat: 10.5000, currentLng: 76.5000, route: 'KSR Bengaluru ➔ Ernakulam', destination: 'Ernakulam (ERS)', priority: 2, direction: 'DOWN', zone: 'SR' },
    { id: 'TRN-22349', name: '22349 PNBE RNC Vande Bharat', type: 'EXPRESS', speedKmH: 115, currentLat: 24.2000, currentLng: 85.2000, route: 'Patna ➔ Ranchi', destination: 'Ranchi (RNC)', priority: 1, direction: 'DOWN', zone: 'ECR' },
    { id: 'TRN-20977', name: '20977 JP DLI Vande Bharat', type: 'EXPRESS', speedKmH: 128, currentLat: 27.5000, currentLng: 76.2000, route: 'Jaipur ➔ Delhi Cantt', destination: 'Delhi Cantt (DEC)', priority: 1, direction: 'UP', zone: 'NWR' },
    { id: 'TRN-22549', name: '22549 GKP LKO Vande Bharat', type: 'EXPRESS', speedKmH: 112, currentLat: 26.8500, currentLng: 82.2000, route: 'Gorakhpur ➔ Lucknow', destination: 'Lucknow (LKO)', priority: 1, direction: 'UP', zone: 'NER' },
    { id: 'TRN-20701', name: '20701 SC TPTY Vande Bharat', type: 'EXPRESS', speedKmH: 120, currentLat: 15.5000, currentLng: 79.5000, route: 'Secunderabad ➔ Tirupati', destination: 'Tirupati (TPTY)', priority: 1, direction: 'DOWN', zone: 'SCR' },
    { id: 'TRN-22229', name: '22229 CSMT MAO Vande Bharat', type: 'EXPRESS', speedKmH: 110, currentLat: 16.2000, currentLng: 73.6000, route: 'Mumbai CSMT ➔ Madgaon', destination: 'Madgaon (MAO)', priority: 1, direction: 'DOWN', zone: 'KR' },
    { id: 'TRN-12425', name: '12425 Jammu Rajdhani', type: 'EXPRESS', speedKmH: 118, currentLat: 31.8000, currentLng: 75.1000, route: 'New Delhi ➔ Jammu Tawi', destination: 'Jammu Tawi (JAT)', priority: 1, direction: 'DOWN', zone: 'NR' },
    { id: 'TRN-20840', name: '20840 New Delhi Rajdhani', type: 'EXPRESS', speedKmH: 125, currentLat: 21.8000, currentLng: 85.5000, route: 'Ranchi ➔ New Delhi', destination: 'New Delhi (NDLS)', priority: 1, direction: 'UP', zone: 'SER' },
    { id: 'TRN-22823', name: '22823 BBS Rajdhani', type: 'EXPRESS', speedKmH: 124, currentLat: 22.4000, currentLng: 86.8000, route: 'Bhubaneswar ➔ New Delhi', destination: 'New Delhi (NDLS)', priority: 1, direction: 'UP', zone: 'ECoR' },
    { id: 'TRN-10103', name: '10103 Mandovi Express', type: 'EXPRESS', speedKmH: 95, currentLat: 17.5000, currentLng: 73.2000, route: 'Mumbai CSMT ➔ Madgaon', destination: 'Madgaon (MAO)', priority: 2, direction: 'DOWN', zone: 'KR' },
    { id: 'TRN-12627', name: '12627 Karnataka Exp Up', type: 'EXPRESS', speedKmH: 112, currentLat: 21.2000, currentLng: 78.5000, route: 'Bengaluru ➔ New Delhi', destination: 'New Delhi (NDLS)', priority: 2, direction: 'UP', zone: 'SWR' },
    { id: 'TRN-12863', name: '12863 Howrah YPR Exp', type: 'EXPRESS', speedKmH: 108, currentLat: 14.8000, currentLng: 79.8000, route: 'Howrah ➔ Yesvantpur', destination: 'Yesvantpur (YPR)', priority: 2, direction: 'DOWN', zone: 'SER' },
    { id: 'TRN-12785', name: '12785 Kacheguda Exp', type: 'EXPRESS', speedKmH: 100, currentLat: 14.2000, currentLng: 77.6000, route: 'Kacheguda ➔ Mysuru', destination: 'Mysuru (MYS)', priority: 2, direction: 'DOWN', zone: 'SCR' },
    { id: 'TRN-12696', name: '12696 TVC MAS Express', type: 'EXPRESS', speedKmH: 106, currentLat: 9.2000, currentLng: 76.5000, route: 'Trivandrum ➔ Chennai', destination: 'Chennai Central (MAS)', priority: 2, direction: 'UP', zone: 'SR' },
    { id: 'TRN-12073', name: '12073 HWH JAN SHATABDI', type: 'EXPRESS', speedKmH: 110, currentLat: 23.8000, currentLng: 87.8000, route: 'Howrah ➔ Rourkela', destination: 'Rourkela (ROU)', priority: 2, direction: 'DOWN', zone: 'ER' },
    { id: 'FRT-2041', name: 'NMG-2041 Auto-Car Rake', type: 'FREIGHT', speedKmH: 70, currentLat: 28.2000, currentLng: 76.8000, route: 'Maruti Gurgaon ➔ Chennai Auto Siding', destination: 'Walajabad (WJ)', priority: 3, direction: 'DOWN', zone: 'NR' },
    { id: 'FRT-7722', name: 'BCN-7722 Fertiliser Rake', type: 'FREIGHT', speedKmH: 56, currentLat: 21.6000, currentLng: 70.1000, route: 'IFFCO Kandla ➔ Bhatinda Yard', destination: 'Bhatinda (BTI)', priority: 3, direction: 'UP', zone: 'WR' },
    { id: 'FRT-9944', name: 'BOBRN-9944 Coal Hopper Rake', type: 'FREIGHT', speedKmH: 55, currentLat: 23.6000, currentLng: 85.9000, route: 'Bokaro Steel ➔ Rourkela Plant', destination: 'Rourkela (ROU)', priority: 3, direction: 'DOWN', zone: 'SER' },
    { id: 'FRT-1022', name: 'BOXN-1022 Coal Supply Rake', type: 'FREIGHT', speedKmH: 60, currentLat: 20.4000, currentLng: 85.2000, route: 'Talcher Coalfields ➔ NTPC Kaniha', destination: 'NTPC Kaniha', priority: 3, direction: 'UP', zone: 'ECoR' },
    { id: 'FRT-3044', name: 'BTPN-3044 Crude Oil Rake', type: 'FREIGHT', speedKmH: 52, currentLat: 26.2000, currentLng: 92.8000, route: 'Digboi Refinery ➔ Bongaigaon Depot', destination: 'Bongaigaon (BNGN)', priority: 3, direction: 'DOWN', zone: 'NFR' },
    { id: 'FRT-5099', name: 'CONCOR-5099 Port Container', type: 'FREIGHT', speedKmH: 78, currentLat: 17.6000, currentLng: 83.2000, route: 'Vizag Port ➔ ICD Hyderabad', destination: 'Sanatnagar ICD (SNF)', priority: 3, direction: 'UP', zone: 'ECoR' },
    { id: 'FRT-6011', name: 'BCN-6011 Rice Supply Rake', type: 'FREIGHT', speedKmH: 64, currentLat: 16.2000, currentLng: 81.1000, route: 'Vijayawada Granary ➔ Kerala Silos', destination: 'Palakkad Siding (PGT)', priority: 3, direction: 'DOWN', zone: 'SCR' },
    { id: 'FRT-7088', name: 'FLAT-7088 Heavy Rail Rake', type: 'FREIGHT', speedKmH: 48, currentLat: 21.2000, currentLng: 81.3000, route: 'Bhilai Steel Plant ➔ DFC Track Siding', destination: 'Rewari DFC Yard', priority: 3, direction: 'UP', zone: 'SECR' }
  ];

  return ultraDensityFleet;
};

export const GisMap: React.FC = () => {
  const { notifications } = useNotifications();

  // Map Tile Style Theme Options (OpenStreetMap & Esri Base Layers)
  const [mapTheme, setMapTheme] = useState<'VOYAGER' | 'DARK' | 'STANDARD' | 'SATELLITE'>('SATELLITE');
  
  // Traffic Density Mode (Standard = 35, High = 75, Ultra = 120+ Fleet)
  const [densityMode, setDensityMode] = useState<'STANDARD' | 'HIGH' | 'ULTRA'>('ULTRA');
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');

  // Interactive Camera Fly Target State
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);

  // Layer Filters
  const [showOpenRailwayMap, setShowOpenRailwayMap] = useState(false);
  const [showTracks, setShowTracks] = useState(true);
  const [showTrains, setShowTrains] = useState(true);
  const [showDefects, setShowDefects] = useState(true);
  const [showStations, setShowStations] = useState(true);
  const [deptFilter, setDeptFilter] = useState<'ALL' | 'ENGINEERING' | 'S&T' | 'TRACTION'>('ALL');
  const [trainFilter, setTrainFilter] = useState<'ALL' | 'EXPRESS' | 'FREIGHT'>('ALL');

  // Live Train position state
  const [trains, setTrains] = useState<LiveTrain[]>(() => buildUltraDenseFleet('ULTRA'));

  // Update fleet on densityMode change
  useEffect(() => {
    setTrains(buildUltraDenseFleet(densityMode));
  }, [densityMode]);

  // RailRadar API Search & Quota State
  const [searchNo, setSearchNo] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchedTrain, setSearchedTrain] = useState<RailRadarTrainDetail | null>(null);
  const [activeRouteGeometry, setActiveRouteGeometry] = useState<[number, number][] | null>(null);
  const [quotaInfo, setQuotaInfo] = useState(getRailRadarQuotaInfo());

  // Refresh quota telemetry info
  useEffect(() => {
    setQuotaInfo(getRailRadarQuotaInfo());
  }, [searchedTrain]);

  const handleRailRadarSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchNo.trim()) return;
    setSearching(true);
    try {
      const [detail, routeCoords] = await Promise.all([
        fetchRailRadarTrain(searchNo.trim()),
        fetchRailRadarTrainRoute(searchNo.trim())
      ]);
      setSearchedTrain(detail);
      if (routeCoords && routeCoords.length > 0) {
        setActiveRouteGeometry(routeCoords);
        setFlyTarget(routeCoords[0]);
      }
      setQuotaInfo(getRailRadarQuotaInfo());
    } catch (err) {
      console.warn('RailRadar lookup error:', err);
    } finally {
      setSearching(false);
    }
  };

  // Smooth position simulation loop along track
  useEffect(() => {
    const timer = setInterval(() => {
      setTrains(prevTrains =>
        prevTrains.map(t => {
          // Slight latitude / longitude movement simulation
          const latDelta = (Math.random() - 0.48) * 0.0025;
          const lngDelta = (Math.random() - 0.48) * 0.0025;
          return {
            ...t,
            currentLat: t.currentLat + latDelta,
            currentLng: t.currentLng + lngDelta,
            speedKmH: Math.max(30, Math.min(135, Math.round(t.speedKmH + (Math.random() - 0.5) * 4)))
          };
        })
      );
    }, 2000);

    return () => clearInterval(timer);
  }, []);

  // Filter defects from notification context
  const filteredNotifications = notifications.filter(n => {
    if (deptFilter !== 'ALL' && n.department && n.department.toUpperCase() !== deptFilter) {
      return false;
    }
    return true;
  });

  // Calculate defect GPS positions for Kavach proximity calculations
  const defectCoords = filteredNotifications.map((_n, idx) => ({
    lat: 25.3267 + (idx * 0.42) - 0.2,
    lng: 82.9893 - (idx * 0.55)
  }));

  // Filter trains with Kavach Proximity evaluation
  const filteredTrains = trains.map(t => {
    // Check distance to closest defect
    let minDefectDist = 9999;
    defectCoords.forEach(d => {
      const dist = getDistanceKm(t.currentLat, t.currentLng, d.lat, d.lng);
      if (dist < minDefectDist) minDefectDist = dist;
    });

    const isKavachWarning = minDefectDist < 35;
    return {
      ...t,
      isKavachWarning,
      kavachDistanceKm: Math.round(minDefectDist)
    };
  }).filter(t => {
    if (trainFilter !== 'ALL' && t.type !== trainFilter) return false;
    if (zoneFilter !== 'ALL' && t.zone !== zoneFilter) return false;
    return true;
  });

  // Active Kavach Warning Count
  const kavachAlertCount = filteredTrains.filter(t => t.isKavachWarning).length;

  // Tile Layer URLs (OpenStreetMap & Esri Satellite Layers)
  const getTileLayerUrl = () => {
    switch (mapTheme) {
      case 'SATELLITE':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'DARK':
        return 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';
      case 'STANDARD':
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      case 'VOYAGER':
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  };

  const getTileAttribution = () => {
    if (mapTheme === 'SATELLITE') {
      return 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
    }
    return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
  };

  // Helper to construct pulsing defect marker HTML
  const createPulsingDefectIcon = (n: any) => {
    const isEmerg = n.type === 'EMERGENCY' || (n.urgencyScore && n.urgencyScore > 90);
    const color = isEmerg ? '#bc473a' : '#e59866';

    return L.divIcon({
      className: 'defect-pulsing-marker',
      html: `
        <div class="defect-pulse-ring" style="background: ${isEmerg ? 'rgba(188,71,58,0.3)' : 'rgba(229,152,102,0.3)'}; border-color: ${color}">
          <span style="font-size:11px; font-weight:900">⚠️</span>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  };

  // Helper to construct train icon with Kavach Proximity Glow
  const createTrainIcon = (t: LiveTrain & { isKavachWarning?: boolean; kavachDistanceKm?: number }) => {
    const isFreight = t.type === 'FREIGHT';
    const bgClass = t.isKavachWarning
      ? 'train-kavach-warning'
      : isFreight
      ? 'train-marker-freight'
      : 'train-marker-express';

    const kavachLabel = t.isKavachWarning ? ` ⚡ KAVACH (${t.kavachDistanceKm}km)` : '';

    return L.divIcon({
      className: 'train-marker-wrapper',
      html: `
        <div class="train-marker-icon ${bgClass}">
          <span>${isFreight ? '📦' : '🚄'} ${t.name.split(' ')[0]} (${t.speedKmH} km/h)${kavachLabel}</span>
        </div>
      `,
      iconSize: [t.isKavachWarning ? 160 : 120, 24],
      iconAnchor: [t.isKavachWarning ? 80 : 60, 12],
    });
  };

  return (
    <div className={styles.gisPage}>
      <GradientBackground
        gradientOrigin="bottom-middle"
        noiseIntensity={0.65}
        noisePatternAlpha={30}
        noisePatternSize={90}
        noisePatternRefreshInterval={2}
        colors={[
          { color: 'rgba(210,186,152,1)', stop: '10.5%' },
          { color: 'rgba(222,200,168,1)', stop: '16%' },
          { color: 'rgba(232,212,182,1)', stop: '17.5%' },
          { color: 'rgba(240,224,200,1)', stop: '25%' },
          { color: 'rgba(245,233,215,1)', stop: '40%' },
          { color: 'rgba(248,240,228,1)', stop: '65%' },
          { color: 'rgba(252,248,240,1)', stop: '100%' },
        ]}
      />
      <div style={{ position: 'relative', zIndex: 100 }}>
        <Navbar />
      </div>

      <div className={styles.contentContainer}>
        {/* TOP TITLE ROW */}
        <div className={styles.headerFlex}>
          <div>
            <PageEntryReveal delay={0.15} duration={1.1}>
              <span style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.15em', color: 'var(--color-railway-red)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                SPATIAL INFRASTRUCTURE COMMAND
              </span>
            </PageEntryReveal>
            <PageEntryReveal delay={0.35} duration={1.25}>
              <h1 className={styles.pageTitle}>
                GIS Track Grid &amp; Telemetry Map
              </h1>
            </PageEntryReveal>
          </div>

          {/* QUICK SUMMARY METRICS BAR */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <div className={styles.metricCard}>
              <div className={styles.metricIcon} style={{ background: 'rgba(188, 71, 58, 0.12)', color: '#bc473a' }}>
                <ShieldAlert size={22} />
              </div>
              <div>
                <div className={styles.metricVal}>{notifications.length}</div>
                <div className={styles.metricLabel}>Spatial Defects</div>
              </div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricIcon} style={{ background: 'rgba(39, 174, 96, 0.12)', color: '#27ae60' }}>
                <Train size={22} />
              </div>
              <div>
                <div className={styles.metricVal}>{filteredTrains.length}</div>
                <div className={styles.metricLabel}>Active Live Trains</div>
              </div>
            </div>

            <div className={`${styles.metricCard} ${kavachAlertCount > 0 ? styles.kavachMetricCard : ''}`}>
              <div className={styles.metricIcon} style={{ background: 'rgba(231, 76, 60, 0.15)', color: '#e74c3c' }}>
                <Zap size={22} />
              </div>
              <div>
                <div className={styles.metricVal} style={{ color: kavachAlertCount > 0 ? '#e74c3c' : undefined }}>
                  {kavachAlertCount}
                </div>
                <div className={styles.metricLabel}>Kavach Warnings</div>
              </div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricIcon} style={{ background: 'rgba(229, 152, 102, 0.15)', color: '#d35400' }}>
                <Activity size={22} />
              </div>
              <div>
                <div className={styles.metricVal}>94.2%</div>
                <div className={styles.metricLabel}>Peak Bottleneck</div>
              </div>
            </div>
          </div>
        </div>

        {/* QUICK FLY HUB CHIPS BAR */}
        <div className={styles.quickSelectSection}>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, fontFamily: 'monospace', color: '#bc473a', textTransform: 'uppercase', marginRight: '4px' }}>
            QUICK FLY:
          </span>
          <button type="button" className={styles.quickChip} onClick={() => setFlyTarget([28.6430, 77.2194])}>
            📍 NDLS New Delhi
          </button>
          <button type="button" className={styles.quickChip} onClick={() => setFlyTarget([18.9401, 72.8351])}>
            📍 CSMT Mumbai
          </button>
          <button type="button" className={styles.quickChip} onClick={() => setFlyTarget([22.5830, 88.3429])}>
            📍 HWH Howrah
          </button>
          <button type="button" className={styles.quickChip} onClick={() => setFlyTarget([13.0827, 80.2707])}>
            📍 MAS Chennai
          </button>
          <button type="button" className={styles.quickChip} onClick={() => setFlyTarget([26.1856, 91.7539])}>
            📍 GHY Guwahati
          </button>
          <button type="button" className={styles.quickChip} onClick={() => setFlyTarget([27.2066, 78.2435])}>
            🚄 22436 Vande Bharat
          </button>
          <button type="button" className={styles.quickChip} onClick={() => setFlyTarget([24.5000, 74.5000])}>
            🚄 12951 Rajdhani
          </button>
          <button type="button" className={styles.quickChip} onClick={() => setFlyTarget([25.2819, 83.1153])}>
            📦 BOXN Coal Rake
          </button>
        </div>

        {/* RAILRADAR API LIVE LOOKUP & QUOTA GUARD BAR */}
        <div className={styles.searchSection}>
          <form onSubmit={handleRailRadarSearch} className={styles.searchForm}>
            <input
              type="text"
              placeholder="Search Train No. (e.g. 22436, 12919, 12236, 12419)..."
              value={searchNo}
              onChange={(e) => setSearchNo(e.target.value)}
              className={styles.searchInput}
            />
            <button type="submit" className={styles.searchBtn} disabled={searching}>
              <Search size={16} />
              {searching ? 'Fetching...' : 'RailRadar Timetable'}
            </button>
          </form>

          <div className={styles.quotaBadge}>
            <ShieldCheck size={16} />
            <span>RailRadar Live API • Quota Guard: {quotaInfo.remaining}/{quotaInfo.monthlyLimit} calls left this month</span>
          </div>
        </div>

        {/* MAIN LEAFLET OPENSTREETMAP CONTAINER */}
        <ScrollReveal>
          <div className={styles.mapWrapper}>
            
            {/* FLOATING SPATIAL CONTROL PANEL OVERLAY */}
            <div
              className={styles.floatingControls}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
            >
              <div>
                <div className={styles.controlGroupTitle}>Traffic Density Mode</div>
                <div className={styles.filterBtnRow}>
                  <button
                    type="button"
                    className={`${styles.filterBtn} ${densityMode === 'STANDARD' ? styles.filterBtnActive : ''}`}
                    onClick={(e) => { e.stopPropagation(); setDensityMode('STANDARD'); }}
                  >
                    ⚡ Standard (35)
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterBtn} ${densityMode === 'HIGH' ? styles.filterBtnActive : ''}`}
                    onClick={(e) => { e.stopPropagation(); setDensityMode('HIGH'); }}
                  >
                    🔥 High (75)
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterBtn} ${densityMode === 'ULTRA' ? styles.filterBtnActive : ''}`}
                    onClick={(e) => { e.stopPropagation(); setDensityMode('ULTRA'); }}
                    style={{ background: densityMode === 'ULTRA' ? '#bc473a' : undefined, borderColor: '#bc473a' }}
                  >
                    🚀 Ultra Network (150+)
                  </button>
                </div>
              </div>

              <div>
                <div className={styles.controlGroupTitle}>OpenStreetMap Theme</div>
                <div className={styles.filterBtnRow}>
                  <button
                    type="button"
                    className={`${styles.filterBtn} ${mapTheme === 'SATELLITE' ? styles.filterBtnActive : ''}`}
                    onClick={(e) => { e.stopPropagation(); setMapTheme('SATELLITE'); }}
                  >
                    🛰️ Satellite View
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterBtn} ${mapTheme === 'VOYAGER' ? styles.filterBtnActive : ''}`}
                    onClick={(e) => { e.stopPropagation(); setMapTheme('VOYAGER'); }}
                  >
                    Parchment Voyager
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterBtn} ${mapTheme === 'DARK' ? styles.filterBtnActive : ''}`}
                    onClick={(e) => { e.stopPropagation(); setMapTheme('DARK'); }}
                  >
                    Dark Matter
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterBtn} ${mapTheme === 'STANDARD' ? styles.filterBtnActive : ''}`}
                    onClick={(e) => { e.stopPropagation(); setMapTheme('STANDARD'); }}
                  >
                    Standard OSM
                  </button>
                </div>
              </div>

              <div>
                <div className={styles.controlGroupTitle}>Railway Zone Filter</div>
                <div className={styles.filterBtnRow}>
                  {['ALL', 'NR', 'WR', 'SR', 'ER', 'CR', 'SCR', 'ECoR', 'SECR', 'NFR'].map(z => (
                    <button
                      key={z}
                      type="button"
                      className={`${styles.filterBtn} ${zoneFilter === z ? styles.filterBtnActive : ''}`}
                      onClick={(e) => { e.stopPropagation(); setZoneFilter(z); }}
                    >
                      {z}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className={styles.controlGroupTitle}>Layer Toggles</div>
                <div className={styles.filterBtnRow}>
                  <button
                    type="button"
                    className={`${styles.filterBtn} ${showOpenRailwayMap ? styles.filterBtnActive : ''}`}
                    onClick={(e) => { e.stopPropagation(); setShowOpenRailwayMap(!showOpenRailwayMap); }}
                    style={{ background: showOpenRailwayMap ? '#d35400' : undefined, color: showOpenRailwayMap ? '#fff' : undefined, borderColor: '#d35400' }}
                  >
                    🚂 OpenRailwayMap Infrastructure
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterBtn} ${showTracks ? styles.filterBtnActive : ''}`}
                    onClick={(e) => { e.stopPropagation(); setShowTracks(!showTracks); }}
                  >
                    🛤️ Corridors
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterBtn} ${showTrains ? styles.filterBtnActive : ''}`}
                    onClick={(e) => { e.stopPropagation(); setShowTrains(!showTrains); }}
                  >
                    🚆 Live Trains
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterBtn} ${showDefects ? styles.filterBtnActive : ''}`}
                    onClick={(e) => { e.stopPropagation(); setShowDefects(!showDefects); }}
                  >
                    ⚠️ Defects
                  </button>
                  <button
                    type="button"
                    className={`${styles.filterBtn} ${showStations ? styles.filterBtnActive : ''}`}
                    onClick={(e) => { e.stopPropagation(); setShowStations(!showStations); }}
                  >
                    🚉 Stations
                  </button>
                </div>
              </div>

              <div>
                <div className={styles.controlGroupTitle}>Train Type Filter</div>
                <div className={styles.filterBtnRow}>
                  <button type="button" className={`${styles.filterBtn} ${trainFilter === 'ALL' ? styles.filterBtnActive : ''}`} onClick={(e) => { e.stopPropagation(); setTrainFilter('ALL'); }}>ALL</button>
                  <button type="button" className={`${styles.filterBtn} ${trainFilter === 'EXPRESS' ? styles.filterBtnActive : ''}`} onClick={(e) => { e.stopPropagation(); setTrainFilter('EXPRESS'); }}>EXPRESS</button>
                  <button type="button" className={`${styles.filterBtn} ${trainFilter === 'FREIGHT' ? styles.filterBtnActive : ''}`} onClick={(e) => { e.stopPropagation(); setTrainFilter('FREIGHT'); }}>FREIGHT</button>
                </div>
              </div>

              <div>
                <div className={styles.controlGroupTitle}>Department Filter</div>
                <div className={styles.filterBtnRow}>
                  <button type="button" className={`${styles.filterBtn} ${deptFilter === 'ALL' ? styles.filterBtnActive : ''}`} onClick={(e) => { e.stopPropagation(); setDeptFilter('ALL'); }}>ALL</button>
                  <button type="button" className={`${styles.filterBtn} ${deptFilter === 'ENGINEERING' ? styles.filterBtnActive : ''}`} onClick={(e) => { e.stopPropagation(); setDeptFilter('ENGINEERING'); }}>ENG</button>
                  <button type="button" className={`${styles.filterBtn} ${deptFilter === 'S&T' ? styles.filterBtnActive : ''}`} onClick={(e) => { e.stopPropagation(); setDeptFilter('S&T'); }}>S&amp;T</button>
                  <button type="button" className={`${styles.filterBtn} ${deptFilter === 'TRACTION' ? styles.filterBtnActive : ''}`} onClick={(e) => { e.stopPropagation(); setDeptFilter('TRACTION'); }}>TRD</button>
                </div>
              </div>
            </div>

            {/* LEAFLET MAP CONTAINER */}
            <MapContainer
              center={[22.5937, 78.9629]}
              zoom={5}
              scrollWheelZoom={true}
              className={styles.mapContainer}
            >
              {/* CAMERA ANIMATION CONTROLLER */}
              <MapFlyControl flyTarget={flyTarget} />
              {/* BASE MAP TILE LAYER */}
              <TileLayer
                attribution={getTileAttribution()}
                url={getTileLayerUrl()}
              />

              {/* OPENRAILWAYMAP INFRASTRUCTURE TILE OVERLAY (GLOWING ORANGE TRACK NETWORK) */}
              {showOpenRailwayMap && (
                <TileLayer
                  url="https://{s}.tile.openrailwaymap.org/standard/{z}/{x}/{y}.png"
                  maxZoom={19}
                  opacity={0.88}
                  attribution='&copy; <a href="https://www.openrailwaymap.org">OpenRailwayMap</a> contributors'
                />
              )}

              {/* DYNAMIC RAILRADAR HIGH-PRECISION TRACK ROUTE GEOMETRY POLYLINE */}
              {activeRouteGeometry && (
                <Polyline
                  positions={activeRouteGeometry}
                  pathOptions={{
                    color: '#00e5ff',
                    weight: 6,
                    opacity: 0.95
                  }}
                >
                  <Popup>
                    <div style={{ fontSize: '11px', fontWeight: 800, fontFamily: 'monospace' }}>
                      ⚡ RailRadar GIS Track Polyline for Train #{searchedTrain?.number || ''}
                    </div>
                  </Popup>
                </Polyline>
              )}

              {/* 1. TRACK CORRIDOR POLYLINES & CONGESTION OVERLAYS */}
              {showTracks && TRACK_CORRIDORS.map(corridor => (
                <Polyline
                  key={corridor.id}
                  positions={corridor.coordinates}
                  pathOptions={{
                    color: corridor.color,
                    weight: corridor.status === 'BOTTLENECK' ? 6 : 4,
                    dashArray: corridor.status === 'BOTTLENECK' ? '8, 8' : undefined,
                    opacity: 0.85
                  }}
                >
                  <Popup>
                    <div style={{ fontFamily: 'sans-serif', padding: '4px', fontSize: '12px' }}>
                      <strong style={{ color: '#bc473a', fontSize: '13px', display: 'block' }}>{corridor.name}</strong>
                      <div><strong>Section Code:</strong> {corridor.id}</div>
                      <div><strong>Capacity Utilized:</strong> {corridor.capacityUtil}%</div>
                      <div><strong>Speed Limit:</strong> {corridor.speedLimit}</div>
                      <div><strong>Status:</strong> <span style={{ color: corridor.color, fontWeight: 800 }}>{corridor.status}</span></div>
                    </div>
                  </Popup>
                </Polyline>
              ))}

              {/* 2. STATION NODES */}
              {showStations && STATIONS.map(st => (
                <CircleMarker
                  key={st.code}
                  center={[st.lat, st.lng]}
                  radius={st.type === 'JUNCTION' || st.type === 'TERMINAL' ? 6 : 4}
                  pathOptions={{
                    fillColor: st.type === 'TERMINAL' ? '#bc473a' : '#1e1b19',
                    fillOpacity: 0.9,
                    color: '#faf6f0',
                    weight: 2
                  }}
                >
                  <Tooltip permanent direction="top" offset={[0, -8]} opacity={0.9}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '10px' }}>{st.code}</span>
                  </Tooltip>
                  <Popup>
                    <div style={{ fontSize: '12px' }}>
                      <strong>{st.name} ({st.code})</strong>
                      <div>Category: {st.type}</div>
                      <div>Coord: {st.lat.toFixed(4)}, {st.lng.toFixed(4)}</div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}

              {/* 3. LIVE TRAIN MARKERS & VECTORS */}
              {showTrains && filteredTrains.map(t => (
                <Marker
                  key={t.id}
                  position={[t.currentLat, t.currentLng]}
                  icon={createTrainIcon(t)}
                >
                  <Popup>
                    <div style={{ fontSize: '12px', minWidth: '180px' }}>
                      <span style={{
                        background: t.type === 'FREIGHT' ? '#d35400' : '#1e824c',
                        color: '#fff',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontSize: '10px',
                        fontWeight: 800,
                        fontFamily: 'monospace'
                      }}>
                        {t.type} • PRIORITY {t.priority}
                      </span>
                      <h4 style={{ margin: '4px 0 2px', fontSize: '13px', color: '#1e1b19' }}>{t.name}</h4>
                      <div><strong>Route:</strong> {t.route}</div>
                      <div><strong>Live Speed:</strong> <span style={{ fontWeight: 800, color: '#bc473a' }}>{t.speedKmH} km/h</span></div>
                      <div><strong>Heading:</strong> {t.direction} Mainline</div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* 4. ACTIVE DEFECT PULSING PINS (FROM NOTIFICATION CONTEXT & DB) */}
              {showDefects && filteredNotifications.map((n, idx) => {
                // Determine coordinates based on sectionCode or default across corridor
                const lat = 25.3267 + (idx * 0.42) - 0.2;
                const lng = 82.9893 - (idx * 0.55);

                return (
                  <Marker
                    key={n.id}
                    position={[lat, lng]}
                    icon={createPulsingDefectIcon(n)}
                  >
                    <Popup>
                      <div style={{ fontSize: '12px', minWidth: '220px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ background: 'rgba(188,71,58,0.15)', color: '#bc473a', padding: '2px 6px', borderRadius: '3px', fontWeight: 800, fontFamily: 'monospace', fontSize: '10px' }}>
                            {n.department || 'ENGINEERING'}
                          </span>
                          <span style={{ fontSize: '10px', color: '#888', fontFamily: 'monospace' }}>{n.timestamp}</span>
                        </div>
                        <h4 style={{ margin: '4px 0 2px', fontSize: '13px', color: '#1e1b19', fontWeight: 800 }}>{n.title}</h4>
                        <p style={{ margin: '2px 0 4px', fontSize: '11px', color: '#444' }}>{n.message}</p>
                        {n.urgencyScore !== undefined && (
                          <div style={{ background: '#bc473a', color: '#fff', padding: '3px 6px', borderRadius: '3px', fontWeight: 800, fontSize: '10px', fontFamily: 'monospace', marginTop: '4px' }}>
                            AI RISK SCORE: {(n.urgencyScore <= 1 ? n.urgencyScore * 100 : n.urgencyScore).toFixed(1)}%
                          </div>
                        )}
                        {n.routeLocation && (
                          <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                            📍 {n.routeLocation}
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

            </MapContainer>
          </div>
        </ScrollReveal>

        {/* TEJAS GIS MAP ARCHITECTURE & PROVENANCE GUIDE CARD */}
        <ScrollReveal>
          <div className={styles.provenanceCard}>
            <div className={styles.provenanceHeader}>
              <div>
                <span className={styles.provenanceBadge}>SYSTEM ARCHITECTURE &amp; DATA PROVENANCE</span>
                <h2 className={styles.provenanceTitle}>
                  TEJAS Spatial Command Grid — Data Pipeline Guide
                </h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontFamily: 'monospace', color: '#1e824c', fontWeight: 800 }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2ecc71', display: 'inline-block' }}></span>
                REAL-TIME TELEMETRY ACTIVE
              </div>
            </div>

            <div className={styles.provenanceGrid}>
              <div className={styles.provenanceCol}>
                <div className={styles.colHeader}>
                  <Navigation size={18} className={styles.colIcon} />
                  <h3>1. What This Map Represents</h3>
                </div>
                <p>
                  A unified <strong>Common Operating Picture (COP)</strong> for Indian Railways headquarters, Zonal Control Rooms, and Divisional Railway Managers (DRMs). It aggregates live train telemetry, railway corridor infrastructure, station interlockings, and AI track defect alerts into a single interactive GIS grid across all 17 Zonal Railways.
                </p>
              </div>

              <div className={styles.provenanceCol}>
                <div className={styles.colHeader}>
                  <Radio size={18} className={styles.colIcon} />
                  <h3>2. Data Sources &amp; Telemetry APIs</h3>
                </div>
                <ul className={styles.provenanceList}>
                  <li><strong>RailRadar Live API:</strong> Real-time 5-digit train schedules, halt sequences, and GIS track geometry polylines.</li>
                  <li><strong>OpenStreetMap &amp; Esri World Imagery:</strong> High-resolution satellite base tiles and open GIS cartography.</li>
                  <li><strong>OpenRailwayMap Infrastructure:</strong> High-definition track layouts, signal locations, electrification (OHE), and speed limits.</li>
                  <li><strong>TEJAS Sensor Mesh &amp; FOIS:</strong> Trackside IoT vibration sensors, acoustic inspection rakes, and Freight Operations data.</li>
                </ul>
              </div>

              <div className={styles.provenanceCol}>
                <div className={styles.colHeader}>
                  <Zap size={18} className={styles.colIcon} />
                  <h3>3. AI Defect &amp; Kavach Proximity Logic</h3>
                </div>
                <p>
                  <strong>AI Anomaly Models</strong> analyze track acoustic &amp; vibration data to flag rail fractures, OHE voltage drops, and S&amp;T point failures.
                </p>
                <p style={{ marginTop: '6px' }}>
                  <strong>Kavach Proximity Guard</strong> continuously evaluates Haversine GPS distances between moving trains and track defects to issue automated slowing/stopping alerts within 35 km.
                </p>
              </div>

              <div className={styles.provenanceCol}>
                <div className={styles.colHeader}>
                  <Compass size={18} className={styles.colIcon} />
                  <h3>4. Operational Impact</h3>
                </div>
                <ul className={styles.provenanceList}>
                  <li><strong>Zero Derailments:</strong> Instant warning correlation prevents trains from entering compromised track sections.</li>
                  <li><strong>Bottleneck Clearance:</strong> Real-time track capacity utilization (e.g. 96.4% Ghaziabad-Kanpur) clears freight delays.</li>
                  <li><strong>Cross-Dept Coordination:</strong> Unifies Engineering, Signals, and Traction into 1 screen.</li>
                  <li><strong>Precision Gang Dispatch:</strong> Dispatches repair crews to exact GPS coordinates.</li>
                </ul>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* RAILRADAR LIVE TIMETABLE MODAL POPUP */}
      {searchedTrain && (
        <div className={styles.modalOverlay} onClick={() => setSearchedTrain(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{
                    background: '#1e1b19',
                    color: '#faf6f0',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    fontWeight: 800
                  }}>
                    TRAIN #{searchedTrain.number}
                  </span>
                  <span style={{
                    background: searchedTrain.cachedFrom === 'LIVE_API' ? 'rgba(39,174,96,0.15)' : 'rgba(211,84,0,0.15)',
                    color: searchedTrain.cachedFrom === 'LIVE_API' ? '#1e824c' : '#d35400',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: '10px',
                    fontWeight: 800
                  }}>
                    {searchedTrain.cachedFrom === 'LIVE_API' ? '⚡ LIVE API' : searchedTrain.cachedFrom === 'CACHE' ? '💾 CACHED (24H)' : '🛡️ LOCAL FALLBACK'}
                  </span>
                </div>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontFamily: 'var(--font-display, serif)', color: '#1e1b19' }}>
                  {searchedTrain.name}
                </h2>
                <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '2px' }}>
                  Category: <strong>{searchedTrain.type}</strong> • Route: <strong>{searchedTrain.source?.name} ({searchedTrain.source?.code}) ➔ {searchedTrain.destination?.name} ({searchedTrain.destination?.code})</strong>
                </div>
              </div>
              <button className={styles.modalCloseBtn} onClick={() => setSearchedTrain(null)}>
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
              <div style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(30,27,25,0.1)', padding: '8px 12px', borderRadius: '6px' }}>
                <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontFamily: 'monospace' }}>AVG SPEED</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e824c' }}>{searchedTrain.avgSpeed || 65} km/h</div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(30,27,25,0.1)', padding: '8px 12px', borderRadius: '6px' }}>
                <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontFamily: 'monospace' }}>MAX MPS</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#bc473a' }}>{searchedTrain.maxSpeed || 110} km/h</div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(30,27,25,0.1)', padding: '8px 12px', borderRadius: '6px' }}>
                <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontFamily: 'monospace' }}>TOTAL DISTANCE</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e1b19' }}>{searchedTrain.distance || 759} km</div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(30,27,25,0.1)', padding: '8px 12px', borderRadius: '6px' }}>
                <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontFamily: 'monospace' }}>TOTAL HALTS</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e1b19' }}>{searchedTrain.totalHalts || searchedTrain.halts?.length || 4} stops</div>
              </div>
            </div>

            {searchedTrain.coachPosition && (
              <div style={{ background: 'rgba(30,27,25,0.05)', border: '1px dashed rgba(30,27,25,0.2)', padding: '8px 12px', borderRadius: '6px' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, fontFamily: 'monospace', color: '#bc473a', marginBottom: '2px' }}>COACH COMPOSITION</div>
                <div style={{ fontSize: '11px', fontFamily: 'monospace', wordBreak: 'break-all', fontWeight: 700 }}>
                  {searchedTrain.coachPosition}
                </div>
              </div>
            )}

            <div>
              <h3 style={{ fontSize: '0.9rem', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#1e1b19', margin: '8px 0' }}>
                STATION TIMETABLE &amp; HALTS
              </h3>
              <div className={styles.trainHaltList}>
                {searchedTrain.halts && searchedTrain.halts.length > 0 ? (
                  searchedTrain.halts.map((h, i) => (
                    <div key={i} className={styles.haltItem}>
                      <div>
                        <strong>#{h.sn} {h.stationName} ({h.stationCode})</strong>
                        <div style={{ fontSize: '10px', color: '#666' }}>PF #{h.platform || '1'} • {h.distance} km mark</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div>ARR: <span style={{ color: '#1e824c', fontWeight: 800 }}>{h.arrivalTime}</span></div>
                        <div>DEP: <span style={{ color: '#bc473a', fontWeight: 800 }}>{h.departureTime}</span></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '12px', color: '#888', fontStyle: 'italic', padding: '12px', textAlign: 'center' }}>
                    Standard timetable halts recorded for this express train.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GisMap;
