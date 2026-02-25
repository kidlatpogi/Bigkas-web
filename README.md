# Bigkas Web

A modern pronunciation practice application built with React and Vite. Bigkas helps users improve their Filipino pronunciation through interactive recording and analysis.

## Features

- 🎤 **Audio Recording** - Record and playback pronunciation practice
- 📊 **Analysis & Feedback** - Get detailed pronunciation analysis
- 📈 **Progress Tracking** - View practice history and scores
- 🔐 **Secure Authentication** - User login and registration
- 🎨 **Modern UI** - Clean, responsive design with dark mode support
- 📱 **Mobile Friendly** - Works on desktop and mobile devices

## Project Structure

```
src/
├── api/               # API client and endpoints
├── assets/            # Images, icons, logos
├── components/        # Reusable UI components
│   ├── audio/        # Audio recording & visualization
│   └── common/       # Shared components (buttons, cards, etc.)
├── config/           # Environment configuration
├── context/          # React Context (auth, sessions)
├── hooks/            # Custom React hooks
├── pages/            # Page components
│   ├── auth/        # Login & register pages
│   ├── main/        # Dashboard, practice, history, profile
│   └── session/     # Session detail & results pages
├── routes/          # React Router configuration
├── styles/          # Global styles & theme
└── utils/           # Utilities (validators, formatters, constants)
```

## Tech Stack

- **Frontend Framework:** React 19
- **Build Tool:** Vite 7
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **State Management:** React Context
- **Styling:** CSS with CSS Variables
- **Language:** JavaScript (ES6+)

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kidlatpogi/Bigkas-web.git
   cd Bigkas-web/bigkas-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your backend API URL:
   ```env
   VITE_API_BASE_URL=http://localhost:8000
   # Optional (recommended for local dev without backend/Supabase schema):
   VITE_ENABLE_DAILY_QUOTE_FETCH=false
   VITE_ENABLE_SESSION_PERSISTENCE=false
   ```

### Development

Start the development server:

```bash
npm run dev
```

The app will open at `http://localhost:5174`

### Demo Mode

If you don't have a backend setup yet, you can use **demo mode**:
1. Navigate to the Login or Register page
2. Enter any email and password
3. The app automatically enables demo mode when the backend is unavailable
4. Explore all features without a backend!

### Build

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

### Linting

Run ESLint:

```bash
npm run lint
```

## Authentication Flow

### Public Routes (no login required)
- `/login` - User login
- `/register` - User registration

### Protected Routes (login required)
- `/dashboard` - Main dashboard with quick access
- `/practice` - Record pronunciation practice
- `/history` - View past practice sessions
- `/profile` - User account settings
- `/session/:sessionId` - Session details
- `/session/:sessionId/result` - Pronunciation analysis results

## API Integration

The app connects to a FastAPI backend with the following endpoints:

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user
- `POST /auth/refresh` - Refresh token

### Sessions
- `GET /sessions` - List user sessions
- `GET /sessions/{id}` - Get session details
- `POST /sessions` - Create new session
- `POST /sessions/{id}/audio` - Submit audio recording
- `GET /sessions/{id}/results` - Get analysis results
- `DELETE /sessions/{id}` - Delete session

## Configuration

### Environment Variables

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000
VITE_API_TIMEOUT=30000

# Optional feature flags
# In production these default to enabled.
# In development these default to disabled unless set to true.
VITE_ENABLE_DAILY_QUOTE_FETCH=false
VITE_ENABLE_SESSION_PERSISTENCE=false

# App Configuration
VITE_APP_NAME=Bigkas Web
```

### Theme Customization

Edit `src/styles/globals.css` to customize:
- Color scheme
- Typography
- Spacing
- Border radius
- Shadows

## Components

### Common Components
- **PrimaryButton** - Reusable button with variants (primary, secondary, outline, danger)
- **Card** - Container component with styling
- **Typography** - Text components (Heading, Text, Label)
- **Navbar** - Top navigation bar
- **Sidebar** - Side navigation (mobile responsive)

### Audio Components
- **AudioRecordButton** - Start/stop recording with visual feedback
- **AudioWaveform** - Real-time audio visualization

## Hooks

- **useAuth()** - Access authentication context
- **useSessions()** - Access session context with auto-fetch option

## State Management

### AuthContext
Manages user authentication state:
- User data
- Loading state
- Login/logout/register actions

### SessionContext
Manages practice session state:
- Current sessions list
- Session CRUD operations
- Audio submission

## Styling

The app uses CSS variables for theming:

```css
/* Colors */
--color-primary: #4F46E5
--color-secondary: #10B981
--color-error: #EF4444

/* Spacing */
--spacing-md: 1rem
--spacing-lg: 1.5rem

/* Dark mode support */
[data-theme="dark"] {
  --color-background: #111827;
  /* ... */
}
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Future Enhancements

- [ ] Dark mode toggle
- [ ] Multi-language support
- [ ] Advanced pronunciation metrics
- [ ] Social features (compare with friends)
- [ ] Offline support with service workers
- [ ] Mobile app version
- [ ] Video recording support
- [ ] AI-powered feedback

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, feature requests, or questions:
- Open an issue on [GitHub Issues](https://github.com/kidlatpogi/Bigkas-web/issues)
- Contact the maintainers

## Authors

- **kidlatpogi** - Initial project setup and core features

## Acknowledgments

- React and Vite communities for excellent tools
- All contributors and testers

---

**Note:** This is the frontend application. For the complete Bigkas system, you'll also need the FastAPI backend.
