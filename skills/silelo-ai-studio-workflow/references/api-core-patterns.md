# Core API Patterns

## Architecture

ใช้โครงสร้าง `client → public API route/tRPC → server gateway → provider adapter → model service` แยก public contract จากรายละเอียด provider และเก็บ secret เฉพาะ server runtime

```text
browser client
  → /api/chat หรือ tRPC mutation
  → validate input + authorize + rate limit
  → provider adapter
  → model endpoint
  → normalize response
  → safe response หรือ SSE stream
```

อย่าให้ client ส่ง `Authorization` ของ provider เอง อย่าเอา provider SDK หรือ secret ไป bundle ใน browser และอย่าให้ settings endpoint เขียนค่า secret หรือเปลี่ยน provider โดยไม่มี authorization และ audit

## Contracts

กำหนด request ที่เล็กและตรวจได้ เช่น `{ messages, model?, room? }` จำกัด role, content length, history count, model allowlist และ body size ตรวจว่า message ล่าสุดเป็นของผู้ใช้เมื่อเหมาะสม

กำหนด response แบบปกติ เช่น `{ reply, provider, model, usage? }` และสำหรับ stream ใช้ SSE event ที่มี schema เช่น `data: { content }` กับ sentinel `[DONE]` อย่าส่ง raw upstream JSON หรือ error stack ไป client

## Streaming

ส่งคำขอด้วย `Accept: text/event-stream` หรือ provider option ที่รองรับจริง สะสม chunk ที่อาจถูกตัดกลางบรรทัดก่อน parse แยก `[DONE]`, handle disconnect และปิด reader/controller ทุกเส้นทาง หาก provider ไม่รองรับ stream ให้รายงานว่าเป็น non-stream response ไม่สร้างเอฟเฟกต์พิมพ์ทีละคำปลอม

## Provider adapter and fallback

ห่อ provider ไว้ใน adapter เดียวที่รับ input กลางและคืน output กลาง เมื่อ primary ล้มเหลว ให้ fallback เฉพาะ error ที่อนุญาต ไม่ retry คำขอที่อาจสร้างค่าใช้จ่ายซ้ำโดยไม่มี idempotency หรือ policy ระบุ รายงาน provider/model ที่ใช้จริงและอย่าซ่อนว่ามีการ fallback

## Settings API

แยก public settings จาก protected settings endpoint ใช้ Zod หรือ schema เดียวกันทั้ง server/client รับเฉพาะค่าที่ allowlist ไว้ ไม่รับ API keys จาก browser settings และไม่ส่งค่าลับกลับใน GET response สำหรับการเปลี่ยนค่า provider ให้ validate URL, model id, timeout และ limits ก่อนบันทึก พร้อมแสดงสถานะ `configured`, `missing`, `invalid` โดยไม่บอก secret

## Failure handling

กำหนด timeout, abort signal, size limit และ rate limit ใน gateway map failure เป็น `BAD_REQUEST`, `UNAUTHORIZED`, `TOO_MANY_REQUESTS`, `BAD_GATEWAY` หรือ `SERVICE_UNAVAILABLE` ตามสาเหตุ เก็บ log ที่ไม่เปิดเผย token และแนบ request id เพื่อ debug โดยไม่เปิดรายละเอียดภายในให้ผู้ใช้

## Secret incident

หากไฟล์แนบหรือ log มีรูปแบบ API key ให้ถือว่า secret อาจรั่ว ห้ามคัดลอกไป env หรือแสดงซ้ำ หยุดการใช้งานค่านั้น แจ้งผู้สร้างให้ revoke/rotate ผ่านผู้ให้บริการ และใช้ secret manager เพื่อรับค่าใหม่ เมื่อไม่ได้รับการยืนยันว่า key ถูก rotate ให้รายงานว่า integration ยังไม่พร้อม ไม่อ้างว่าปลอดภัย 100%
