import json
import os
import shutil
from urllib.parse import urlparse


#setting-up the json and the script paths
script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, '..', 'enhanced web app', 'output.json')

def assign_dockerfile(lang):
    lang_str=str(lang)
    dockerfile_path=os.path.join(script_dir, '..', 'Dockerfiles',lang_str)
    return dockerfile_path

with open(json_path, 'r') as file:
    data = json.load(file)

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

if (data['githubRepo']):
    source_dir=os.path.join(script_dir, '..', 'enhanced web app', 'uploads',extract_repo_name(data['githubRepo']))
else:
    source_dir=os.path.join(script_dir, '..', 'enhanced web app', 'uploads')

destination_dir=os.path.join(script_dir, '..', 'app-ready-to-test')


merge_directories(source_dir,destination_dir)


prog_language = data['progLanguage']
requirements_check = data['requirementsCheck']
dockerfile = data['Dockerfile']


if dockerfile=="no":
    match prog_language:
        case 'python': 
            merge_directories(assign_dockerfile('Python'),destination_dir)
        case 'java-spring':
            merge_directories(assign_dockerfile('Spring'),destination_dir)