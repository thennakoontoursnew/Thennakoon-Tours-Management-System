'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  MapPin,
  Car,
  Zap,
  Battery,
  ShieldCheck,
  RefreshCw,
  Plus,
  Navigation,
  Activity,
  CheckCircle2,
  Radio,
  Wifi,
  Smartphone,
  Cpu,
  Copy,
  Check,
} from 'lucide-react'
import { recordGPSLocationAction } from './gps-actions'

interface GPSClientWrapperProps {
  locations: any[]
  vehicles: any[]
  geofences: any[]
  tripLogs: any[]
}

export function GPSClientWrapper({
  locations,
  vehicles,
  geofences,
  tripLogs,
}: GPSClientWrapperProps) {
  const router = useRouter()
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('')
  const [recordingPing, setRecordingPing] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const [realtimeConnected, setRealtimeConnected] = useState(false)
  const [lastPingTime, setLastPingTime] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  // Simulation Form State
  const [simVehicleId, setSimVehicleId] = useState('')
  const [simLat, setSimLat] = useState('6.9271')
  const [simLng, setSimLng] = useState('79.8612')
  const [simSpeed, setSimSpeed] = useState('55')
  const [simLocationName, setSimLocationName] = useState('Colombo Central Highway')

  // Supabase Realtime Telemetry Subscription
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('fleet-telematics-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'vehicle_telemetry' },
        (payload) => {
          console.log('[Realtime Telemetry Insert]', payload.new)
          setLastPingTime(new Date().toLocaleTimeString())
          router.refresh()
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'vehicles' },
        (payload) => {
          console.log('[Realtime Vehicle Update]', payload.new)
          setLastPingTime(new Date().toLocaleTimeString())
          router.refresh()
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeConnected(true)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router])

  const handleSendTelemetryPing = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!simVehicleId) {
      alert('Please select a vehicle to log telemetry')
      return
    }

    setRecordingPing(true)
    try {
      const res = await recordGPSLocationAction({
        vehicle_id: simVehicleId,
        latitude: simLat,
        longitude: simLng,
        speed_kmh: simSpeed,
        location_name: simLocationName,
        ignition_on: Number(simSpeed) > 0,
      })

      if (res.success) {
        setShowEventModal(false)
        setLastPingTime(new Date().toLocaleTimeString())
        router.refresh()
      } else {
        alert(res.error || 'Failed to log GPS telemetry')
      }
    } finally {
      setRecordingPing(false)
    }
  }

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedUrl(label)
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  const filteredLocations = selectedVehicleId
    ? locations.filter((l) => l.vehicle_id === selectedVehicleId)
    : locations

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Modal for Simulated Telemetry Ping */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-slate-900 dark:text-white text-base">Record GPS Telemetry Ping</h3>
              <button onClick={() => setShowEventModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSendTelemetryPing} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Select Vehicle *</label>
                <select
                  required
                  value={simVehicleId}
                  onChange={(e) => setSimVehicleId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="">Choose Vehicle...</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vehicle_name} ({v.registration_number}) {v.tracker_id ? `[${v.tracker_id}]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Latitude (Lat) *</label>
                  <input
                    type="text"
                    required
                    value={simLat}
                    onChange={(e) => setSimLat(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Longitude (Lng) *</label>
                  <input
                    type="text"
                    required
                    value={simLng}
                    onChange={(e) => setSimLng(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Speed (KM/H)</label>
                  <input
                    type="number"
                    value={simSpeed}
                    onChange={(e) => setSimSpeed(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Location Name</label>
                  <input
                    type="text"
                    value={simLocationName}
                    onChange={(e) => setSimLocationName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recordingPing}
                  className="px-5 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold hover:bg-amber-300 transition-all cursor-pointer disabled:opacity-50"
                >
                  {recordingPing ? 'Logging...' : 'Log GPS Ping'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Navigation size={24} className="text-amber-500" /> Live GPS Fleet Telematics & Trip Tracking
            </h1>
            {realtimeConnected && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center gap-1.5 uppercase tracking-wider animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                REALTIME CONNECTED
              </span>
            )}
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Real-time vehicle position telemetry, geofence status monitoring, speed alerts, and digital trip logs.
          </p>
        </div>

        <button
          onClick={() => setShowEventModal(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus size={15} /> Log Telemetry Ping
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Monitored Vehicles</span>
          <span className="font-mono font-black text-slate-900 dark:text-white text-xl">{locations.length}</span>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-emerald-500 block">Active On-Trip</span>
          <span className="font-mono font-black text-emerald-500 text-xl">
            {locations.filter((l) => Number(l.speed_kmh || l.current_speed) > 0 || l.ignition_on).length}
          </span>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-amber-500 block">Active Geofences</span>
          <span className="font-mono font-black text-amber-500 text-xl">{geofences.length > 0 ? geofences.length : 4}</span>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-purple-500 block">Live Telemetry Socket</span>
          <span className="font-mono font-bold text-emerald-500 text-xs flex items-center gap-1.5 uppercase mt-1">
            <Radio size={14} className="animate-spin text-emerald-500" />
            {realtimeConnected ? 'ACTIVE' : 'CONNECTING...'}
          </span>
          {lastPingTime && (
            <span className="text-[9px] text-slate-400 block mt-0.5 font-mono">Last Ping: {lastPingTime}</span>
          )}
        </div>
      </div>

      {/* Device Webhook Integration Banner */}
      <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-sm space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-amber-400" />
            <span className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">
              GPS Hardware & Mobile App Integration Ingestion Endpoints
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">OwnTracks / Traccar / SinoTrack 4G Compatible</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
            <div className="truncate">
              <span className="text-purple-400 font-bold block text-[9px] uppercase">OwnTracks / Mobile App Endpoint</span>
              <span className="text-slate-300">/api/telemetry/ping</span>
            </div>
            <button
              onClick={() => handleCopy(`${window.location.origin}/api/telemetry/ping`, 'ping')}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shrink-0"
              title="Copy endpoint URL"
            >
              {copiedUrl === 'ping' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
            <div className="truncate">
              <span className="text-amber-400 font-bold block text-[9px] uppercase">Traccar / SinoTrack 4G Endpoint</span>
              <span className="text-slate-300">/api/telemetry/traccar</span>
            </div>
            <button
              onClick={() => handleCopy(`${window.location.origin}/api/telemetry/traccar`, 'traccar')}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shrink-0"
              title="Copy endpoint URL"
            >
              {copiedUrl === 'traccar' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-amber-500" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Live Vehicle Filter:</span>
        </div>
        <select
          value={selectedVehicleId}
          onChange={(e) => setSelectedVehicleId(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none"
        >
          <option value="">All Fleet Vehicles ({locations.length})</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.vehicle_name} ({v.registration_number}) {v.tracker_id ? `[${v.tracker_id}]` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* GPS Telematics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLocations.map((loc) => {
          const speed = Number(loc.speed_kmh ?? loc.current_speed ?? 0)
          const batt = Number(loc.battery_level_pct ?? loc.current_battery ?? 100)
          const vehicleObj = vehicles.find((v) => v.id === loc.vehicle_id)
          const trackerId = vehicleObj?.tracker_id || loc.tracker_id

          return (
            <div
              key={loc.id || loc.vehicle_id}
              className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-sm">{loc.vehicle_name}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono text-[11px] text-slate-400">{loc.registration_number}</span>
                    {trackerId && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold border border-purple-500/20">
                        {trackerId}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 border ${
                    speed > 0
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                  }`}
                >
                  <Zap size={12} className={speed > 0 ? 'animate-pulse text-emerald-500' : ''} />
                  {speed > 0 ? `${speed} KM/H` : 'Stationary'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-850/50 rounded-xl space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                  <MapPin size={14} className="text-amber-500 shrink-0" />
                  <span>{loc.location_name || 'Sri Lanka GPS Region'}</span>
                </div>
                <div className="font-mono text-[10px] text-slate-400 pl-5">
                  Coords: {Number(loc.latitude).toFixed(4)}, {Number(loc.longitude).toFixed(4)}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <Battery size={13} className="text-emerald-500" /> Battery: {batt}%
                </span>
                <span className="font-mono text-[10px]">
                  {loc.recorded_at ? new Date(loc.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
