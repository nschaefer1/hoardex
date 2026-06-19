import logging
logger = logging.getLogger(__name__)

import sys
import sqlite3 as sql
from contextlib import contextmanager
from dataclasses import dataclass
from typing import List, Tuple, Any, Optional
from pathlib import Path

from .py_confirm import Alert
from .icon_manager import IconManager

@dataclass(frozen=True)
class DBReturn:
    success: bool
    columns: Optional[Tuple[str, ...]] = None
    rows: Optional[List[Tuple[Any, ...]]] = None
    row_count: Optional[int] = None

    def __post_init__(self):
        if not self.success:
            logger.error("DBReturn failure")
            return

        # Debug-level summary (safe, not too verbose)
        logger.debug(
            "DBReturn success | row_count=%s | columns=%s",
            self.row_count,
            self.columns
        )

class DBManager:

    _schema_initialized = False                                     # Prevents multiple schema creations
    
    def __init__(self, db_path='database.db', *, start_scripts=[]):
        self.db_path = db_path                                              # Database location
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)        # Create folder if it doesn't exist
        self._initialize_schema(start_scripts)                              # Schema creation

    def _initialize_schema(self, start_scripts):
        if DBManager._schema_initialized:
            return
        # Check to see if the database exists, if it doesn't force creation
        if not Path(self.db_path).exists():
            if not Alert().confirm("Database was not found relative to executable at data/database.db.\n\nThis is normal on first launch.\n\nCreate blank database?", "Database Not Found"):
                Alert().info("Cannot open application without database, closing.")
                sys.exit()
        # Run schema steps
        for f in start_scripts:
            result = self.execute_path(path=f, script=True)
            if not result.success:
                logger.error(f"Database initialization failed on step {f}")
                raise RuntimeError("Database initialization failed")
        # Sync DB and icons
        IconManager().sync_icons(self)
        # Set singleton variable
        DBManager._schema_initialized = True
     
    def execute(self, query, params=None):
        with sql.connect(self.db_path) as conn:
            cursor = conn.cursor()
            try:
                cursor.execute('PRAGMA foreign_keys = ON;') 
                if params is not None:
                    cursor.execute(query, params)
                else:
                    cursor.execute(query)
                rows = cursor.fetchall()
                conn.commit()
                columns = tuple([desc[0] for desc in cursor.description]) if cursor.description else ()
                return DBReturn(
                    success = True,
                    columns = columns,
                    rows = rows,
                    row_count = len(rows)
                )
            except Exception as e:
                conn.rollback()
                logger.error(f'Execution failed, transaction rolled back: {e}')
                return DBReturn(
                    success = False
                )
    
    def execute_script(self, query):
        with sql.connect(self.db_path) as conn:
            cursor = conn.cursor()
            try:
                cursor.executescript(query)     # Ensure PRAGMA foregin_keys = ON; is embedded in your script
                conn.commit()
                return DBReturn(
                    success = True
                )
            except Exception as e:
                conn.rollback()
                logger.error(f'SQL Script execution failed, transaction rolled back: {e}')
                return DBReturn(
                    success = False
                )
    
    def execute_path(self, path, script=False, params=None):
        with open(path, 'r', encoding = 'utf-8') as f:
            query = f.read()
        if script:
            return self.execute_script(query)
        else:
            return self.execute(query, params)

    def executemany(self, query, param_list):
        with sql.connect(self.db_path) as conn:
            cursor = conn.cursor()
            try:
                cursor.execute('PRAGMA foreign_keys = ON;')
                cursor.executemany(query, param_list)
                conn.commit()
                return DBReturn(success=True)
            except Exception as e:
                conn.rollback()
                logger.error(f'Executemany failed: {e}')
                return DBReturn(success=False)
    
    @contextmanager
    def transaction(self):
        conn = sql.connect(self.db_path)
        try: 
            conn.execute('PRAGMA foreign_keys = ON;')
            yield conn
            conn.commit()
            logger.debug(f'SQL transaction completed successfully.')
        except:
            conn.rollback()
            logger.error(f'SQL transaction failed, rolling back')
            raise
        finally:
            conn.close()