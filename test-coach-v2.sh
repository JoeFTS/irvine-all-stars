#!/bin/bash
# Coach Application E2E Test v2 - Uses ref-based interactions

SD="/Users/joe/irvine-all-stars/test-screenshots"
mkdir -p "$SD"

echo "=== STEP 1: Open coach application ==="
npx agent-browser open "https://irvineallstars.com/apply/coach" 2>&1
sleep 2

# Verify we're on the right page
URL=$(npx agent-browser get url 2>&1)
echo "URL: $URL"
if [[ "$URL" != *"/apply/coach"* ]]; then
  echo "FAIL: Wrong page. Exiting."
  exit 1
fi

npx agent-browser screenshot "$SD/01-landing.png" 2>&1

# Get fresh snapshot with refs
echo ""
echo "=== Getting snapshot for refs ==="
SNAP=$(npx agent-browser snapshot -i 2>&1)
echo "$SNAP"

# Extract the Next button ref
NEXT_REF=$(echo "$SNAP" | grep -o 'button "NEXT.*\[ref=e[0-9]*\]' | grep -o 'e[0-9]*')
echo "Next button ref: @$NEXT_REF"

# Fill Step 1 using CSS selectors with escaped quotes
echo ""
echo "=== Filling Step 1 ==="
npx agent-browser fill 'input[id="full_name"]' "Test Coach Johnson" 2>&1
npx agent-browser fill 'input[id="email"]' "testcoach@example.com" 2>&1
npx agent-browser fill 'input[id="phone"]' "949-555-1234" 2>&1
npx agent-browser fill 'input[id="address"]' "123 Main St, Irvine CA 92620" 2>&1
npx agent-browser screenshot "$SD/02-step1-filled.png" 2>&1

# Click Next using ref
echo ""
echo "=== Clicking Next (Step 1 -> Step 2) ==="
npx agent-browser click "@$NEXT_REF" 2>&1
sleep 2
npx agent-browser screenshot "$SD/03-step2.png" 2>&1
URL=$(npx agent-browser get url 2>&1)
echo "URL after clicking Next: $URL"

# Get new snapshot for Step 2
echo ""
echo "=== Step 2 snapshot ==="
SNAP2=$(npx agent-browser snapshot -i 2>&1)
echo "$SNAP2"

# Check if we're still on the same page
if [[ "$URL" != *"/apply/coach"* ]]; then
  echo "FAIL: Page navigated away after clicking Next!"
  exit 1
fi

# Fill Step 2
echo ""
echo "=== Filling Step 2 ==="
npx agent-browser select 'select[id="current_division"]' "9U-Mustang" 2>&1
npx agent-browser fill 'input[id="years_experience"]' "5" 2>&1
npx agent-browser fill 'textarea[id="previous_allstar_experience"]' "Coached travel ball for 3 years" 2>&1
npx agent-browser screenshot "$SD/04-step2-filled.png" 2>&1

# Get Next button ref for Step 2
NEXT_REF2=$(echo "$SNAP2" | grep -o 'button "NEXT.*\[ref=e[0-9]*\]' | grep -o 'e[0-9]*')
echo "Next button ref (Step 2): @$NEXT_REF2"
npx agent-browser click "@$NEXT_REF2" 2>&1
sleep 2
npx agent-browser screenshot "$SD/05-step3.png" 2>&1

echo ""
echo "=== Step 3 snapshot ==="
SNAP3=$(npx agent-browser snapshot -i 2>&1)
echo "$SNAP3"

# Fill Step 3
echo ""
echo "=== Filling Step 3 ==="
npx agent-browser fill 'textarea[id="coaching_philosophy"]' "Player development first, winning second" 2>&1
npx agent-browser fill 'textarea[id="player_development_approach"]' "Focus on fundamentals and game awareness" 2>&1
npx agent-browser fill 'textarea[id="communication_style"]' "Open door policy with parents" 2>&1
npx agent-browser fill 'textarea[id="tournament_experience"]' "Managed teams in USSSA and PONY tournaments" 2>&1
npx agent-browser screenshot "$SD/06-step3-filled.png" 2>&1

NEXT_REF3=$(echo "$SNAP3" | grep -o 'button "NEXT.*\[ref=e[0-9]*\]' | grep -o 'e[0-9]*')
echo "Next button ref (Step 3): @$NEXT_REF3"
npx agent-browser click "@$NEXT_REF3" 2>&1
sleep 2
npx agent-browser screenshot "$SD/07-step4.png" 2>&1

echo ""
echo "=== Step 4 snapshot ==="
SNAP4=$(npx agent-browser snapshot -i 2>&1)
echo "$SNAP4"

# Fill Step 4
echo ""
echo "=== Filling Step 4 ==="
npx agent-browser check 'input[id="consent_background_check"]' 2>&1
npx agent-browser check 'input[id="consent_safety_certs"]' 2>&1
npx agent-browser check 'input[id="agree_pony_rules"]' 2>&1
npx agent-browser check 'input[id="agree_ipb_policies"]' 2>&1
npx agent-browser check 'input[id="commit_full_season"]' 2>&1
npx agent-browser fill 'textarea[id="why_manage"]' "I want to give back to the community" 2>&1
npx agent-browser fill 'textarea[id="unique_qualities"]' "Strong communication and organizational skills" 2>&1
npx agent-browser fill 'textarea[id="additional_comments"]' "Available for all practices and games" 2>&1
npx agent-browser screenshot "$SD/08-step4-filled.png" 2>&1

# Click Submit
SUBMIT_REF=$(echo "$SNAP4" | grep -o 'button "SUBMIT.*\[ref=e[0-9]*\]' | grep -o 'e[0-9]*')
if [ -z "$SUBMIT_REF" ]; then
  SUBMIT_REF=$(echo "$SNAP4" | grep -oi 'button.*submit.*\[ref=e[0-9]*\]' | grep -o 'e[0-9]*')
fi
echo "Submit button ref: @$SUBMIT_REF"
npx agent-browser click "@$SUBMIT_REF" 2>&1
sleep 5

echo ""
echo "=== Submission result ==="
npx agent-browser screenshot "$SD/09-submitted.png" 2>&1
URL=$(npx agent-browser get url 2>&1)
echo "URL: $URL"
npx agent-browser snapshot -c 2>&1
echo "--- Errors ---"
npx agent-browser errors 2>&1
echo "--- Console ---"
npx agent-browser console 2>&1

echo ""
echo "=== Admin Login ==="
npx agent-browser open "https://irvineallstars.com/auth/login" 2>&1
sleep 2
SNAP_LOGIN=$(npx agent-browser snapshot -i 2>&1)
echo "$SNAP_LOGIN"

EMAIL_REF=$(echo "$SNAP_LOGIN" | grep -o 'textbox "EMAIL.*\[.*ref=e[0-9]*\]' | grep -o 'e[0-9]*')
PASS_REF=$(echo "$SNAP_LOGIN" | grep -o 'textbox "PASSWORD.*\[.*ref=e[0-9]*\]' | grep -o 'e[0-9]*')
SIGNIN_REF=$(echo "$SNAP_LOGIN" | grep -o 'button "SIGN IN.*\[ref=e[0-9]*\]' | grep -o 'e[0-9]*')

echo "Email ref: @$EMAIL_REF, Pass ref: @$PASS_REF, SignIn ref: @$SIGNIN_REF"

npx agent-browser fill "@$EMAIL_REF" "allstars@irvinepony.com" 2>&1
npx agent-browser fill "@$PASS_REF" "Refreeze8!Decorated!Tuition" 2>&1
npx agent-browser click "@$SIGNIN_REF" 2>&1
sleep 5
echo "URL after login: $(npx agent-browser get url 2>&1)"
npx agent-browser screenshot "$SD/10-admin-login.png" 2>&1

npx agent-browser open "https://irvineallstars.com/admin/applications" 2>&1
sleep 3
echo "URL: $(npx agent-browser get url 2>&1)"
npx agent-browser screenshot "$SD/11-admin-applications.png" 2>&1
npx agent-browser snapshot -c 2>&1

echo ""
echo "=== DONE ==="
