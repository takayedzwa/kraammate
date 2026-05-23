# Dutch Babies Green Book 🍼

A modern, mobile-first web application for tracking baby growth and development, inspired by the Dutch "Groene Boekje" baby health and development booklet.

## Features

### Core Functionality
- **Baby Profiles** - Create and manage profiles with birth details, measurements, and medical info
- **Daily Tracking** - Log feeding, sleep, diapers, and growth metrics
- **Milestones** - Capture precious first moments with photos and notes
- **Vaccination Schedule** - Dutch Rijksvaccinatieprogramma with reminders
- **Health Records** - Temperature, symptoms, medications, and doctor visits
- **Analytics Dashboard** - Visualize trends with charts and reports

### Collaboration
- **Share with Kraamzorger** - Generate secure invite links for maternity nurses
- **Permission Levels** - View-only or view-and-edit access
- **Real-time Updates** - Live sync using Supabase Realtime
- **Audit Log** - Track who made each entry

### Technical Features
- **PWA Support** - Install on mobile devices, works offline
- **Responsive Design** - Mobile-first, works on all screen sizes
- **Multi-language** - Dutch and English support (i18n ready)
- **Secure Authentication** - Email, Google OAuth, and magic links

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Forms**: React Hook Form, Zod validation

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kraammate
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Set up the database**
   - Go to your Supabase project
   - Navigate to SQL Editor
   - Run the contents of `supabase/schema.sql`

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open the application**
   - Visit [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── auth/            # Authentication pages
│   ├── dashboard/       # Main dashboard
│   ├── babies/          # Baby profile management
│   ├── tracking/        # Daily tracking (feeding, sleep, diapers)
│   ├── milestones/      # Milestone timeline
│   ├── medical/         # Health records
│   ├── analytics/       # Charts and reports
│   └── share/           # Sharing and invites
├── components/
│   ├── ui/              # Base UI components
│   ├── tracking/        # Tracking form components
│   └── dashboard/       # Dashboard widgets
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions and configs
└── types/               # TypeScript type definitions
```

## Database Schema

The application uses the following main tables:

- `profiles` - User profiles
- `babies` - Baby profiles
- `caregivers` - Caregiver access relationships
- `share_tokens` - Secure invite tokens
- `feeding_logs` - Feeding tracking
- `sleep_logs` - Sleep tracking
- `diaper_logs` - Diaper change tracking
- `growth_logs` - Weight/height measurements
- `milestones` - Development milestones
- `vaccination_schedule` - Vaccination records
- `doctor_visits` - Medical visit records
- `activity_feed` - Real-time activity log
- `audit_log` - Security audit trail

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Docker

```bash
docker build -t kraammate .
docker run -p 3000:3000 kraammate
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-side) | No |
| `NEXT_PUBLIC_APP_URL` | Application URL | No |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Inspired by the Dutch [Groene Boekje](https://www.cjg.nl/groene-boekje)
- Built with [Supabase](https://supabase.com)
- UI components from [shadcn/ui](https://ui.shadcn.com)

## Support

For support, email support@kraammate.nl or open an issue in the repository.
