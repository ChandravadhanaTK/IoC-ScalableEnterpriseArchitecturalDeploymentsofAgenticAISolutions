import React, { useState, useEffect } from 'react';
import { 
  DoorOpen, 
  Users, 
  Tv, 
  Video, 
  PenTool, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Search,
  Calendar,
  Layers,
  MapPin
} from 'lucide-react';
import { Room, User, RoomStatus } from '../types';
import { storage } from '../services/storage';
import { Badge } from '../components/common/Badge';

interface MeetingRoomsPageProps {
  currentUser: User;
  onNavigateToAssistantWithPrompt: (prompt: string) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const MeetingRoomsPage: React.FC<MeetingRoomsPageProps> = ({
  currentUser,
  onNavigateToAssistantWithPrompt,
  onShowToast
}) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [capacityFilter, setCapacityFilter] = useState<number>(0);
  const [projectorFilter, setProjectorFilter] = useState<string>('all');
  const [videoFilter, setVideoFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const refresh = () => setRooms(storage.getRooms());
    refresh();
    const unsub = storage.subscribe(refresh);
    return () => unsub();
  }, []);

  const handleToggleRoomStatus = (room: Room) => {
    const nextStatus: RoomStatus = room.status === 'available' ? 'occupied' : 'available';
    const updated = { ...room, status: nextStatus };
    storage.updateRoom(updated);
    storage.addAuditLog({
      actor: currentUser.name,
      actorRole: currentUser.role,
      action: 'ROOM_STATUS_UPDATED',
      targetResource: room.name,
      decision: 'executed',
      details: `Transitioned status from ${room.status.toUpperCase()} to ${nextStatus.toUpperCase()}`
    });
    onShowToast('Room Status Updated', `${room.name} marked as ${nextStatus}.`, 'info');
  };

  const filteredRooms = rooms.filter((room) => {
    if (searchQuery && !room.name.toLowerCase().includes(searchQuery.toLowerCase()) && !room.location.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (capacityFilter > 0 && room.capacity < capacityFilter) {
      return false;
    }
    if (projectorFilter === 'yes' && !room.equipment.projector) return false;
    if (projectorFilter === 'no' && room.equipment.projector) return false;
    if (videoFilter === 'yes' && !room.equipment.videoConferencing) return false;
    if (videoFilter === 'no' && room.equipment.videoConferencing) return false;
    if (statusFilter !== 'all' && room.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <DoorOpen className="w-5 h-5 text-indigo-400" />
            <span>Meeting Rooms & Conference Spaces</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise facilities directory with live availability and hardware instrumentation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">
            Showing {filteredRooms.length} of {rooms.length} Spaces
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <span>Facility Filters</span>
          </div>

          <button
            onClick={() => {
              setCapacityFilter(0);
              setProjectorFilter('all');
              setVideoFilter('all');
              setStatusFilter('all');
              setSearchQuery('');
            }}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          {/* Search Query */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Search Room</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name or wing..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Min Capacity */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Min Capacity</label>
            <select
              value={capacityFilter}
              onChange={(e) => setCapacityFilter(parseInt(e.target.value, 10))}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value={0}>Any Capacity</option>
              <option value={8}>8+ Attendees</option>
              <option value={15}>15+ Attendees</option>
              <option value={20}>20+ Attendees</option>
              <option value={30}>30 Attendees</option>
            </select>
          </div>

          {/* Projector */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Projector</label>
            <select
              value={projectorFilter}
              onChange={(e) => setProjectorFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All</option>
              <option value="yes">Yes (Equipped)</option>
              <option value="no">No</option>
            </select>
          </div>

          {/* Video Conferencing */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Video Conferencing</label>
            <select
              value={videoFilter}
              onChange={(e) => setVideoFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All</option>
              <option value="yes">Yes (Telepresence)</option>
              <option value="no">No</option>
            </select>
          </div>

          {/* Availability */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Availability</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available Now</option>
              <option value="occupied">Occupied</option>
            </select>
          </div>
        </div>
      </div>

      {/* Room Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredRooms.map((room) => {
          const isOccupied = room.status === 'occupied';
          return (
            <div
              key={room.id}
              className={`rounded-2xl border transition-all p-5 flex flex-col justify-between ${
                isOccupied
                  ? 'bg-slate-900/60 border-slate-800/80'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-lg'
              }`}
            >
              <div>
                {/* Top Badge & Room Name */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">{room.name}</h3>
                      <Badge
                        variant={isOccupied ? 'danger' : 'success'}
                        size="sm"
                      >
                        {isOccupied ? 'Occupied' : 'Available'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1 font-mono">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{room.floor} &bull; {room.location}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-300 text-xs font-mono">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Cap: <strong className="text-white">{room.capacity}</strong></span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                  {room.description}
                </p>

                {/* Equipment Badges */}
                <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-800/80">
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs ${
                      room.equipment.projector
                        ? 'bg-indigo-950/60 text-indigo-300 border border-indigo-900/40'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    <Tv className="w-3.5 h-3.5" />
                    <span>Projector: {room.equipment.projector ? 'Yes' : 'No'}</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs ${
                      room.equipment.videoConferencing
                        ? 'bg-indigo-950/60 text-indigo-300 border border-indigo-900/40'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Video Conf: {room.equipment.videoConferencing ? 'Yes' : 'No'}</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs ${
                      room.equipment.whiteboard
                        ? 'bg-indigo-950/60 text-indigo-300 border border-indigo-900/40'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Whiteboard: {room.equipment.whiteboard ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-800">
                {(currentUser.role === 'operations_manager' || currentUser.role === 'admin') ? (
                  <button
                    onClick={() => handleToggleRoomStatus(room)}
                    className="text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
                  >
                    Toggle {isOccupied ? 'to Available' : 'to Occupied'}
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400 font-mono">
                    Tier: {room.hourlyRate}
                  </span>
                )}

                <button
                  onClick={() =>
                    onNavigateToAssistantWithPrompt(
                      `I need ${room.name} tomorrow at 2 PM for our team meeting.`
                    )
                  }
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Book with AI</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
