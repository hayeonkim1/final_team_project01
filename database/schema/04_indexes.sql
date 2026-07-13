-- ============================================================
-- Additional Indexes for Analysis Performance
-- ============================================================
USE popcorn_dw;

-- 시즌성 분석: 월별 집계
CREATE INDEX idx_cp_posted_month ON community_posts ((DATE_FORMAT(posted_at, '%Y-%m')));
CREATE INDEX idx_retp_posted_month ON real_estate_transfer_posts ((DATE_FORMAT(posted_at, '%Y-%m')));

-- 가설별 시장통계 필터
CREATE INDEX idx_ms_hypothesis_category ON market_statistics (hypothesis_id, market_category);

-- 대학가 단기임대 필터
CREATE INDEX idx_strl_univ_area ON short_term_rental_listings (is_univ_area, region_id);

-- 인구이동 20대 필터
CREATE INDEX idx_pms_age_period ON population_migration_stats (age_group, period_year_month);

-- 수집 배치 상태 모니터링
CREATE INDEX idx_batch_status ON crawl_batches (status, data_id);
