#!/bin/bash
# ============================================================================
# setup_cron.sh — Set up cron jobs for automated fixture fetching & resolution
# Run this once on the VPS: bash /root/football-prediction/scripts/setup_cron.sh
# ============================================================================

SCRIPT_DIR="/root/football-prediction/scripts"
LOG_DIR="/root/football-prediction/logs"

# Create log directory
mkdir -p "$LOG_DIR"

# Create environment file for cron (cron doesn't inherit shell env)
cat > "$SCRIPT_DIR/.env.cron" << 'ENVEOF'
# ⚠️ EDIT THESE VALUES:
export FOOTBALL_API_KEY="YOUR_API_KEY_HERE"
export GENLAYER_PRIVATE_KEY="YOUR_PRIVATE_KEY_HERE"
export CONTRACT_ADDRESS="0x1Ef6B4b71352c8803a69f2B5981543505967F593"
export PATH="/usr/local/bin:/usr/bin:/bin"
ENVEOF

echo "📝 Created $SCRIPT_DIR/.env.cron"
echo "⚠️  IMPORTANT: Edit $SCRIPT_DIR/.env.cron with your real API key and private key!"
echo ""

# Create wrapper scripts that source env
cat > "$SCRIPT_DIR/run_fetch.sh" << FETCHEOF
#!/bin/bash
source $SCRIPT_DIR/.env.cron
cd /root/football-prediction
/usr/bin/node scripts/fetch_fixtures.mjs >> $LOG_DIR/fetch.log 2>&1
FETCHEOF
chmod +x "$SCRIPT_DIR/run_fetch.sh"

cat > "$SCRIPT_DIR/run_resolve.sh" << RESOLVEEOF
#!/bin/bash
source $SCRIPT_DIR/.env.cron
cd /root/football-prediction
/usr/bin/node scripts/resolve_matches.mjs >> $LOG_DIR/resolve.log 2>&1
RESOLVEEOF
chmod +x "$SCRIPT_DIR/run_resolve.sh"

# Add cron jobs
(crontab -l 2>/dev/null | grep -v "fetch_fixtures\|resolve_matches"; cat << CRONEOF

# ── Football Prediction Market Automation ──────────────────
# Fetch new fixtures every 6 hours
0 */6 * * * $SCRIPT_DIR/run_fetch.sh

# Resolve finished matches every 30 minutes
*/30 * * * * $SCRIPT_DIR/run_resolve.sh
CRONEOF
) | crontab -

echo ""
echo "✅ Cron jobs installed:"
echo "   - Fetch fixtures:   every 6 hours  (0 */6 * * *)"
echo "   - Resolve matches:  every 30 min   (*/30 * * * *)"
echo ""
echo "📋 Logs:"
echo "   - Fetch log:    $LOG_DIR/fetch.log"
echo "   - Resolve log:  $LOG_DIR/resolve.log"
echo ""
echo "🔧 Next steps:"
echo "   1. Edit $SCRIPT_DIR/.env.cron with your real keys"
echo "   2. Test manually:"
echo "      source $SCRIPT_DIR/.env.cron && node scripts/fetch_fixtures.mjs"
echo "      source $SCRIPT_DIR/.env.cron && node scripts/resolve_matches.mjs"
echo "   3. Check logs: tail -f $LOG_DIR/fetch.log"
