

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

create view if not exists vw_wallet as
select
    character_ck,
    wallet_name,
    sub_inv_ck,
    coalesce(sum(pp), 0) as pp,
    coalesce(sum(gp), 0) as gp,
    coalesce(sum(sp), 0) as sp,
    coalesce(sum(cp), 0) as cp,
    coalesce(sum(pp + gp + sp + cp), 0) / 50.0 as coin_weight_lbs
from ft_wallet
group by character_ck, wallet_name, sub_inv_ck;