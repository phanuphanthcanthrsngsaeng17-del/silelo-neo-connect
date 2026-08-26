# SILELO Configuration Patterns

## แยกประเภทการตั้งค่า

แบ่งการตั้งค่าเป็นสามชั้น: `public app config` สำหรับชื่อแอป เวอร์ชัน คำอธิบาย ธีม และ feature flags ที่เปิดเผยได้; `server runtime config` สำหรับ URL provider, model id, timeout และ limits ที่ server ใช้; และ `secrets` สำหรับ API keys, OAuth secrets, signing keys และ tokens

ห้ามตั้งชื่อ secret ด้วย prefix ที่ framework ส่งไป client เช่น `NEXT_PUBLIC_` หรือ `VITE_` ห้ามเก็บค่า secret ในไฟล์ที่ commit, bundle, screenshot, log หรือข้อความแจ้งเตือน ให้ใช้ secret manager และอ่านผ่าน server env helper ที่มีอยู่ใน template

## Public config schema

กำหนด schema กลางสำหรับค่าที่หน้าเว็บต้องใช้ เช่น:

```ts
export const APP_CONFIG = {
  name: "SILELO",
  version: "2.0.0",
  links: {
    autoConvert: true,
    openInNewTab: true,
    maxLinkLength: 2_000,
  },
  security: {
    maxMessageLength: 5_000,
    maxFileSizeMB: 50,
    allowGuest: false,
  },
  ai: {
    streamResponse: true,
    memoryLength: 12,
  },
} as const;
```

ใช้ค่าจาก config แทน hardcode ใน component แต่ validate ค่า env และ user input ฝั่ง server ด้วย Zod ซ้ำอีกชั้น อย่าใช้ `allowedDomains: ["*"]` เป็นค่า default เพราะเปิดขอบเขตเกินจำเป็น ให้ใช้ allowlist หรือให้ผู้ใช้เห็นและยืนยันปลายทางก่อนเปิด

## Secure defaults

ใช้ `https` สำหรับ service endpoint เมื่อเป็น production, จำกัดความยาวข้อความและไฟล์, ตั้ง timeout, rate limit และ session expiry ตาม provider, ปิด guest access จนกว่าจะมี abuse controls และอย่าใช้ secret link query parameter เป็น authentication แทน session ที่ตรวจสอบได้

การตั้งค่า `openInNewTab`, `showPreview`, `copyOnLongPress`, `responsive` และ `streamResponse` เป็น behavior flags ได้ แต่ต้องทดสอบ keyboard, mobile, popup blocked, reduced motion และ error state ด้วย

## Theme and branding

รวมสีใน token กลาง เช่น `primary`, `secondary`, `dark`, `card`, `text`, `muted`, `userBubble` และ `aiBubble` แล้ว map เข้ากับ CSS variables อย่าใส่ brand claims หรือข้อความความสัมพันธ์เป็นข้อเท็จจริงใน metadata โดยอัตโนมัติ ให้ใช้ชื่อและคำอธิบายที่ผู้ใช้ยืนยันแล้ว

## AI runtime settings

`defaultModel` เป็นเพียงค่าตั้งต้น ไม่ได้พิสูจน์ว่า provider รองรับโมเดลนั้น `memoryLength` หมายถึงจำนวนข้อความที่ส่งใน request ไม่ใช่ความจำถาวร `typingSpeed` เป็น UI simulation เท่านั้น และ `streamResponse` ใช้ได้ต่อเมื่อ transport/provider รองรับ streaming จริง หากไม่รองรับให้รายงานสถานะตามจริง

## Configuration review

ก่อนส่งมอบ ตรวจว่า config ไม่มี secret, claim เกินจริง, wildcard domain โดยไม่จำเป็น หรือค่าที่ทำให้เกิดค่าใช้จ่าย/สิทธิ์เกินที่ผู้สร้างอนุมัติ ทดสอบ defaults, override, missing env, malformed env และการแสดงสถานะที่แจ้งผู้ใช้เมื่อ config ไม่ครบ
