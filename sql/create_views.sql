

create view if not exists vw_character_inventory as 
SELECT
    fi.character_ck,
    di.inv_ck,
    di.inv_name,
    di.inv_type,
    di.equip_location,
    di.icon_path,
    di.inv_stats,
    di.weight_lbs,
    sum(fi.val) as quantity
from ft_inventory fi
join dim_inventory di 
    on di.inv_ck = fi.inv_ck
group by 1,2,3,4,5,6,7,8
having quantity > 0;