import logging
logger = logging.getLogger(__name__)

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

    def get_character(self, character_ck:int):
        """Return all data on a specific character"""
        pass
    
    def post_character(self, character_name:str):
        """Post a new character into the database"""
        query = "insert into dim_character (character_name) values (?);"
        response = self.db_manager.execute(query, (character_name,))
        if response.success:
            return self._success_response(message=rf"Character {character_name} added to database.")
        return self._failure_response("Character could not be added to database")

    def put_character(self, character_ck:int, **fields):
        """Update specific information on the character"""
        pass

    def delete_character(self, character_ck:int):
        """Delete a given character from the database"""
        query = "delete from dim_character where character_ck = ?;"
        response = self.db_manager.execute(query, (character_ck,))
        if response.success:
            return self._success_response(message=f"Character removed")
        return self._failure_response("Character could not be removed from database")
        
    
