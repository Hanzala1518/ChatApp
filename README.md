# 💬 ChatApp

A modern, real-time team chat application built with Next.js 16 and Supabase. Features a stunning, immersive UI with dark/light mode support.

![Next.js](https://img.shields.io/badge/Next.js-16.0-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green?logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38B2AC?logo=tailwind-css)

## ✨ Features

### Core Functionality
- 💬 **Real-time Messaging** - Instant message delivery in channels and DMs
- 📢 **Public & Private Channels** - Create channels with optional invite-code protection
- 👥 **Direct Messages** - 1:1 private conversations
- 🔐 **Authentication** - Email/password and Google OAuth support
- 🟢 **Presence Indicators** - See who's online in real-time
- ⌨️ **Typing Indicators** - Know when others are typing
- 📜 **Message History** - Paginated message loading
- ✏️ **Message Editing** - Edit your sent messages
- 🗑️ **Message Deletion** - Delete your own messages
- 🔍 **Message Search** - Search across all channels and DMs
- 👤 **User Profiles** - Customizable profiles with avatar upload
- 🎨 **Dark/Light Mode** - Beautiful theme toggle

### UI/UX
- 🌈 Soft gradients and aesthetic color palette
- 💫 Smooth animations and transitions
- 📱 Responsive design for all screen sizes
- 🎯 Intuitive sidebar navigation
- ✨ Modern glass-morphism effects

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Real-time | Supabase Realtime |
| Storage | Supabase Storage |
| State | Zustand + React Query |
| Icons | Lucide React |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (free tier works)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/chatapp.git
cd chatapp
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** in your Supabase dashboard
3. Copy the contents of `supabase-setup.sql` and run it
4. Go to **Project Settings > API** and copy your credentials

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 5. Enable Google OAuth (Optional)

1. Go to Supabase Dashboard > Authentication > Providers
2. Enable Google provider
3. Add your Google Client ID and Secret from [Google Cloud Console](https://console.cloud.google.com)
4. Set the redirect URL to: `https://your-project-ref.supabase.co/auth/v1/callback`

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
├── app/
│   ├── (auth)/           # Login & Register pages
│   ├── (main)/           # Authenticated app pages
│   │   ├── channels/     # Channel chat pages
│   │   ├── dms/          # Direct message pages
│   │   └── profile/      # User profile page
│   ├── api/              # API routes
│   └── auth/             # Auth callback handler
├── components/
│   ├── channels/         # Channel-related components
│   ├── chat/             # Message components
│   ├── dms/              # DM components
│   ├── layout/           # Sidebar, navigation
│   ├── profile/          # Profile components
│   ├── providers/        # Context providers
│   ├── search/           # Search dialog
│   └── ui/               # shadcn/ui components
├── lib/
│   ├── supabaseClient.ts # Client-side Supabase
│   ├── supabaseServer.ts # Server-side Supabase
│   ├── store.ts          # Zustand store
│   ├── types.ts          # TypeScript types
│   ├── utils.ts          # Utility functions
│   └── validators.ts     # Zod schemas
└── supabase-setup.sql    # Database setup script
```

## 🗄️ Database Schema

The app uses the following tables:

| Table | Description |
|-------|-------------|
| `profiles` | User profiles (extends auth.users) |
| `channels` | Chat channels (public/private) |
| `channel_members` | Channel membership & roles |
| `messages` | Channel messages |
| `direct_conversations` | 1:1 DM conversations |
| `direct_messages` | DM messages |
| `message_reactions` | Emoji reactions on messages |
| `dm_reactions` | Emoji reactions on DMs |

All tables have Row Level Security (RLS) enabled for data protection.

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Add environment variables in Vercel project settings
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/chatapp)

### Environment Variables for Production

Set these in your Vercel project settings:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 🔒 Security Features

- **Row Level Security (RLS)** - Database-level access control
- **Supabase Auth** - Secure authentication with session management
- **API Route Protection** - Server-side authentication checks
- **Input Validation** - Zod schemas for request validation

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Supabase](https://supabase.com/) - Open Source Firebase Alternative
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI Components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-First CSS Framework
- [Lucide](https://lucide.dev/) - Beautiful Icons

---

Built with ❤️ using Next.js and Supabase
