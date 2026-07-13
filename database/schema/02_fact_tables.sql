-- ============================================================
-- Layer 2: Fact / Transaction Tables (수집 데이터)
-- ============================================================
USE popcorn_dw;

-- ------------------------------------------------------------
-- A. 페인포인트 & 수요 검증 (H1, H3, H6)
-- ------------------------------------------------------------

-- 커뮤니티 게시글 (D001 통합)
CREATE TABLE community_posts (
    post_id           BIGINT        NOT NULL AUTO_INCREMENT,
    batch_id          BIGINT        NULL,
    platform_id       SMALLINT      NOT NULL,
    region_id         INT           NULL,
    external_post_id  VARCHAR(100)  NULL     COMMENT '원본 플랫폼 게시글 ID',
    title             VARCHAR(500)  NULL,
    content           TEXT          NULL,
    view_count        INT           NULL     DEFAULT 0,
    comment_count     INT           NULL     DEFAULT 0,
    like_count        INT           NULL     DEFAULT 0,
    posted_at         DATETIME      NULL,
    crawled_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id),
    KEY idx_cp_platform (platform_id),
    KEY idx_cp_region (region_id),
    KEY idx_cp_posted (posted_at),
    KEY idx_cp_batch (batch_id),
    CONSTRAINT fk_cp_platform FOREIGN KEY (platform_id)
        REFERENCES platforms (platform_id),
    CONSTRAINT fk_cp_region FOREIGN KEY (region_id)
        REFERENCES regions (region_id),
    CONSTRAINT fk_cp_batch FOREIGN KEY (batch_id)
        REFERENCES crawl_batches (batch_id)
) ENGINE=InnoDB COMMENT='커뮤니티 크롤링 게시글 (D001)';

-- 게시글-키워드 매칭 (M:N)
CREATE TABLE community_post_keywords (
    post_id           BIGINT        NOT NULL,
    keyword_id        INT           NOT NULL,
    PRIMARY KEY (post_id, keyword_id),
    CONSTRAINT fk_cpk_post FOREIGN KEY (post_id)
        REFERENCES community_posts (post_id) ON DELETE CASCADE,
    CONSTRAINT fk_cpk_keyword FOREIGN KEY (keyword_id)
        REFERENCES keywords (keyword_id)
) ENGINE=InnoDB COMMENT='커뮤니티 게시글-키워드 매핑';

-- 게시글-가설 매칭 (M:N, 분석 태깅용)
CREATE TABLE community_post_hypotheses (
    post_id           BIGINT        NOT NULL,
    hypothesis_id     VARCHAR(10)   NOT NULL,
    PRIMARY KEY (post_id, hypothesis_id),
    CONSTRAINT fk_cph_post FOREIGN KEY (post_id)
        REFERENCES community_posts (post_id) ON DELETE CASCADE,
    CONSTRAINT fk_cph_hypothesis FOREIGN KEY (hypothesis_id)
        REFERENCES hypotheses (hypothesis_id)
) ENGINE=InnoDB COMMENT='커뮤니티 게시글-가설 매핑';

-- 부동산 방양도 게시글 (D002)
CREATE TABLE real_estate_transfer_posts (
    post_id           BIGINT        NOT NULL AUTO_INCREMENT,
    batch_id          BIGINT        NULL,
    platform_id       SMALLINT      NOT NULL,
    region_id         INT           NULL,
    external_post_id  VARCHAR(100)  NULL,
    monthly_rent      INT           NULL     COMMENT '월세(원)',
    deposit           INT           NULL     COMMENT '보증금(원)',
    lease_period_months INT         NULL     COMMENT '임대기간(월)',
    match_status      VARCHAR(20)   NULL     COMMENT '매칭상태 (open/matched/expired)',
    view_count        INT           NULL,
    posted_at         DATETIME      NULL,
    crawled_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id),
    KEY idx_retp_region (region_id),
    KEY idx_retp_posted (posted_at),
    CONSTRAINT fk_retp_platform FOREIGN KEY (platform_id)
        REFERENCES platforms (platform_id),
    CONSTRAINT fk_retp_region FOREIGN KEY (region_id)
        REFERENCES regions (region_id),
    CONSTRAINT fk_retp_batch FOREIGN KEY (batch_id)
        REFERENCES crawl_batches (batch_id)
) ENGINE=InnoDB COMMENT='부동산 방양도 게시글 (D002)';

-- 검색 트렌드 (D003)
CREATE TABLE search_trends (
    trend_id          BIGINT        NOT NULL AUTO_INCREMENT,
    batch_id          BIGINT        NULL,
    keyword_id        INT           NOT NULL,
    hypothesis_id     VARCHAR(10)   NULL,
    source            VARCHAR(30)   NOT NULL COMMENT 'naver_datalab/google_trends',
    period_type       VARCHAR(10)   NOT NULL COMMENT 'daily/weekly/monthly',
    period_date       DATE          NOT NULL,
    search_volume     INT           NULL     COMMENT '검색량 또는 상대지수',
    crawled_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (trend_id),
    UNIQUE KEY uq_trend (keyword_id, source, period_type, period_date),
    KEY idx_st_period (period_date),
    KEY idx_st_hypothesis (hypothesis_id),
    CONSTRAINT fk_st_keyword FOREIGN KEY (keyword_id)
        REFERENCES keywords (keyword_id),
    CONSTRAINT fk_st_hypothesis FOREIGN KEY (hypothesis_id)
        REFERENCES hypotheses (hypothesis_id),
    CONSTRAINT fk_st_batch FOREIGN KEY (batch_id)
        REFERENCES crawl_batches (batch_id)
) ENGINE=InnoDB COMMENT='검색량 시계열 (D003)';

-- 대학 기숙사 공시 (D004)
CREATE TABLE university_dormitory_info (
    dorm_info_id      INT           NOT NULL AUTO_INCREMENT,
    batch_id          BIGINT        NULL,
    univ_id           INT           NOT NULL,
    academic_year     VARCHAR(10)   NOT NULL COMMENT '학년도',
    dorm_capacity_rate DECIMAL(5,2) NULL     COMMENT '기숙사 수용률(%)',
    local_student_rate DECIMAL(5,2) NULL    COMMENT '지방출신 비율(%)',
    vacation_eviction_rule TEXT     NULL     COMMENT '방학 전원퇴소 규정',
    move_out_date     DATE          NULL     COMMENT '퇴소 시작일',
    move_in_date      DATE          NULL     COMMENT '재입소 시작일',
    total_dorm_capacity INT         NULL     COMMENT '기숙사 수용 인원',
    crawled_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (dorm_info_id),
    UNIQUE KEY uq_univ_year (univ_id, academic_year),
    CONSTRAINT fk_udi_univ FOREIGN KEY (univ_id)
        REFERENCES universities (univ_id),
    CONSTRAINT fk_udi_batch FOREIGN KEY (batch_id)
        REFERENCES crawl_batches (batch_id)
) ENGINE=InnoDB COMMENT='대학 기숙사 공시정보 (D004)';

-- 청년 주거 계약유지 (D005)
CREATE TABLE youth_housing_contracts (
    record_id         INT           NOT NULL AUTO_INCREMENT,
    batch_id          BIGINT        NULL,
    age_group         VARCHAR(20)   NOT NULL,
    housing_type      VARCHAR(30)   NULL     COMMENT '원룸/오피스텔/다세대 등',
    avg_contract_months DECIMAL(5,1) NULL    COMMENT '평균 계약유지(월)',
    survey_year       YEAR          NOT NULL,
    source            VARCHAR(50)   NULL,
    crawled_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (record_id),
    KEY idx_yhc_year (survey_year),
    CONSTRAINT fk_yhc_batch FOREIGN KEY (batch_id)
        REFERENCES crawl_batches (batch_id)
) ENGINE=InnoDB COMMENT='청년 주거 계약유지기간 (D005)';

-- 경쟁사 창고 서비스 (D006)
CREATE TABLE competitor_storage_services (
    service_id        INT           NOT NULL AUTO_INCREMENT,
    batch_id          BIGINT        NULL,
    service_name      VARCHAR(50)   NOT NULL,
    region_id         INT           NULL,
    location_detail   VARCHAR(100)  NULL,
    min_contract_months INT         NULL,
    pickup_available  TINYINT(1)    NULL     COMMENT '픽업 서비스 유무',
    pickup_fee        INT           NULL     COMMENT '픽업 비용(원)',
    monthly_fee_min   INT           NULL     COMMENT '최소 월요금(원)',
    space_unit        VARCHAR(20)   NULL     COMMENT '0.3평 큐브 등',
    car_required      TINYINT(1)    NULL     COMMENT '자차 필수 여부',
    crawled_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (service_id),
    CONSTRAINT fk_css_region FOREIGN KEY (region_id)
        REFERENCES regions (region_id),
    CONSTRAINT fk_css_batch FOREIGN KEY (batch_id)
        REFERENCES crawl_batches (batch_id)
) ENGINE=InnoDB COMMENT='경쟁사 창고 서비스 (D006)';

-- 우회대안 비용 벤치마크 (D007)
CREATE TABLE alternative_cost_benchmarks (
    cost_id           INT           NOT NULL AUTO_INCREMENT,
    batch_id          BIGINT        NULL,
    cost_type         VARCHAR(30)   NOT NULL COMMENT 'parcel/moving/box',
    box_size          VARCHAR(20)   NULL     COMMENT '5호 등',
    one_way_cost      INT           NULL     COMMENT '편도(원)',
    round_trip_cost   INT           NULL     COMMENT '왕복(원)',
    avg_box_count     DECIMAL(4,1)  NULL     COMMENT '평균 박스 수',
    appliance_ratio   DECIMAL(5,2)  NULL     COMMENT '소형가전 비율(%)',
    survey_date       DATE          NULL,
    source            VARCHAR(50)   NULL,
    PRIMARY KEY (cost_id),
    CONSTRAINT fk_acb_batch FOREIGN KEY (batch_id)
        REFERENCES crawl_batches (batch_id)
) ENGINE=InnoDB COMMENT='우회대안 비용 (D007)';

-- ------------------------------------------------------------
-- B. 시장·트렌드 검증 (H2, H3, H5)
-- ------------------------------------------------------------

-- 시장 통계 통합 (D008~D011)
CREATE TABLE market_statistics (
    stat_id           INT           NOT NULL AUTO_INCREMENT,
    batch_id          BIGINT        NULL,
    data_id           VARCHAR(10)   NOT NULL,
    hypothesis_id     VARCHAR(10)   NULL,
    market_category   VARCHAR(50)   NOT NULL COMMENT 'sharing_economy/used_trade/rental/storage',
    metric_name       VARCHAR(100)  NOT NULL,
    metric_value      DECIMAL(18,2) NULL,
    unit              VARCHAR(20)   NULL     COMMENT '억원/%/명/CAGR',
    reference_year    YEAR          NULL,
    age_group         VARCHAR(20)   NULL,
    source            VARCHAR(100)  NULL,
    crawled_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (stat_id),
    KEY idx_ms_category (market_category),
    KEY idx_ms_year (reference_year),
    CONSTRAINT fk_ms_data FOREIGN KEY (data_id)
        REFERENCES data_collection_items (data_id),
    CONSTRAINT fk_ms_hypothesis FOREIGN KEY (hypothesis_id)
        REFERENCES hypotheses (hypothesis_id),
    CONSTRAINT fk_ms_batch FOREIGN KEY (batch_id)
        REFERENCES crawl_batches (batch_id)
) ENGINE=InnoDB COMMENT='시장 통계 (D008~D011)';

-- 단기임대 매물 (D012, D014)
CREATE TABLE short_term_rental_listings (
    listing_id        BIGINT        NOT NULL AUTO_INCREMENT,
    batch_id          BIGINT        NULL,
    platform_id       SMALLINT      NOT NULL,
    region_id         INT           NULL,
    external_listing_id VARCHAR(100) NULL,
    rent_type         VARCHAR(20)   NULL     COMMENT 'monthly/one_month_stay',
    monthly_rent      INT           NULL,
    deposit           INT           NULL,
    lease_period_months INT         NULL,
    area_sqm          DECIMAL(6,2)  NULL,
    is_univ_area      TINYINT(1)    NOT NULL DEFAULT 0,
    listed_at         DATE          NULL,
    crawled_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (listing_id),
    KEY idx_strl_region (region_id),
    KEY idx_strl_rent (monthly_rent),
    CONSTRAINT fk_strl_platform FOREIGN KEY (platform_id)
        REFERENCES platforms (platform_id),
    CONSTRAINT fk_strl_region FOREIGN KEY (region_id)
        REFERENCES regions (region_id),
    CONSTRAINT fk_strl_batch FOREIGN KEY (batch_id)
        REFERENCES crawl_batches (batch_id)
) ENGINE=InnoDB COMMENT='단기임대 매물 (D012, D014)';

-- 인구이동 통계 (D013)
CREATE TABLE population_migration_stats (
    migration_id      BIGINT        NOT NULL AUTO_INCREMENT,
    batch_id          BIGINT        NULL,
    region_id         INT           NOT NULL,
    age_group         VARCHAR(20)   NULL,
    period_year_month CHAR(7)       NOT NULL COMMENT 'YYYY-MM',
    move_in_count     INT           NULL,
    move_out_count    INT           NULL,
    net_migration     INT           NULL     COMMENT '전입-전출',
    household_type    VARCHAR(20)   NULL     COMMENT 'single 등',
    crawled_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (migration_id),
    UNIQUE KEY uq_migration (region_id, age_group, period_year_month, household_type),
    KEY idx_pms_period (period_year_month),
    CONSTRAINT fk_pms_region FOREIGN KEY (region_id)
        REFERENCES regions (region_id),
    CONSTRAINT fk_pms_batch FOREIGN KEY (batch_id)
        REFERENCES crawl_batches (batch_id)
) ENGINE=InnoDB COMMENT='인구이동 통계 (D013)';

-- 1인가구 주거 통계 (D019)
CREATE TABLE single_household_housing_stats (
    stat_id           INT           NOT NULL AUTO_INCREMENT,
    batch_id          BIGINT        NULL,
    region_id         INT           NOT NULL,
    single_household_ratio DECIMAL(5,2) NULL COMMENT '1인가구 비율(%)',
    youth_ratio       DECIMAL(5,2)  NULL     COMMENT '청년 비율(%)',
    monthly_rent_ratio DECIMAL(5,2) NULL     COMMENT '월세 비율(%)',
    avg_contract_months DECIMAL(5,1) NULL,
    survey_year       YEAR          NOT NULL,
    crawled_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (stat_id),
    UNIQUE KEY uq_shhs (region_id, survey_year),
    CONSTRAINT fk_shhs_region FOREIGN KEY (region_id)
        REFERENCES regions (region_id),
    CONSTRAINT fk_shhs_batch FOREIGN KEY (batch_id)
        REFERENCES crawl_batches (batch_id)
) ENGINE=InnoDB COMMENT='1인가구 주거 통계 (D019)';

-- 중고 단기사용 게시글 (D018)
CREATE TABLE used_item_short_use_posts (
    post_id           BIGINT        NOT NULL AUTO_INCREMENT,
    batch_id          BIGINT        NULL,
    platform_id       SMALLINT      NOT NULL,
    keyword_id        INT           NOT NULL,
    external_post_id  VARCHAR(100)  NULL,
    category          VARCHAR(50)   NULL,
    title             VARCHAR(500)  NULL,
    price             INT           NULL,
    condition_desc    VARCHAR(100)  NULL,
    posted_at         DATETIME      NULL,
    crawled_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id),
    KEY idx_uisup_keyword (keyword_id),
    KEY idx_uisup_posted (posted_at),
    CONSTRAINT fk_uisup_platform FOREIGN KEY (platform_id)
        REFERENCES platforms (platform_id),
    CONSTRAINT fk_uisup_keyword FOREIGN KEY (keyword_id)
        REFERENCES keywords (keyword_id),
    CONSTRAINT fk_uisup_batch FOREIGN KEY (batch_id)
        REFERENCES crawl_batches (batch_id)
) ENGINE=InnoDB COMMENT='중고 단기사용 게시글 (D018)';

-- ------------------------------------------------------------
-- C. 신뢰·리서치 검증 (H4)
-- ------------------------------------------------------------

CREATE TABLE user_research_responses (
    response_id       INT           NOT NULL AUTO_INCREMENT,
    batch_id          BIGINT        NULL,
    segment_id        INT           NULL,
    user_segment      VARCHAR(30)   NULL     COMMENT 'dorm_student/nomad_worker 등',
    consignment_intent TINYINT      NULL     COMMENT '위탁 의향 1~5',
    payment_intent    TINYINT       NULL     COMMENT '지불 의향 1~5',
    trust_factor      VARCHAR(50)   NULL,
    risk_concern      VARCHAR(50)   NULL,
    item_category     VARCHAR(50)   NULL,
    survey_date       DATE          NULL,
    PRIMARY KEY (response_id),
    CONSTRAINT fk_urr_segment FOREIGN KEY (segment_id)
        REFERENCES housing_nomad_segments (segment_id),
    CONSTRAINT fk_urr_batch FOREIGN KEY (batch_id)
        REFERENCES crawl_batches (batch_id)
) ENGINE=InnoDB COMMENT='유저 리서치 응답 (D015)';

CREATE TABLE prototype_events (
    event_id          BIGINT        NOT NULL AUTO_INCREMENT,
    batch_id          BIGINT        NULL,
    response_id       INT           NULL,
    event_type        VARCHAR(50)   NOT NULL COMMENT 'rental_consent_click 등',
    event_value       VARCHAR(100)  NULL,
    event_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (event_id),
    KEY idx_pe_type (event_type),
    CONSTRAINT fk_pe_response FOREIGN KEY (response_id)
        REFERENCES user_research_responses (response_id),
    CONSTRAINT fk_pe_batch FOREIGN KEY (batch_id)
        REFERENCES crawl_batches (batch_id)
) ENGINE=InnoDB COMMENT='프로토타입 행동 데이터 (D017)';

CREATE TABLE competitor_trust_benchmarks (
    benchmark_id      INT           NOT NULL AUTO_INCREMENT,
    batch_id          BIGINT        NULL,
    service_name      VARCHAR(50)   NOT NULL,
    insurance_policy  TEXT          NULL,
    inspection_process TEXT         NULL,
    compensation_policy TEXT        NULL,
    verification_system TEXT        NULL,
    customer_support  TEXT          NULL,
    crawled_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (benchmark_id),
    CONSTRAINT fk_ctb_batch FOREIGN KEY (batch_id)
        REFERENCES crawl_batches (batch_id)
) ENGINE=InnoDB COMMENT='신뢰장치 벤치마킹 (D016)';
