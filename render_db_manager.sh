#!/bin/bash

# Harmonic Universe - Render Database Manager
# This script helps manage the lifecycle of your Render.com database instance

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Function to print section headers
print_section() {
  echo -e "\n${BOLD}${CYAN}=== $1 ===${NC}"
}

# Function to display usage
print_usage() {
  echo -e "${BOLD}Harmonic Universe - Render Database Manager${NC}"
  echo -e "Usage: $0 <command>"
  echo
  echo -e "${BOLD}Commands:${NC}"
  echo -e "  setup-reminder     Setup calendar reminders for database renewal"
  echo -e "  check-expiry       Check when the current database will expire"
  echo -e "  backup             Create a backup of your current database"
  echo -e "  instructions       Show instructions for creating a new database instance"
  echo
}

# Setup calendar reminders for database renewal
setup_reminder() {
  print_section "Setting Up Calendar Reminders"

  # Calculate dates
  current_date=$(date +"%Y-%m-%d")
  reminder_date=$(date -v+25d +"%Y-%m-%d")
  expiry_date=$(date -v+30d +"%Y-%m-%d")

  echo -e "Current Date: ${BOLD}$current_date${NC}"
  echo -e "Reminder Date (25 days): ${YELLOW}$reminder_date${NC}"
  echo -e "Expiry Date (30 days): ${RED}$expiry_date${NC}"

  # Create an ICS file for calendar
  echo "Creating calendar reminder file (db_renewal_reminder.ics)..."

  cat > db_renewal_reminder.ics << EOL
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Harmonic Universe//Render DB Renewal//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
SUMMARY:Render Database Renewal - Harmonic Universe
DTSTART:${reminder_date}T090000
DTEND:${reminder_date}T100000
DESCRIPTION:Your Render.com free database instance will expire in 5 days. Create a new instance and update your application's environment variables.
BEGIN:VALARM
TRIGGER:-PT24H
ACTION:DISPLAY
DESCRIPTION:Reminder: Render Database Renewal Tomorrow
END:VALARM
END:VEVENT
END:VCALENDAR
EOL

  echo -e "${GREEN}✓ Calendar reminder created: db_renewal_reminder.ics${NC}"
  echo -e "${YELLOW}! Import this file to your calendar application to set up the reminder.${NC}"
}

# Check when the current database will expire
check_expiry() {
  print_section "Checking Database Expiry"

  # Try to find creation timestamp from Render
  if [ -f ".render_db_created" ]; then
    creation_date=$(cat .render_db_created)
    echo -e "Database created on: ${BOLD}$creation_date${NC}"

    # Calculate days remaining
    current_timestamp=$(date +%s)
    creation_timestamp=$(date -j -f "%Y-%m-%d" "$creation_date" +%s)
    seconds_diff=$((current_timestamp - creation_timestamp))
    days_diff=$((seconds_diff / 86400))
    days_remaining=$((30 - days_diff))

    if [ $days_remaining -le 0 ]; then
      echo -e "${RED}! YOUR DATABASE HAS EXPIRED !${NC}"
      echo -e "${RED}! Create a new database instance immediately.${NC}"
    elif [ $days_remaining -le 5 ]; then
      echo -e "${RED}! WARNING: Database expires in $days_remaining days${NC}"
      echo -e "${YELLOW}! Create a new database instance soon.${NC}"
    else
      echo -e "${GREEN}✓ Database expires in $days_remaining days${NC}"
    fi
  else
    echo -e "${YELLOW}! Database creation date not found.${NC}"
    echo -e "${YELLOW}! To track expiry, run this command after creating a new database:${NC}"
    echo -e "${CYAN}  echo \"\$(date +\"%Y-%m-%d\")\" > .render_db_created${NC}"
  fi
}

# Backup current database
backup_database() {
  print_section "Backing Up Database"

  echo -e "${YELLOW}! This requires the pg_dump utility and database credentials.${NC}"

  # Check if DATABASE_URL is set
  if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL environment variable is not set.${NC}"
    echo -e "${YELLOW}! You can set it temporarily for this script:${NC}"
    echo -e "${CYAN}  export DATABASE_URL=postgres://username:password@host:port/database${NC}"
    return 1
  fi

  # Create backup filename with date
  backup_file="harmonic_universe_db_backup_$(date +"%Y%m%d").sql"

  echo "Creating database backup..."
  pg_dump "$DATABASE_URL" > "$backup_file"

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database backup created: $backup_file${NC}"
  else
    echo -e "${RED}✗ Database backup failed${NC}"
    return 1
  fi
}

# Show instructions for creating a new database
show_instructions() {
  print_section "Instructions for Creating a New Database"

  cat << EOL
${BOLD}Step 1: Create a New Database Instance${NC}
1. Log in to your Render.com account
2. Go to the Dashboard
3. Click on "New+" and select "PostgreSQL"
4. Give your database a descriptive name
5. Choose the region closest to you
6. Click "Create Database"
7. Wait for the database to be created
8. Save the "Internal Database URL" for the next step

${BOLD}Step 2: Update Environment Variables${NC}
1. For each application using the database:
   a. Go to the application's dashboard
   b. Click on "Environment" in the left sidebar
   c. Update the DATABASE_URL variable with the new URL
   d. Click "Save Changes"

${BOLD}Step 3: Re-deploy Your Applications${NC}
1. For each application:
   a. Go to the application's dashboard
   b. Click "Manual Deploy"
   c. Select "Clear build cache & deploy"
   d. Wait for the deployment to complete

${BOLD}Step 4: Update Local Tracking${NC}
1. Update the local tracking file with today's date:
   echo "\$(date +"%Y-%m-%d")" > .render_db_created

${BOLD}Step 5: Test Your Application${NC}
1. Visit your application URL
2. Verify that all functionality works correctly
3. Check that data is properly seeded

${BOLD}Step 6: Set a New Reminder${NC}
1. Run this script with the setup-reminder command:
   ./$(basename "$0") setup-reminder
2. Import the created ICS file to your calendar
EOL
}

# Main function
main() {
  if [ $# -eq 0 ]; then
    print_usage
    exit 1
  fi

  command=$1

  case $command in
    setup-reminder)
      setup_reminder
      ;;
    check-expiry)
      check_expiry
      ;;
    backup)
      backup_database
      ;;
    instructions)
      show_instructions
      ;;
    *)
      print_usage
      exit 1
      ;;
  esac
}

# Execute main function
main "$@"
