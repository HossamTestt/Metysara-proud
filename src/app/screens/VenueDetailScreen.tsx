import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Calendar } from '../components/ui/calendar';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { useVenues } from '../contexts/VenuesContext';
import {
  ArrowLeft,
  Share2,
  Heart,
  Star,
  MapPin,
  Users,
  Wifi,
  Utensils,
  Music,
  ParkingCircle,
  AirVent,
  Camera,
  Shield,
  ChevronLeft,
  ChevronRight,
  Upload,
  Send,
} from 'lucide-react';

export function VenueDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getVenueById, getCommentsByVenueId, addComment } = useVenues();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<'morning' | 'evening' | 'fullDay' | null>(null);

  const venueId = id || '';
  const venue = getVenueById(venueId);
  const comments = getCommentsByVenueId(venueId);

  if (!venue) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Venue not found</p>
      </div>
    );
  }

  const amenities = [
    { icon: Wifi, name: 'Free WiFi', nameAr: 'واي فاي مجاني' },
    { icon: ParkingCircle, name: 'Valet Parking', nameAr: 'موقف سيارات' },
    { icon: Utensils, name: 'Catering Service', nameAr: 'خدمة طعام' },
    { icon: Music, name: 'Sound System', nameAr: 'نظام صوتي' },
    { icon: AirVent, name: 'Air Conditioning', nameAr: 'تكييف هواء' },
    { icon: Camera, name: 'Photo Booth', nameAr: 'ركن تصوير' },
    { icon: Shield, name: '24/7 Security', nameAr: 'أمن على مدار الساعة' },
  ];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % venue.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + venue.images.length) % venue.images.length);
  };

  const handleSubmitComment = () => {
    if (newComment.trim()) {
      addComment({
        venueId: venue.id,
        userName: 'Guest User', // In a real app, this would be the logged-in user
        rating: newRating,
        comment: newComment,
        photos: uploadedPhotos.length > 0 ? uploadedPhotos : undefined,
      });
      setNewComment('');
      setNewRating(5);
      setUploadedPhotos([]);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // In a real app, you would upload these to a server
      // For now, we'll create mock URLs
      const newPhotos = Array.from(files).map((file, index) => 
        `https://images.unsplash.com/photo-${Date.now()}-${index}?w=400`
      );
      setUploadedPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  const isDateDisabled = (date: Date) => {
    // Past dates are always disabled
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;

    // If venue has no availability map defined yet, we loosely allow all future dates temporarily
    if (!venue.availability || Object.keys(venue.availability).length === 0) return false;

    const dateStr = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, '0') + "-" + String(date.getDate()).padStart(2, '0');
    const slots = venue.availability[dateStr] as { morning?: boolean, evening?: boolean, fullDay?: boolean };
    
    // Disable if no slots exist for this date, or if all are false
    if (!slots) return true;
    return !(slots.morning || slots.evening || slots.fullDay);
  };

  const getAvailableSlotsForDate = (date: Date | undefined): { morning?: boolean, evening?: boolean, fullDay?: boolean } => {
    if (!date) return { morning: false, evening: false, fullDay: false };
    if (!venue.availability || Object.keys(venue.availability).length === 0) return { morning: true, evening: true, fullDay: false }; // Default mock
    
    const dateStr = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, '0') + "-" + String(date.getDate()).padStart(2, '0');
    return (venue.availability[dateStr] as { morning?: boolean, evening?: boolean, fullDay?: boolean }) || { morning: false, evening: false, fullDay: false };
  };

  const currentDaySlots = getAvailableSlotsForDate(selectedDate);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Image Gallery */}
      <div className="relative h-[400px] bg-gray-200">
        <img
          src={venue.images[currentImageIndex]}
          alt={venue.name}
          className="w-full h-full object-cover"
        />
        
        {/* Navigation Arrows */}
        {venue.images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Image Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {venue.images.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentImageIndex
                  ? 'w-8 bg-white'
                  : 'w-2 bg-white/50'
              }`}
            />
          ))}
        </div>

        {/* Header Actions */}
        <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <button className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors">
              <Share2 className="h-5 w-5" />
            </button>
            <button
              onClick={() => setIsSaved(!isSaved)}
              className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
            >
              <Heart
                className={`h-5 w-5 ${
                  isSaved ? 'fill-red-500 text-red-500' : 'text-gray-700'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-6">
        <Card className="p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl mb-2">{venue.name}</h1>
              <p className="text-muted-foreground text-lg" dir="rtl">
                {venue.nameAr}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Starting from</p>
              <p className="text-2xl text-primary font-semibold">
                {venue.price.toLocaleString()} EGP
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{venue.rating}</span>
              <span className="text-muted-foreground">({venue.reviews} reviews)</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <span className="text-muted-foreground">{venue.location}, {venue.zone}</span>
          </div>

          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="text-muted-foreground">Up to {venue.capacity} guests</span>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="booking">Booking</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({comments.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg mb-4">Description</h3>
              <p className="text-muted-foreground mb-4">{venue.description}</p>
              <p className="text-muted-foreground" dir="rtl">{venue.descriptionAr}</p>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg mb-4">Amenities</h3>
              <div className="grid grid-cols-2 gap-4">
                {amenities.map((amenity, index) => {
                  const Icon = amenity.icon;
                  return (
                    <div key={index} className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm">{amenity.name}</p>
                        <p className="text-xs text-muted-foreground" dir="rtl">
                          {amenity.nameAr}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="booking">
            <Card className="p-6">
              <h3 className="text-lg mb-4">Select Event Date</h3>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => {
                   setSelectedDate(d);
                   setSelectedSlot(null); // reset slot when day changes
                }}
                disabled={isDateDisabled}
                className="rounded-md border mb-4 flex justify-center p-4"
              />
              {selectedDate && (
                <div className="space-y-4 mb-6">
                  <h4 className="font-medium text-sm">Select Time Slot</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {venue.type === 'venue' || venue.type === 'wedding' ? (
                      <>
                        <Button
                          variant={selectedSlot === 'morning' ? 'default' : 'outline'}
                          disabled={!currentDaySlots.morning}
                          onClick={() => setSelectedSlot('morning')}
                          className={`h-12 ${selectedSlot === 'morning' ? 'bg-primary text-white' : ''}`}
                        >
                          Morning (10 AM - 3 PM)
                        </Button>
                        <Button
                          variant={selectedSlot === 'evening' ? 'default' : 'outline'}
                          disabled={!currentDaySlots.evening}
                          onClick={() => setSelectedSlot('evening')}
                          className={`h-12 ${selectedSlot === 'evening' ? 'bg-primary text-white' : ''}`}
                        >
                          Evening (6 PM - 12 AM)
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant={selectedSlot === 'fullDay' ? 'default' : 'outline'}
                        disabled={!currentDaySlots.fullDay}
                        onClick={() => setSelectedSlot('fullDay')}
                        className={`h-12 col-span-2 ${selectedSlot === 'fullDay' ? 'bg-primary text-white' : ''}`}
                      >
                        Full Day Booking
                      </Button>
                    )}
                  </div>
                </div>
              )}
              {selectedDate && selectedSlot && (
                <Button
                  onClick={() => navigate(`/booking/${venue.id}?date=${selectedDate.toISOString()}&slot=${selectedSlot}`)}
                  className="w-full h-12 bg-primary hover:bg-primary/90"
                >
                  Continue to Booking
                </Button>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            {/* Add Review Form */}
            <Card className="p-6">
              <h3 className="text-lg mb-4">Share Your Experience</h3>
              
              {/* Rating */}
              <div className="mb-4">
                <label className="block text-sm mb-2">Your Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setNewRating(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= newRating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div className="mb-4">
                <label className="block text-sm mb-2">Your Review</label>
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your experience with this venue..."
                  className="min-h-[100px]"
                />
              </div>

              {/* Photo Upload */}
              <div className="mb-4">
                <label className="block text-sm mb-2">Add Photos (Optional)</label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="relative"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photos
                    <Input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </Button>
                  {uploadedPhotos.length > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {uploadedPhotos.length} photo(s) selected
                    </span>
                  )}
                </div>
              </div>

              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim()}
                className="w-full bg-primary hover:bg-primary/90"
              >
                <Send className="h-4 w-4 mr-2" />
                Submit Review
              </Button>
            </Card>

            {/* Reviews List */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <Card key={comment.id} className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold">{comment.userName}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(comment.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          className={`h-4 w-4 ${
                            index < comment.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-3">{comment.comment}</p>
                  {comment.photos && comment.photos.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto">
                      {comment.photos.map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`Review photo ${index + 1}`}
                          className="h-24 w-24 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}
                </Card>
              ))}

              {comments.length === 0 && (
                <Card className="p-6 text-center">
                  <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Booking Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Starting from</p>
            <p className="text-xl text-primary font-semibold">
              {venue.price.toLocaleString()} EGP
            </p>
          </div>
          <Button
            onClick={() => {
              if (!selectedDate || !selectedSlot) {
                 alert("Please select a date and an available time slot from the Booking tab first!");
                 return;
              }
              navigate(`/booking/${venue.id}?date=${selectedDate.toISOString()}&slot=${selectedSlot}`);
            }}
            className="h-12 px-8 bg-primary hover:bg-primary/90"
          >
            Book Now
          </Button>
        </div>
      </div>
    </div>
  );
}
