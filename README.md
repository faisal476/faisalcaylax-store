# NightCity RP — Backend API

## نشر على Render.com (مجاني)

### الخطوات:
1. روح [render.com](https://render.com) وسجّل دخول
2. اضغط **New → Web Service**
3. اختر **Deploy from existing code** أو **Upload**
4. ارفع الملفات هذي (server.js + package.json)
5. اضبط الإعدادات:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Environment:** Node
6. أضف متغيرات البيئة (Environment Variables):
   - `ADMIN_PASSWORD` = كلمة مرور لوحة التحكم (مثال: MyStrongPass123)
   - `FIVEM_API_KEY` = مفتاح API (مثال: nightcity-secret-key-2024)
7. اضغط **Deploy** وانتظر

### بعد النشر:
- ستحصل على رابط مثل: `https://nightcity-api.onrender.com`
- ضعه في `Config.WebsiteURL` في ملف config.lua الخاص بالريسورس
- ضعه في إعدادات موقع Netlify كـ API URL

### نقاط API:
- POST /api/fivem/heartbeat
- GET  /api/fivem/commands
- POST /api/fivem/command-result
- POST /api/admin/login
- GET  /api/admin/stats
- GET  /api/admin/players
- POST /api/admin/command
- GET|PUT /api/admin/theme
