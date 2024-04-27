import subprocess
import os


script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, '..', 'scripts', 'adding-dockerfile.py')

def execute_scripts():
    script_paths = [
        os.path.join(script_dir, '..', 'scripts', 'adding-dockerfile.py'),
        os.path.join(script_dir, '..', 'scripts', 'adding-pipeline.py'),
        os.path.join(script_dir, '..', 'scripts', 'pushing-to-gitlab.py')
    ]

    processes = []
    for script_path in script_paths:
        # Start each script in its own process
        process = subprocess.Popen(['python', script_path], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        processes.append(process)
    
    # Wait for all scripts to complete and print their outputs and potential errors
    for process in processes:
        stdout, stderr = process.communicate()
        if stderr:
            print("Error:", stderr.decode())

if __name__ == '__main__':
    execute_scripts()