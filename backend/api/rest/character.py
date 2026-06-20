import logging
logger = logging.getLogger(__name__)

import time
import json
from .base import APIResponse, BaseAPI

class RESTCharacter(BaseAPI):

    def __init__(self, db_manager):
        self.db_manager = db_manager

    def get_all_characters(self):
        """Return all characters with character names and icon paths"""
        query = "select character_ck, character_name, icon_path, last_login from dim_character order by last_login desc;"
        response = self.db_manager.execute(query)
        if response.success:
            data = self._format_db_rows(response)
            return self._success_response(data)
        return self._failure_response("No data retrieved from the database.")

    def get_character(self, character_ck: int):
        response = self.db_manager.execute(
            "SELECT * FROM dim_character WHERE character_ck = ?;",
            (character_ck,)
        )
        if not response.success or response.row_count == 0:
            return self._failure_response('Character not found.')
        return self._success_response(data=self._format_db_rows(response)[0])
    
    def post_character(self, character_name:str):
        """Post a new character into the database"""
        query = "insert into dim_character (character_name, created_at) values (?, ?);"
        response = self.db_manager.execute(query, (character_name, int(time.time())))
        if response.success:
            return self._success_response(message=rf"Character {character_name} added to database.")
        return self._failure_response("Character could not be added to database")

    def put_character(self, character_ck:int, fields:dict):
        """Update specific information on the character"""
        if not fields:
            return self._failure_response("No fields provided to update.")
        
        allowed = {
            'character_name', 'icon_path', 'stat_scores',
            'leg_count', 'band_override',
            'light_band', 'medium_band', 'heavy_band', 'size_cat',
        }

        invalid = set(fields.keys()) - allowed
        if invalid:
            return self._failure_response(f"Invalid fields: {invalid}")

        if 'stat_scores' in fields:
            fields['stat_scores'] = json.dumps(fields['stat_scores']) if fields['stat_scores'] else None

        set_clause = ', '.join(f"{k} = ?" for k in fields)
        params = (*fields.values(), character_ck)
        query = f"update dim_character set {set_clause} where character_ck = ?;"

        response = self.db_manager.execute(query, params)
        if not response.success:
            return self._failure_response("Character update failed.")
        return self._success_response()
    
    def put_char_sign_in(self, character_ck:int):
        """Quick sign in update on the character"""
        query = "update dim_character set last_login = ? where character_ck = ?;"

        update_time = int(time.time())
        
        response = self.db_manager.execute(query, (update_time, character_ck))
        if response.success:
            return self._success_response()
        return self._failure_response()


    def delete_character(self, character_ck:int):
        """Delete a given character from the database"""
        query = "delete from dim_character where character_ck = ?;"
        response = self.db_manager.execute(query, (character_ck,))
        if response.success:
            return self._success_response(message=f"Character removed")
        return self._failure_response("Character could not be removed from database")

    
