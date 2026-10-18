"""
Capture headless screenshots of StratumBar Dev Studio and compile
an optimized animated GIF and high-resolution preview for README.md.
"""

import os
import time
from PIL import Image
from playwright.sync_api import sync_playwright

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DOCS_IMAGES = os.path.join(REPO_ROOT, "docs", "images")
ASSETS_DIR = os.path.join(REPO_ROOT, "assets")

os.makedirs(DOCS_IMAGES, exist_ok=True)
os.makedirs(ASSETS_DIR, exist_ok=True)

FRAMES = [
    {
        "name": "01_healthcare_3d_cylinder.png",
        "url": "http://localhost:5174/?scenario=healthcare",
        "description": "Healthcare IRCCS (Slice 430): 3D Cylinder Columns with Dual Y-Axis Wait Time Spline & Target Benchmark",
    },
    {
        "name": "02_sales_benchmark_stacked.png",
        "url": "http://localhost:5174/?scenario=sales_benchmark",
        "description": "Regional Sales Performance: 3D Stacked Prisms with Fixed Benchmark & Delta % Badges",
    },
    {
        "name": "03_axis_break_outliers.png",
        "url": "http://localhost:5174/?scenario=axis_break",
        "description": "Axis Break: Outlier Spike Compression with Isometric Cut Mark (//)",
    },
    {
        "name": "04_2d_modern_standard.png",
        "url": "http://localhost:5174/?scenario=healthcare",
        "description": "2D Modern Standard Mode: Rounded Corner Bars, Secondary Dual Axis & Track Background",
        "action": "switch_2d",
    },
    {
        "name": "05_echarts_options_modal.png",
        "url": "http://localhost:5174/?scenario=healthcare",
        "description": "ECharts Options Inspector Modal: Resolved ECharts Option Payload & One-Click Copy",
        "action": "open_modal",
    },
]

def capture_frames():
    print("Connecting to StratumBar Dev Studio via Chrome headless...")
    captured_paths = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=True,
        )
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        
        for frame in FRAMES:
            out_path = os.path.join(DOCS_IMAGES, frame["name"])
            print(f"Capturing: {frame['url']} -> {frame['name']}")
            page.goto(frame["url"])
            page.wait_for_timeout(1500)
            
            if frame.get("action") == "switch_2d":
                try:
                    btn_2d = page.locator("button.segmented-btn:has-text('2D Standard')")
                    if btn_2d.count() > 0:
                        btn_2d.first.click()
                        page.wait_for_timeout(800)
                except Exception as e:
                    print(f"Warning during switch_2d: {e}")
            elif frame.get("action") == "open_modal":
                try:
                    btn_modal = page.locator("button.btn-echarts-options")
                    if btn_modal.count() > 0:
                        btn_modal.first.click()
                        page.wait_for_timeout(800)
                except Exception as e:
                    print(f"Warning during open_modal: {e}")
            
            page.screenshot(path=out_path)
            size_kb = os.path.getsize(out_path) / 1024
            print(f"Saved {frame['name']} ({size_kb:.1f} KB)")
            captured_paths.append(out_path)
            time.sleep(0.3)
            
        browser.close()
        
    return captured_paths

def generate_gif_and_assets(captured_paths):
    gif_path = os.path.join(DOCS_IMAGES, "dev_studio_demo.gif")
    preview_jpg = os.path.join(ASSETS_DIR, "stratumbar_preview.jpg")
    preview_png = os.path.join(DOCS_IMAGES, "stratumbar_preview.png")
    
    # Save the main healthcare overview as the primary visual preview
    main_img = Image.open(captured_paths[0]).convert("RGB")
    main_img.save(preview_jpg, "JPEG", quality=92, optimize=True)
    main_img.save(preview_png, "PNG", optimize=True)
    print(f"Updated preview photo: {preview_jpg}")
    
    print(f"Compiling animated GIF demo: {gif_path}...")
    target_size = (1280, 800)
    pil_frames = []
    
    for path in captured_paths:
        img = Image.open(path).convert("RGB")
        resized = img.resize(target_size, Image.Resampling.LANCZOS)
        # 256 colors adaptive palette
        quantized = resized.quantize(colors=256, method=Image.Resampling.LANCZOS)
        pil_frames.append(quantized)
        
    # Frame duration: 2800ms per frame
    durations = [2800, 2800, 2800, 2800, 2800]
    
    pil_frames[0].save(
        gif_path,
        save_all=True,
        append_images=pil_frames[1:],
        duration=durations,
        loop=0,
        optimize=True,
    )
    
    gif_kb = os.path.getsize(gif_path) / 1024
    print(f"GIF compiled successfully: {gif_path} ({gif_kb:.1f} KB)")

if __name__ == "__main__":
    paths = capture_frames()
    if paths:
        generate_gif_and_assets(paths)
        print("Done!")
