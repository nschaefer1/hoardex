import logging
logger = logging.getLogger(__name__)

##############################################################################

# RESPONSE CODES

    # 2xx Success
        # 200 OK: Request succeeded
        # 201 Created: Resource created (e.g., POST/PUT)
        # 204 No Content: Success, but not body to return (e.g., Delete)

    # 4xx Client Error
        # 400 Bad Request: Server cannot process due to client error
        # 401 Unauthorized: authentication missing or invalid
        # 403 Forbidden: Authenticated, but lacking permission
        # 404 Not Found: Resource does not exist
        # 429 Too Many Requests: Rate limit exceeded

    # 5xx Server Error
        # 500 Internal Server Error: Generic server error
        # 503 Service Unavailable: Server overloaded or down
        # 504 Gateway Timeout: Server acting as a gateway timed out

##############################################################################

from .rest import (
    APIResponse,
    RESTCharacter,
)

class API(
    RESTCharacter,      # Character table controls
):

    def __init__(self, db_manager):
        self.db_manager = db_manager
        self.session = {}

    def resolve_path(self, rel_path: str) -> str:
        return self.app_path(f'frontend/{rel_path}').as_posix()
    
    # Proxy session state controls
    def set_session(self, key, value):
        self.session[key] = value
        logger.debug(f'Set {key}: {value}')
        return self._success_response()
    def get_session(self, key):
        return self._success_response(data=self.session.get(key, None))
    def remove_session(self, key):
        logger.debug(f'Removed `{key}` from session')
        return self._success_response(data=self.session.pop(key, False))

    