# Gym Pal

Build a Complete Gym QR Attendance Management System (100% Free, No Docker, No Self-Hosting, No Paid Services. Project Overview: A simple, professional, mobile-friendly gym attendance system for a small gym. Tech Stack: Frontend—React, Vite, Tailwind CSS, React Router, Axios, React Hook Form, Zod Validation. Backend—Supabase (Authentication, PostgreSQL, Database, Storage, Row Level Security). Charts: Recharts. QR Code: qrcode / html5-qrcode. Export: SheetJS (xlsx). Notifications: React Toastify. Icons: Lucide React. Date handling: Day.js. Main Concept: One static QR code outside the gym. First-time scan opens registration (name, mobile, optional age/gender, plan). Generate member ID and save to Supabase. Returning scan securely identifies the member and marks attendance automatically (prevent duplicate check-ins). Store member ID, name, date, and check-in time. Admin Dashboard (secure login): total members, today's attendance, active and expired memberships, pending payments, monthly revenue, trends. Membership Management: add, edit, renew, delete, search member. Track active, expiring in 7 days, expired memberships. Payment Management: view paid, pending, and overdue members with revenue summary. WhatsApp Reminder: for expiring or overdue memberships, provide a “Send WhatsApp Reminder” button using WhatsApp Click-to-Chat with a pre-filled message. QR Code Generation: generate only one permanent static QR code that simply opens the web application (no per-member QR). UI Requirements: premium gym theme, modern responsive layout, dark and light mode, smooth animations, beautiful cards, fast loading. Security: use Supabase Auth, Row Level Security, input validation, protected admin routes. Folder Structure: organize components, pages, hooks, services, utils, supabase, assets, config cleanly. Error Handling: provide friendly error messages, loading and empty states, success toasts. Deployment: deploy frontend on Vercel and use Supabase backend. Final Deliverables: complete source code, responsive UI, attendance and membership modules, Excel export, WhatsApp click-to-chat reminder, documentation and README, clean, beginner-friendly code using only free technologies. And name the Gym System as Jupiter Gym

## Build with Lovable

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
