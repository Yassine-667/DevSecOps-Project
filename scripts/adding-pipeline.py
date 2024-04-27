import json
import os
import shutil
from urllib.parse import urlparse


#setting-up the json and the script paths
script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, '..', 'web portal', 'output.json')

def merge_directories(src, dst):
    # Loop over all the files in the source directory
    for src_dir, dirs, files in os.walk(src):
        # Determine the relative path to the source directory
        dst_dir = src_dir.replace(src, dst, 1)
        if not os.path.exists(dst_dir):
            os.makedirs(dst_dir)
        for file_ in files:
            src_file = os.path.join(src_dir, file_)
            dst_file = os.path.join(dst_dir, file_)
            if os.path.exists(dst_file):
                # File already exists, can prompt for overwrite, append a suffix, etc.
                print(f"File {dst_file} already exists. Skipping or handling overwrite.")
            else:
                shutil.copy2(src_file, dst_dir)  # or shutil.move to move instead of copy

def extract_repo_name(url):
    path = urlparse(url).path
    repo_name = path.split('/')[-1]
    return repo_name

source_dir=os.path.join(script_dir, '..','pipelines')

destination_dir=os.path.join(script_dir, '..', 'app-ready-to-test')


merge_directories(source_dir,destination_dir)