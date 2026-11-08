# Genera versiones ligeras de las fotos para el catálogo, tarjetas de modelos y galerías.
# fotos/<desarrollo>/<foto>.jpg  ->  fotos/min/<desarrollo>/<foto>.jpg  (máx. 800 px, calidad 74)
# La foto original (grande) se sigue usando al abrir la galería en pantalla completa.
# Solo rehace una miniatura si la foto original cambió (registro en fotos/min/registro.json).
import hashlib, json, os
from PIL import Image, ImageOps

ORIGEN, DESTINO, LADO, CALIDAD = "fotos", os.path.join("fotos", "min"), 800, 74
REG = os.path.join(DESTINO, "registro.json")
try:
    registro = json.load(open(REG, encoding="utf-8"))
except Exception:
    registro = {}
vistas, hechas = set(), 0
for raiz, dirs, archivos in os.walk(ORIGEN):
    if os.path.abspath(raiz).startswith(os.path.abspath(DESTINO)):
        continue
    dirs[:] = [d for d in dirs if os.path.join(raiz, d) != DESTINO]
    for n in archivos:
        if n.lower().rsplit(".", 1)[-1] not in ("jpg", "jpeg", "png", "webp"):
            continue
        src = os.path.join(raiz, n)
        rel = os.path.relpath(src, ORIGEN)
        dst = os.path.join(DESTINO, rel)
        vistas.add(rel)
        h = hashlib.sha1(open(src, "rb").read()).hexdigest()
        if registro.get(rel) == h and os.path.exists(dst):
            continue
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        im = ImageOps.exif_transpose(Image.open(src))
        im.thumbnail((LADO, LADO), Image.LANCZOS)
        ext = n.lower().rsplit(".", 1)[-1]
        if ext in ("jpg", "jpeg"):
            im.convert("RGB").save(dst, "JPEG", quality=CALIDAD, optimize=True, progressive=True)
        elif ext == "webp":
            im.save(dst, "WEBP", quality=CALIDAD)
        else:
            im.save(dst, "PNG", optimize=True)
        registro[rel] = h
        hechas += 1
# Quita miniaturas de fotos que ya no existen
for rel in list(registro):
    if rel not in vistas:
        try:
            os.remove(os.path.join(DESTINO, rel))
        except FileNotFoundError:
            pass
        del registro[rel]
os.makedirs(DESTINO, exist_ok=True)
json.dump(registro, open(REG, "w", encoding="utf-8"), indent=0, sort_keys=True)
print("Miniaturas nuevas o actualizadas:", hechas)
