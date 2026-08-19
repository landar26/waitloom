#!/usr/bin/env bash
#
# Upload the secrets in .dev.vars to the deployed Cloudflare Worker.
#
#   ./scripts/put-secrets.sh              # push ADMIN_PASSWORD and IP_SALT
#   ./scripts/put-secrets.sh IP_SALT      # push only the keys you name
#   ./scripts/put-secrets.sh -y           # skip the confirmation prompt
#   ENV_FILE=.dev.vars.prod ./scripts/put-secrets.sh
#
# Values are read from the (gitignored) env file and piped straight to
# `wrangler secret bulk`. The script never prints a secret value.
#
# Note: NEXT_PUBLIC_SITE_URL is a plain var in wrangler.jsonc, not a secret —
# it is inlined into the client bundle at build time and does not belong here.

set -euo pipefail

cd "$(dirname "$0")/.."

ENV_FILE="${ENV_FILE:-.dev.vars}"
ASSUME_YES=false
KEYS=()

for arg in "$@"; do
	case "$arg" in
		-y | --yes) ASSUME_YES=true ;;
		-h | --help)
			sed -n '3,15p' "$0" | sed 's/^# \{0,1\}//'
			exit 0
			;;
		-*)
			echo "unknown flag: $arg" >&2
			exit 1
			;;
		*) KEYS+=("$arg") ;;
	esac
done

if [ ${#KEYS[@]} -eq 0 ]; then
	KEYS=(ADMIN_PASSWORD IP_SALT)
fi

if [ ! -f "$ENV_FILE" ]; then
	echo "error: $ENV_FILE not found — create it before pushing secrets." >&2
	exit 1
fi

# Build the JSON payload, failing loudly on a missing or empty key.
payload="$(python3 - "$ENV_FILE" "${KEYS[@]}" <<'PY'
import json, sys

path, *keys = sys.argv[1:]
values = {}
with open(path, encoding="utf-8") as handle:
    for line in handle:
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key, value = key.strip(), value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        values[key] = value

out = {}
for key in keys:
    value = values.get(key, "")
    if not value:
        sys.exit(f"error: {key} is missing or empty in {path}")
    out[key] = value

print(json.dumps(out))
PY
)"

echo "About to upload to the 'waitloom' Worker from $ENV_FILE:"
for key in "${KEYS[@]}"; do
	length="$(python3 -c 'import json,sys; print(len(json.loads(sys.argv[1])[sys.argv[2]]))' "$payload" "$key")"
	echo "  - $key ($length chars)"
done

if [ "$ASSUME_YES" = false ]; then
	if [ ! -t 0 ]; then
		# Never upload unattended just because there is no terminal to ask at.
		echo "error: not running interactively — re-run with -y to confirm." >&2
		exit 1
	fi
	printf 'Continue? [y/N] '
	read -r reply
	case "$reply" in
		y | Y | yes | YES) ;;
		*)
			echo "aborted."
			exit 1
			;;
	esac
fi

printf '%s' "$payload" | npx wrangler secret bulk

echo "Done. Secrets take effect on the next request; no redeploy needed."
