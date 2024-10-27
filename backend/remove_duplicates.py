# Run the Script:
#   Dry Run (Recommended First):
#       python remove_duplicates.py /path/to/target/directory --dry-run
#       This will display the files that would be deleted without actually removing them.
#
# Execute Deletion:
# python remove_duplicates.py /path/to/target/directory

import os
import argparse
import re
from collections import defaultdict

def get_base_name(filename):
    """
    Extracts the base name by removing the last '_<7 alphanum>' suffix if present.

    Args:
        filename (str): The original filename without extension.

    Returns:
        tuple: (base_name, is_duplicate)
            - base_name (str): The filename without the '_7chars' suffix.
            - is_duplicate (bool): True if the suffix was matched and removed.
    """
    # Regular expression to match the last '_<7 alphanum>' at the end of the string
    pattern = r'^(.*)_[A-Za-z0-9]{7}$'
    match = re.match(pattern, filename)
    if match:
        return match.group(1), True
    else:
        return filename, False

def find_and_delete_duplicates(root_dir, dry_run=True):
    """
    Traverse the root_dir recursively, find duplicate files based on base filenames
    by stripping the last '_<7 alphanum>' suffix, and delete duplicates within each folder,
    keeping the original file or one suffixed file if original doesn't exist.

    Args:
        root_dir (str): The root directory to start searching.
        dry_run (bool): If True, only logs the actions without deleting files.
    """
    # Define the allowed file extensions
    allowed_extensions = {'.jpg', '.jpeg', '.png', '.tiff', '.tif', '.pdf'}

    # Counter for summary
    total_duplicates = 0
    total_deleted = 0

    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Dictionary to group files by base name and extension
        file_groups = defaultdict(list)

        for filename in filenames:
            name, ext = os.path.splitext(filename)
            ext_lower = ext.lower()

            if ext_lower not in allowed_extensions:
                continue  # Skip files with unsupported extensions

            base_name, is_duplicate = get_base_name(name)
            key = f"{base_name}{ext_lower}"
            file_groups[key].append((filename, is_duplicate))

        # Process each group to identify duplicates
        for key, files in file_groups.items():
            # Separate originals and duplicates
            originals = [f for f, is_dup in files if not is_dup]
            duplicates = [f for f, is_dup in files if is_dup]

            if originals:
                # If original exists, all duplicates are to be deleted
                total_duplicates += len(duplicates)
                files_to_delete = duplicates
            elif len(duplicates) > 1:
                # If no original exists, keep one duplicate and delete the rest
                total_duplicates += len(duplicates) - 1
                files_to_delete = duplicates[1:]
            else:
                # Only one file exists (either original or single duplicate), do nothing
                continue

            for f in files_to_delete:
                file_path = os.path.join(dirpath, f)
                if dry_run:
                    print(f"[DRY RUN] Would delete: {file_path}")
                else:
                    try:
                        os.remove(file_path)
                        print(f"Deleted: {file_path}")
                        total_deleted += 1
                    e
                    xcept Exception as e:
                        print(f"Error deleting {file_path}: {e}")

    # Summary
    if dry_run:
        print("\nDry run complete.")
        print(f"Total duplicate files identified: {total_duplicates}")
    else:
        print("\nDeletion complete.")
        print(f"Total duplicate files deleted: {total_deleted}")

def main():
    parser = argparse.ArgumentParser(description="Delete duplicate image and PDF files in a directory and its subdirectories based on the last '_7chars' suffix.")
    parser.add_argument("directory", help="Path to the target directory.")
    parser.add_argument("--dry-run", action="store_true", help="Perform a dry run without deleting any files.")
    args = parser.parse_args()

    root_dir = args.directory

    if not os.path.isdir(root_dir):
        print(f"Error: The path '{root_dir}' is not a valid directory.")
        return

    find_and_delete_duplicates(root_dir, dry_run=args.dry_run)

if __name__ == "__main__":
    main()
