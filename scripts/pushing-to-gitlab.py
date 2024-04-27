import git
import os
import shutil
import stat

script_dir = os.path.dirname(os.path.abspath(__file__))
repo_path = os.path.join(script_dir, '..', 'app-ready-to-test')

def delete_git_directory(repo_path):
    """Deletes the .git directory if it exists, handling permissions issues."""
    git_dir = os.path.join(repo_path, '.git')
    if os.path.isdir(git_dir):
        # Change the file permissions to delete read-only files
        for root, dirs, files in os.walk(git_dir, topdown=False):
            for name in files:
                filepath = os.path.join(root, name)
                os.chmod(filepath, stat.S_IWUSR)
            for name in dirs:
                dirpath = os.path.join(root, name)
                os.chmod(dirpath, stat.S_IWUSR)
        # Attempt to remove the directory again
        shutil.rmtree(git_dir)
        print(f"Deleted existing .git directory at {repo_path}")

def delete_remote_branch(repo, branch_name):
    """Delete a remote branch on GitLab."""
    try:
        origin = repo.remote(name='origin')
        origin.push(refspec=f":{branch_name}")
        print(f"Deleted branch {branch_name} on remote.")
    except git.exc.GitCommandError as e:
        print(f"Error deleting remote branch {branch_name}: {e}")

def push_directory_to_gitlab(repo_path, remote_url, target_branch='master', commit_message="Initial commit"):
    # Delete existing .git directory if it exists
    delete_git_directory(repo_path)
    
    # Initialize the directory as a git repository
    repo = git.Repo.init(repo_path)
    repo.create_remote('origin', remote_url)
    
    # Fetch and check if the target branch exists on remote
    origin = repo.remote(name='origin')
    origin.fetch()
    remote_branches = [ref.name for ref in repo.refs if ref.is_remote()]
    remote_target_branch = f'origin/{target_branch}'
    if remote_target_branch in remote_branches:
        delete_remote_branch(repo, target_branch)

    # Add all files to staging
    repo.git.add(all=True)

    # Commit changes
    if repo.is_dirty(untracked_files=True):
        repo.index.commit(commit_message)
    else:
        print("No changes to commit.")

    # Push to remote GitLab repository, ensuring the correct branch is pushed
    try:
        origin.push(refspec=f"{target_branch}:{target_branch}", set_upstream=True)
    except git.exc.GitCommandError as e:
        print(f"Error pushing to {remote_url}: {e}")

    print(f"Changes pushed to {remote_url} on branch {target_branch}.")



# Example usage:
remote_url = 'https://gitlab.com/yassine-lazrak/devsecops-plateform.git'  # Your GitLab repository URL
push_directory_to_gitlab(repo_path, remote_url)
