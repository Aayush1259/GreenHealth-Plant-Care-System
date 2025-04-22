# GreenHealth Plant Care System

A comprehensive plant care application that helps users identify plants, detect diseases, and provide care recommendations.

## Features

- **Plant Identification**: Upload photos to identify plant species
- **Disease Detection**: Detect plant diseases and get treatment recommendations
- **Plant Care Reminders**: Set reminders for watering and other plant care tasks
- **Garden Management**: Track your plants and their growth
- **AI Assistant**: Get personalized care advice from our GreenAI assistant

## Technologies Used

- Next.js 15
- React
- Firebase (Authentication, Firestore, Storage)
- Tailwind CSS
- Cloudinary for image processing
- Google Generative AI for plant identification and disease detection

## Getting Started

### Prerequisites

- Node.js (>= 18.x)
- npm or yarn
- Firebase account for backend services
- Cloudinary account for image hosting (optional)
- Google AI API key for AI features

### Installation

1. Clone the repository
```bash
git clone https://github.com/Aayush1259/GreenHealth-Plant-Care-System.git
cd GreenHealth-Plant-Care-System
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables by creating a `.env.local` file with the following variables:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_cloudinary_upload_preset
GOOGLE_AI_API_KEY=your_google_ai_api_key
```

4. Start the development server
```bash
npm run dev:safe
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
