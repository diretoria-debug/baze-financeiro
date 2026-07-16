#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Deploy automático — Baze Financeiro → GitHub → Vercel
# Uso: ./deploy.sh
# Requer: git, node, npm, vercel CLI instalados
# ─────────────────────────────────────────────────────────────────────────────

set -e  # Para se der erro em qualquer comando

REPO_NAME="baze-financeiro"
GITHUB_USER=$(git config user.name 2>/dev/null || echo "")

echo ""
echo "🚀 Deploy Baze Financeiro"
echo "─────────────────────────"

# ── 1. Verificar dependências ─────────────────────────────────────────────────
echo "→ Verificando dependências..."
command -v git  >/dev/null 2>&1 || { echo "❌ git não encontrado. Instale em git-scm.com"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ node não encontrado. Instale em nodejs.org"; exit 1; }
command -v npm  >/dev/null 2>&1 || { echo "❌ npm não encontrado."; exit 1; }
echo "   ✅ git, node e npm OK"

# ── 2. Verificar Vercel CLI ───────────────────────────────────────────────────
if ! command -v vercel >/dev/null 2>&1; then
  echo "→ Instalando Vercel CLI..."
  npm install -g vercel
fi
echo "   ✅ Vercel CLI OK"

# ── 3. Verificar GitHub CLI ───────────────────────────────────────────────────
if ! command -v gh >/dev/null 2>&1; then
  echo ""
  echo "⚠️  GitHub CLI não encontrado."
  echo "   Instale em: https://cli.github.com"
  echo "   Depois rode: gh auth login"
  echo ""
  echo "   Alternativa: crie o repositório manualmente em github.com"
  echo "   e rode este script novamente."
  echo ""
  read -p "   O repositório '$REPO_NAME' já existe no seu GitHub? (s/n): " JA_EXISTE
  if [ "$JA_EXISTE" != "s" ]; then
    echo "Crie o repositório em github.com/$GITHUB_USER/$REPO_NAME e rode novamente."
    exit 1
  fi
fi

# ── 4. Verificar se já é um repo git ─────────────────────────────────────────
if [ ! -d ".git" ]; then
  echo "→ Inicializando repositório git..."
  git init
  git branch -M main
fi

# ── 5. Criar repositório no GitHub (se gh disponível) ────────────────────────
if command -v gh >/dev/null 2>&1; then
  echo "→ Verificando repositório no GitHub..."
  if ! gh repo view "$REPO_NAME" >/dev/null 2>&1; then
    echo "→ Criando repositório '$REPO_NAME' no GitHub..."
    gh repo create "$REPO_NAME" --public --source=. --remote=origin --push
    echo "   ✅ Repositório criado e arquivos enviados"
  else
    echo "   ✅ Repositório já existe"
    # Adicionar remote se não existir
    if ! git remote get-url origin >/dev/null 2>&1; then
      GITHUB_USER=$(gh api user --jq .login)
      git remote add origin "https://github.com/$GITHUB_USER/$REPO_NAME.git"
    fi
  fi
fi

# ── 6. Commit e push ─────────────────────────────────────────────────────────
echo "→ Fazendo commit..."
git add .
git diff --staged --quiet || git commit -m "📊 Baze Financeiro — $(date '+%b/%Y')"

echo "→ Enviando para GitHub..."
git push -u origin main 2>/dev/null || git push --set-upstream origin main

echo "   ✅ Código no GitHub"

# ── 7. Deploy na Vercel ───────────────────────────────────────────────────────
echo ""
echo "→ Fazendo deploy na Vercel..."
echo "   (Na primeira vez: faça login quando solicitado)"
echo ""

vercel --prod --yes 2>&1 | tee /tmp/vercel_output.txt

# Extrair URL do output
URL=$(grep -o 'https://[a-zA-Z0-9._-]*\.vercel\.app' /tmp/vercel_output.txt | head -1)

echo ""
echo "─────────────────────────────────────────────────────────────────────────"
echo "✅ DEPLOY CONCLUÍDO!"
if [ -n "$URL" ]; then
  echo ""
  echo "   🔗 Seu dashboard está em:"
  echo "   $URL"
  echo ""
  echo "   Acesse de qualquer celular ou computador."
fi
echo "─────────────────────────────────────────────────────────────────────────"
echo ""
