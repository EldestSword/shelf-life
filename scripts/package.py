"""Package tracked source, excluding the reference photograph and local clutter."""
import pathlib, subprocess, zipfile
root=pathlib.Path(__file__).resolve().parents[1]
files=subprocess.check_output(['git','ls-files','-z'],cwd=root).decode().split('\0')
target=root.parent/'shelf-life-repo.zip'
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as bundle:
    for name in files:
        if name and (root/name).is_file(): bundle.write(root/name,name)
print(target)
