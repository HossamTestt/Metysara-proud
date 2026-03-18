# Metysara App Setup Instructions

## 1. Prerequisites
- **Flutter SDK** (`>=3.3.0`) installed on your machine.
- **Firebase CLI** (`firebase-tools`) & **FlutterFire CLI** installed to connect the project.

## 2. Generate the missing platforms
Because this code was scaffolded in an environment without Flutter installed, the underlying Android and iOS directories are omitted. To generate them:
1. Open your terminal.
2. Navigate to this `metysara_app` directory.
3. Run: `flutter create --org com.metysara .` (Mind the dot at the end)

## 3. Link Firebase
Since the Firestore schema is completely ready, you simply need to generate the configuration files:
1. Run `flutterfire configure` inside this directory.
2. Select the existing Firebase project (the one where you set up `users`, `vendors`, `bookings`, etc.).
3. Check the platforms (Android, iOS).
4. This will overwrite `lib/firebase_options.dart` with valid configuration tokens.

## 4. Generate the Models (Freezed)
This app uses `freezed` and `json_serializable` to map exactly to your Firestore collections without errors.
Run this command to build the `.freezed.dart` and `.g.dart` model files:
`flutter pub run build_runner build --delete-conflicting-outputs`

## 5. Architecture Summary
- **Routing**: `lib/core/routing/app_router.dart` controls role-based redirecting based on domain ending (`@metysara.com`, `@metysaravendors.com`).
- **State Management**: Uses Riverpod. `auth_provider.dart` caches user data globally.
- **Booking Safety**: `lib/data/repositories/booking_repository.dart` implements a genuine Firestore Transaction that checks boolean `isAvailable` and writes the booking atomically.
- **Theme**: Uses `app_theme.dart` with a preconfigured luxury aesthetic (Gold/Champagne) mapped dynamically to Dark/Light modes.

## Next Steps
Open the project in Android Studio or VS Code and run `flutter run`.
