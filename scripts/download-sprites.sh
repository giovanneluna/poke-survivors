#!/bin/bash
# Download attack sprite frames from pokemonAutoChess
BASE_URL="https://raw.githubusercontent.com/keldaanCommunity/pokemonAutoChess/main/app/public/src/assets/abilities%7Btps%7D"
OUT_DIR="public/assets/attacks/frames"

mkdir -p "$OUT_DIR"

# Map: local_name|remote_name|frame_count
ATTACKS=(
  "scratch|CUT|8"
  "slash|SLASH|4"
  "fury-swipes|X_SCISSOR|10"
  "night-slash|NIGHT_SLASH|15"
  "fire-fang|FIRE_FANG|10"
  "blaze-kick|BLAZE_KICK|15"
  "dragon-breath|DRAGON_BREATH|9"
  "dragon-claw|DRAGON_CLAW|10"
  "dragon-pulse|DRAGON_PULSE|6"
  "dragon-rush|CLOSE_COMBAT|7"
  "draco-meteor|DRACO_METEOR|31"
  "smokescreen|SMOKE_SCREEN|12"
  "flame-charge|FLAME_CHARGE|31"
  "flare-blitz|BLUE_FLARE|15"
  "air-slash|AIR_SLASH|8"
  "aerial-ace|AERIAL_ACE|4"
  "hurricane|HURRICANE|31"
  "heat-wave|ERUPTION|11"
  "outrage|OUTRAGE|13"
  "shadow-ball|SHADOW_BALL|31"
  "rock-slide|ROCK_SLIDE|31"
  "hyper-voice|HYPER_VOICE|4"
)

for entry in "${ATTACKS[@]}"; do
  IFS='|' read -r local_name remote_name frame_count <<< "$entry"
  dir="$OUT_DIR/$local_name"
  mkdir -p "$dir"

  echo "Downloading $local_name ($remote_name, $frame_count frames)..."
  for i in $(seq 0 $((frame_count - 1))); do
    f=$(printf "%03d" $i)
    outfile="$dir/${f}.png"
    if [ ! -f "$outfile" ]; then
      curl -s -o "$outfile" "${BASE_URL}/${remote_name}/${f}.png" &
    fi
    # Limit parallel downloads
    if (( (i + 1) % 10 == 0 )); then
      wait
    fi
  done
  wait
  echo "  Done: $local_name"
done

echo "All downloads complete!"
