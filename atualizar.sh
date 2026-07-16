#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Atualização mensal — substitui o dashboard e republica
# Uso: ./atualizar.sh caminho/para/novo-App.jsx
# ─────────────────────────────────────────────────────────────────────────────

set -e

NOVO_JSX="$1"
MES=$(date '+%b/%Y')

if [ -z "$NOVO_JSX" ]; then
  echo ""
  echo "Uso: ./atualizar.sh caminho/para/analise-cartao-ago-2026.jsx"
  echo ""
  exit 1
fi

if [ ! -f "$NOVO_JSX" ]; then
  echo "❌ Arquivo não encontrado: $NOVO_JSX"
  exit 1
fi

echo ""
echo "📊 Atualizando dashboard — $MES"
echo "──────────────────────────────"

# Substituir App.jsx
echo "→ Substituindo dashboard..."
cp "$NOVO_JSX" src/App.jsx

# Garantir import React
if ! grep -q 'import React' src/App.jsx; then
  sed -i '1s/^/import React from "react";\n/' src/App.jsx
fi

# Commit e push
echo "→ Enviando para GitHub..."
git add src/App.jsx
git commit -m "📊 Dashboard $MES"
git push

# Redeploy na Vercel (automático via integração GitHub)
echo "   ✅ Vercel detecta o push e republica automaticamente"
echo ""
echo "─────────────────────────────────────────────────────"
echo "✅ Dashboard atualizado para $MES"
echo "   O link permanece o mesmo — basta recarregar a página."
echo "─────────────────────────────────────────────────────"
echo ""
