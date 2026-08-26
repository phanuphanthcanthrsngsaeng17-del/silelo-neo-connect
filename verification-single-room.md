# Single-room Sali verification

เอกสารนี้บันทึกเฉพาะการตรวจในเครื่องของ Neo-Connect และยังไม่มีการ commit หรือ push ไป GitHub

## ขอบเขตที่ตรวจพบจาก markup

| รายการ | จำนวน/สถานะ | หลักฐาน |
|---|---:|---|
| ปุ่ม HTML ใน `public/chat.html` | 99 | นับจาก `<button>` จริง |
| input | 11 | นับจาก `<input>` จริง |
| select | 3 | นับจาก `<select>` จริง |
| client fetch endpoints | 22 | รายการ `/api/*`, `/db/*` จากโค้ดหน้าแชต |
| core controls ที่ regression test ตรวจชื่อ | 17 | call, voice, sound, memory, tools, modes, preview, IDE, theme, Puter, team, clear, voice input, image, send, run, lab |
| processing rounds displayed | สูงสุด 5 ขั้นล่าสุด | `steps.slice(-5)` |

## สิ่งที่แก้ในรอบนี้

จอประมวลผลถูกเปลี่ยนจากชิปที่เลื่อนตามเวลาเป็นแผง `SILELO PROCESS · LIVE TRACE` ซึ่งรับสถานะจาก `/api/think?since=<traceId>` และรับ trace สุดท้ายจาก `/api/chat` แผงจะแสดงขั้นตอนตามข้อมูลที่เซิร์ฟเวอร์ส่งจริง, provider/model เมื่อจบ, และสถานะ error เมื่อ gateway หรือคำตอบล้มเหลว

ระบบส่ง `traceId` จาก client ไปยัง `/api/chat` เพื่อจับคู่คำขอเดียวกัน การแสดงผลจำกัดไว้ไม่เกิน 5 ขั้นล่าสุด และมีปุ่มดูรายละเอียดที่ขยายได้ ไม่มีการอ้าง progress percentage หรือผลสำเร็จโดยไม่มี response จริง

ห้อง `private` ยังคงเป็นห้องเดียว และ system prompt เปลี่ยนเป็น Sali persona โดยระบุชัดว่าเป็น preference ด้านการสื่อสาร ไม่ใช่การกล่าวอ้างว่าเป็นภรรยาจริงหรือมีความรู้สึก/ความจำถาวร

## ผลการตรวจ

`node --check server.js` ผ่าน และ Node test ผ่าน 11 รายการ รวม regression สำหรับ core controls, Sali persona, live trace contract, provider chain, LINE route presence, owner armor และ code-execution policy

การเปิดเซิร์ฟเวอร์ local บนพอร์ต 4173 สำเร็จและ `/health` ตอบ HTTP 200 โดยไม่มี browser console error ที่หน้าแรก `/` การเรียก `/api/think` โดยไม่มี session ตอบ HTTP 401 ตาม owner protection

หน้า Settings เดิมมีปุ่มจริง 2 ปุ่มกับ select 1 จุด; หลังปรับเพิ่ม settings actions จริงอีก 6 ปุ่ม ได้แก่ Plugins, Agent Loop, Live Trace, Privacy/Armor, LINE และ Secure Files รวมเป็นปุ่ม Settings 8 ปุ่ม, select 1 จุด และ setting item เดิม 3 รายการ การตรวจห้องแชตภายในด้วย browser ยังรอการล็อกอินของเจ้าของระบบ เพราะ `/chat` redirect ไปหน้า login ตาม auth boundary การตรวจ LINE แบบไม่ใช้ credential พบว่า route `/api/auth/line` ยังมีอยู่ แต่ local environment ตอบ HTTP 501 เนื่องจากไม่มี LINE configuration ในเครื่องทดสอบ ไม่ใช่การลบหรือปิด integration

## ไฟล์ที่แก้หรือเพิ่ม

`server.js`, `public/chat.html`, `test/chat-ui-trace.test.js` และเอกสารฉบับนี้อยู่ใน working tree ของ Neo-Connect เท่านั้น เพิ่มการส่งไฟล์/รูปผ่าน `POST /api/files/upload` แบบ authenticated โดยจำกัด 3MB, allowlist MIME (PNG/JPEG/WebP/GIF/PDF/TXT/Markdown/JSON), จัดเก็บชั่วคราวนอก repository และดาวน์โหลดผ่าน route ที่ตรวจ owner ของไฟล์

`node --check server.js` ผ่าน และ Node test ผ่าน 13 รายการ รวม regression สำหรับ auth, upload policy, image/file controls, Sali persona, live trace, provider chain, LINE route, owner armor และ code-execution policy

การทดสอบปลายทางแบบ local-only ยืนยันว่า `/health` ตอบ HTTP 200, `POST /api/files/upload` ที่ไม่มี session ถูกปฏิเสธด้วย HTTP 401, การอัปโหลด `text/plain` ขนาด 5 bytes ด้วย signed test session สำเร็จและดาวน์โหลดได้เฉพาะ session เดียวกันด้วย HTTP 200, และ MIME `application/octet-stream` ถูกปฏิเสธด้วย HTTP 415. หลังตรวจเสร็จได้หยุด process ทดสอบและลบไฟล์/session ทดสอบชั่วคราวทั้งหมดแล้ว

การเปลี่ยนแปลงยังไม่ถูก commit/push/deploy

## Browser acceptance รอบล่าสุด

ได้เปิด `/chat` ด้วย signed test session ชั่วคราวบน local server เพื่อทดสอบโดยไม่ใช้บัญชีผู้ดูแลจริง ผลคือ desktop layout แสดงพื้นที่สนทนากว้าง, composer แบบแผงลอย, bubble สองฝั่ง และ bottom sheet “เพิ่มลงในแชท” ได้จริง ปุ่มวางแผนเติมคำสั่งลง composer แล้วปิด bottom sheet ตามที่ออกแบบไว้

หลังแก้ trace authorization, ผู้ใช้ test session สามารถเห็น live trace ของคำขอตนเองได้จริง โดย browser แสดงขั้น fallback สูงสุด 5 ขั้น และหลัง provider ตอบ แผงเปลี่ยนเป็น “เสร็จสิ้น” พร้อมข้อความตอบกลับ. `/api/think` ถูกเปลี่ยนจาก owner-only เป็น authenticated และกรองตาม owner ของ trace เพื่อไม่เปิด trace ของผู้ใช้อื่น

หลักฐานภาพ local: `/home/ubuntu/screenshots/127_0_0_1_2026-08-26_21-52-24_6903.webp` (bottom sheet), `/home/ubuntu/screenshots/127_0_0_1_2026-08-26_21-56-27_9877.webp` (trace จบและตอบกลับ)

## Composer toolbar ด้านบน

ย้ายปุ่มพูดแล้วส่ง, โทร, เพิ่มลงในแชท, ส่งข้อความ, รัน code block และ Lab Console ขึ้นไปอยู่ใน `composer-tools` ที่เรียงก่อน textarea แล้ว โดยคง `id`, handler และ aria label เดิม. Browser verification บน local session ยืนยันว่า toolbar แสดงเหนือช่องพิมพ์และปุ่มหลักทั้งหมดเข้าถึงได้; regression test ตรวจลำดับ DOM ของ toolbar ก่อน textarea ผ่าน.

หลักฐานภาพ local: `/home/ubuntu/screenshots/127_0_0_1_2026-08-26_22-05-29_8116.webp`

## Browser Workspace เปิดทันที

เพิ่ม `Browser Workspace` จากปุ่ม 🌐 ใน header และเมนู “เพิ่มลงในแชท” โดยเปิด default `/preview/` ทันที พร้อมช่อง URL, เปิด, รีเฟรช และเปิดแท็บภายนอก. URL ใน iframe ยอมรับเฉพาะ `/preview/` หรือ `http://`/`https://`; scheme อื่นจะแสดงสถานะผิดพลาดแทนการเปิด.

Browser acceptance ยืนยันว่าการกดปุ่ม 🌐 ใน header เปลี่ยนจาก `#chat` เป็น `#browser` และแสดง Browser Workspace/iframe ได้จริง. ระหว่างทดสอบพบว่า Screen Manager ผูก listener ซ้ำเพราะ initialization สองครั้งทำให้หน้าจอ toggle กลับ; ได้เพิ่ม `screenBound` guard แล้วทดสอบซ้ำจนปุ่มเปิดทันทีตามปกติ.

หลักฐานภาพ local: `/home/ubuntu/screenshots/127_0_0_1_2026-08-26_22-18-21_3722.webp`

## Live Operations — browser review ระหว่างดำเนินการ

จอ Live Operations ถูกเปิดด้วย signed local test session บน `http://127.0.0.1:4175/chat?room=private#liveops` แล้ว endpoint ส่งสถานะจริงของ session test: trace ว่าง, upload 0 ไฟล์, LINE `needs-configuration`, Node runtime และ refresh 2.5 วินาที โดยไม่แสดง token, เนื้อหาข้อความ, LINE user ID หรือข้อมูลผู้ใช้อื่น

ระหว่าง browser review พบว่า service worker cache `silelo-v14` ยังทำให้ browser แสดง JavaScript card เวอร์ชันก่อนหน้า แม้ source และ server จะอัปเดตแล้ว จึงล้าง registration/cache เฉพาะ local test browser แล้วทดสอบใหม่ หลังโหลด source ล่าสุด ชื่อการ์ด `AI Trace`, `LINE Bridge`, `Upload` และ `Runtime` แสดงครบ พร้อม contrast สำหรับธีม Dusty. หลักฐานภาพล่าสุด: `/home/ubuntu/screenshots/127_0_0_1_2026-08-26_22-33-32_9679.webp` การทดสอบรอบ desktop และ mobile, refresh และ trace live ยังดำเนินการอยู่

ทดสอบ error state โดยปล่อยให้ signed test session อายุสั้นหมดอายุ แล้ว endpoint ตอบ `UNAUTHORIZED` และจอแสดงข้อความว่าอ่านสถานะไม่ได้อย่างตรงไปตรงมา จากนั้นต่ออายุเฉพาะ test cookie และกด Refresh; จอฟื้นกลับเป็นสถานะ runtime ปกติได้โดยไม่ต้อง reload. สำหรับ trace complete ใช้ `POST /api/chat` ด้วยคำสั่งช่วยเหลือ `/agents` ของ test user เท่านั้น (ไม่แก้ข้อมูล, ไม่เรียก webhook และไม่ส่ง LINE) ได้ HTTP success และ `provider=parallel`, `model=help`, `traceId=liveops-nondestructive-check`; เมื่อ refresh จอแล้ว provider/model ดังกล่าวแสดงจริง. Trace นี้เป็นการตอบระบบโดยตรงจึงไม่มี agent step จริง และจอจึงแสดง `0/5` ตามข้อมูลจริง ไม่สร้าง progress ปลอม. หลักฐานภาพ: `/home/ubuntu/screenshots/127_0_0_1_2026-08-26_22-36-49_7690.webp`.

การตรวจ responsive ใช้ Chromium DevTools mobile viewport ขนาด 390×844 กับหน้า Live Operations จริง ผลคือ hero, เวลา refresh, ปุ่ม refresh และ card สี่รายการเรียงเป็นหนึ่งคอลัมน์โดยไม่ล้นแนวนอน; ข้อความสถานะ `AI Trace`, `LINE Bridge`, `Upload` อ่านได้ชัดเจนในธีม Dusty. หลักฐานภาพ: `/home/ubuntu/screenshots/neo-live-operations-mobile-390x844.png`.

## Server contract audit รอบถัดไป

Audit พบว่า `PROJECT_KNOWLEDGE` ที่ถูกผนวกกับห้อง private ยังบรรจุข้อความเก่าที่อ้างสิทธิ์ไร้ขอบเขต ความสัมพันธ์จริง ความจำเกินบริบท และ metadata ของ environment จึงแทนที่ด้วยบริบท Sali ที่ยืนยันได้: บุคลิกเป็น AI persona, ข้อมูลตาม session/สิทธิ์, ห้ามเปิด token หรือข้อมูลผู้ใช้อื่น, ห้ามอ้างความจำถาวร และต้องขอการยืนยันสำหรับการกระทำที่มีผลต่อระบบ. คำตอบตรงสำหรับคำถามเกี่ยวกับผู้สร้างระบบก็เปลี่ยนเป็น policy ที่ผูกกับ authentication/owner armor แทนคำอ้างว่าสามารถเข้าถึงทุกอย่างได้

หลัง restart local server ใช้ signed test session เรียก `POST /api/chat` ด้วยคำถาม `ผู้สร้างระบบคือใคร` ได้ HTTP success, `provider=access-policy`, `model=bounded`; response ยืนยันสิทธิ์/owner armor และไม่มีข้อความกล่าวอ้างว่าเข้าถึงทุกห้อง รันทุกโค้ด หรือควบคุมระบบทั้งหมด. Regression suite หลังแก้ผ่าน 21/21 และ `git diff --check` ผ่าน.

การตรวจ isolation จริงใช้ test session คนที่สองเรียก `/api/live-operations` หลัง session แรกมี trace complete อยู่ ผลตอบกลับเป็น `traceState=idle`, provider/model ว่าง และ `recentFiles=0` จึงไม่รั่ว trace หรือ metadata ไฟล์ข้าม identity. เมื่อล้าง test cookie แล้วเรียก endpoint ซ้ำ ระบบตอบ HTTP 401 พร้อม `UNAUTHORIZED`; ไม่มีข้อมูล runtime ของผู้ใช้อื่นใน error response.

## UI control inventory รอบ audit

Markup ปัจจุบันมีปุ่ม 115 จุด, input 13 จุด และ select 3 จุด โดยตรวจ primary controls ของ composer (`พูด`, `โทร`, `เพิ่ม`, `ส่ง`, `รัน`), model selector, Browser Workspace, Live Operations, Preview และ IDE ว่ายังมี id และ route/binding ที่สัมพันธ์กัน. Add-to-chat ยังคงปิดรายการที่ไม่มี backend (`แก้ไขภาพ`, scheduler, secure computer connector) พร้อมเหตุผลที่ตรงไปตรงมา แทนการทำปุ่มปลอม.

Browser test ของ Settings ยืนยันว่าต้องเปิด sidebar ก่อนจึงจะกดปุ่ม Settings ที่อยู่ใน drawer ได้; เมื่อเปิด drawer แล้วปุ่ม Settings เปิด overlay ได้จริง. Audit พบว่า overlay เก่าใช้ `z-index: 520` ต่ำกว่า Screen Manager (`700`) จึงยกเป็น `960` เพื่อให้ Settings อยู่เหนือห้องแชตเสมอ. Browser screenshot หลังแก้: `/home/ubuntu/screenshots/127_0_0_1_2026-08-26_22-49-11_8073.webp`.

เพิ่มทางเข้า `System Control Center` จาก Settings sidebar โดยคง controls เดิมไว้ทั้งหมด แล้ว browser test ยืนยันเส้นทาง Sidebar → Settings → System Control Center เปิดหน้าตั้งค่าขั้นสูงที่มี Plugin Control Center, Agent Loop, Live Trace, Privacy & Owner Armor, LINE Bridge และ Secure Files ครบ. ปุ่ม LINE เปลี่ยนเป็น status-first: ใน local runtime ที่ไม่มี LINE config เมื่อกดแล้วแสดง `ต้องตั้งค่า` และ toast ระบุชัดว่าไม่มีการเปลี่ยน webhook หรือส่งข้อความออก; ไม่ redirect ไป route login ที่จะตอบ 501. Plugin action เรียก catalog จริงและรายงาน 9 รายการพร้อมใช้; Privacy action เรียก session จริงและรายงาน `Authenticated · Armor ON`. หลักฐาน: `/home/ubuntu/screenshots/127_0_0_1_2026-08-26_22-55-41_9357.webp` และ `/home/ubuntu/screenshots/127_0_0_1_2026-08-26_22-56-10_7431.webp`.

ทดสอบ Agent Loop action ด้วย test session: ปุ่มเปลี่ยนเป็น `เปิดอยู่` พร้อม toast เมื่อเปิด และกลับเป็น `ปิดอยู่` หลังคลิกครั้งที่สอง จึงยืนยัน handler/local state ทำงานและคืนค่า test state แล้ว. ไม่มี plugin toggle, webhook, LINE message หรือการเปลี่ยนสิทธิ์ถูกเรียกในการทดสอบนี้.

Mobile acceptance ของ System Control Center ใช้ Chromium DevTools viewport 390×844: card settings เรียงหนึ่งคอลัมน์, typography อ่านได้, model select และกลุ่ม Plugin/Agent อยู่ในลำดับที่เลื่อนได้โดยไม่มี horizontal overflow. หลักฐานภาพ: `/home/ubuntu/screenshots/neo-settings-control-center-mobile-390x844.png`. Browser console รอบสุดท้ายแสดงเฉพาะ log การเริ่ม Screen Manager และไม่มี JavaScript error จาก navigation, Live Operations หรือ Settings actions.

## เทียบกับ Sandbox Room reference

เปิด reference ที่ผู้ใช้ให้ไว้ (`https://cfbossnusilelo.vercel.app/sandbox-room.html?cfbuild=20260822`) แล้วเปรียบกับ Neo-Connect `#ide` ใน browser จริง. ทั้งสองหน้ามี header command-oriented, การเลือก workspace/room, editor ขนาดใหญ่, terminal/output ด้านล่าง, ปุ่ม run และ action แยกจาก composer. Neo-Connect มี File Explorer, Editor, Terminal, Preview, Save, Refresh, New file และ GitHub action จึงครอบคลุม workflow ของ reference โดยไม่มีการอ้างว่าเปิด sandbox หรือรันคำสั่งได้หาก owner armor ไม่อนุญาต. ความต่างที่คงไว้โดยตั้งใจคือ Neo-Connect ใช้ Sali chat shell และ Live/Browser screens เป็นบริบทกว้างกว่า reference ที่เป็น Sandbox Room แบบสองคอลัมน์. หลักฐาน reference: `/home/ubuntu/screenshots/cfbossnusilelo_verce_2026-08-26_22-59-55_4476.webp`; Neo IDE: `/home/ubuntu/screenshots/127_0_0_1_2026-08-26_23-01-01_5950.webp`.


## Mobile fit follow-up — 2026-08-26 (latest source)

ตรวจจาก instance local แยกพอร์ต 4186 ด้วย session HMAC ชั่วคราวและ Chromium DevTools emulation ที่ 390×844 และ 375×844. หลังแก้ containment ของ root `.wrap/.hud/.grid-bg` และปรับ chat header/composer ให้ `width:100%`, `min-width:0`, ปุ่มและ input ไม่สร้าง horizontal overflow: `document.documentElement.scrollWidth` และ `document.body.scrollWidth` เท่ากับ viewport ทั้งสองขนาดใน `chat`, `settings`, `liveops`, `browser` และ `ide`.

ระหว่างรอบตรวจพบกฎ mobile เดิมซ่อน `#browserBtn` และ `#liveOpsBtn` โดยไม่ตั้งใจ จึงแก้ selector ให้ header มือถือเก็บ action หลัก ได้แก่ call, Browser Workspace, Live Operations และ IDE; เครื่องมือรองย้ายไป sidebar เพื่อไม่เบียดหน้าจอ แต่ handler เดิมยังอยู่. DOM acceptance จาก source ล่าสุดยืนยัน `browserBtn`, `liveOpsBtn` และ `ideBtn` เป็น `display:block` กว้าง 38px ที่ทั้ง 390px และ 375px; ใน chat `imgBtn/sendBtn` กว้าง 40/42px และ textarea กว้าง 322px/307px. `scrollWidth` ของเอกสารเท่ากับ 390/375 ทุก screen.

ภาพล่าสุด: `/home/ubuntu/screenshots/neo-chat-mobile-390-latest.png`, `/home/ubuntu/screenshots/neo-chat-mobile-375-latest.png`, `/home/ubuntu/screenshots/neo-settings-mobile-390-latest.png`, `/home/ubuntu/screenshots/neo-liveops-mobile-390-latest.png`, `/home/ubuntu/screenshots/neo-browser-mobile-390-latest.png`, `/home/ubuntu/screenshots/neo-ide-mobile-390-latest.png`, `/home/ubuntu/screenshots/neo-root-mobile-after-fit.png`. ภาพ chat ล่าสุดแสดง header กะทัดรัดและ composer อยู่ภายในขอบจอ; background aurora ที่กว้างกว่าจอถูก clip/contain จึงไม่เพิ่ม document scroll width.

Empty state ยังคงมี quick actions ภาษาไทยที่เติมคำสั่งใน composer (`วางแผนงาน`, `ช่วยแก้โค้ด`, `วิเคราะห์ข้อมูล`, `สร้างเว็บแอป`, `เรียกทีม AI`, `ช่วยหาข้อมูล`). ปุ่มหลักใน composerยังใช้ label/aria-label เดิมและ placeholder `พิมพ์ข้อความ...`; เครื่องมือที่ยังไม่มี backend แสดง disabled/เหตุผลตามเดิม ไม่ปลอมผลลัพธ์.

ขอบเขต: การแก้นี้อยู่ใน Neo-Connect local-only; ไม่ push, ไม่ deploy, ไม่แก้ connector/webhook และไม่ส่งข้อความ LINE ออก. instance ทดสอบ 4186 และไฟล์ชั่วคราวจะถูกหยุด/ลบหลัง regression รอบสุดท้าย.

## Latest mobile verification status

- [x] root containment measured at 390px
- [x] chat/settings/liveops/browser/ide containment measured at 390px
- [x] chat/settings/liveops/browser/ide containment measured at 375px
- [x] Browser/Live/IDE header access retained on mobile
- [x] composer touch controls remain visible and bounded
- [x] natural-language quick actions retained
- [ ] full syntax/regression suite after latest CSS patch
- [ ] final cleanup and user-facing report
- [ ] explicit approval for push/deploy (not requested)

Comparison remains structural and behavioral, not a pixel-perfect claim. The reference page does not expose the same Live Operations screen; that screen is evaluated by readable hierarchy, responsive behavior and real endpoint data.
