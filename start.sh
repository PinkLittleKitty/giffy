#!/usr/bin/env bash
set -e

echo "==========================================="
echo "  Se pronuncia GIF, no JIF"
echo "==========================================="
echo ""

if ! command -v node >/dev/null 2>&1; then
    echo "Error: Node.js no está instalado o no se encuentra en el PATH."
    echo "Por favor instalá Node.js desde https://nodejs.org/"
    exit 1
fi

PORT=3000
URL="http://localhost:${PORT}"

cd "$(dirname "$0")"

node server.js &
SERVER_PID=$!

cleanup() {
    echo ""
    echo "Deteniendo el servidor (PID: $SERVER_PID)..."
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
    echo "Servidor detenido. ¡Hasta luego!"
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

sleep 1.5

echo ""
echo "Servidor iniciado en ${URL}"
echo "Abriendo tu navegador..."
echo "Presioná Ctrl + C para detener el servidor."
echo ""

if [[ "$OSTYPE" == "darwin"* ]]; then
    open "$URL" 2>/dev/null || true
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if command -v xdg-open >/dev/null 2>&1; then
        xdg-open "$URL" >/dev/null 2>&1 &
    elif command -v sensible-browser >/dev/null 2>&1; then
        sensible-browser "$URL" >/dev/null 2>&1 &
    elif command -v google-chrome >/dev/null 2>&1; then
        google-chrome "$URL" >/dev/null 2>&1 &
    elif command -v firefox >/dev/null 2>&1; then
        firefox "$URL" >/dev/null 2>&1 &
    fi
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    start "$URL" 2>/dev/null || true
fi

wait "$SERVER_PID"