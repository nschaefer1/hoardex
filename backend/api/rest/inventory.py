import logging
logger = logging.getLogger(__name__)

import json
from .base import APIResponse, BaseAPI

class RESTInventory(BaseAPI):

    def __init__(self, db_manager):
        self.db_manager = db_manager

    def post_inventory_item(
            self,
            inv_name:str,
            inv_desc:str,
            child_ind:int,
            inv_type:str,
            equip_location:str,
            icon_path:str,
            weight_lbs:float,
            inv_stats:dict,
    ):
        query = "insert into dim_inventory (inv_name, inv_desc, child_ind, inv_type, equip_location, icon_path, weight_lbs, inv_stats) values (?, ?, ?, ?, ?, ?, ?, ?);"
        response = self.db_manager.execute(
            query,
            (
                inv_name,
                inv_desc,
                child_ind,
                inv_type,
                equip_location,
                icon_path or 'frontend/icons/default.png',
                weight_lbs,
                json.dumps(inv_stats) if inv_stats else None,
            )
        )

        if response.success:
            return self._success_response()
        return self._failure_response(f'Database could not submit the item: {response}')


    
