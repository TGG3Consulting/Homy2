#!/usr/bin/env bash
# Заливка Homy в GitHub с СОХРАНЕНИЕМ всей истории коммитов.
# Из всей истории вырезаются только большие deploy-архивы *.tar (лимит GitHub 100MB).
# Запуск: в папке C:\HomLy -> правой кнопкой "Git Bash Here", затем:  bash push-to-github.sh
set -e
cd "$(dirname "$0")"

REMOTE_URL="https://github.com/TGG3Consulting/Homy2.git"
BRANCH="main"

echo "==> repo: $(pwd)"

# 0) идентичность, если не задана
git config user.name  >/dev/null 2>&1 || git config user.name  "TGG3Consulting"
git config user.email >/dev/null 2>&1 || git config user.email "tigrilll@yahoo.com"

# 1) игнорируем *.tar на будущее + фиксируем текущие правки (если есть)
grep -qxF '*.tar' .gitignore 2>/dev/null || printf '\n# deploy artifacts (too large for GitHub)\n*.tar\n' >> .gitignore
git add -A
git commit -m "chore: ignore large deploy .tar; UI 1:1 redesign work" || echo "==> нечего коммитить, продолжаю"

# 2) вырезаем *.tar из ВСЕЙ истории (все коммиты сохраняются, удаляются только архивы)
export FILTER_BRANCH_SQUELCH_WARNING=1
git filter-branch --force --index-filter \
  "git rm -r --cached --ignore-unmatch '*.tar'" \
  --tag-name-filter cat -- --all

# 3) чистим бэкап-ссылки и мусор, чтобы большие блобы не улетели в push и ушли локально
rm -rf .git/refs/original/
git reflog expire --expire=now --all || true
git gc --prune=now || true

# 4) remote -> Homy2
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REMOTE_URL"
else
  git remote add origin "$REMOTE_URL"
fi

# 5) push всей (переписанной без .tar) истории
echo "==> push всей истории в $REMOTE_URL ($BRANCH)"
git push -u origin "$BRANCH" --force

echo "==> ГОТОВО. Вся история сохранена, .tar исключены. https://github.com/TGG3Consulting/Homy2"
