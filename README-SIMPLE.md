# MediGuide AI - Vanilla HTML/CSS/JS Version

This is a pure HTML, CSS, and JavaScript version of MediGuide AI - no build tools, no frameworks, just vanilla web technologies.

## 🚀 Quick Start

### 1. Setup

No installation needed! Just open the HTML files in your browser.

However, for the AI health plan generation to work, you'll need to run a simple Node.js server:

```bash
# Set your OpenAI API key
export OPENAI_API_KEY=your_openai_api_key

# Run the server
node server.js
```

The server will start on `http://localhost:3001`

### 2. Update API URL

In `js/api.js`, make sure the `API_BASE_URL` matches your server:

```javascript
const API_BASE_URL = 'http://localhost:3001/api';
```

### 3. Open in Browser

Simply open `index.html` in your web browser, or use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js (http-server)
npx http-server -p 8000
```

Then visit `http://localhost:8000`

## 📁 File Structure

```
mediguide-ai/
├── index.html              # Home page
├── health-plan.html        # Health plan display
├── dashboard.html          # User dashboard
├── reminders.html          # Reminders management
├── doctors.html            # Doctor finder
├── profile.html            # User profile
├── login.html              # Authentication
├── styles.css              # All styles
├── js/
│   ├── app.js              # Home page logic
│   ├── health-plan.js      # Health plan display
│   ├── dashboard.js        # Dashboard logic
│   ├── reminders.js        # Reminders logic
│   ├── doctors.js          # Doctor finder logic
│   ├── profile.js          # Profile logic
│   ├── auth.js             # Authentication
│   ├── api.js               # API utilities
│   ├── storage.js           # localStorage utilities
│   └── notifications.js     # Notification system
├── server.js                # Simple Node.js backend
└── manifest.json            # PWA manifest
```

## 🎯 Features

- ✅ Pure HTML/CSS/JavaScript - no build step
- ✅ AI health plan generation (requires backend server)
- ✅ Smart reminders with notifications
- ✅ Doctor finder with map
- ✅ User dashboard
- ✅ LocalStorage for data persistence
- ✅ Responsive design
- ✅ Modern UI

## ⚙️ Configuration

### OpenAI API (Required for AI features)

1. Get your API key from https://platform.openai.com/
2. Set it as environment variable:
   ```bash
   export OPENAI_API_KEY=your_key_here
   ```
3. Run the server: `node server.js`

### Google Maps (Optional)

1. Get API key from https://console.cloud.google.com/
2. Update `doctors.html`:
   ```html
   <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_KEY&libraries=places"></script>
   ```

## 📝 Usage

1. **Generate Health Plan**: Enter a disease name on the home page
2. **View Plan**: See personalized diet, exercise, medicine, and doctor recommendations
3. **Set Reminders**: Add reminders for meals and medications
4. **Find Doctors**: Search for nearby healthcare professionals
5. **Track Progress**: View your dashboard with stats and schedule

## 🔧 How It Works

- **Frontend**: Pure HTML/CSS/JavaScript
- **Backend**: Simple Node.js server for OpenAI API calls (CORS proxy)
- **Storage**: localStorage for client-side data persistence
- **Notifications**: Web Notifications API

## 🌐 Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Modern mobile browsers

## 📦 Deployment

### Option 1: Static Hosting

Upload all files to any static hosting service:
- Netlify
- Vercel
- GitHub Pages
- AWS S3

**Note**: You'll still need to run the Node.js server separately for AI features, or use a serverless function.

### Option 2: Full Server

Deploy both frontend and backend together:
- Heroku
- Railway
- DigitalOcean
- AWS EC2

## 🐛 Troubleshooting

### AI Health Plan Not Working
- Make sure the Node.js server is running
- Check that `OPENAI_API_KEY` is set
- Verify the API URL in `js/api.js` matches your server

### Notifications Not Working
- Browser must allow notifications
- Site must be served over HTTPS (or localhost)
- Check browser notification settings

### Maps Not Loading
- Verify Google Maps API key is correct
- Check browser console for errors
- Ensure Maps JavaScript API is enabled in Google Cloud Console

## 📄 License

MIT

