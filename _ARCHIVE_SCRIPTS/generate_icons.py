import os
import base64
import json
from io import BytesIO
from PIL import Image

def generate():
    src_path = r"E:\PZ-PROYECT\Isotipo-Apocalipto PZ.png"
    img = Image.open(src_path).convert("RGBA")
    
    # Isotipo cuadrado centrado con padding estético (8%)
    w, h = img.size
    max_dim = max(w, h)
    padding = int(max_dim * 0.08)
    canvas_dim = max_dim + padding * 2
    
    square_img = Image.new("RGBA", (canvas_dim, canvas_dim), (0, 0, 0, 0))
    offset_x = (canvas_dim - w) // 2
    offset_y = (canvas_dim - h) // 2
    square_img.paste(img, (offset_x, offset_y), img)
    
    # Destinos de Tauri
    tauri_icons = r"E:\PZ-PROYECT\PZ-LAUNCHER\src-tauri\icons"
    os.makedirs(tauri_icons, exist_ok=True)
    
    # 1. Tauri PNGs
    img32 = square_img.resize((32, 32), Image.Resampling.LANCZOS)
    img32.save(os.path.join(tauri_icons, "32x32.png"))
    
    img128 = square_img.resize((128, 128), Image.Resampling.LANCZOS)
    img128.save(os.path.join(tauri_icons, "128x128.png"))
    
    img256 = square_img.resize((256, 256), Image.Resampling.LANCZOS)
    img256.save(os.path.join(tauri_icons, "128x128@2x.png"))
    
    img512 = square_img.resize((512, 512), Image.Resampling.LANCZOS)
    img512.save(os.path.join(tauri_icons, "icon.png"))
    
    # 2. Windows icon.ico multi-resolución
    ico_path = os.path.join(tauri_icons, "icon.ico")
    square_img.save(
        ico_path,
        format="ICO",
        sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    )
    
    root_ico = r"E:\PZ-PROYECT\icon.ico"
    square_img.save(root_ico, format="ICO", sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    
    # 3. Preparar SVG con PNG incrustado en alta fidelidad
    buf = BytesIO()
    img512.save(buf, format="PNG")
    b64_png = base64.b64encode(buf.getvalue()).decode("utf-8")
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <image width="512" height="512" href="data:image/png;base64,{b64_png}" />
</svg>'''

    # 4. Generar tamaños web
    img192 = square_img.resize((192, 192), Image.Resampling.LANCZOS)
    img180 = square_img.resize((180, 180), Image.Resampling.LANCZOS)

    web_destinations = [
        (r"E:\PZ-PROYECT\PZ-LAUNCHER\public", "Apocalipto PZ - Launcher Oficial", "Apocalipto Launcher", "#111111"),
        (r"E:\PZ-PROYECT\PZ-Landing\public", "Apocalipto PZ — Servidor Hardcore Knox County", "Apocalipto PZ", "#0c0d10"),
        (r"E:\PZ-PROYECT\PZ-ADMIN\public", "Apocalipto PZ - Centro de Mando Central [Admin]", "Bento OS", "#0a0c0e")
    ]
    
    for folder, app_name, short_name, bg_color in web_destinations:
        os.makedirs(folder, exist_ok=True)
        # favicon.ico
        square_img.save(os.path.join(folder, "favicon.ico"), format="ICO", sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64)])
        # isotipo.png (512x512)
        img512.save(os.path.join(folder, "isotipo.png"))
        # icon-192.png y icon-512.png
        img192.save(os.path.join(folder, "icon-192.png"))
        img512.save(os.path.join(folder, "icon-512.png"))
        # apple-touch-icon.png
        img180.save(os.path.join(folder, "apple-touch-icon.png"))
        # Sobrescribir favicon.svg (reemplaza el logo de Vite)
        with open(os.path.join(folder, "favicon.svg"), "w", encoding="utf-8") as f:
            f.write(svg_content)
        # manifest.json
        manifest = {
            "name": app_name,
            "short_name": short_name,
            "start_url": "/",
            "display": "standalone",
            "background_color": bg_color,
            "theme_color": "#dc2626",
            "icons": [
                {
                    "src": "/isotipo.png",
                    "sizes": "512x512",
                    "type": "image/png",
                    "purpose": "any maskable"
                },
                {
                    "src": "/icon-512.png",
                    "sizes": "512x512",
                    "type": "image/png"
                },
                {
                    "src": "/icon-192.png",
                    "sizes": "192x192",
                    "type": "image/png"
                },
                {
                    "src": "/favicon.ico",
                    "sizes": "64x64 48x48 32x32 24x24 16x16",
                    "type": "image/x-icon"
                }
            ]
        }
        with open(os.path.join(folder, "manifest.json"), "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2)

    print("ALL BRANDING ASSETS & MANIFESTS GENERATED SUCCESSFULLY!")

if __name__ == "__main__":
    generate()
