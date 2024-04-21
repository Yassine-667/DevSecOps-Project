import os
import shutil


def merge_directories(source_dir1, source_dir2, destination_dir):
    # Create the destination directory if it doesn't exist
    if not os.path.exists(destination_dir):
        os.makedirs(destination_dir)

    # Copy files and directories from the first source directory to the destination directory
    for item in os.listdir(source_dir1):
        source_item = os.path.join(source_dir1, item)
        destination_item = os.path.join(destination_dir, item)
        if os.path.isdir(source_item):
            shutil.copytree(source_item, destination_item)
        else:
            shutil.copy2(source_item, destination_item)

    # Copy files and directories from the second source directory to the destination directory
    for item in os.listdir(source_dir2):
        source_item = os.path.join(source_dir2, item)
        destination_item = os.path.join(destination_dir, item)
        if os.path.isdir(source_item):
            shutil.copytree(source_item, destination_item)
        else:
            shutil.copy2(source_item, destination_item)

if __name__ == "__main__":
    # Input directories
    source_directory1 = input("Enter the first source directory: ")
    source_directory2 = input("Enter the second source directory: ")

    # Destination directory
    destination_directory = input("Enter the destination directory: ")

    # Merge directories
    merge_directories(source_directory1, source_directory2, destination_directory)

    print("Directories merged successfully.")

