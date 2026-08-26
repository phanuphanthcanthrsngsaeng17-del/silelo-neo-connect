# Security and Login Setup

ระบบล็อกอินของ SILELO Neo-Connect ใช้บัญชีผู้ดูแลหนึ่งบัญชี โดยเก็บเฉพาะ password hash แบบ `scrypt` ใน environment variables และออก session เป็นคุกกี้ `HttpOnly`, `Secure`, `SameSite=Lax` ที่เซิร์ฟเวอร์เซ็นด้วย `AUTH_SECRET`

## ตั้งค่าบัญชี

สร้าง hash ของรหัสผ่านบนเครื่องที่เชื่อถือได้เท่านั้น:

```bash
node scripts/hash-password.js "รหัสผ่านที่แข็งแรงอย่างน้อย 12 ตัวอักษร"
```

นำผลลัพธ์ไปตั้งค่าใน Render, Vercel หรือระบบ deployment ที่ใช้งานอยู่:

```text
ADMIN_EMAIL=your-real-email@example.com
ADMIN_PASSWORD_HASH=scrypt$...
AUTH_SECRET=<สุ่มค่าอย่างน้อย 32 bytes>
```

ห้ามตั้ง `ADMIN_PASSWORD` แบบ plaintext และห้าม commit ค่า `ADMIN_PASSWORD_HASH` หรือ `AUTH_SECRET` ลง Git หากสงสัยว่าคีย์หรือ hash หลุด ให้ rotate ทั้งสองค่าและ deploy ใหม่

## การป้องกันที่เพิ่มเข้ามา

- การตรวจรหัสผ่านใช้ Node.js `crypto.scryptSync` พร้อม salt แบบสุ่มและเปรียบเทียบด้วย `timingSafeEqual`
- การเข้าสู่ระบบล้มเหลวเกิน 8 ครั้งต่อ IP ภายใน 15 นาทีจะถูกจำกัดชั่วคราว
- API ที่เป็นข้อมูลหรือการกระทำของผู้ใช้ต้องมี session ยกเว้น endpoint สาธารณะ เช่น `/health`, `/api/auth/me` และ `/api/auth/login`
- หน้า `/chat` จะ redirect กลับหน้าแรกหากยังไม่มี session
- session ไม่ถูกเก็บใน `localStorage`; คุกกี้เป็น `HttpOnly` และมีอายุ 90 วัน
- PIN เดิมถูกปิดใช้งานและไม่ควรนำกลับมาใช้เป็นทางผ่านการยืนยันตัวตน
- มี security headers พื้นฐาน เช่น `X-Content-Type-Options`, `X-Frame-Options` และ `Referrer-Policy`

ก่อนเปิดใช้งานจริง ควรตั้งค่า HTTPS, จำกัดสิทธิ์บัญชี deployment, ตรวจ log และพิจารณาเพิ่มฐานข้อมูลผู้ใช้, password reset, MFA และ distributed rate limiting หากรองรับผู้ใช้หลายคน
