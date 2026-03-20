import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { MapPin, Calendar, DollarSign, Building, Sparkles, Loader } from 'lucide-react';

interface ItineraryRequest {
  city: string;
  days: number;
  budget: number;
  accommodationType: 'hotel' | 'hostel' | 'resort' | 'budget';
  interests: string[];
}

interface Activity {
  time: string;
  place: string;
  type: 'attraction' | 'restaurant' | 'hotel';
  estimatedCost: number;
  description: string;
}

interface DayItinerary {
  day: number;
  title: string;
  activities: Activity[];
  dayBudget: number;
  meals: string[];
}

interface ItineraryResponse {
  city: string;
  totalDays: number;
  totalBudget: number;
  dailyBudget: number;
  accommodation: {
    type: string;
    costPerNight: number;
    totalCost: number;
  };
  itinerary: DayItinerary[];
  estimatedCosts: {
    accommodation: number;
    food: number;
    activities: number;
    contingency: number;
  };
}

const interestOptions = [
  'history',
  'food',
  'adventure',
  'relaxation',
  'culture',
  'art',
  'nature',
  'shopping',
  'nightlife',
  'beach'
];

export default function Itinerary() {
  const [formData, setFormData] = useState<ItineraryRequest>({
    city: '',
    days: 3,
    budget: 10000,
    accommodationType: 'hotel',
    interests: []
  });

  const generateItinerary = useMutation({
    mutationFn: async (data: ItineraryRequest) => {
      const response = await axios.post('/api/itinerary/generate', data);
      return response.data;
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.city.trim()) {
      generateItinerary.mutate(formData);
    }
  };

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const data = generateItinerary.data as ItineraryResponse | undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            <Sparkles className="inline-block mr-3 text-indigo-600" />
            Generate Your Perfect Itinerary
          </h1>
          <p className="text-xl text-gray-600">
            Tell us your travel preferences and we'll create a personalized travel plan
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* City Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <MapPin className="inline-block mr-2 w-4 h-4" />
                  Which city do you want to visit?
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="e.g., Paris, Tokyo, Delhi"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Days Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <Calendar className="inline-block mr-2 w-4 h-4" />
                  How many days? ({formData.days} days)
                </label>
                <input
                  type="range"
                  min="1"
                  max="14"
                  value={formData.days}
                  onChange={(e) => setFormData(prev => ({ ...prev, days: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 day</span>
                  <span>14 days</span>
                </div>
              </div>

              {/* Budget Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <DollarSign className="inline-block mr-2 w-4 h-4" />
                  Total Budget: ₹{formData.budget.toLocaleString()}
                </label>
                <input
                  type="range"
                  min="5000"
                  max="500000"
                  step="5000"
                  value={formData.budget}
                  onChange={(e) => setFormData(prev => ({ ...prev, budget: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>₹5,000</span>
                  <span>₹500,000</span>
                </div>
              </div>

              {/* Accommodation Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Building className="inline-block mr-2 w-4 h-4" />
                  Accommodation Type
                </label>
                <select
                  value={formData.accommodationType}
                  onChange={(e) => setFormData(prev => ({ ...prev, accommodationType: e.target.value as ItineraryRequest['accommodationType'] }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="hotel">Hotel (₹1,000-2,000/night)</option>
                  <option value="hostel">Hostel (₹300-500/night)</option>
                  <option value="resort">Resort (₹2,000-3,000/night)</option>
                  <option value="budget">Budget (₹300-800/night)</option>
                </select>
              </div>

              {/* Interests */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  What are your interests?
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {interestOptions.map(interest => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => handleInterestToggle(interest)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        formData.interests.includes(interest)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {interest.charAt(0).toUpperCase() + interest.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={generateItinerary.isPending || !formData.city.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {generateItinerary.isPending ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Itinerary
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results */}
          <div className="space-y-4">
            {generateItinerary.isError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                Error generating itinerary. Please try again.
              </div>
            )}

            {data && (
              <div className="space-y-6">
                {/* Budget Summary */}
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-4">{data.city} - {data.totalDays} Days</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-indigo-100 text-sm">Total Budget</p>
                      <p className="text-2xl font-bold">₹{data.totalBudget.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-indigo-100 text-sm">Daily Budget</p>
                      <p className="text-2xl font-bold">₹{Math.round(data.dailyBudget).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-indigo-100 text-sm">Accommodation</p>
                      <p className="text-lg font-bold">₹{data.estimatedCosts.accommodation.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-indigo-100 text-sm">Activities & Food</p>
                      <p className="text-lg font-bold">₹{(data.estimatedCosts.food + data.estimatedCosts.activities).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Daily Itinerary */}
                <div className="max-h-96 overflow-y-auto space-y-4">
                  {data.itinerary.map((day) => (
                    <div key={day.day} className="bg-white rounded-lg p-4 border-l-4 border-indigo-600">
                      <h4 className="font-bold text-lg text-gray-900 mb-3">{day.title}</h4>
                      
                      {/* Activities */}
                      <div className="space-y-2 mb-3">
                        {day.activities.map((activity, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm">
                            <span className="text-indigo-600 font-semibold whitespace-nowrap">{activity.time}</span>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{activity.place}</p>
                              <p className="text-gray-600 text-xs">{activity.description}</p>
                            </div>
                            <span className="text-indigo-600 font-bold whitespace-nowrap">₹{activity.estimatedCost}</span>
                          </div>
                        ))}
                      </div>

                      {/* Meals */}
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-700 mb-1">Meals</p>
                        <ul className="text-xs text-gray-600 space-y-0.5">
                          {day.meals.map((meal, idx) => (
                            <li key={idx}>• {meal}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!data && !generateItinerary.isError && (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Fill in the form and generate your personalized itinerary</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
