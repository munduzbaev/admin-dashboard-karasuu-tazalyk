Build a complete, production-ready admin dashboard web application 
for "МП Тазалык Кара-Суу" — a municipal waste management company 
in Kara-Suu, Kyrgyzstan.

=== TECH STACK ===
- React + Vite
- Tailwind CSS
- React Router v6
- Supabase JS client (for auth only)
- All data from REST API (no direct Supabase queries)

=== API BASE URL ===
https://tazalyk-api.vercel.app

All requests return: { success: bool, data: any, error?: string }
Auth header: Authorization: Bearer {token}

=== DESIGN SYSTEM ===
Style: Glassmorphism + Dark theme
- Background: Dark (#0f1117) with subtle green gradient glow
- Glass cards: backdrop-filter blur(16px), bg rgba(255,255,255,0.05), 
  border 1px solid rgba(255,255,255,0.1), border-radius 16px
- Primary: #22c55e (green-500)
- Primary dark: #16a34a
- Accent: #4ade80
- Text primary: #f1f5f9
- Text muted: #94a3b8
- Danger: #ef4444
- Warning: #f59e0b
- Font: Space Grotesk (headings) + Inter (body)
- Sidebar: 260px fixed left, glass style
- Desktop-first: min-width 1280px

=== LANGUAGE ===
Bilingual UI: Kyrgyz + Russian
Toggle button in header: [КГ | РУ]
Store language in localStorage

All labels show both:
"Арыздар / Заявки", "Транспорт / Транспорт" etc.

=== AUTH FLOW ===

POST /api/auth/login → { token, user: {id, name, email, role} }
POST /api/auth/register → creates pending user
GET /api/auth/me → current user info

- Store token in localStorage
- Protected routes: redirect to /login if no token
- Role-based: "admin" sees all, "operator" sees limited

Pages:
/login — Login form
/register — Registration (user gets "pending" status, 
  admin must approve)

=== PAGES ===

--- 1. /dashboard (Башкы бет / Главная) ---

Fetch: GET /api/analytics

Top stats row (4 glass cards):
- 📋 Жаңы арыздар / Новые заявки (data.applications.new)
- ✅ Жабылган / Закрыто (data.applications.closed)
- 🚛 Транспорт иштейт / Работает (data.transport.working)
- 🔧 Ремонтто / В ремонте (data.transport.repair)

Charts row:
- Line chart: заявки за 30 дней (data.applications.applications_history)
- Donut chart: по источникам (data.applications.by_source)
- Bar chart: по типу отходов (data.applications.by_waste_type)

Bottom:
- Последние 5 заявок (from /api/applications?limit=5)
- Транспорт статус (from /api/transport, show as cards)
- Завтра вывозы (from /api/schedules/tomorrow)

--- 2. /applications (Арыздар / Заявки) ---

Fetch: GET /api/applications?status=&source=&waste_type=

Header:
- Title + "➕ Жаңы арыз / Новая заявка" button
- Filters: status dropdown, source dropdown, date range, search

Table columns:
№ | Телефон | Тип колдонуучу / Тип пользователя | Мекеме / Учреждение | 
Дарек / Адрес | Таштанды түрү / Тип отходов | 
Статус (badge) | Дата | Действия

Status badges:
- "new" → green "Жаңы / Новая"
- "in_progress" → yellow "Иштелүүдө / В работе"  
- "waiting_user" → blue "Күтүүдө / Ожидание"
- "closed" → gray "Жабылды / Закрыто"
- "pending_review" → orange "Кароодо / На рассмотрении"

Actions per row:
- 👁 View → opens side panel
- ✏️ Edit status
- 📞 Call (tel: link)
- 🗑 Delete (admin only)

APPLICATION SIDE PANEL (slides from right, 420px):
When clicking row → panel opens with:
- Header: Application #{id} + status badge
- Client info: phone, user_type, address
- Waste type + description
- Institution info (if institution user)
- Status change dropdown + Save button
- Chat/messages section:
  GET /api/applications/{id}/messages
  POST /api/applications/{id}/messages
  Message input + Send button

--- 3. /applications/new (Жаңы арыз / Новая заявка) ---

Manual application form for operators:

Step 1 — User type:
  Radio: 👤 Жашоочу / Житель  |  🏢 Мекеме / Учреждение

Step 2 (if Учреждение):
  - Institution dropdown (GET /api/institutions)
  - OR type new institution name

Step 3:
  - Телефон / Телефон (required)
  - Дарек / Адрес (required)
  - Таштанды түрү / Тип отходов (dropdown, GET /api/waste_types)
  - Сүрөттөмө / Описание (textarea)
  - Баштапкы / Источник: [WhatsApp | Телефон | Жеке / Лично]
  - Транспорт (dropdown, GET /api/transport)

Submit → POST /api/applications
Success → redirect to /applications with toast

--- 4. /schedule (График / График) ---

Fetch: GET /api/schedules

Two tabs:
Tab 1: Таблица / Таблица
Table columns:
№ | Объект | Дарек / Адрес | Телефон | Транспорт | 
Кийинки вывоз / След. вывоз | Тип интервала | Действия

Tab 2: Эртең / Завтра
Fetch: GET /api/schedules/tomorrow
Cards for tomorrow's pickups:
  - Object name + address
  - Transport assigned  
  - Client phone (click to call)
  - "✅ Даяр / Готово" button

"➕ Кошуу / Добавить" button → modal form:
Fields:
  - Объект аты / Название объекта
  - Дарек / Адрес
  - Телефон
  - Транспорт (dropdown)
  - Тип интервала (select):
    точная_дата / еженедельно / каждые_N_дней / через_день
  - Интервал мааниси / Значение (суббота / 14 / 2)
  - Кийинки дата / След. дата (date picker)
  
PATCH /api/schedules/{id} for inline editing

--- 5. /transport (Транспорт / Транспорт) ---

Fetch: GET /api/transport

Grid of vehicle cards (3 columns):
Each card shows:
  - Vehicle icon (🚛 or 🚜 based on type)
  - Name + plate number (large)
  - Type badge (мусоровоз/ассенизатор/трактор)
  - Status badge:
    available → green "Бош / Свободен"
    working → blue "Иштейт / Работает"
    repair → red "Ремонтто / В ремонте"
  - Current task (if any)
  - Driver name + phone
  - Fuel level progress bar
  - Mileage
  - "Көбүрөөк / Подробнее →" button

VEHICLE DETAIL SIDE PANEL (slides from right, 440px):
GET /api/transport/{id} → includes history

Panel sections:
1. Header: name, plate, status change dropdown
2. Info: type, driver, fuel, mileage, last/next service
3. Current task input (editable inline)
4. Маршрут / Маршрут: 
   Shows today's schedules for this transport
5. Тарых / История:
   Table from transport_history
   Columns: Дата, Аракет / Действие, Сүрөттөмө / Описание
   Paginated (10 per page)

"➕ Транспорт кошуу / Добавить" button → modal:
  POST /api/transport
  Fields: name, plate, type, driver_name, driver_phone, 
          fuel_level, status

--- 6. /operators (Операторлор / Операторы) --- ADMIN ONLY ---

If role !== "admin" → show "Мүмкүнчүлүк жок / Нет доступа"

Fetch: GET /api/users (shows all users with status)

Table columns:
№ | Аты / ФИО | Email | Телефон | 
Ролу / Роль | Статус (pending/approved/rejected) | 
Акыркы кириш / Последний вход | Действия

Actions:
- ✅ Approve → PATCH /api/users/{id}/approve
- ❌ Reject → PATCH /api/users/{id}/reject
- 🔑 Change role → PATCH /api/users/{id}/role
- 🗑 Delete → DELETE /api/users/{id}

Pending users section at top (highlighted in orange):
  New registration requests waiting for approval

"➕ Оператор кошуу / Добавить оператора" button → modal:
  POST /api/auth/register
  Fields: name, email, password, role (operator/admin)

--- 7. /reports (Отчёттор / Отчёты) ---

Fetch: GET /api/reports/summary?date_from=&date_to=

Date range picker at top

Summary cards:
- Total applications
- Completed
- Pending
- Average response time

Charts:
- Bar chart: applications by day (30 days)
- Pie chart: by waste type
- Pie chart: by source (WhatsApp/phone/walk-in)
- Bar chart: by user type (resident/institution)

Transport usage table:
  GET /api/reports/summary → transport_usage
  Columns: Транспорт, Гос номер, Рейстер / Рейсы

Export button: 
  "📥 Excel жүктөө / Скачать Excel"
  Client-side export using SheetJS library

--- 8. /profile (Профиль / Профиль) ---

Fetch: GET /api/auth/me

Show: name, email, role, last login
Edit form: PATCH /api/users/{id}

Password change form:
  PATCH /api/users/{id}/password
  Fields: old_password, new_password, confirm

Notification preferences:
  GET/PATCH /api/users/{id}/notif-prefs
  Toggles: new_application, status_changed, 
            urgent_application, system_update

=== SIDEBAR NAVIGATION ===

Glass sidebar, 260px, fixed left:
Logo area: 🗑️ "Тазалык" + "Кара-Суу"

Nav items with icons:
📊 Башкы бет / Главная → /dashboard
📋 Арыздар / Заявки → /applications
➕ Жаңы арыз / Новая → /applications/new
🚛 График / График → /schedule
🚚 Транспорт → /transport
📈 Отчёттор / Отчёты → /reports
👥 Операторлор / Операторы → /operators (admin only)
👤 Профиль / Профиль → /profile
🚪 Чыгуу / Выход → logout

Bottom of sidebar:
- Current user name + role badge
- Language toggle: КГ | РУ

=== HEADER ===

Top bar (60px):
- Page title (dynamic)
- 🔔 Notifications bell (badge count)
- Language toggle
- User avatar + name dropdown

=== GLOBAL COMPONENTS ===

Toast notifications:
- Success (green), Error (red), Warning (yellow)
- Auto-dismiss after 4 seconds
- Position: top-right

Loading states:
- Skeleton loaders on all tables/lists
- Spinner on buttons while submitting

Empty states:
- Custom illustration + message when no data
- "Маалымат жок / Нет данных"

Confirm dialogs:
- Before delete operations
- Before status changes

=== API CLIENT (src/api.js) ===

Create centralized API client:
const API_BASE = 'https://tazalyk-api.vercel.app'

function getHeaders() {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
}

export const api = {
  get: (path) => fetch(API_BASE + path, { headers: getHeaders() }).then(r => r.json()),
  post: (path, body) => fetch(API_BASE + path, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(r => r.json()),
  patch: (path, body) => fetch(API_BASE + path, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify(body) }).then(r => r.json()),
  delete: (path) => fetch(API_BASE + path, { method: 'DELETE', headers: getHeaders() }).then(r => r.json()),
}

=== IMPORTANT NOTES ===
1. NO mock data — all data from real API
2. Handle loading, error, empty states everywhere
3. Token stored in localStorage key "token"
4. User stored in localStorage key "user" (JSON)
5. On 401 response → clear storage → redirect to /login
6. Tables support sorting by clicking column headers
7. All forms validate before submit
8. Use recharts for all charts
9. Side panels use CSS transform translateX animation
10. Mobile: sidebar collapses to hamburger menu