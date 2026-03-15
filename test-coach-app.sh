#!/bin/bash

SCREENSHOT_DIR="/Users/joe/irvine-all-stars/test-screenshots"
mkdir -p "$SCREENSHOT_DIR"

# Helper to take screenshot and continue
ss() {
  npx agent-browser screenshot "$SCREENSHOT_DIR/$1" 2>&1
  echo "Screenshot saved: $1"
}

echo "=========================================="
echo "TEST 1: Navigate to coach application"
echo "=========================================="
npx agent-browser open "https://irvineallstars.com/apply/coach" 2>&1
sleep 2
echo "URL after load: $(npx agent-browser get url 2>&1)"
ss "01-coach-app-landing.png"
npx agent-browser snapshot -i 2>&1

echo ""
echo "=========================================="
echo "TEST 2: Fill out Step 1 (Contact Info)"
echo "=========================================="
npx agent-browser fill 'input[id="full_name"]' "Test Coach Johnson" 2>&1
npx agent-browser fill 'input[id="email"]' "testcoach@example.com" 2>&1
npx agent-browser fill 'input[id="phone"]' "949-555-1234" 2>&1
npx agent-browser fill 'input[id="address"]' "123 Main St, Irvine CA 92620" 2>&1
ss "02-step1-filled.png"

# Click Next button - using text locator
npx agent-browser find text "NEXT" click 2>&1 || npx agent-browser click 'button:has-text("NEXT")' 2>&1 || echo "WARN: Could not click Next button"
sleep 2
echo "URL after Step 1 Next: $(npx agent-browser get url 2>&1)"
ss "03-step2.png"
npx agent-browser snapshot -i 2>&1

echo ""
echo "=========================================="
echo "TEST 3: Fill out Step 2 (Experience)"
echo "=========================================="
npx agent-browser select 'select[id="current_division"]' "9U-Mustang" 2>&1 || echo "WARN: Could not select division"
npx agent-browser fill 'input[id="years_experience"]' "5" 2>&1 || echo "WARN: Could not fill years"
npx agent-browser fill 'textarea[id="previous_allstar_experience"]' "Coached travel ball for 3 years" 2>&1 || echo "WARN: Could not fill prev exp"
ss "04-step2-filled.png"

npx agent-browser find text "NEXT" click 2>&1 || echo "WARN: Could not click Next"
sleep 2
ss "05-step3.png"
npx agent-browser snapshot -i 2>&1

echo ""
echo "=========================================="
echo "TEST 4: Fill out Step 3 (Philosophy)"
echo "=========================================="
npx agent-browser fill 'textarea[id="coaching_philosophy"]' "Player development first, winning second" 2>&1 || echo "WARN"
npx agent-browser fill 'textarea[id="player_development_approach"]' "Focus on fundamentals and game awareness" 2>&1 || echo "WARN"
npx agent-browser fill 'textarea[id="communication_style"]' "Open door policy with parents" 2>&1 || echo "WARN"
npx agent-browser fill 'textarea[id="tournament_experience"]' "Managed teams in USSSA and PONY tournaments" 2>&1 || echo "WARN"
ss "06-step3-filled.png"

npx agent-browser find text "NEXT" click 2>&1 || echo "WARN: Could not click Next"
sleep 2
ss "07-step4.png"
npx agent-browser snapshot -i 2>&1

echo ""
echo "=========================================="
echo "TEST 5: Fill out Step 4 (Compliance & Submit)"
echo "=========================================="
npx agent-browser check 'input[id="consent_background_check"]' 2>&1 || echo "WARN"
npx agent-browser check 'input[id="consent_safety_certs"]' 2>&1 || echo "WARN"
npx agent-browser check 'input[id="agree_pony_rules"]' 2>&1 || echo "WARN"
npx agent-browser check 'input[id="agree_ipb_policies"]' 2>&1 || echo "WARN"
npx agent-browser check 'input[id="commit_full_season"]' 2>&1 || echo "WARN"
npx agent-browser fill 'textarea[id="why_manage"]' "I want to give back to the community" 2>&1 || echo "WARN"
npx agent-browser fill 'textarea[id="unique_qualities"]' "Strong communication and organizational skills" 2>&1 || echo "WARN"
npx agent-browser fill 'textarea[id="additional_comments"]' "Available for all practices and games" 2>&1 || echo "WARN"
ss "08-step4-filled.png"

# Submit
npx agent-browser find text "Submit Application" click 2>&1 || npx agent-browser find text "SUBMIT" click 2>&1 || echo "WARN: Could not click Submit"
sleep 4

echo ""
echo "=========================================="
echo "TEST 6: Verify submission"
echo "=========================================="
echo "URL after submit: $(npx agent-browser get url 2>&1)"
ss "09-submitted.png"
npx agent-browser snapshot -c 2>&1
echo "--- Console ---"
npx agent-browser console 2>&1
echo "--- Errors ---"
npx agent-browser errors 2>&1

echo ""
echo "=========================================="
echo "TEST 7: Admin verification"
echo "=========================================="
npx agent-browser open "https://irvineallstars.com/auth/login" 2>&1
sleep 2
npx agent-browser fill 'input[type="email"]' "allstars@irvinepony.com" 2>&1
npx agent-browser fill 'input[type="password"]' "Refreeze8!Decorated!Tuition" 2>&1
npx agent-browser find text "SIGN IN" click 2>&1 || echo "WARN: Could not click Sign In"
sleep 4
echo "URL after login: $(npx agent-browser get url 2>&1)"
ss "10-admin-login.png"

npx agent-browser open "https://irvineallstars.com/admin/applications" 2>&1
sleep 3
echo "URL: $(npx agent-browser get url 2>&1)"
ss "11-admin-applications.png"
npx agent-browser snapshot -c 2>&1

echo ""
echo "=========================================="
echo "ALL TESTS COMPLETE"
echo "=========================================="
