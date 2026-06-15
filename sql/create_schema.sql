
create table if not exists dim_icon (
    icon_path text primary key not null unique,
    icon_hash text not null
);

create table if not exists dim_character (
    character_ck integer primary key not null unique,
    character_name text not null,

    stat_scores JSON,           -- JSON object with "str, dex, con, int, wis, and cha"
    
    size_cat text check(size_cat in ('Fine', 'Diminutive', 'Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan', 'Colossal')),
    leg_count integer,

    band_override integer default 0 check(band_override in (0, 1)),

    light_band integer,         -- we have 3 bands to identify upper and lower bounds
    medium_band integer,
    heavy_band integer,

    icon_path text default 'frontend/icons/default_bust.png',

    created_at integer,         -- will hold the unix epoch
    updated_at integer
);

create table if not exists dim_inventory (
    inv_ck integer primary key not null unique,
    inv_name text not null,
    inv_desc text,

    child_ind integer default 0 check(child_ind in (0, 1)),        -- identifies if the item itself has an inventory
    inv_type text,
    equip_location text,

    rarity text,
    icon_path text default 'frontend/icons/default.png',
    weight_lbs float,             -- changing into float due to weight element

    inv_stats JSON,             -- JSON object identifying the stats of the object itself

    foreign key (icon_path) references dim_icon(icon_path) on delete set default
);
create index if not exists idx_di_icon_path on dim_inventory (icon_path);

create table if not exists ft_inventory (
    inv_trans_ck integer primary key not null unique,
    inv_ck integer not null,
    character_ck integer not null,
    val integer not null,

foreign key (inv_ck) references dim_inventory(inv_ck) on delete cascade,
    foreign key (character_ck) references dim_character(character_ck) on delete cascade
);
create index if not exists idx_fi_inv_ck on ft_inventory (inv_ck);
create index if not exists idx_fi_character_ck on ft_inventory (character_ck);
