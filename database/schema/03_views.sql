-- ============================================================
-- Layer 3: Analysis Views (가설 검증용)
-- ============================================================
USE popcorn_dw;

-- ------------------------------------------------------------
-- H1: 방학 시즌 커뮤니티 페인포인트 급증
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW v_h1_community_pain_trend AS
SELECT
    DATE_FORMAT(cp.posted_at, '%Y-%m') AS year_month,
    k.keyword_text,
    p.platform_name,
    COUNT(*) AS post_count,
    SUM(cp.comment_count) AS total_comments
FROM community_posts cp
JOIN community_post_keywords cpk ON cp.post_id = cpk.post_id
JOIN keywords k ON cpk.keyword_id = k.keyword_id
JOIN platforms p ON cp.platform_id = p.platform_id
WHERE k.keyword_category = 'pain_point'
GROUP BY DATE_FORMAT(cp.posted_at, '%Y-%m'), k.keyword_text, p.platform_name;

-- ------------------------------------------------------------
-- H1: 방양도 게시글 시즌별 추이
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW v_h1_room_transfer_trend AS
SELECT
    DATE_FORMAT(rtp.posted_at, '%Y-%m') AS year_month,
    r.region_name,
    COUNT(*) AS post_count,
    AVG(rtp.monthly_rent) AS avg_monthly_rent,
    SUM(CASE WHEN rtp.match_status = 'matched' THEN 1 ELSE 0 END) AS matched_count,
    SUM(CASE WHEN rtp.match_status != 'matched' OR rtp.match_status IS NULL THEN 1 ELSE 0 END) AS unmatched_count
FROM real_estate_transfer_posts rtp
LEFT JOIN regions r ON rtp.region_id = r.region_id
GROUP BY DATE_FORMAT(rtp.posted_at, '%Y-%m'), r.region_name;

-- ------------------------------------------------------------
-- H3: 대학가 단기임대 vs 보관 비용 비교
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW v_h3_cost_comparison AS
SELECT
    r.region_name,
    AVG(strl.monthly_rent) AS avg_short_term_rent,
    AVG(css.monthly_fee_min) AS avg_storage_fee,
    AVG(strl.monthly_rent) - AVG(css.monthly_fee_min) AS rent_minus_storage
FROM regions r
LEFT JOIN short_term_rental_listings strl
    ON r.region_id = strl.region_id AND strl.is_univ_area = 1
LEFT JOIN competitor_storage_services css
    ON r.region_id = css.region_id
WHERE r.is_univ_area = 1
GROUP BY r.region_name;

-- ------------------------------------------------------------
-- H6: 기숙사 퇴소 규모 × 지역 1인가구 밀집도
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW v_h6_dorm_gap_market_size AS
SELECT
    u.university_name,
    r.region_name,
    udi.dorm_capacity_rate,
    udi.local_student_rate,
    udi.total_dorm_capacity,
    udi.move_out_date,
    udi.move_in_date,
    shhs.single_household_ratio,
    shhs.youth_ratio
FROM university_dormitory_info udi
JOIN universities u ON udi.univ_id = u.univ_id
JOIN regions r ON u.region_id = r.region_id
LEFT JOIN single_household_housing_stats shhs
    ON r.region_id = shhs.region_id
    AND shhs.survey_year = YEAR(udi.move_out_date);

-- ------------------------------------------------------------
-- 가설별 데이터 수집 현황 대시보드
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW v_data_collection_status AS
SELECT
    dci.data_id,
    dci.data_name,
    GROUP_CONCAT(DISTINCT h.hypothesis_id ORDER BY h.hypothesis_id) AS related_hypotheses,
    COUNT(cb.batch_id) AS total_batches,
    SUM(CASE WHEN cb.status = 'success' THEN 1 ELSE 0 END) AS success_batches,
    MAX(cb.finished_at) AS last_collected_at,
    SUM(cb.record_count) AS total_records
FROM data_collection_items dci
LEFT JOIN hypothesis_data_mapping hdm ON dci.data_id = hdm.data_id
LEFT JOIN hypotheses h ON hdm.hypothesis_id = h.hypothesis_id
LEFT JOIN crawl_batches cb ON dci.data_id = cb.data_id
GROUP BY dci.data_id, dci.data_name;

-- ------------------------------------------------------------
-- 검색 트렌드 시즌성 (H1, H5, H6)
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW v_search_seasonality AS
SELECT
    st.hypothesis_id,
    k.keyword_text,
    st.source,
    MONTH(st.period_date) AS month_num,
    AVG(st.search_volume) AS avg_search_volume
FROM search_trends st
JOIN keywords k ON st.keyword_id = k.keyword_id
GROUP BY st.hypothesis_id, k.keyword_text, st.source, MONTH(st.period_date);
