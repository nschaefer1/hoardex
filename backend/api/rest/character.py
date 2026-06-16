import logging
logger = logging.getLogger(__name__)

from .base import APIResponse, BaseAPI

class RESTCharacter(BaseAPI):

    def __init__(self, db_manager):
        self.db_manager = db_manager

    def get_all_characters(self):
        """Return all characters with character names and icon paths"""
        pass

    def get_character(self, character_ck:int):
        """Return all data on a specific character"""
        pass
    
    def post_character(self, character_name:str):
        """Post a new character into the database"""
        query = "insert into dim_character (character_name) values (?);"
        response = self.db_manager.execute(query, (character_name,))
        if response.success:
            return self._success_response(message=rf"Character {character_name} added to database.")
        else:
            return self._failure_response("Character could not be added to database")

    def put_character(self, character_ck:int, **fields):
        """Update specific information on the character"""
        pass
