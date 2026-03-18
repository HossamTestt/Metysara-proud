import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Slider } from '../components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Search, SlidersHorizontal, MapPin, Star, Heart, ArrowLeft, Users } from 'lucide-react';
import { useVenues } from '../contexts/VenuesContext';

const egyptianCities = [
  { 
    name: 'Cairo', 
    nameAr: 'القاهرة',
    zones: ['Nasr City', 'New Cairo', 'Heliopolis', 'Maadi', 'Downtown', 'Zamalek']
  },
  { 
    name: 'Giza', 
    nameAr: 'الجيزة',
    zones: ['Haram', 'October', 'Omranaia', 'Dokki', 'Mohandessin', 'Sheikh Zayed']
  },
  { 
    name: 'Alexandria', 
    nameAr: 'الإسكندرية',
    zones: ['Stanley', 'Smouha', 'Sidi Gaber', 'Miami', 'Glim', 'Montazah']
  },
  { 
    name: 'Beni Suef', 
    nameAr: 'بني سويف',
    zones: ['Downtown', 'Al Wadi', 'East District']
  },
  { 
    name: 'Fayoum', 
    nameAr: 'الفيوم',
    zones: ['City Center', 'Ibshaway', 'Sinnuris']
  },
  { 
    name: 'Minya', 
    nameAr: 'المنيا',
    zones: ['Downtown', 'West Minya', 'East Minya']
  },
];

export function SearchResultsScreen() {
  const { venues } = useVenues();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedZone, setSelectedZone] = useState('All Zones');
  const [priceRange, setPriceRange] = useState([10000, 100000]);
  const [minCapacity, setMinCapacity] = useState(0);
  const [sortBy, setSortBy] = useState('recommended');
  const [savedVenues, setSavedVenues] = useState<Set<string>>(new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const typeFilter = searchParams.get('type');

  const currentCityData = egyptianCities.find(c => c.name === selectedCity);
  const availableZones = currentCityData ? currentCityData.zones : [];

  // Reset zone when city changes
  useEffect(() => {
    if (selectedCity !== 'All Cities') {
      setSelectedZone('All Zones');
    }
  }, [selectedCity]);

  const toggleSave = (venueId: string) => {
    const newSaved = new Set(savedVenues);
    if (newSaved.has(venueId)) {
      newSaved.delete(venueId);
    } else {
      newSaved.add(venueId);
    }
    setSavedVenues(newSaved);
  };

  const filteredVenues = venues.filter((venue) => {
    const matchesCity = selectedCity === 'All Cities' || 
      venue.location.toLowerCase() === selectedCity.toLowerCase();
    const matchesZone = selectedZone === 'All Zones' || 
      venue.zone.toLowerCase() === selectedZone.toLowerCase();
    const matchesPrice = venue.price >= priceRange[0] && venue.price <= priceRange[1];
    const matchesCapacity = venue.capacity >= minCapacity;
    const matchesSearch = searchQuery === '' || 
      venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      venue.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      venue.zone.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = !typeFilter || venue.type === typeFilter;
    
    return matchesCity && matchesZone && matchesPrice && matchesCapacity && matchesSearch && matchesType;
  });

  const sortedVenues = [...filteredVenues].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'capacity-high') return b.capacity - a.capacity;
    if (sortBy === 'capacity-low') return a.capacity - b.capacity;
    return 0;
  });

  const clearAllFilters = () => {
    setSelectedCity('All Cities');
    setSelectedZone('All Zones');
    setPriceRange([10000, 100000]);
    setMinCapacity(0);
    setSortBy('recommended');
    setSearchQuery('');
  };

  const hasActiveFilters = selectedCity !== 'All Cities' || 
    selectedZone !== 'All Zones' || 
    priceRange[0] > 10000 || 
    priceRange[1] < 100000 || 
    minCapacity > 0;

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="bg-card px-6 pt-12 pb-6 rounded-b-3xl shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4 mb-4">
          <button 
            onClick={() => navigate('/home')}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-xl flex-1">Search Venues</h2>
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <button className="p-2.5 bg-primary rounded-lg hover:bg-primary/90 transition-colors relative">
                <SlidersHorizontal className="h-5 w-5 text-primary-foreground" />
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent side="bottom" className="h-[85vh] rounded-t-3xl">
              <div className="py-6 space-y-6 overflow-y-auto h-[calc(85vh-100px)]">
                {/* City Filter */}
                <div>
                  <label className="block text-sm font-semibold mb-3">Location (City)</label>
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All Cities">All Cities</SelectItem>
                      {egyptianCities.map((city) => (
                        <SelectItem key={city.name} value={city.name}>
                          {city.name} - {city.nameAr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Zone Filter */}
                {selectedCity !== 'All Cities' && availableZones.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold mb-3">
                      Zone in {selectedCity}
                    </label>
                    <Select value={selectedZone} onValueChange={setSelectedZone}>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All Zones">All Zones</SelectItem>
                        {availableZones.map((zone) => (
                          <SelectItem key={zone} value={zone}>
                            {zone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-semibold mb-3">
                    Price Range: {priceRange[0].toLocaleString()} - {priceRange[1].toLocaleString()} EGP
                  </label>
                  <Slider
                    min={10000}
                    max={100000}
                    step={5000}
                    value={priceRange}
                    onValueChange={setPriceRange}
                    className="mt-2"
                  />
                </div>

                {/* Guest Capacity */}
                <div>
                  <label className="block text-sm font-semibold mb-3">
                    Minimum Guest Capacity: {minCapacity} guests
                  </label>
                  <Slider
                    min={0}
                    max={1000}
                    step={50}
                    value={[minCapacity]}
                    onValueChange={(value) => setMinCapacity(value[0])}
                    className="mt-2"
                  />
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-semibold mb-3">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recommended">Recommended</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="capacity-high">Capacity: High to Low</SelectItem>
                      <SelectItem value="capacity-low">Capacity: Low to High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={clearAllFilters}
                    variant="outline"
                    className="w-full h-12 rounded-xl mb-3"
                  >
                    Clear All Filters
                  </Button>
                  <Button
                    onClick={() => setFilterOpen(false)}
                    className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90"
                  >
                    Show {sortedVenues.length} Results
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, city, or zone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 pl-12 bg-input-background rounded-xl border-0"
          />
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="px-6 py-3 flex gap-2 flex-wrap">
          {selectedCity !== 'All Cities' && (
            <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm flex items-center gap-2">
              {selectedCity}
              <button onClick={() => setSelectedCity('All Cities')} className="hover:text-primary-foreground">×</button>
            </div>
          )}
          {selectedZone !== 'All Zones' && (
            <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm flex items-center gap-2">
              {selectedZone}
              <button onClick={() => setSelectedZone('All Zones')} className="hover:text-primary-foreground">×</button>
            </div>
          )}
          {(priceRange[0] > 10000 || priceRange[1] < 100000) && (
            <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm flex items-center gap-2">
              {priceRange[0].toLocaleString()} - {priceRange[1].toLocaleString()} EGP
              <button onClick={() => setPriceRange([10000, 100000])} className="hover:text-primary-foreground">×</button>
            </div>
          )}
        </div>
      )}

      {/* Results Count */}
      <div className="px-6 py-4">
        <p className="text-muted-foreground">
          Found {sortedVenues.length} venues
          {selectedCity !== 'All Cities' && ` in ${selectedCity}`}
          {selectedZone !== 'All Zones' && ` - ${selectedZone}`}
        </p>
      </div>

      {/* Venue Cards */}
      <div className="px-6 space-y-4">
        {sortedVenues.map((venue) => (
          <Card
            key={venue.id}
            className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/venue/${venue.id}`)}
          >
            <div className="relative">
              <img
                src={venue.images[0]}
                alt={venue.name}
                className="w-full h-48 object-cover"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSave(venue.id);
                }}
                className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
              >
                <Heart
                  className={`h-5 w-5 ${
                    savedVenues.has(venue.id)
                      ? 'fill-red-500 text-red-500'
                      : 'text-gray-700'
                  }`}
                />
              </button>
              <div className="absolute bottom-3 left-3 px-3 py-1 bg-primary/90 backdrop-blur-sm rounded-full">
                <span className="text-white text-sm">
                  {(() => {
                     const t = venue.type || 'venue';
                     if (t === 'wedding' || t === 'venue') return 'Venue';
                     if (t === 'photographer') return 'Photographer';
                     if (t === 'videographer') return 'Videographer';
                     if (t === 'makeup') return 'Makeup Artist';
                     if (t === 'planner') return 'Event Planner';
                     return 'Service';
                  })()}
                </span>
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="text-lg mb-1">{venue.name}</h4>
                  <p className="text-sm text-muted-foreground" dir="rtl">
                    {venue.nameAr}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {venue.location}, {venue.zone}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Up to {venue.capacity} guests
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm">{venue.rating}</span>
                  <span className="text-sm text-muted-foreground">
                    ({venue.reviews})
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">From</p>
                  <p className="text-lg text-primary">
                    {venue.price.toLocaleString()} EGP
                  </p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {sortedVenues.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-2">No venues found matching your criteria</p>
          <p className="text-sm text-muted-foreground mb-4">Try adjusting your filters</p>
          <Button
            onClick={clearAllFilters}
            variant="outline"
            className="mt-4"
          >
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );
}