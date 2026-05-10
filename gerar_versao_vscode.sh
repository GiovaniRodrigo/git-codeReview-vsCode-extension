#!/usr/bin/env bash

set -euo pipefail

# ============================================================
# Script para gerar arquivo .vsix de extensão VS Code
# ============================================================
# Uso:
#   chmod +x package-extension.sh
#   ./package-extension.sh
#
# Opções:
#   ./package-extension.sh --install
#   ./package-extension.sh --clean
#   ./package-extension.sh --skip-build
# ============================================================

INSTALL_AFTER_PACKAGE=false
CLEAN_BEFORE_BUILD=false
SKIP_BUILD=false

for arg in "$@"; do
  case "$arg" in
    --install)
      INSTALL_AFTER_PACKAGE=true
      ;;
    --clean)
      CLEAN_BEFORE_BUILD=true
      ;;
    --skip-build)
      SKIP_BUILD=true
      ;;
    *)
      echo "Opção desconhecida: $arg"
      echo "Uso: ./package-extension.sh [--install] [--clean] [--skip-build]"
      exit 1
      ;;
  esac
done

echo "============================================================"
echo " Gerador de pacote VS Code Extension"
echo "============================================================"

# ------------------------------------------------------------
# 1. Validar se está na raiz do projeto
# ------------------------------------------------------------

if [ ! -f "package.json" ]; then
  echo "Erro: package.json não encontrado."
  echo "Execute este script na raiz do projeto da extensão."
  exit 1
fi

# ------------------------------------------------------------
# 2. Validar Node.js
# ------------------------------------------------------------

if ! command -v node >/dev/null 2>&1; then
  echo "Erro: Node.js não encontrado."
  echo "Instale o Node.js antes de continuar."
  exit 1
fi

NODE_VERSION=$(node -v)
echo "Node.js: $NODE_VERSION"

# ------------------------------------------------------------
# 3. Validar npm
# ------------------------------------------------------------

if ! command -v npm >/dev/null 2>&1; then
  echo "Erro: npm não encontrado."
  exit 1
fi

NPM_VERSION=$(npm -v)
echo "npm: $NPM_VERSION"

# ------------------------------------------------------------
# 4. Validar campos básicos do package.json
# ------------------------------------------------------------

EXTENSION_NAME=$(node -p "require('./package.json').name || ''")
EXTENSION_VERSION=$(node -p "require('./package.json').version || ''")
EXTENSION_PUBLISHER=$(node -p "require('./package.json').publisher || ''")
EXTENSION_MAIN=$(node -p "require('./package.json').main || ''")

if [ -z "$EXTENSION_NAME" ]; then
  echo "Erro: campo 'name' não encontrado no package.json."
  exit 1
fi

if [ -z "$EXTENSION_VERSION" ]; then
  echo "Erro: campo 'version' não encontrado no package.json."
  exit 1
fi

if [ -z "$EXTENSION_PUBLISHER" ]; then
  echo "Aviso: campo 'publisher' não encontrado no package.json."
  echo "Para publicar no Marketplace, este campo é obrigatório."
fi

if [ -z "$EXTENSION_MAIN" ]; then
  echo "Aviso: campo 'main' não encontrado no package.json."
  echo "Extensões com código normalmente precisam de um arquivo main."
fi

echo "Extensão: $EXTENSION_NAME"
echo "Versão: $EXTENSION_VERSION"
echo "Publisher: ${EXTENSION_PUBLISHER:-não definido}"
echo "Main: ${EXTENSION_MAIN:-não definido}"

# ------------------------------------------------------------
# 5. Criar .vscodeignore se não existir
# ------------------------------------------------------------

if [ ! -f ".vscodeignore" ]; then
  echo "Criando .vscodeignore padrão..."

  cat > .vscodeignore <<'EOF'
.vscode/**
.vscode-test/**
src/**
webview-ui/src/**
webview-ui/node_modules/**
node_modules/**
.git/**
.gitignore
.env
.env.*
*.log
*.map
coverage/**
docs/**
tests/**
test/**
README-dev.md
package-lock.json
tsconfig.json
vite.config.ts
.eslintrc*
.prettierrc*
EOF

  echo ".vscodeignore criado."
else
  echo ".vscodeignore já existe."
fi

# ------------------------------------------------------------
# 6. Limpeza opcional
# ------------------------------------------------------------

if [ "$CLEAN_BEFORE_BUILD" = true ]; then
  echo "Limpando builds antigos..."

  rm -rf dist
  rm -rf out
  rm -rf webview-ui/dist
  rm -f ./*.vsix

  echo "Limpeza concluída."
fi

# ------------------------------------------------------------
# 7. Instalar dependências
# ------------------------------------------------------------

if [ ! -d "node_modules" ]; then
  echo "Instalando dependências do projeto..."
  npm install
else
  echo "Dependências do projeto já instaladas."
fi

# ------------------------------------------------------------
# 8. Instalar dependências do Webview, se existir
# ------------------------------------------------------------

if [ -f "webview-ui/package.json" ]; then
  if [ ! -d "webview-ui/node_modules" ]; then
    echo "Instalando dependências do webview-ui..."
    npm --prefix webview-ui install
  else
    echo "Dependências do webview-ui já instaladas."
  fi
fi

# ------------------------------------------------------------
# 9. Garantir vsce disponível
# ------------------------------------------------------------

if ! npx --yes vsce --version >/dev/null 2>&1; then
  echo "Erro: não foi possível executar vsce."
  echo "Tente instalar com:"
  echo "npm install --save-dev @vscode/vsce"
  exit 1
fi

VSCE_VERSION=$(npx --yes vsce --version)
echo "vsce: $VSCE_VERSION"

# ------------------------------------------------------------
# 10. Compilar projeto
# ------------------------------------------------------------

if [ "$SKIP_BUILD" = false ]; then
  echo "Compilando projeto..."

  if npm run | grep -q "compile"; then
    npm run compile
  elif npm run | grep -q "build"; then
    npm run build
  else
    echo "Aviso: nenhum script 'compile' ou 'build' encontrado."
    echo "Pulando compilação."
  fi
else
  echo "Compilação ignorada por --skip-build."
fi

# ------------------------------------------------------------
# 11. Validar arquivo main, se definido
# ------------------------------------------------------------

if [ -n "$EXTENSION_MAIN" ]; then
  MAIN_PATH="${EXTENSION_MAIN#./}"

  if [ ! -f "$MAIN_PATH" ]; then
    echo "Aviso: arquivo main não encontrado: $MAIN_PATH"
    echo "Verifique se o build gerou o arquivo correto."
  else
    echo "Arquivo main encontrado: $MAIN_PATH"
  fi
fi

# ------------------------------------------------------------
# 12. Gerar pacote .vsix
# ------------------------------------------------------------

echo "Gerando pacote .vsix..."

npx --yes vsce package

VSIX_FILE=$(ls -t ./*.vsix 2>/dev/null | head -n 1 || true)

if [ -z "$VSIX_FILE" ]; then
  echo "Erro: nenhum arquivo .vsix foi gerado."
  exit 1
fi

echo "============================================================"
echo " Pacote gerado com sucesso"
echo "============================================================"
echo "Arquivo: $VSIX_FILE"

# ------------------------------------------------------------
# 13. Instalar localmente, se solicitado
# ------------------------------------------------------------

if [ "$INSTALL_AFTER_PACKAGE" = true ]; then
  if ! command -v code >/dev/null 2>&1; then
    echo "Aviso: comando 'code' não encontrado."
    echo "Instale manualmente pelo VS Code:"
    echo "Extensions > ... > Install from VSIX"
    exit 0
  fi

  echo "Instalando extensão localmente no VS Code..."
  code --install-extension "$VSIX_FILE" --force

  echo "Extensão instalada localmente."
fi

echo "Finalizado."