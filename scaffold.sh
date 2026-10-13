#!/usr/bin/env bash
set -e

PLUGIN_NAME="statics-detector-rolldown-plugin"
PLUGIN_PATH=${PLUGIN_PATH:-"."}

adds_on_name=""
if [ -z "$1" ] || [ -z "${1//}" ]; then
	echo "Usage: $0 <adds-on-name>"
	exit 1
fi
adds_on_name="$1"


__init() {
echo "init"

cat > package.json << EOF
{
  "name": "$adds_on_name",
  "version": "1.0.0",
  "description": "A Firefox monifest v2 & ts adds-on",
  "author": "$USER",
  "type": "module",
  "license": "ISC",
EOF
cat >> package.json << 'EOF'
  "scripts": {
    "build": "rolldown -c rolldown.config.ts build",
    "dev": "rolldown -c rolldown.config.ts build --watch"
    "lint": "eslint .",
    "format": "prettier --write ."
  }
}
EOF

cat package.json

exit 0

npm install -D \
typescript \

eslint prettier typescript-eslint eslint-config-prettier

}

__create_prettier() {
cat >".prettierrc"<<EOF
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "endOfLine": "lf"
}

EOF
}

__init


