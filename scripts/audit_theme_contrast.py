import os
import sys
import asyncio
import http.server
import socketserver
import threading
from pathlib import Path
from playwright.async_api import async_playwright

if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

PAGES_TO_AUDIT = [
    "/landing.html",
    "/index.html",
    "/login.html",
    "/register.html"
]

JS_CONTRAST_SNIPPET = r"""
() => {
    function parseColor(colorStr) {
        if (!colorStr) return null;
        if (colorStr === 'transparent' || colorStr === 'rgba(0, 0, 0, 0)') return null;
        const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (match) {
            return {
                r: parseInt(match[1], 10),
                g: parseInt(match[2], 10),
                b: parseInt(match[3], 10),
                a: match[4] !== undefined ? parseFloat(match[4]) : 1.0
            };
        }
        return null;
    }

    function blendColors(fg, bg) {
        if (!fg) return bg;
        if (!bg) return fg;
        const alpha = fg.a;
        return {
            r: Math.round(fg.r * alpha + bg.r * (1 - alpha)),
            g: Math.round(fg.g * alpha + bg.g * (1 - alpha)),
            b: Math.round(fg.b * alpha + bg.b * (1 - alpha)),
            a: 1.0
        };
    }

    function getEffectiveBackgroundColor(el) {
        let current = el;
        let blendedBg = null;
        while (current && current.nodeType === Node.ELEMENT_NODE) {
            const style = window.getComputedStyle(current);
            const parsed = parseColor(style.backgroundColor);
            if (parsed && parsed.a > 0) {
                if (!blendedBg) {
                    blendedBg = parsed;
                } else {
                    blendedBg = blendColors(blendedBg, parsed);
                }
                if (blendedBg.a >= 0.99) {
                    return blendedBg;
                }
            }
            current = current.parentElement;
        }
        // Default page background fallback if transparent
        return blendedBg || { r: 176, g: 196, b: 177, a: 1.0 }; // #b0c4b1 sage default
    }

    function getLuminance(color) {
        const sRGB = [color.r / 255, color.g / 255, color.b / 255];
        const linear = sRGB.map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
        return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
    }

    function getContrastRatio(fg, bg) {
        const l1 = getLuminance(fg);
        const l2 = getLuminance(bg);
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
    }

    const results = [];
    const elements = Array.from(document.querySelectorAll('body *'));

    for (const el of elements) {
        // Skip hidden or non-text elements
        if (el.children.length > 0 && Array.from(el.childNodes).some(n => n.nodeType === Node.ELEMENT_NODE && n.textContent.trim().length > 0)) {
            // Container with child elements — skip to avoid duplicate child node reporting
            if (!Array.from(el.childNodes).some(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0)) {
                continue;
            }
        }

        const text = el.textContent.trim();
        if (!text || text.length === 0) continue;

        // Skip disabled elements per WCAG SC 1.4.3
        if (el.disabled || el.getAttribute('aria-disabled') === 'true') continue;

        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        const computedStyle = window.getComputedStyle(el);
        if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden' || computedStyle.opacity === '0') continue;

        const fgColor = parseColor(computedStyle.color);
        const bgColor = getEffectiveBackgroundColor(el);

        if (!fgColor || !bgColor) continue;

        const effectiveFg = blendColors(fgColor, bgColor);
        const ratio = getContrastRatio(effectiveFg, bgColor);

        const fontSizePx = parseFloat(computedStyle.fontSize);
        const fontWeight = computedStyle.fontWeight;
        const isBold = fontWeight === 'bold' || parseInt(fontWeight, 10) >= 700;
        const isLargeText = fontSizePx >= 24 || (fontSizePx >= 18.66 && isBold);
        const requiredRatio = isLargeText ? 3.0 : 4.5;

        const isLightMode = document.body.classList.contains('light-mode') || document.documentElement.classList.contains('light-mode');
        const bgLuminance = getLuminance(bgColor);
        const isInteractiveControl = el.tagName === 'BUTTON' || el.tagName === 'A' || el.tagName === 'INPUT' || el.classList.contains('btn') || el.classList.contains('btn-primary') || el.classList.contains('btn-submit') || el.closest('button, a, input, .btn, .btn-primary, .btn-submit, .btn-cyber-primary') !== null;
        const isDarkSurfaceInLightMode = isLightMode && !isInteractiveControl && bgLuminance < 0.20;

        const isContrastFailure = ratio < requiredRatio;
        const isFailure = isContrastFailure || isDarkSurfaceInLightMode;

        if (isFailure) {
            let reason = isContrastFailure ? `Contrast ${ratio.toFixed(2)}:1 < ${requiredRatio}:1` : `Dark surface (L=${bgLuminance.toFixed(2)}) in Light Mode`;
            results.push({
                tagName: el.tagName.toLowerCase(),
                id: el.id || null,
                className: el.className || null,
                textSnippet: text.substring(0, 40),
                fg: `rgb(${effectiveFg.r}, ${effectiveFg.g}, ${effectiveFg.b})`,
                bg: `rgb(${bgColor.r}, ${bgColor.g}, ${bgColor.b})`,
                contrast: ratio.toFixed(2),
                requiredRatio: requiredRatio,
                reason: reason,
                inlineStyle: el.getAttribute('style') || '',
                isFailure: isFailure
            });
        }
    }

    return results;
}
"""

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(Path(__file__).resolve().parent.parent / "app" / "static"), **kwargs)
    def log_message(self, format, *args):
        pass

def start_local_http_server(port=8888):
    handler = QuietHandler
    httpd = socketserver.TCPServer(("127.0.0.1", port), handler)
    server_thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    server_thread.start()
    return httpd

async def run_audit():
    port = 8888
    httpd = start_local_http_server(port)
    base_url = f"http://127.0.0.1:{port}"
    total_failures = 0
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 960})
        
        print("=================================================================")
        print("         SYSTEMATIC LIGHT-MODE WCAG CONTRAST AUDIT               ")
        print("=================================================================")
        
        for page_path in PAGES_TO_AUDIT:
            url = f"{base_url}{page_path}"
            page = await context.new_page()
            await page.goto(url)

            # Activate Light Mode explicitly
            await page.evaluate("""() => {
                document.body.classList.add('light-mode');
                document.documentElement.classList.add('light-mode');
                if (window.setApplicationTheme) {
                    window.setApplicationTheme('light');
                }
            }""")
            await page.wait_for_timeout(300) # wait for DOM repaint

            failures = await page.evaluate(JS_CONTRAST_SNIPPET)
            
            print(f"\nAUDITING PAGE: [{page_path}]")
            
            page_failures = [f for f in failures if f['isFailure']]
            
            if not page_failures:
                print(f"  --> PASSED: 0 WCAG contrast failures found on {page_path}!")
            else:
                total_failures += len(page_failures)
                print(f"  --> FAILED: {len(page_failures)} contrast violations detected!")
                for idx, f in enumerate(page_failures, 1):
                    element_desc = f"{f['tagName']}"
                    if f['id']:
                        element_desc += f"#{f['id']}"
                    elif f['className']:
                        element_desc += f".{f['className'].strip().replace(' ', '.')}"
                    
                    snippet_safe = f['textSnippet'].encode('ascii', errors='replace').decode('ascii')
                    print(f"      [{idx}] {element_desc}")
                    print(f"          Snippet  : \"{snippet_safe}\"")
                    print(f"          FG Color : {f['fg']}")
                    print(f"          BG Color : {f['bg']}")
                    print(f"          Contrast : {f['contrast']}:1 (Required: {f['requiredRatio']}:1)")
                    if f['inlineStyle']:
                        print(f"          Style    : {f['inlineStyle']}")

            await page.close()

        await browser.close()
        httpd.shutdown()
        
        print("\n=================================================================")
        print(f"FINAL AUDIT SUMMARY: {total_failures} TOTAL CONTRAST FAILURES FOUND")
        print("=================================================================")
        
        return total_failures

if __name__ == "__main__":
    exit_code = asyncio.run(run_audit())
    sys.exit(0 if exit_code == 0 else 1)
