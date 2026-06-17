import logging
logger = logging.getLogger(__name__)

import sys
from pathlib import Path
from dataclasses import dataclass
from typing import Any, Optional

@dataclass(frozen=True)
class APIResponse:
    success: bool
    message: str = ""
    data: Optional[Any] = None
    response_code: int = 200

    def __post_init__(self):
        if not self.success:
            logger.error(
                "API Response Failure | Code=%s | Message=%s",
                self.response_code,
                self.message
            )
        else:
            logger.debug(
                "API Resonse Success | Code=%s",
                self.response_code
            )
    
    def to_dict(self):
        return {
            "success": self.success,
            "message": self.message,
            "data": self.data,
            "response_code": self.response_code
        }

class BaseAPI:

    # Response wrappers
    def _success_response(self, data=None, message="", response_code=200):
        return APIResponse(
            success=True,
            message=message,
            data=data,
            response_code=response_code
        ).to_dict()
    def _failure_response(self, message, response_code=500, data=None):
        return APIResponse(
            success=False,
            message=message,
            data=data,
            response_code=response_code
        ).to_dict()
    def _format_db_rows(self, db_result, normalize=True):
        outgoing = self._pull_into_json(db_result.rows, db_result.columns)
        if normalize:
            outgoing = self._normalize(outgoing)
        return outgoing

    # Database response checks
    def _db_failure(self, db_result, default_message="Database failure"):
        if not db_result.success:
            return self._failure_response(
                    message = default_message,
                    response_code = 500
                )
        return None
    
    def app_path(self, relative_path):      # ← Also present in main app, duplicated to prevent coupling
        if getattr(sys, 'frozen', False):       
            base_dir = Path(sys.executable).parent.parent
        else:   # This is the dev-env
            base_dir = Path(__file__).resolve().parent.parent.parent
        return base_dir / relative_path
    def _pull_into_json(self, data, col_names): # converts DB-style rows into JSON-friendly data
        return [
            {col: self._normalize_str(val) for col, val in zip(col_names, row)}
            for row in data
        ]   
    def _normalize_str(self, value):            # converts empty strings → None
        if isinstance(value, str) and value.strip() == "":
            return None
        return value
    def _normalize(self, obj):                  # converts empty strings → None in nested circumstances
        if isinstance(obj, dict):
            for k, v in obj.items():
                if isinstance(v, str) and not v.strip():
                    obj[k] = None
                else:
                    self._normalize(v)
        elif isinstance(obj, list):
            for i, v in enumerate(obj):
                if isinstance(v, str) and not v.strip():
                    obj[i] = None
                else:
                    self._normalize(v)
        return obj