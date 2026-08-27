#!/usr/bin/env python3
"""Smoke-test models exposed by the application's Puter server routes.

The script never accepts or prints a Puter API key. The server keeps that secret;
this client only needs an authenticated application session cookie.
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import sys
import time
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests


@dataclass
class Result:
    model: str
    status: str
    http_status: int | None
    provider: str = ""
    returned_model: str = ""
    latency_ms: int | None = None
    error: str = ""
    reply_preview: str = ""


STATUS_NAMES = {
    "passed": "โมเดล Puter ตอบจริงและ provider ตรง",
    "fallback": "ตอบได้แต่เป็น provider อื่น ไม่ใช่ Puter",
    "auth_error": "การยืนยันตัวตนหรือสิทธิ์ไม่ผ่าน",
    "model_not_found": "ไม่พบหรือไม่รองรับ model id",
    "timeout": "หมดเวลารอคำตอบ",
    "provider_error": "provider ตอบ error หรือไม่มีคำตอบ",
    "http_error": "HTTP error จากเว็บหลัก",
    "invalid_response": "รูปแบบ JSON ไม่ตรงสัญญา",
    "dry_run": "ไม่ได้ยิง API เป็นการจำลองคำขอ",
}


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="ทดสอบโมเดล Puter ผ่าน server route ของเว็บหลัก")
    p.add_argument("--base-url", default=os.getenv("BASE_URL", ""), help="โดเมนเว็บหลัก เช่น https://example.com")
    p.add_argument("--cookie-env", default="SESSION_COOKIE", help="ชื่อ env ที่เก็บ Cookie header เต็ม เช่น nc_session=...")
    p.add_argument("--models-file", type=Path, help="ไฟล์ text ที่มี model id บรรทัดละหนึ่งรายการ")
    p.add_argument("--model", action="append", default=[], help="ระบุ model id เอง; ใช้ซ้ำได้")
    p.add_argument("--limit", type=int, default=70, help="จำนวนโมเดลสูงสุดที่ทดสอบ (ค่าเริ่มต้น 70)")
    p.add_argument("--delay", type=float, default=1.0, help="เวลาพักระหว่างคำขอ หน่วยวินาที")
    p.add_argument("--timeout", type=float, default=60.0, help="timeout ต่อคำขอ หน่วยวินาที")
    p.add_argument("--retries", type=int, default=1, help="จำนวน retry เมื่อ timeout/5xx")
    p.add_argument("--prompt", default="ตอบสั้น ๆ ว่า READY และระบุชื่อโมเดลที่กำลังใช้งาน", help="ข้อความทดสอบ")
    p.add_argument("--output-dir", type=Path, default=Path("model-test-results"), help="โฟลเดอร์ CSV/JSON")
    p.add_argument("--dry-run", action="store_true", help="แสดงสิ่งที่จะทำโดยไม่ยิง network")
    p.add_argument("--include-disabled", action="store_true", help="ไม่ตัด model id ว่างหรือ disabled จากไฟล์เอง")
    return p.parse_args()


def compact_error(value: Any) -> str:
    if isinstance(value, dict):
        value = value.get("message") or value.get("error") or value
    text = str(value or "").replace("\n", " ").strip()
    return text[:300]


def load_models(session: requests.Session, base_url: str, timeout: float, models_file: Path | None, explicit: list[str], dry_run: bool) -> list[str]:
    if explicit:
        return unique_models(explicit)
    if models_file:
        return unique_models(models_file.read_text(encoding="utf-8").splitlines())
    if dry_run:
        return ["gpt-5-nano", "claude-sonnet-4", "gemini-3.6-flash"]
    response = session.get(f"{base_url.rstrip('/')}/api/puter/models", timeout=timeout)
    response.raise_for_status()
    data = response.json()
    raw = data.get("models", []) if isinstance(data, dict) else data
    models = []
    for item in raw if isinstance(raw, list) else []:
        model_id = item if isinstance(item, str) else item.get("id") or item.get("name")
        if model_id:
            models.append(str(model_id))
    if not models:
        raise RuntimeError(f"ไม่พบรายการโมเดลจาก /api/puter/models: {compact_error(data)}")
    return unique_models(models)


def unique_models(values: list[str]) -> list[str]:
    output: list[str] = []
    seen: set[str] = set()
    for value in values:
        model = str(value).strip()
        if not model or model.startswith("#") or model in seen:
            continue
        seen.add(model)
        output.append(model)
    return output


def classify(http_status: int | None, body: Any, exception: Exception | None, requested_model: str) -> tuple[str, str, str, str]:
    if exception:
        if isinstance(exception, (requests.Timeout, requests.ConnectionError)):
            return "timeout", "", "", compact_error(exception)
        return "http_error", "", "", compact_error(exception)
    if not isinstance(body, dict):
        return "invalid_response", "", "", "response ไม่ใช่ JSON object"
    provider = str(body.get("provider") or "").lower()
    returned_model = str(body.get("model") or "")
    error = compact_error(body.get("error") or body.get("message"))
    combined = f"{error} {body.get('reply', '')}".lower()
    if http_status in (401, 403) or any(word in combined for word in ("auth", "unauthorized", "forbidden", "token missing")):
        return "auth_error", provider, returned_model, error
    if any(word in combined for word in ("unknown model", "model not found", "invalid model", "unsupported model")):
        return "model_not_found", provider, returned_model, error
    if provider and provider != "puter":
        return "fallback", provider, returned_model, error or "provider ไม่ใช่ puter"
    if body.get("error") or http_status is not None and http_status >= 400:
        return "provider_error", provider, returned_model, error
    if provider == "puter" and body.get("reply") and (not returned_model or returned_model == requested_model):
        return "passed", provider, returned_model, ""
    if body.get("reply") and provider == "puter":
        return "passed", provider, returned_model, ""
    return "invalid_response", provider, returned_model, error or "ไม่มี reply/provider ที่ยืนยันได้"


def test_model(session: requests.Session, base_url: str, cookie: str, model: str, prompt: str, timeout: float, retries: int, dry_run: bool) -> Result:
    if dry_run:
        return Result(model=model, status="dry_run", http_status=None)
    payload = {"room": "private", "question": prompt, "history": [], "memory": "", "model": model, "modelMode": "auto", "super": False, "unrestricted": False}
    headers = {"Accept": "application/json", "Content-Type": "application/json"}
    if cookie:
        headers["Cookie"] = cookie
    started = time.perf_counter()
    last_exception: Exception | None = None
    response: requests.Response | None = None
    for attempt in range(max(0, retries) + 1):
        try:
            response = session.post(f"{base_url.rstrip('/')}/api/chat", json=payload, headers=headers, timeout=timeout)
            if response.status_code < 500 or attempt >= retries:
                break
        except (requests.Timeout, requests.ConnectionError) as exc:
            last_exception = exc
            if attempt >= retries:
                break
        time.sleep(min(2.0, 0.5 * (attempt + 1)))
    latency = int((time.perf_counter() - started) * 1000)
    if last_exception and response is None:
        status, provider, returned_model, error = classify(None, None, last_exception, model)
        return Result(model, status, None, provider, returned_model, latency, error)
    assert response is not None
    try:
        body = response.json()
    except ValueError:
        body = None
    status, provider, returned_model, error = classify(response.status_code, body, None, model)
    preview = ""
    if isinstance(body, dict) and body.get("reply"):
        preview = " ".join(str(body["reply"]).split())[:160]
    return Result(model, status, response.status_code, provider, returned_model, latency, error, preview)


def write_reports(results: list[Result], output_dir: Path) -> tuple[Path, Path]:
    output_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    csv_path = output_dir / f"puter-model-test-{stamp}.csv"
    json_path = output_dir / f"puter-model-test-{stamp}.json"
    rows = [asdict(result) for result in results]
    with csv_path.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()) if rows else ["model", "status"])
        writer.writeheader()
        writer.writerows(rows)
    summary: dict[str, Any] = {"generated_at": datetime.now(timezone.utc).isoformat(), "total": len(results), "counts": {}}
    for result in results:
        summary["counts"][result.status] = summary["counts"].get(result.status, 0) + 1
    summary["results"] = rows
    json_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    return csv_path, json_path


def main() -> int:
    args = parse_args()
    if not args.base_url and not args.dry_run:
        print("ต้องระบุ --base-url หรือ BASE_URL", file=sys.stderr)
        return 2
    cookie = os.getenv(args.cookie_env, "")
    if not cookie and not args.dry_run:
        print(f"ไม่พบ Cookie header ใน env {args.cookie_env}; ไม่รับ token ผ่าน argument เพื่อป้องกันการรั่วไหล", file=sys.stderr)
        return 2
    session = requests.Session()
    try:
        models = load_models(session, args.base_url, args.timeout, args.models_file, args.model, args.dry_run)
    except Exception as exc:
        print(f"โหลดรายการโมเดลไม่สำเร็จ: {compact_error(exc)}", file=sys.stderr)
        return 1
    models = models[: max(0, args.limit)]
    print(f"เริ่มทดสอบ {len(models)} โมเดล แบบ sequential; delay={args.delay}s timeout={args.timeout}s")
    results: list[Result] = []
    for index, model in enumerate(models, 1):
        result = test_model(session, args.base_url, cookie, model, args.prompt, args.timeout, args.retries, args.dry_run)
        results.append(result)
        label = STATUS_NAMES.get(result.status, result.status)
        extra = f" provider={result.provider}" if result.provider else ""
        print(f"[{index:>3}/{len(models)}] {model} -> {result.status}{extra} ({label})")
        if index < len(models) and args.delay > 0:
            time.sleep(args.delay)
    csv_path, json_path = write_reports(results, args.output_dir)
    counts: dict[str, int] = {}
    for result in results:
        counts[result.status] = counts.get(result.status, 0) + 1
    print("\nสรุปผล:")
    for status, count in sorted(counts.items()):
        print(f"  {status}: {count}")
    print(f"CSV:  {csv_path}")
    print(f"JSON: {json_path}")
    return 0 if all(result.status in {"passed", "dry_run"} for result in results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
