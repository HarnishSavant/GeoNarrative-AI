import subprocess

cwd = r"d:\sem3\geonarrative-ai"
subprocess.run(["git", "checkout", "--", r"frontend\src\components\Sidebar.tsx"], cwd=cwd)
print("Sidebar successfully restored to the last commit!")
