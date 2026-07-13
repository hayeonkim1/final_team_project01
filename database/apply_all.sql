-- 팝콘 프로젝트 전체 스키마 일괄 적용
-- Usage: mysql -u root -p < database/apply_all.sql

SOURCE schema/00_create_database.sql;
SOURCE schema/01_master_tables.sql;
SOURCE schema/02_fact_tables.sql;
SOURCE schema/03_views.sql;
SOURCE seed/seed_master.sql;

SELECT 'popcorn_dw schema applied successfully.' AS status;
