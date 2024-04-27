import os
import shutil
import stat

def handle_directory(directory, recreate=False):
    """
    Handles the cleaning of a directory. Deletes `.git` directory if found, and optionally deletes and recreates the directory.
    """
    # Delete `.git` directory if it exists
    git_dir = os.path.join(directory, '.git')
    if os.path.isdir(git_dir):
        try:
            shutil.rmtree(git_dir, onerror=change_permissions)
            print(f"Deleted .git directory at {directory}")
        except Exception as e:
            print(f"Failed to delete .git directory at {directory}. Reason: {e}")

    # Conditionally delete and recreate the directory
    if recreate:
        try:
            shutil.rmtree(directory, onerror=change_permissions)
            os.makedirs(directory)
            print(f"Recreated directory: {directory}")
        except Exception as e:
            print(f"Failed to delete and recreate {directory}. Reason: {e}")
    else:
        clean_directory_contents(directory)

def change_permissions(func, path, exc_info):
    """
    Changes permissions of a file or directory to ensure `shutil.rmtree` can delete it.
    """
    os.chmod(path, stat.S_IWUSR)
    func(path)

def clean_directory_contents(directory):
    """
    Removes all contents of a directory without deleting the directory itself.
    """
    for item in os.listdir(directory):
        item_path = os.path.join(directory, item)
        try:
            if os.path.isfile(item_path) or os.path.islink(item_path):
                os.unlink(item_path)
            elif os.path.isdir(item_path):
                shutil.rmtree(item_path, onerror=change_permissions)
        except Exception as e:
            print(f"Failed to delete {item_path}. Reason: {e}")

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    uploads_path = os.path.join(script_dir, '..', 'web portal', 'uploads')
    repo_path = os.path.join(script_dir, '..', 'app-ready-to-test')

    directories = [
        (uploads_path, True),  # Tuple of path and whether to recreate it
        (repo_path, False)
    ]

    for directory, recreate in directories:
        print(f"Handling directory: {directory}")
        handle_directory(directory, recreate=recreate)
        print(f"Completed handling directory: {directory}")

if __name__ == "__main__":
    main()
