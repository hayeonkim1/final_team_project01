CREATE DATABASE IF NOT EXISTS zimtori_project
DEFAULT CHARACTER SET utf8mb4
DEFAULT COLLATE utf8mb4_unicode_ci;

USE zimtori_project;

DROP TABLE IF EXISTS fact_collected_posts;

CREATE TABLE fact_collected_posts (
    post_key VARCHAR(255) PRIMARY KEY,
    raw_post_id VARCHAR(255),
    platform VARCHAR(50),
    source_type VARCHAR(50),
    data_domain VARCHAR(50),
    demand_category VARCHAR(100),
    keyword VARCHAR(100),
    keyword_group VARCHAR(100),
    title TEXT,
    content_text MEDIUMTEXT,
    full_text MEDIUMTEXT,
    posted_date DATE,
    `year_month` VARCHAR(7),
    region VARCHAR(100),
    price BIGINT,
    price_band VARCHAR(50),
    item_category VARCHAR(50),
    view_count INT,
    comment_count INT,
    like_count INT,
    content_url TEXT,
    is_housing_gap INT,
    is_storage_need INT,
    is_pickup_delivery_need INT,
    is_rental_potential INT,
    source_file VARCHAR(255)
);

USE zimtori_project;

SELECT COUNT(*) AS total_rows
FROM fact_collected_posts;

SELECT 
    platform,
    COUNT(*) AS post_count
FROM fact_collected_posts
GROUP BY platform
ORDER BY post_count DESC;

SELECT 
    data_domain,
    COUNT(*) AS post_count
FROM fact_collected_posts
GROUP BY data_domain
ORDER BY post_count DESC;