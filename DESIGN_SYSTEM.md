# Venue Booking Platform - Egypt

A premium mobile-first venue booking platform for Egypt, designed for booking wedding venues and funeral venues (Dar Monasbat - دار مناسبات).

## 🎨 Design System

### Brand Colors
- **Primary Gold**: `#C5A572` - Used for CTAs, highlights, and premium accents
- **Secondary Navy**: `#2C4A5E` - Used for headers, text, and professional elements
- **Background Cream**: `#F5F3E7` - Soft, warm background for premium feel
- **Card White**: `#ffffff` - Clean cards and surfaces
- **Muted**: `#E8E6DA` - Subtle backgrounds and disabled states

### Typography
- **English**: Poppins (Modern, clean, professional)
- **Arabic**: Tajawal (RTL-optimized, elegant)
- Font weights: 300 (Light), 400 (Regular), 500 (Medium), 600 (Semi-Bold), 700 (Bold)

### Design Principles
- **Premium & Elegant**: Soft shadows, rounded corners (12px), smooth transitions
- **Mobile-First**: Optimized for iOS and Android
- **Bilingual**: Full RTL support for Arabic
- **Accessible**: High contrast, clear hierarchy, touch-friendly targets (44px minimum)

## 📱 Screens

### 1. Splash Screen (`/`)
- Animated logo with brand colors
- Auto-navigates to onboarding after 2.5s

### 2. Onboarding (`/onboarding`)
- 3 slides introducing key features
- Skip button and progress indicators
- Bilingual content (English + Arabic)

### 3. Login & Signup (`/login`, `/signup`)
- Email/Phone and password authentication
- Google OAuth integration
- Form validation and error handling

### 4. Home Screen (`/home`)
- Search bar with filter access
- Category cards (Wedding / Funeral venues)
- Featured venues carousel with save functionality
- Bottom navigation bar

### 5. Search Results (`/search`)
- Advanced filters (City, Price, Capacity, Date)
- Sort options (Recommended, Price, Rating)
- Venue cards with key information
- Save/unsave functionality

### 6. Venue Detail (`/venue/:id`)
- Image gallery with carousel
- Venue information and ratings
- Tabs: Overview, Amenities, Availability
- Interactive calendar for date selection
- Map location preview
- "Book Now" CTA

### 7. Booking Flow (`/booking/:id`)
- Date selection calendar
- Guest count selector (with min/max)
- Additional services (Photography, Catering, DJ, etc.)
- Special requests text area
- Booking summary with pricing

### 8. Payment (`/payment/:id`)
- Multiple payment methods:
  - Credit/Debit cards (Visa, Mastercard, Amex)
  - Mobile wallets (Vodafone Cash, Orange Money, Fawry)
- Secure payment indicators
- Payment summary

### 9. Booking Confirmation (`/confirmation/:id`)
- Success animation
- Booking reference number
- Complete booking details
- Contact support options
- Download receipt
- Navigation to profile/bookings

### 10. Profile (`/profile`)
- User information
- Stats cards (Bookings, Saved, Reviews)
- Tabs:
  - **Bookings**: All user bookings with status
  - **Saved**: Saved venues
  - **Settings**: Notifications, language, admin access
- Logout functionality

### 11. Admin Dashboard (`/admin`)
- Dashboard statistics (Venues, Bookings, Revenue, Users)
- Tabs:
  - **Bookings**: Manage all bookings, approve/reject
  - **Venues**: Add/edit/delete venues, view analytics
- Venue management (capacity, pricing, status)

## 🧩 Reusable Components

All components are located in `/src/app/components/ui/`:

- **Button**: Primary, secondary, outline variants
- **Card**: Elevated surfaces with shadows
- **Input**: Text inputs with icons
- **Calendar**: Date picker with disable dates
- **Tabs**: Tabbed navigation
- **Sheet**: Bottom sheet for filters
- **Select**: Dropdown selector
- **Slider**: Range slider for filters
- **Switch**: Toggle switches
- **Checkbox**: Selection boxes

## 🌐 Internationalization

The app supports both English and Arabic with proper RTL handling:

- Language context in `/src/app/contexts/LanguageContext.tsx`
- All text has both English and Arabic versions
- RTL direction changes automatically
- Fonts switch based on language (Poppins ↔ Tajawal)

## 🎯 Key Features

1. **Bilingual Support**: Seamless English/Arabic switching
2. **Premium Design**: Elegant, modern interface with brand colors
3. **Complete Booking Flow**: From search to confirmation
4. **Admin Dashboard**: Venue and booking management
5. **Mobile-Optimized**: Touch-friendly, responsive design
6. **Save & Favorites**: Users can save venues
7. **Advanced Filters**: City, price, capacity, date filtering
8. **Multiple Payment Methods**: Cards and mobile wallets
9. **Real-time Availability**: Calendar-based booking system
10. **Additional Services**: Photography, catering, decoration add-ons

## 🚀 Navigation Flow

\`\`\`
Splash → Onboarding → Login/Signup → Home
                                        ↓
                                    Search → Venue Detail → Booking → Payment → Confirmation
                                        ↓
                                    Profile (Bookings/Saved/Settings)
                                        ↓
                                    Admin Dashboard (for admins)
\`\`\`

## 💡 Usage Notes

- The app uses React Router for navigation
- All venue data is currently mock data (can be replaced with API calls)
- Payment processing is simulated (integrate with real payment gateway)
- All images are sourced from Unsplash
- The logo is imported from Figma assets

## 🎨 Design Export

This design is fully responsive and ready for developer handoff. All components follow a consistent design system and can be easily modified or extended.

### Component Structure
- `/src/app/screens/` - All screen components
- `/src/app/components/` - Reusable UI components
- `/src/app/contexts/` - React contexts (Language)
- `/src/app/routes.ts` - Routing configuration
- `/src/styles/` - Global styles and theme

## 📱 Mobile Compatibility

- Optimized for mobile viewports (375px - 428px)
- Touch-friendly interactions
- Bottom navigation for easy thumb access
- Swipe gestures for image galleries
- Pull-to-refresh ready

---

**Built with**: React, TypeScript, Tailwind CSS v4, React Router, Radix UI
**Design Language**: Premium, Elegant, Bilingual, Mobile-First
