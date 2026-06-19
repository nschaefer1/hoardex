import csv
import sqlite3
from pathlib import Path

DB_PATH = 'data/database.db'
CSV_PATH = 'dev/dim_inventory_seed.csv'
DEFAULT_ICON = 'frontend/icons/default.png'

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()
cursor.execute('PRAGMA foreign_keys = ON;')

with open(CSV_PATH, newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        cursor.execute("""
            INSERT INTO dim_inventory (inv_name, inv_desc, inv_type, equip_location, weight_lbs, child_ind, icon_path)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            row['inv_name'],
            row['inv_desc'] or None,
            row['inv_type'] or None,
            row['equip_location'] or None,
            float(row['weight_lbs']) if row['weight_lbs'] else None,
            int(row['child_ind']),
            DEFAULT_ICON
        ))

conn.commit()
conn.close()