'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Plus, X, Info, Filter } from 'lucide-react';

interface Traveler {
  name: string;
  startDate: string;
  endDate: string;
}

interface Trip {
  id: number;
  name: string;
  city: string;
  country: string;
  startDate: string;
  endDate: string;
  travelers: Traveler[];
}

const TravelCoordinator = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterPerson, setFilterPerson] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [joiningTrip, setJoiningTrip] = useState<Trip | null>(null);
  
  // Form state
  const [newTrip, setNewTrip] = useState({
    name: '',
    city: '',
    country: '',
    startDate: '',
    endDate: '',
    travelers: [{ name: '', startDate: '', endDate: '' }]
  });

  // Join form state
  const [joinForm, setJoinForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    useDefaultDates: true
  });

  const months = [
    { value: '01', label: 'January 2026' },
    { value: '02', label: 'February 2026' },
    { value: '03', label: 'March 2026' },
    { value: '04', label: 'April 2026' },
    { value: '05', label: 'May 2026' }
  ];

  // Load trips from API
  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      const response = await fetch('/api/trips');
      if (response.ok) {
        const data = await response.json();
        setTrips(data);
      }
    } catch (error) {
      console.log('Error fetching trips', error);
    } finally {
      setLoading(false);
    }
  };

  const addTrip = async () => {
    if (!newTrip.name || !newTrip.city || !newTrip.country || !newTrip.startDate || !newTrip.endDate) {
      alert('Please fill in all required fields');
      return;
    }

    const filteredTravelers = newTrip.travelers
      .filter(t => t.name.trim() !== '')
      .map(t => ({
        name: t.name.trim(),
        startDate: t.startDate || newTrip.startDate,
        endDate: t.endDate || newTrip.endDate
      }));

    if (filteredTravelers.length === 0) {
      alert('Please add at least one traveler');
      return;
    }

    const tripData = {
      name: newTrip.name,
      city: newTrip.city,
      country: newTrip.country,
      startDate: newTrip.startDate,
      endDate: newTrip.endDate,
      travelers: filteredTravelers
    };

    try {
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tripData)
      });

      if (response.ok) {
        await loadTrips(); // Reload list
        setNewTrip({ name: '', city: '', country: '', startDate: '', endDate: '', travelers: [{ name: '', startDate: '', endDate: '' }] });
        setShowAddForm(false);
      } else {
        alert('Failed to save trip');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Error saving trip.');
    }
  };

  const joinTrip = (trip: Trip) => {
    setJoiningTrip(trip);
    setJoinForm({
      name: '',
      startDate: trip.startDate,
      endDate: trip.endDate,
      useDefaultDates: true
    });
  };

  const confirmJoinTrip = async () => {
    if (!joinForm.name.trim()) {
      alert('Please enter your name');
      return;
    }

    if (!joiningTrip) return;

    // Client-side check for duplicate (optional, but good UX)
    const alreadyJoined = joiningTrip.travelers.some(t => t.name === joinForm.name.trim());
    if (alreadyJoined) {
      alert('You have already joined this trip!');
      return;
    }

    const travelerData = {
      name: joinForm.name.trim(),
      startDate: joinForm.useDefaultDates ? joiningTrip.startDate : joinForm.startDate,
      endDate: joinForm.useDefaultDates ? joiningTrip.endDate : joinForm.endDate
    };

    try {
      const response = await fetch(`/api/trips/${joiningTrip.id}/join`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(travelerData)
      });

      if (response.ok) {
        await loadTrips();
        setJoiningTrip(null);
        setJoinForm({ name: '', startDate: '', endDate: '', useDefaultDates: true });
      } else {
        alert('Failed to join trip');
      }
    } catch (error) {
      console.error('Join error:', error);
      alert('Error joining trip');
    }
  };

  const deleteTrip = async (tripId: number) => {
    if (!confirm('Are you sure you want to delete this trip?')) return;
    
    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // Optimistic update or reload
        setTrips(trips.filter(t => t.id !== tripId));
      } else {
        alert('Failed to delete trip');
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const addTravelerField = () => {
    setNewTrip({ 
      ...newTrip, 
      travelers: [...newTrip.travelers, { name: '', startDate: '', endDate: '' }] 
    });
  };

  const updateTraveler = (index: number, field: string, value: string) => {
    const updated = [...newTrip.travelers];
    // @ts-expect-error - dynamic field assignment
    updated[index][field] = value;
    setNewTrip({ ...newTrip, travelers: updated });
  };

  const removeTravelerField = (index: number) => {
    if (newTrip.travelers.length > 1) {
      const updated = newTrip.travelers.filter((_, i) => i !== index);
      setNewTrip({ ...newTrip, travelers: updated });
    }
  };

  const clearFilters = () => {
    setFilterPerson('');
    setFilterMonth('');
    setFilterCountry('');
  };

  // Get all unique travelers and countries for filters
  const allTravelers = [...new Set(trips.flatMap(trip => trip.travelers.map(t => t.name)))].sort();
  const allCountries = [...new Set(trips.map(trip => trip.country))].sort();

  // Apply filters
  let filteredTrips = trips;

  if (filterPerson) {
    filteredTrips = filteredTrips.filter(trip => 
      trip.travelers.some(t => t.name === filterPerson)
    );
  }

  if (filterMonth) {
    filteredTrips = filteredTrips.filter(trip => {
      const tripMonth = trip.startDate.substring(5, 7);
      return tripMonth === filterMonth;
    });
  }

  if (filterCountry) {
    filteredTrips = filteredTrips.filter(trip => trip.country === filterCountry);
  }

  // Sort trips by start date
  const sortedTrips = [...filteredTrips].sort((a, b) => 
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const activeFilterCount = [filterPerson, filterMonth, filterCountry].filter(f => f !== '').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-xl text-gray-600">Loading trips...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <MapPin className="text-indigo-600" />
            Europe Travel Coordinator
          </h1>
          <p className="text-gray-600 mb-3">Jan 16 - May 31, 2026</p>
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              <strong>Flexible dates:</strong> All dates are approximate (±1-2 days). When joining trips, you can specify your own arrival/departure dates if they differ from the main trip dates.
            </p>
          </div>
        </div>

        {/* Add Trip Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-lg"
          >
            <Plus size={20} />
            Add New Trip
          </button>
        </div>

        {/* Filters and Add Button */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-600" />
              <h2 className="font-semibold text-gray-800">Filters</h2>
              {activeFilterCount > 0 && (
                <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-medium">
                  {activeFilterCount} active
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-1">Person</label>
              <select 
                value={filterPerson}
                onChange={(e) => setFilterPerson(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white"
              >
                <option value="" className="text-gray-900">All travelers</option>
                {allTravelers.map(person => (
                  <option key={person} value={person} className="text-gray-900">{person}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-1">Month</label>
              <select 
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white"
              >
                <option value="" className="text-gray-900">All months</option>
                {months.map(month => (
                  <option key={month.value} value={month.value} className="text-gray-900">{month.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-1">Country</label>
              <select 
                value={filterCountry}
                onChange={(e) => setFilterCountry(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white"
              >
                <option value="" className="text-gray-900">All countries</option>
                {allCountries.map(country => (
                  <option key={country} value={country} className="text-gray-900">{country}</option>
                ))}
              </select>
            </div>

            {activeFilterCount > 0 && (
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full px-3 py-2 text-sm border border-gray-400 rounded-lg hover:bg-gray-50 transition-colors font-bold text-gray-900"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Add Trip Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Add New Trip</h2>
              <button onClick={() => setShowAddForm(false)} className="text-gray-500 hover:text-gray-900">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Trip Name *</label>
                <input
                  type="text"
                  value={newTrip.name}
                  onChange={(e) => setNewTrip({ ...newTrip, name: e.target.value })}
                  placeholder="e.g., Paris Weekend"
                  className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">City *</label>
                  <input
                    type="text"
                    value={newTrip.city}
                    onChange={(e) => setNewTrip({ ...newTrip, city: e.target.value })}
                    placeholder="e.g., Paris"
                    className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Country *</label>
                  <input
                    type="text"
                    value={newTrip.country}
                    onChange={(e) => setNewTrip({ ...newTrip, country: e.target.value })}
                    placeholder="e.g., France"
                    className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Trip Start Date *</label>
                  <input
                    type="date"
                    value={newTrip.startDate}
                    onChange={(e) => setNewTrip({ ...newTrip, startDate: e.target.value })}
                    min="2026-01-16"
                    max="2026-05-31"
                    className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Trip End Date *</label>
                  <input
                    type="date"
                    value={newTrip.endDate}
                    onChange={(e) => setNewTrip({ ...newTrip, endDate: e.target.value })}
                    min="2026-01-16"
                    max="2026-05-31"
                    className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Initial Travelers *</label>
                <p className="text-xs text-gray-700 font-medium mb-3">You can specify custom dates for each traveler, or leave blank to use trip dates</p>
                {newTrip.travelers.map((traveler, index) => (
                  <div key={index} className="border border-gray-300 rounded-lg p-3 mb-3 bg-gray-50">
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={traveler.name}
                        onChange={(e) => updateTraveler(index, 'name', e.target.value)}
                        placeholder="Enter name"
                        className="flex-1 px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                      />
                      {newTrip.travelers.length > 1 && (
                        <button
                          onClick={() => removeTravelerField(index)}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X size={20} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={traveler.startDate}
                        onChange={(e) => updateTraveler(index, 'startDate', e.target.value)}
                        placeholder="Start date (optional)"
                        min="2026-01-16"
                        max="2026-05-31"
                        className="px-3 py-1.5 text-sm border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white"
                      />
                      <input
                        type="date"
                        value={traveler.endDate}
                        onChange={(e) => updateTraveler(index, 'endDate', e.target.value)}
                        placeholder="End date (optional)"
                        min="2026-01-16"
                        max="2026-05-31"
                        className="px-3 py-1.5 text-sm border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white"
                      />
                    </div>
                  </div>
                ))}
                <button
                  onClick={addTravelerField}
                  className="text-indigo-700 hover:text-indigo-900 text-sm font-bold"
                >
                  + Add another traveler
                </button>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={addTrip}
                  className="flex-1 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-bold shadow-md"
                >
                  Save Trip
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-bold text-gray-900"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Join Trip Modal */}
        {joiningTrip && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Join Trip</h2>
                <button onClick={() => setJoiningTrip(null)} className="text-gray-500 hover:text-gray-900">
                  <X size={24} />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-gray-900 mb-1"><strong>{joiningTrip.name}</strong></p>
                <p className="text-sm text-gray-800">{joiningTrip.city}, {joiningTrip.country}</p>
                <p className="text-sm text-gray-800">Trip dates: {formatDateRange(joiningTrip.startDate, joiningTrip.endDate)}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Your Name *</label>
                  <input
                    type="text"
                    value={joinForm.name}
                    onChange={(e) => setJoinForm({ ...joinForm, name: e.target.value })}
                    placeholder="Enter your name"
                    className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 mb-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={joinForm.useDefaultDates}
                      onChange={(e) => setJoinForm({ ...joinForm, useDefaultDates: e.target.checked })}
                      className="w-4 h-4 text-indigo-600"
                    />
                    <span className="text-sm font-bold text-gray-900">Use trip dates</span>
                  </label>

                  {!joinForm.useDefaultDates && (
                    <div className="grid grid-cols-2 gap-3 pl-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-900 mb-1">Your Start Date</label>
                        <input
                          type="date"
                          value={joinForm.startDate}
                          onChange={(e) => setJoinForm({ ...joinForm, startDate: e.target.value })}
                          min="2026-01-16"
                          max="2026-05-31"
                          className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-gray-900 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-900 mb-1">Your End Date</label>
                        <input
                          type="date"
                          value={joinForm.endDate}
                          onChange={(e) => setJoinForm({ ...joinForm, endDate: e.target.value })}
                          min="2026-01-16"
                          max="2026-05-31"
                          className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-gray-900 bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={confirmJoinTrip}
                    className="flex-1 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-bold shadow-md"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setJoiningTrip(null)}
                    className="px-6 py-2 border border-gray-400 rounded-lg hover:bg-gray-100 transition-colors font-bold text-gray-900"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trips List */}
        {sortedTrips.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <MapPin size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-700 mb-2">
              {trips.length === 0 ? 'No trips yet' : 'No trips match your filters'}
            </h3>
            <p className="text-gray-500">
              {trips.length === 0 
                ? "Click 'Add Trip' to start planning your European adventures!" 
                : 'Try adjusting your filters to see more trips'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedTrips.map(trip => (
              <div key={trip.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-1">{trip.name}</h3>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin size={16} />
                      <span>{trip.city}, {trip.country}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteTrip(trip.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex items-center gap-2 text-gray-600 mb-4">
                  <Calendar size={16} />
                  <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-2 text-gray-700 font-medium mb-2">
                    <Users size={16} />
                    <span>Travelers ({trip.travelers.length})</span>
                  </div>
                  <div className="space-y-2">
                    {trip.travelers.map((traveler, idx) => {
                      const hasDifferentDates = traveler.startDate !== trip.startDate || traveler.endDate !== trip.endDate;
                      return (
                        <div key={idx} className="flex items-center justify-between bg-indigo-50 rounded-lg p-2">
                          <span className="font-medium text-indigo-900">{traveler.name}</span>
                          {hasDifferentDates && (
                            <span className="text-xs text-indigo-600">
                              {formatDateRange(traveler.startDate, traveler.endDate)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={() => joinTrip(trip)}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Join This Trip
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TravelCoordinator;
