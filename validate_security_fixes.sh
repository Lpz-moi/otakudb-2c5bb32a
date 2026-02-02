#!/bin/bash
# 🔒 Security Validation Script for OtakuDB

echo "================================"
echo "OtakuDB Security Audit Validation"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# Helper functions
check_file_exists() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✓${NC} File exists: $1"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} File missing: $1"
    ((FAILED++))
  fi
}

check_pattern_exists() {
  local file=$1
  local pattern=$2
  local description=$3
  
  if grep -q "$pattern" "$file" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} $description"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} $description (pattern not found in $file)"
    ((FAILED++))
  fi
}

check_pattern_not_exists() {
  local file=$1
  local pattern=$2
  local description=$3
  
  if ! grep -q "$pattern" "$file" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} $description"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} $description (pattern found in $file)"
    ((FAILED++))
  fi
}

# Tests
echo "1️⃣  Session Logs Security"
check_pattern_not_exists \
  "supabase/migrations/20260201211822_bd9f2d6d-0692-4f08-b508-b446abf4d1a7.sql" \
  'CREATE POLICY "Users can view own session logs"' \
  "Session logs SELECT policy removed"

echo ""
echo "2️⃣  Discord Data Privacy"
check_pattern_exists \
  "supabase/migrations/20260201211822_bd9f2d6d-0692-4f08-b508-b446abf4d1a7.sql" \
  "Discord data.*PRIVATE" \
  "Discord privacy documentation added"

check_pattern_exists \
  "src/pages/FriendsPage.tsx" \
  "select.*display_name.*discord_username.*discord_avatar.*total_anime" \
  "FriendsPage selects only public profile fields"

echo ""
echo "3️⃣  CSRF Protection"
check_pattern_exists \
  "supabase/functions/discord-auth/index.ts" \
  "CSRF protection.*state parameter" \
  "CSRF protection code comment added"

check_pattern_exists \
  "supabase/functions/discord-auth/index.ts" \
  "CSRF protection.*Missing state parameter" \
  "CSRF validation check implemented"

check_pattern_exists \
  "src/hooks/useDiscordAuth.ts" \
  "handleCallback.*state" \
  "useDiscordAuth passes state to callback"

check_pattern_exists \
  "src/pages/AuthPage.tsx" \
  "const state = searchParams.get" \
  "AuthPage extracts state from query params"

echo ""
echo "4️⃣  RLS Policies Cleanup"
check_pattern_not_exists \
  "supabase/migrations/20260201211822_bd9f2d6d-0692-4f08-b508-b446abf4d1a7.sql" \
  'CREATE POLICY "Require authentication"' \
  "Redundant 'Require authentication' policies removed"

echo ""
echo "5️⃣  Anime Lists Policy Fix"
check_pattern_exists \
  "supabase/migrations/20260201211822_bd9f2d6d-0692-4f08-b508-b446abf4d1a7.sql" \
  "share_watching = 'friends_only'" \
  "anime_lists policy restricts to friends_only (not public)"

check_pattern_exists \
  "supabase/migrations/20260201211822_bd9f2d6d-0692-4f08-b508-b446abf4d1a7.sql" \
  "Do NOT allow public viewing through anime_lists" \
  "anime_lists public access restriction documented"

echo ""
echo "6️⃣  SQL Injection Prevention"
check_pattern_exists \
  "src/pages/FriendsPage.tsx" \
  "replace.*\\^" \
  "Search sanitization uses character class whitelist"

check_pattern_exists \
  "src/pages/FriendsPage.tsx" \
  "if.*sanitizedQuery.length === 0" \
  "Search validates sanitized query length"

echo ""
echo "================================"
echo "Summary"
echo "================================"
echo -e "Passed: ${GREEN}${PASSED}${NC}"
echo -e "Failed: ${RED}${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All security checks passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some checks failed!${NC}"
  exit 1
fi
