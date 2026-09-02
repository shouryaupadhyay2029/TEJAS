import os
import sys
import pandas as pd

# Add backend directory to sys.path to import load_timetable module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from scripts.load_timetable import COLUMN_MAP

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
CSV_1 = os.path.join(DATA_DIR, "Train_details_22122017.csv")
CSV_2 = os.path.join(DATA_DIR, "isl_wise_train_detail_03082015_v1.csv")

def inspect_csv(file_path):
    filename = os.path.basename(file_path)
    print(f"\n==================================================")
    print(f"INSPECTING: {filename}")
    print(f"==================================================")
    
    if not os.path.exists(file_path):
        print(f"ERROR: File not found at {file_path}")
        return None
        
    df = pd.read_csv(file_path, nrows=5)
    
    col_names = list(df.columns)
    print("\n--- EXACT COLUMN NAMES (repr) ---")
    print(repr(col_names))
    
    print("\n--- COLUMN DTYPES ---")
    for col, dtype in df.dtypes.items():
        print(f"  {repr(col)}: {dtype}")
        
    print("\n--- FIRST 5 ROWS ---")
    print(df.to_string())
    
    return col_names

def verify_column_map(csv_columns, filename):
    print(f"\n--------------------------------------------------")
    print(f"COLUMN_MAP MATCH VERIFICATION FOR: {filename}")
    print(f"--------------------------------------------------")
    
    if csv_columns is None:
        print("Skipping verification due to missing CSV.")
        return
        
    mismatches = []
    matches = []
    
    for expected_key in COLUMN_MAP.keys():
        if expected_key in csv_columns:
            matches.append(expected_key)
        else:
            # Look for near matches
            near_matches = [
                col for col in csv_columns
                if col.strip().lower() == expected_key.strip().lower()
            ]
            if near_matches:
                mismatches.append((expected_key, near_matches[0], "Whitespace/case/encoding difference"))
            else:
                mismatches.append((expected_key, None, "Missing completely from CSV headers"))
                
    print(f"\nExact Matches ({len(matches)}/{len(COLUMN_MAP)}):")
    for m in matches:
        print(f"  [OK] '{m}' -> '{COLUMN_MAP[m]}'")
        
    if mismatches:
        print(f"\nMismatches / Missing ({len(mismatches)}):")
        for expected, actual, reason in mismatches:
            if actual:
                print(f"  [MISMATCH] COLUMN_MAP expects {repr(expected)} but CSV has {repr(actual)} ({reason})")
            else:
                print(f"  [MISSING] COLUMN_MAP expects {repr(expected)} but not found in CSV headers ({reason})")
    else:
        print("\nAll expected COLUMN_MAP keys match the CSV headers perfectly!")

def main():
    cols_1 = inspect_csv(CSV_1)
    if cols_1:
        verify_column_map(cols_1, os.path.basename(CSV_1))
        
    cols_2 = inspect_csv(CSV_2)
    if cols_2:
        verify_column_map(cols_2, os.path.basename(CSV_2))

if __name__ == "__main__":
    main()
