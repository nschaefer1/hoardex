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
        query = "select inv_ck, inv_name, inv_type, icon_path, inv_stats from dim_inventory order by inv_name asc;"
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

    def put_inventory_item(self, inv_ck: int, fields: dict):
        allowed = {'inv_name', 'inv_desc', 'inv_type', 'equip_location', 'weight_lbs', 'child_ind', 'inv_stats', 'icon_path'}
        invalid = set(fields.keys()) - allowed
        if invalid:
            return self._failure_response(f'Invalid fields: {invalid}')

        if 'inv_stats' in fields:
            fields['inv_stats'] = json.dumps(fields['inv_stats']) if fields['inv_stats'] else None

        set_clause = ', '.join(f"{k} = ?" for k in fields)
        params = (*fields.values(), inv_ck)
        result = self.db_manager.execute(
            f"UPDATE dim_inventory SET {set_clause} WHERE inv_ck = ?;",
            params
        )
        if not result.success:
            return self._failure_response('Could not update item.')
        return self._success_response()
    
    def post_inventory_transaction(self, inv_ck: int, character_ck: int, val: int):
        # character_ck would come from session/state later
        result = self.db_manager.execute(
            "INSERT INTO ft_inventory (inv_ck, character_ck, val) VALUES (?, ?, ?);",
            (inv_ck, character_ck, val)
        )
        if not result.success:
            return self._failure_response('Could not add item to inventory.')
        return self._success_response()
    
    def get_character_inventory(self, character_ck: int):
        query = "SELECT * FROM vw_character_inventory WHERE character_ck = ?;"
        response = self.db_manager.execute(query, (character_ck,))
        if not response.success:
            return self._failure_response('Could not retrieve inventory.')
        return self._success_response(data=self._format_db_rows(response))
    
    def get_wallet(self, character_ck: int):
        query = "SELECT * FROM vw_wallet WHERE character_ck = ? AND sub_inv_ck IS NULL AND wallet_name = 'On Person';"
        response = self.db_manager.execute(query, (character_ck,))
        if not response.success:
            return self._failure_response('Could not retrieve wallet.')
        if response.row_count == 0:
            return self._success_response(data={'pp': 0, 'gp': 0, 'sp': 0, 'cp': 0, 'coin_weight_lbs': 0.0})
        return self._success_response(data=self._format_db_rows(response)[0])

    def post_wallet_transaction(self, character_ck: int, pp: int = 0, gp: int = 0, sp: int = 0, cp: int = 0, wallet_name: str = 'On Person', sub_inv_ck: int = None):
        result = self.db_manager.execute(
            "INSERT INTO ft_wallet (character_ck, wallet_name, sub_inv_ck, pp, gp, sp, cp) VALUES (?, ?, ?, ?, ?, ?, ?);",
            (character_ck, wallet_name, sub_inv_ck, pp, gp, sp, cp)
        )
        if not result.success:
            return self._failure_response('Could not post wallet transaction.')
        return self._success_response()