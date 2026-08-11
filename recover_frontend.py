import subprocess
import os

cwd = r"d:\sem3\geonarrative-ai"

def run_cmd(cmd):
    result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, shell=True)
    print(f"Command: {cmd}")
    print(result.stdout)
    if result.stderr:
        print(f"Error: {result.stderr}")

# Check status
run_cmd("git status")

# Only restore the files we know we overwrote
files_to_restore = [
    r"frontend\package.json",
    r"frontend\postcss.config.js",
    r"frontend\tsconfig.json",
    r"frontend\README.md",
    r"backend\requirements.txt",
    r"backend\core\config.py",
    r"backend\db\database.py",
    r"backend\main.py",
    r"backend\README.md"
]

for f in files_to_restore:
    run_cmd(f"git checkout -- {f}")

# Delete the new Vite React files we created
files_to_delete = [
    r"frontend\vite.config.ts",
    r"frontend\tailwind.config.js",
    r"frontend\index.html",
    r"frontend\tsconfig.node.json",
    r"frontend\src\main.tsx",
    r"frontend\src\App.tsx",
    r"frontend\src\index.css",
    r"frontend\src\store\useStore.ts",
    r"frontend\src\services\api.ts",
    r"frontend\src\pages\DigitalTwinDashboard.tsx",
    r"frontend\src\components\Sidebar.tsx",
    r"frontend\src\components\Legend.tsx",
    r"frontend\src\components\MapboxViewer.tsx"
]

for f in files_to_delete:
    path = os.path.join(cwd, f)
    if os.path.exists(path):
        os.remove(path)
        print(f"Deleted {path}")

# Delete geodata.py and health.py which we created
new_backend_files = [
    r"backend\api\endpoints\health.py",
    r"backend\api\endpoints\geodata.py"
]
for f in new_backend_files:
    path = os.path.join(cwd, f)
    if os.path.exists(path):
        os.remove(path)
        print(f"Deleted {path}")

run_cmd("git status")
