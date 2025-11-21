import os
import numpy as np
from PIL import Image
from scipy.ndimage import label, find_objects

INPUT = r"E:\Games-web\evolutiongames\img\resources\unnamed.png"
OUTPUT = r"E:\Games-web\evolutiongames\img\resources\icons_detected"
os.makedirs(OUTPUT, exist_ok=True)

# Charge image
img = Image.open(INPUT).convert("RGBA")
arr = np.array(img)

# Détection des pixels NON noirs (seuil ajustable)
# (fond noir = 0, 0, 0)
r, g, b, a = arr[:,:,0], arr[:,:,1], arr[:,:,2], arr[:,:,3]
mask = (r > 20) | (g > 20) | (b > 20)   # pixels utiles

# Label : chaque sprite devient un groupe
labeled, num = label(mask)
slices = find_objects(labeled)

print(f"Detected {num} sprites")

count = 0
for sl in slices:
    y1, y2 = sl[0].start, sl[0].stop
    x1, x2 = sl[1].start, sl[1].stop

    sprite = img.crop((x1, y1, x2, y2))
    sprite.save(os.path.join(OUTPUT, f"icon_{count}.png"))
    count += 1

print("Done!")
