USE zimtori_project;

CREATE OR REPLACE VIEW v_post_summary AS
SELECT
    platform,
    source_type,
    data_domain,
    demand_category,
    COUNT(*) AS post_count,
    COUNT(DISTINCT keyword) AS keyword_count,
    AVG(view_count) AS avg_view_count,
    AVG(comment_count) AS avg_comment_count
FROM fact_collected_posts
GROUP BY platform, source_type, data_domain, demand_category;

CREATE OR REPLACE VIEW v_keyword_demand AS
SELECT
    data_domain,
    demand_category,
    keyword,
    COUNT(*) AS post_count,
    AVG(view_count) AS avg_view_count,
    AVG(comment_count) AS avg_comment_count
FROM fact_collected_posts
GROUP BY data_domain, demand_category, keyword;

CREATE OR REPLACE VIEW v_monthly_trend AS
SELECT
    post_year_month,
    data_domain,
    demand_category,
    COUNT(*) AS post_count
FROM fact_collected_posts
WHERE post_year_month IS NOT NULL
  AND post_year_month <> ''
GROUP BY post_year_month, data_domain, demand_category;

CREATE OR REPLACE VIEW v_region_demand AS
SELECT
    region,
    platform,
    data_domain,
    demand_category,
    COUNT(*) AS post_count,
    AVG(CASE WHEN price > 0 THEN price END) AS avg_price
FROM fact_collected_posts
WHERE region IS NOT NULL
  AND region <> ''
GROUP BY region, platform, data_domain, demand_category;

CREATE OR REPLACE VIEW v_item_category_summary AS
SELECT
    item_category,
    demand_category,
    COUNT(*) AS post_count,
    AVG(CASE WHEN price > 0 THEN price END) AS avg_price,
    SUM(is_rental_potential) AS rental_potential_count,
    SUM(is_storage_need) AS storage_need_count
FROM fact_collected_posts
WHERE data_domain = '물품'
GROUP BY item_category, demand_category;

CREATE OR REPLACE VIEW v_price_band_summary AS
SELECT
    price_band,
    item_category,
    demand_category,
    COUNT(*) AS post_count
FROM fact_collected_posts
WHERE data_domain = '물품'
GROUP BY price_band, item_category, demand_category;

CREATE OR REPLACE VIEW v_zimtori_painpoint_summary AS
SELECT
    data_domain,
    demand_category,
    COUNT(*) AS total_posts,
    SUM(is_housing_gap) AS housing_gap_posts,
    SUM(is_storage_need) AS storage_need_posts,
    SUM(is_pickup_delivery_need) AS pickup_delivery_need_posts,
    SUM(is_rental_potential) AS rental_potential_posts
FROM fact_collected_posts
GROUP BY data_domain, demand_category;

CREATE OR REPLACE VIEW v_platform_domain_summary AS
SELECT
    platform,
    data_domain,
    COUNT(*) AS post_count
FROM fact_collected_posts
GROUP BY platform, data_domain;

SHOW FULL TABLES 
WHERE Table_type = 'VIEW';

SELECT *
FROM v_post_summary
LIMIT 10;

SELECT *
FROM v_keyword_demand
ORDER BY post_count DESC
LIMIT 10;

SELECT *
FROM v_zimtori_painpoint_summary
ORDER BY total_posts DESC;

SHOW TABLES;

SELECT COUNT(*) AS total_rows
FROM fact_collected_posts;

USE zimtori_project;

SELECT 
    keyword,
    COUNT(*) AS post_count
FROM fact_collected_posts
WHERE data_domain = '장소'
  AND demand_category = '물품대여'
GROUP BY keyword
ORDER BY post_count DESC;

USE zimtori_project;

UPDATE fact_collected_posts
SET demand_category = '공간대여'
WHERE data_domain = '장소'
  AND demand_category = '물품대여';
  
  SELECT 
    data_domain,
    demand_category,
    COUNT(*) AS post_count
FROM fact_collected_posts
WHERE data_domain = '장소'
GROUP BY data_domain, demand_category
ORDER BY post_count DESC;

USE zimtori_project;

SELECT 
    keyword,
    COUNT(*) AS post_count
FROM fact_collected_posts
WHERE data_domain = '장소'
  AND demand_category = '물품대여'
GROUP BY keyword
ORDER BY post_count DESC;

USE zimtori_project;

UPDATE fact_collected_posts
SET demand_category = '공간대여'
WHERE post_key IN (
    SELECT post_key
    FROM (
        SELECT post_key
        FROM fact_collected_posts
        WHERE data_domain = '장소'
          AND demand_category = '물품대여'
    ) AS target_posts
);

SELECT 
    data_domain,
    demand_category,
    COUNT(*) AS post_count
FROM fact_collected_posts
WHERE data_domain = '장소'
GROUP BY data_domain, demand_category
ORDER BY post_count DESC;

SELECT *
FROM v_keyword_demand
WHERE data_domain = '장소'
ORDER BY post_count DESC;

USE zimtori_project;

SET SQL_SAFE_UPDATES = 0;

UPDATE fact_collected_posts
SET demand_category = '렌탈 탐색'
WHERE data_domain = '물품'
  AND demand_category = '물품대여';

SET SQL_SAFE_UPDATES = 1;