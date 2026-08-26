# Neo-Connect — Audit รอบ Live Operations 2026

**ขอบเขต:** ตรวจซ้ำห้อง Sali, Live Operations, settings, auth/owner boundary, provider chain, LINE status, uploads, Browser Workspace และ controls ที่เกี่ยวข้อง โดยใช้เฉพาะ source, local server และ browser test session ชั่วคราว

> สถานะการเปลี่ยนแปลง: **local-only** ไม่มี commit, push, deploy, webhook edit หรือ LINE outbound message ในรอบนี้

| หัวข้อตรวจ | ผล | หลักฐาน |
|---|---|---|
| ห้อง Sali เดียวและ persona boundary | ผ่าน | Prompt ปรับให้เป็น AI persona, ไม่อ้างความสัมพันธ์จริง ความจำถาวร หรือสิทธิ์ไร้ขอบเขต; regression ครอบคลุม |
| Live Operations | ผ่าน | `/api/live-operations` ต้อง authenticated, scoping ตาม user, แสดง trace/provider/model/upload/LINE/runtime ที่ยืนยันได้ |
| Live Operations UI | ผ่าน | Operational console 2026, refresh 2.5 วินาทีเฉพาะหน้าจอ, live/complete/error state, desktop/mobile evidence |
| Browser Workspace | ผ่านจาก regression และ browser check ก่อนหน้า | URL รับเฉพาะ `http(s)` หรือ `/preview/`; header entry เปิด screen จริง |
| Upload boundary | ผ่านจาก regression และ local checks ก่อนหน้า | ไฟล์ allowlist 3 MB; binary image 50 MB; download และ recent files scoped ตาม owner |
| Provider chain | ผ่าน | GPT → Groq → OpenRouter free fallback 16 รุ่นยังถูกตรวจ order โดย test |
| LINE UI | ผ่านตาม runtime ที่ทดสอบ | Settings ตรวจ status ก่อน; runtime ไม่มี config จึงแสดง `ต้องตั้งค่า` โดยไม่ redirect, แก้ webhook หรือส่งข้อความ |
| Settings | ผ่าน | Sidebar → Settings → System Control Center เข้าถึง Plugin, Agent, Trace, Privacy, LINE และ Files; legacy controls คงอยู่ |
| Owner armor และ trace isolation | ผ่าน | Test user ที่สองเห็น trace idle/provider-model ว่าง; unauthenticated endpoint ตอบ 401 |
| Service worker freshness | ผ่าน | bump cache เป็น `silelo-v16` เพื่อให้ app shell รับ Settings/LINE UI ล่าสุด |

## ผลการทดสอบ

คำสั่งล่าสุดที่ผ่าน:

```text
node --check server.js
node --test test/*.test.js
git diff --check
```

ผล: **23/23 tests passed** และไม่มี whitespace error จาก `git diff --check`.

## หลักฐานภาพ

| พื้นที่ | ไฟล์หลักฐาน |
|---|---|
| Live Operations desktop | `/home/ubuntu/screenshots/127_0_0_1_2026-08-26_22-36-49_7690.webp` |
| Live Operations mobile 390×844 | `/home/ubuntu/screenshots/neo-live-operations-mobile-390x844.png` |
| System Control Center mobile 390×844 | `/home/ubuntu/screenshots/neo-settings-control-center-mobile-390x844.png` |
| LINE status-first + System Control Center desktop | `/home/ubuntu/screenshots/127_0_0_1_2026-08-26_22-55-41_9357.webp` |

## จุดที่แก้ใน audit นี้

1. เพิ่ม Live Operations screen และ 2026 operational hierarchy พร้อม endpoint สถานะจริง
2. แก้ Sali project context และ fallback prompts ที่ยังมีข้อความอ้างสิทธิ์หรือความสัมพันธ์เกินขอบเขต
3. แก้ z-index ของ Settings legacy overlay ให้สูงกว่า Screen Manager
4. เพิ่ม `System Control Center` ให้เข้าถึง controls ขั้นสูงจาก sidebar Settings โดยไม่ทิ้ง settings เดิม
5. เปลี่ยน LINE action เป็น status-first และ bump Service Worker เป็น `silelo-v16`

## ข้อจำกัดที่ยังแสดงอย่างตรงไปตรงมา

| รายการ | สถานะ |
|---|---|
| LINE login/bot local runtime | ต้องตั้งค่า environment; UI แสดงสถานะจริงและไม่เริ่ม login เมื่อยังไม่พร้อม |
| Image edit, scheduler, secure computer connector | ปิดเป็น `ต้องตั้งค่า` เพราะไม่มี backend ที่ตรวจสอบได้ |
| Storage upload | อยู่ใน `/tmp/neo-connect-uploads` สำหรับ runtime local และไม่อ้างว่า persistent |
| Pixel-perfect comparison กับ Sandbox Room reference | เทียบโครงและ browser แล้ว: Neo IDE ครอบคลุม header/workspace, editor, terminal/output และ action controls ของ reference แต่ยังไม่อ้างว่าเป็น pixel-perfect copy เพราะขยายด้วย Sali chat shell, Browser Workspace และ Live Operations ตาม scope ของ Neo-Connect |

## ความปลอดภัยและการ cleanup

ใช้ signed local test session อายุสั้นเท่านั้น หลังทดสอบได้ล้าง cookie และ local toggles แล้ว. หยุด local server ที่เริ่มสำหรับการตรวจนี้แล้ว และไม่ยุ่งกับ process ที่เปิดใช้งานก่อนหน้าหรือ service ของผู้ใช้.


## Mobile fit follow-up ล่าสุด

หลัง audit รอบเดิม ตรวจ source ล่าสุดบน local instance พอร์ต 4186 ที่ 390×844 และ 375×844. ทั้ง `chat`, `settings`, `liveops`, `browser` และ `ide` มี `documentElement.scrollWidth` และ `body.scrollWidth` เท่ากับ viewport จึงไม่พบ horizontal overflow ในเอกสาร. Header มือถือเก็บปุ่ม call, Browser Workspace, Live Operations และ IDE ที่กว้าง 38px; เครื่องมือรองยังเข้าถึงผ่าน sidebar. ระหว่างตรวจพบ selector เก่าซ่อน Browser/Live โดยไม่ตั้งใจ จึงแก้แล้วและทดสอบ DOM ซ้ำจนทั้งสองปุ่มเป็น `display:block` ที่ทั้ง 390px และ 375px.

Composer มือถือยังแสดงปุ่มแนบ, ส่ง และ textarea ภายในขอบจอ โดยวัด textarea กว้าง 322px ที่ 390px และ 307px ที่ 375px. Quick actions ภาษาไทยยังอยู่ใน empty state เพื่อให้เริ่มด้วยภาษาคนได้โดยไม่ต้องจำคำสั่ง. ภาพล่าสุดเพิ่มเติมอยู่ที่ `/home/ubuntu/screenshots/neo-chat-mobile-390-latest.png`, `/home/ubuntu/screenshots/neo-chat-mobile-375-latest.png`, `/home/ubuntu/screenshots/neo-settings-mobile-390-latest.png`, `/home/ubuntu/screenshots/neo-liveops-mobile-390-latest.png`, `/home/ubuntu/screenshots/neo-browser-mobile-390-latest.png` และ `/home/ubuntu/screenshots/neo-ide-mobile-390-latest.png`.

ผล regression หลัง patch: `node --check server.js`, `node --test test/*.test.js` ผ่าน 23/23 และ `git diff --check` ผ่าน. หยุดเฉพาะ local test instance ที่สร้างสำหรับรอบ mobile แล้ว; ไม่ push, ไม่ deploy, ไม่แก้ webhook/connector และไม่ส่ง LINE outbound message.
