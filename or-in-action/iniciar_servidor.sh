#!/bin/bash

# Script para iniciar un servidor local para la competencia MCP
# Esto evita problemas de CORS al cargar archivos CSV

echo "🚀 Iniciando servidor local para la Competencia MCP..."
echo ""
echo "📍 Directorio: $(pwd)"
echo ""

# Verificar si Python 3 está disponible
if command -v python3 &> /dev/null; then
    echo "✅ Python 3 detectado"
    echo "🌐 Servidor iniciando en: http://localhost:8000"
    echo ""
    echo "📋 Abre tu navegador en: http://localhost:8000/competencia_mcp.html"
    echo ""
    echo "⚠️  Presiona Ctrl+C para detener el servidor"
    echo ""
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "✅ Python detectado"
    echo "🌐 Servidor iniciando en: http://localhost:8000"
    echo ""
    echo "📋 Abre tu navegador en: http://localhost:8000/competencia_mcp.html"
    echo ""
    echo "⚠️  Presiona Ctrl+C para detener el servidor"
    echo ""
    python -m SimpleHTTPServer 8000
elif command -v php &> /dev/null; then
    echo "✅ PHP detectado"
    echo "🌐 Servidor iniciando en: http://localhost:8000"
    echo ""
    echo "📋 Abre tu navegador en: http://localhost:8000/competencia_mcp.html"
    echo ""
    echo "⚠️  Presiona Ctrl+C para detener el servidor"
    echo ""
    php -S localhost:8000
else
    echo "❌ No se encontró Python ni PHP"
    echo ""
    echo "Por favor instala Python 3 o usa Node.js:"
    echo "  npx http-server -p 8000"
    echo ""
    echo "O abre el archivo directamente y usa la opción de carga manual."
    exit 1
fi
