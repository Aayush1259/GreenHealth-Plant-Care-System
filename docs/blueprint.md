# **App Name**: VerdantAI

## Core Features

- Image Input: Implement an intuitive interface for image upload and capture, allowing users to easily submit plant images for identification and disease detection.
- Plant Identification: Integrate Google Gemini Vision Pro to identify plant species from uploaded images and display the results, including common and scientific names, along with care tips.
- Disease Detection: Integrate Google Gemini Vision Pro to detect plant diseases from uploaded images and provide information on symptoms, causes, treatments, and prevention methods. The LLM may use a tool to decide if the information about the disease should be displayed to the user.
- My Garden: Allow users to save identified plants to a personal garden dashboard, where they can track care information and set reminders for watering and maintenance.
- GreenAI Assistant: Implement an AI-powered chat interface using Google Gemini to provide personalized advice and contextual suggestions for plant care, acting as a helpful assistant. The LLM may use a tool to decide if the information about some specific fertilizer should be displayed to the user.

## Style Guidelines

- Primary color: Natural green (#0E8F6E) for primary buttons, key UI elements, and branding.
- Secondary color: Light sage (#F2FCE2) for backgrounds, cards, and secondary elements.
- Accent color: Warm earth tones (#1A3129) for highlights, special features, and emphasis.
- Headings: Clear, modern sans-serif font (Inter or similar), medium to semi-bold weights.
- Body text: Highly readable sans-serif with appropriate line height and letter spacing.
- Use Lucide React icons consistently throughout the interface.
- Cards: Rounded corners (8px radius), subtle drop shadows, minimal borders.
- Subtle fade transitions between screens (300ms duration, ease timing function).

## Original User Request

Project Overview
Develop a Progressive Web App (PWA) named "Plant Care System (GreenHealth)" that empowers users to identify plants, detect plant diseases, and manage their garden collections. The application should be visually appealing, user-friendly, and fully functional across devices with offline capabilities.

1. UI/UX Design
   Color Palette
   Primary: Natural green (#0E8F6E) - for primary buttons, key UI elements, and branding
   Secondary: Light sage (#F2FCE2) - for backgrounds, cards, and secondary elements
   Accent: Warm earth tones (#1A3129) - for highlights, special features, and emphasis
   Neutral: Soft grays (#F8F8F8, #E8E8E8, #D1D1D1, #A9A9A9, #6B6B6B) - for text, borders, and subtle UI elements
   Typography
   Headings: Clear, modern sans-serif font (Inter or similar), medium to semi-bold weights
   Body text: Highly readable sans-serif with appropriate line height and letter spacing
   Font size hierarchy: 24px (main headings), 18px (subheadings), 16px (body text), 14px (secondary text), 12px (captions)
   Component Design
   Cards: Rounded corners (8px radius), subtle drop shadows, minimal borders
   Buttons: Clear hierarchy (primary, secondary, tertiary), consistent padding, hover/active states
   Forms: Clean layout, clear labels, intuitive input validation
   Navigation: Intuitive bottom navigation for mobile, sidebar for larger screens
   Iconography
   Use Lucide React icons consistently throughout the interface
   Key icons: Leaf, Camera, Bell, User, Home, Brain/AI
   Icon weights and sizes should be consistent (24px standard size, 2px stroke width)
   Animations & Transitions
   Subtle fade transitions between screens (300ms duration, ease timing function)
   Micro-interactions for button presses, form completions, and status changes
   Loading states with branded animation for AI processing
   Responsive Design
   Mobile-first approach with optimized layouts for tablets and desktops
   Critical breakpoints: 320px, 768px, 1024px, 1440px
   Consistent spacing system based on 4px increments
   Accessibility
   Minimum contrast ratio of 4.5:1 for all text
   Focus states clearly visible for keyboard navigation
   Semantic HTML structure with appropriate ARIA attributes
2. Frontend Development
   Technology Stack
   React with TypeScript using Vite
   Tailwind CSS for styling
   Lucide React for icons
   Firebase for authentication, storage, and database
   Tanstack React Query for data fetching
   Shadcn UI components
   Pages and Components
   Home Page: Feature grid (plant identification, disease detection, community, garden), hero image section
   Plant Identification Page: Image upload/capture interface, sample gallery, result display with accordions
   Plant Disease Page: Similar to identification, disease-specific UI, accordions for symptoms, causes, treatments
   Garden Page: Grid display of saved plants, care information, watering schedules
   Profile Page: User information, settings, authentication options
   GreenAI Page: AI assistant interface
   Reusable Components: Image selector, loading indicators, accordion, action buttons, bottom navigation, header
   PWA Implementation
   Service worker for offline functionality (caching, background sync)
   Web manifest with appropriate icons, theme colors, and display settings
   Custom installation prompt
   Network status monitoring
   Update detection
3. Backend Development
   API Integration
   Google Gemini Vision Pro API for image analysis (plant identification and disease detection)
   Error handling and fallbacks for API requests
   Image processing utilities
   Firebase Integration
   Authentication (user accounts)
   Cloud Storage (image uploads)
   Firestore Database (plant data, user data, garden data)
   API Endpoints
   Plant identification endpoint (image upload, API call, response processing)
   Disease detection endpoint (image upload, API call, response processing)
   User profile management endpoints
   Garden data management endpoints (add, remove, update plants)
4. Features & Functionalities
   Plant Identification
   Image upload/capture
   Integration with Google Gemini AI
   Display plant information (common/scientific names, care tips, growth characteristics)
   Disease Detection
   Image upload
   Integration with Google Gemini AI
   Display disease information (symptoms, causes, treatments, prevention)
   My Garden
   Saving identified plants
   Garden dashboard
   Care reminders (watering, fertilizing, maintenance)
   GreenAI Assistant
   AI-powered chat interface
   Personalized advice
   Contextual suggestions
   Community Features (Future Enhancement)
   Community section
   Knowledge base
   Q&A section
5. Workflow & Pipelines
   Development Workflow
   Agile development methodology (sprints, daily stand-ups)
   Version control (Git)
   Code reviews
   Testing (unit tests, integration tests, end-to-end tests)
   Deployment Pipeline
   Continuous Integration (CI) with automated testing
   Continuous Deployment (CD) to Firebase Hosting
   Automated builds and deployments
   API Request Workflow
   User uploads/captures an image
   Frontend sends the image to the appropriate API endpoint
   Backend processes the image and sends it to the Google Gemini AI API
   Backend receives the response from the API
   Backend processes the response and returns structured data to the frontend
   Frontend displays the results to the user
6. Technical Requirements
   Ensure all Firebase configurations are correctly set up
   Implement proper error handling throughout the application
   Support offline functionality for core features
   Ensure the app is installable on devices
   Optimize performance for mobile devices
   Implement responsive design for all screen sizes
   Implement sharing functionality where available
   Enable downloading of identification/diagnosis reports
   Follow all UI/UX design specifications
7. Progressive Web App Features
   Service worker implementation
   Installable on devices
   Offline functionality
   Push notifications (future enhancement)
   Background sync
   Network status monitoring
   Update detection and management

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// <https://firebase.google.com/docs/web/setup#available-libraries>

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
apiKey: "AIzaSyAlnb_txtpjQqLPoDdPEuQcVKGwYmZygw8",
authDomain: "plantcaresystem-d0fdd.firebaseapp.com",
projectId: "plantcaresystem-d0fdd",
storageBucket: "plantcaresystem-d0fdd.firebasestorage.app",
messagingSenderId: "327115438975",
appId: "1:327115438975:web:dea286e6bf62f68987384a",
measurementId: "G-RJM57F3Y0T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

# Configure Gemini - replace with your actual API key

API_KEY = "AIzaSyDAxUv4BTwOT6COqs3c_wSgzYc37CGF5rE"
genai.configure(api_key=API_KEY)
model = genai.GenerativeModel("models/gemini-2.0-flash-exp")
