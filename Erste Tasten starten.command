#!/bin/bash
# Erste Tasten starten – im Finder doppelklicken.
# Startet einen kleinen Webserver, der nur auf diesem Mac erreichbar ist, und öffnet die App in Chrome.
# Das Terminal-Fenster offen lassen, solange du übst. Schließen beendet den Server.
cd "$(dirname "$0")" || exit 1
PORT=8123
URL="http://localhost:$PORT"

open_app() {
  open -a "Google Chrome" "$URL" 2>/dev/null \
    || open -a "Microsoft Edge" "$URL" 2>/dev/null \
    || { echo "Chrome/Edge nicht gefunden – öffne Standardbrowser (USB-Keyboard geht dort evtl. nicht)."; open "$URL"; }
}

if curl -s -o /dev/null "$URL"; then
  echo "Erste Tasten läuft bereits – öffne $URL"
  open_app
  exit 0
fi

# Kleiner Webserver mit „no-cache“, damit der Browser nach Updates immer die neueste Version lädt
python3 - "$PORT" >/dev/null 2>&1 <<'PY' &
import http.server, sys
class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()
http.server.ThreadingHTTPServer(("127.0.0.1", int(sys.argv[1])), NoCache).serve_forever()
PY
SERVER=$!
trap 'kill "$SERVER" 2>/dev/null' EXIT HUP INT TERM
sleep 1
if ! kill -0 "$SERVER" 2>/dev/null; then
  echo "Der Server konnte nicht starten (ist Port $PORT belegt?)."
  exit 1
fi
open_app
echo "Erste Tasten läuft auf $URL"
echo "Zum Beenden dieses Fenster schließen oder Ctrl+C drücken."
wait "$SERVER"
