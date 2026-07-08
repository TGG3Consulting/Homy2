#!/usr/bin/env bash
# Подготовленный git-флоу для заливки Homy в GitHub (без больших deploy .tar).
# Запуск: в папке C:\HomLy -> правой кнопкой "Git Bash Here", затем:  bash push-to-github.sh
set -e
cd "$(dirname "$0")"

REMOTE_URL="https://github.com/TGG3Consulting/Homy2.git"
BRANCH="main"
MSG="Homy: full project — UI 1:1 redesign (auth, results Focus map, property popup, favorites+compare). Deploy .tar excluded."

echo "==> repo: $(pwd)"

# 0) идентичность, если не задана
git config user.name  >/dev/null 2>&1 || git config user.name  "TGG3Consulting"
git config user.email >/dev/null 2>&1 || git config user.email "tigrilll@yahoo.com"

# 1) игнорируем большие deploy-архивы (лимит GitHub 100 MB)
grep -qxF '*.tar' .gitignore 2>/dev/null || printf '\n# deploy artifacts (too large for GitHub)\n*.tar\n' >> .gitignore

# 2) один чистый коммит текущего дерева БЕЗ игнорируемого (*.tar, node_modules, .next, .env)
git checkout --orphan _clean_main
git rm -r --cached . >/dev/null 2>&1 || true
git add -A
git commit -m "$MSG"

# 3) делаем его веткой main
git branch -D "$BRANCH" >/dev/null 2>&1 || true
git branch -m "$BRANCH"

# 4) remote -> Homy2
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REMOTE_URL"
else
  git remote add origin "$REMOTE_URL"
fi

# 5) push (force: заменяем отклонённую попытку, remote пустой)
echo "==> push в $REMOTE_URL ($BRANCH)"
git push -u origin "$BRANCH" --force

echo "==> ГОТОВО. Проверь: https://github.com/TGG3Consulting/Homy2"
echo "    (файлы *.tar остались у тебя на диске, просто не заливаются в git)"
