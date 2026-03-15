"""Playwright test of live frontend AI features."""
import json, time
from playwright.sync_api import sync_playwright

SITE_URL = "https://yt-transcript-web.pages.dev"
TEST_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

def run_test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        errors = []
        api_calls = []

        def on_resp(resp):
            if "/api/" in resp.url:
                try:
                    body = resp.text()
                except:
                    body = "<no body>"
                api_calls.append({"url": resp.url, "status": resp.status, "body": body[:300]})

        def on_console(msg):
            if msg.type == "error":
                errors.append(msg.text)

        page.on("response", on_resp)
        page.on("console", on_console)

        # 1. Load site
        print("[1] Loading site...")
        page.goto(SITE_URL, wait_until="networkidle", timeout=30000)
        print(f"  Title: {page.title()}")

        # Check if AI buttons exist
        ai_btns = page.locator('button:has-text("Summary"), button:has-text("Action Points"), button:has-text("Professional Edit")')
        print(f"  AI buttons found: {ai_btns.count()}")

        # 2. Enter URL and extract transcript
        print("[2] Entering URL and extracting transcript...")
        input_field = page.locator('input[placeholder*="youtube" i], input[type="url"], input[type="text"]').first
        input_field.fill(TEST_URL)

        extract_btn = page.locator('button:has-text("Extract"), button:has-text("Get"), button[type="submit"]').first
        extract_btn.click()

        print("  Waiting for transcript...")
        time.sleep(15)
        page.screenshot(path="/home/azureuser/.openclaw/workspace/design-tools/yt-transcript-upgrade/test-screenshot.png")

        # Check if transcript appeared
        body_text = page.inner_text("body")[:2000]
        has_transcript = "never" in body_text.lower() or "strangers" in body_text.lower()
        print(f"  Transcript loaded: {has_transcript}")

        # Check AI buttons again after transcript loads
        ai_btns = page.locator('button:has-text("Summary"), button:has-text("Action Points"), button:has-text("Professional Edit")')
        print(f"  AI buttons visible: {ai_btns.count()}")

        # 3. Click AI button (Summary)
        if ai_btns.count() > 0:
            print("[3] Clicking AI Summary button...")
            summary_btn = page.locator('button:has-text("Summary")').first
            summary_btn.click()
            time.sleep(10)
            page.screenshot(path="/home/azureuser/.openclaw/workspace/design-tools/yt-transcript-upgrade/test-ai-result.png")

            # Check for AI result
            body_text = page.inner_text("body")[:3000]
            has_ai_result = "summary" in body_text.lower() or "rick" in body_text.lower()
            print(f"  AI result appeared: {has_ai_result}")
        else:
            print("  No AI buttons found!")

        # Summary
        print("\n=== API Calls ===")
        for call in api_calls:
            print(f"  {call['status']} {call['url'][:80]}")
            if call['body']:
                print(f"     Body: {call['body'][:100]}")

        print("\n=== Console Errors ===")
        for e in errors:
            print(f"  {e[:150]}")

        browser.close()

run_test()
