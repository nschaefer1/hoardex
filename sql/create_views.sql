

create view if not exists vw_character_inventory as 
SELECT
    fi.character_ck,
    di.inv_ck,
    di.inv_name,
    di.inv_type,
    di.equip_location,
    di.icon_path,
    di.inv_stats,
    sum(fi.val) as quantity
from ft_inventory fi
join dim_inventory di 
    on di.inv_ck = fi.inv_ck
group by 1,2
having quantity > 0;