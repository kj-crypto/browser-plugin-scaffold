#!/usr/bin/env bash

EXCLUDE='.*\.\(ts\|js\|tsx\|jsx\)$'

set_exclude() {
    EXCLUDE=${1:-$EXCLUDE}
}

copy_statics() {
    local source_dir=$1
    local target_dir=$2
    echo "[BASH] Run with pattern '$EXCLUDE'"

    find "$source_dir" -type f ! -regex $EXCLUDE | while read -r file; do
        dest="${file/#$source_dir/$target_dir}"
        mkdir -p $(dirname "$dest")

        cp "$file" "$dest"
        echo "Updated $file"
    done
}

watch_files() {
    local source_dir=$1
    local target_dir=$2
    local sleep_time=$3
    echo "[BASH] Run with pattern '$EXCLUDE'"

    local last_check_time="0"
    while true; do
        current_time=$(date +%s.%N)

        find "$source_dir" -type f  -newermt "@$last_check_time" ! -regex $EXCLUDE | while read -r file; do
                dest="${file/#$source_dir/$target_dir}"
                # mkdir -p "$(dirname "$dest")"
                # cp "$file" "$dests"
                echo "Updated $file to $dest"
        done

        last_check_time=$current_time
        sleep $sleep_time
    done
}

set_exclude
