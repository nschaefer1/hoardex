import logging
logger = logging.getLogger(__name__)

import json
from .base import APIResponse, BaseAPI

class RESTInventory(BaseAPI):

    def __init__(self, db_manager):
        self.db_manager = db_manager

    def delete_inventory_item(self, inv_ck: int):
        result = self.db_manager.execute(
            'DELETE FROM dim_inventory WHERE inv_ck = ?;', (inv_ck,)
        )
        if not result.success:
            return self._failure_response('Could not delete item')
        return self._success_response()

    def get_all_inventory_items(self):
        query = "select inv_ck, inv_name, inv_type, icon_path from dim_inventory order by inv_name asc;"
        response = self.db_manager.execute(query)
        if not response.success:
            return self._failure_response("Could not retrieve inventory items")
        return self._success_response(data = self._format_db_rows(response))

    def get_inventory_item(self, inv_ck):
        query = 'select * from dim_inventory where inv_ck = ?;'
        response = self.db_manager.execute(query, (inv_ck,))
        if not response.success or response.row_count == 0:
            return self._failure_response('Item not found')
        return self._success_response(data=self._format_db_rows(response)[0])

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


    
