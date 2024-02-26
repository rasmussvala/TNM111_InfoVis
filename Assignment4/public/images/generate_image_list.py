import os
import json

image_dir = './'
files = os.listdir(image_dir)
with open('imageList.json', 'w') as f:
    json.dump(files, f)
