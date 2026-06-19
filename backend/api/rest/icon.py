import logging
logger = logging.getLogger(__name__)

import base64
import hashlib
import os
from pathlib import Path

from .base import APIResponse, BaseAPI

class RESTIcon(BaseAPI):

    def __init__(self, db_manager):
        self.db_manager = db_manager

    def get_all_icons(self):
        response = self.db_manager.execute(
            'select icon_path from dim_icon order by icon_path asc;'
        )
        if not response.success:
            return self._failure_response('Could not retrieve icons')
        return self._success_response(data=[row[0] for row in response.rows])

    def post_icon(self, filename:str, base64_data:str): 
        """Hash check, dedup, copy to assets, insert to dim_icon"""

        # Read the base64 bytes
        try:
            file_bytes = base64.b64decode(base64_data)
        except Exception as e:
            return self._failure_response('Could not decode file')
        
        # Check for duplicates
        icon_hash = hashlib.md5(file_bytes).hexdigest()       
        existing = self.db_manager.execute(
            "select icon_path from dim_icon where icon_hash = ?;",
            (icon_hash,)
        )
        if existing.success and existing.row_count > 0:
            existing_path = existing.rows[0][0]
            return self._success_response(data={'icon_path':existing_path})

        # Ensure reasonable size
        if len(file_bytes) > 5 * 1024 * 1024:  # 5MB limit
            return self._failure_response('Icon file must be under 5MB')

        # Handle filename collisons
        dest_path = Path('frontend/icons') / filename
        if dest_path.exists():              # e.g., default.png
            stem = dest_path.stem           # default
            suffix = dest_path.suffix       # .png
            counter = 1
            while dest_path.exists():
                dest_path = Path('frontend/icons') / f"{stem}_{counter}{suffix}"
                counter += 1
        
        try:
            with open(dest_path, 'wb') as f:
                f.write(file_bytes)
        except Exception as e:
            return self._failure_response('Could not write icon to disk')
        
        icon_path_str = str(dest_path).replace('\\', '/')
        result = self.db_manager.execute(
            'insert into dim_icon (icon_path, icon_hash) values (?, ?);',
            (icon_path_str, icon_hash),
        )

        if not result.success:
            return self._failure_response('Could not insert icon into database')

        return self._success_response(data = {'icon_path':icon_path_str})
    
    def delete_icon(self, icon_path):
        defaults = ['frontend/icons/default.png', 'frontend/icons/default_bust.png']
        if icon_path in defaults:
            return self._failure_response('Cannot delete default icons.')
        
        try:
            if os.path.exists(icon_path):
                os.remove(icon_path)
        except Exception as e:
            return self._failure_response("Could not delete icon file")
        
        result = self.db_manager.execute(
            "delete from dim_icon where icon_path = ?;", (icon_path,)
        )

        if not result.success:
            return self._failure_response("Could not delete icon from database")
        return self._success_response()