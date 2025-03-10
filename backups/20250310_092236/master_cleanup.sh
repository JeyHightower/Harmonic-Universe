#!/bin/bash

# Harmonic Universe - Master Cleanup Script
# This script runs all cleanup processes in sequence, repeating 15 times as requested

set -e # Exit on error

TOTAL_ITERATIONS=15
LOG_FILE="./cleanup_master_log_$(date +%Y%m%d_%H%M%S).txt"

echo "====== Starting Master Cleanup Process ======"
echo "Will run all cleanup tasks $TOTAL_ITERATIONS times"
echo "Log file: $LOG_FILE"
echo "Started at: $(date)"

echo "====== Starting Master Cleanup Process ======" > "$LOG_FILE"
echo "Will run all cleanup tasks $TOTAL_ITERATIONS times" >> "$LOG_FILE"
echo "Started at: $(date)" >> "$LOG_FILE"

# Make sure all scripts are executable
chmod +x ./cleanup_codebase.sh
chmod +x ./verify_cleanup.sh
chmod +x ./find_conflicts.sh

# Function to run a script and log its output
run_script() {
  local script="$1"
  local iteration="$2"

  echo -e "\n====== Running $script (Iteration $iteration) ======" | tee -a "$LOG_FILE"
  echo "Started at: $(date)" | tee -a "$LOG_FILE"

  # Run the script and capture both stdout and stderr, pass them to tee
  if "./$script" 2>&1 | tee -a "$LOG_FILE"; then
    echo "$script completed successfully (Iteration $iteration)" | tee -a "$LOG_FILE"
    return 0
  else
    echo "$script failed with exit code $? (Iteration $iteration)" | tee -a "$LOG_FILE"
    return 1
  fi
}

# Main loop to run all tasks for the specified number of iterations
for ((i=1; i<=$TOTAL_ITERATIONS; i++)); do
  echo -e "\n\n======= ITERATION $i OF $TOTAL_ITERATIONS =======" | tee -a "$LOG_FILE"
  echo "Started at: $(date)" | tee -a "$LOG_FILE"

  # Task 1: Find conflicts in the codebase
  echo -e "\n--- Task 1: Finding conflicts in the codebase ---" | tee -a "$LOG_FILE"
  run_script "find_conflicts.sh" "$i"

  # Task 2: Clean up the codebase
  echo -e "\n--- Task 2: Cleaning up the codebase ---" | tee -a "$LOG_FILE"
  run_script "cleanup_codebase.sh" "$i"

  # Task 3: Verify the cleanup
  echo -e "\n--- Task 3: Verifying the cleanup ---" | tee -a "$LOG_FILE"
  run_script "verify_cleanup.sh" "$i"

  echo -e "\n--- Completed iteration $i of $TOTAL_ITERATIONS ---" | tee -a "$LOG_FILE"
  echo "Finished at: $(date)" | tee -a "$LOG_FILE"

  # Check if we're on the final iteration
  if [ "$i" -lt "$TOTAL_ITERATIONS" ]; then
    echo "Waiting 2 seconds before starting the next iteration..." | tee -a "$LOG_FILE"
    sleep 2
  fi
done

echo -e "\n====== Master Cleanup Process Complete! ======"
echo "Ran all cleanup tasks $TOTAL_ITERATIONS times"
echo "Completed at: $(date)"
echo "Full log available at: $LOG_FILE"

echo -e "\n====== Master Cleanup Process Complete! ======" >> "$LOG_FILE"
echo "Ran all cleanup tasks $TOTAL_ITERATIONS times" >> "$LOG_FILE"
echo "Completed at: $(date)" >> "$LOG_FILE"
