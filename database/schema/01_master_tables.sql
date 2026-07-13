-- ============================================================
-- Layer 1: Master / Reference Tables
-- ============================================================
USE popcorn_dw;

-- ------------------------------------------------------------
-- 1. 가설 마스터 (H1~H6)
-- ------------------------------------------------------------
CREATE TABLE hypotheses (
    hypothesis_id     VARCHAR(10)   NOT NULL COMMENT '가설 ID (H1~H6)',
    hypothesis_name   VARCHAR(200)  NOT NULL COMMENT '가설 요약명',
    description       TEXT          NOT NULL COMMENT '가설 상세',
    owner_name        VARCHAR(50)   NULL     COMMENT '담당자',
    validation_question VARCHAR(300) NULL     COMMENT '핵심 검증 질문',
    nsm_related       TINYINT(1)    NOT NULL DEFAULT 1 COMMENT 'NSM 연관 여부',
    created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (hypothesis_id)
) ENGINE=InnoDB COMMENT='검증 가설 마스터';

-- ------------------------------------------------------------
-- 2. 데이터 수집 항목 마스터 (D001~D020)
-- ------------------------------------------------------------
CREATE TABLE data_collection_items (
    data_id           VARCHAR(10)   NOT NULL COMMENT '데이터 수집 ID',
    data_name         VARCHAR(100)  NOT NULL COMMENT '데이터명',
    collection_channel VARCHAR(200) NOT NULL COMMENT '수집 채널/출처',
    collection_method VARCHAR(50)   NOT NULL COMMENT '수집 방법 (크롤링/API/공공데이터/설문)',
    validation_purpose TEXT         NOT NULL COMMENT '검증 목적',
    is_merged         TINYINT(1)    NOT NULL DEFAULT 0 COMMENT '중복 통합 여부',
    notes             TEXT          NULL     COMMENT '비고',
    created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (data_id)
) ENGINE=InnoDB COMMENT='데이터 수집 항목 마스터';

-- ------------------------------------------------------------
-- 3. 가설 ↔ 데이터 수집 항목 (M:N)
-- ------------------------------------------------------------
CREATE TABLE hypothesis_data_mapping (
    mapping_id        INT           NOT NULL AUTO_INCREMENT,
    hypothesis_id     VARCHAR(10)   NOT NULL,
    data_id           VARCHAR(10)   NOT NULL,
    PRIMARY KEY (mapping_id),
    UNIQUE KEY uq_hypothesis_data (hypothesis_id, data_id),
    CONSTRAINT fk_hdm_hypothesis FOREIGN KEY (hypothesis_id)
        REFERENCES hypotheses (hypothesis_id),
    CONSTRAINT fk_hdm_data FOREIGN KEY (data_id)
        REFERENCES data_collection_items (data_id)
) ENGINE=InnoDB COMMENT='가설-데이터 수집 항목 매핑';

-- ------------------------------------------------------------
-- 4. 플랫폼 마스터
-- ------------------------------------------------------------
CREATE TABLE platforms (
    platform_id       SMALLINT      NOT NULL AUTO_INCREMENT,
    platform_code     VARCHAR(30)   NOT NULL COMMENT '플랫폼 코드',
    platform_name     VARCHAR(50)   NOT NULL COMMENT '플랫폼 표시명',
    platform_type     VARCHAR(30)   NOT NULL COMMENT 'community/real_estate/used_item/search/storage',
    base_url          VARCHAR(200)  NULL,
    PRIMARY KEY (platform_id),
    UNIQUE KEY uq_platform_code (platform_code)
) ENGINE=InnoDB COMMENT='수집 대상 플랫폼';

-- ------------------------------------------------------------
-- 5. 키워드 마스터
-- ------------------------------------------------------------
CREATE TABLE keywords (
    keyword_id        INT           NOT NULL AUTO_INCREMENT,
    keyword_text      VARCHAR(100)  NOT NULL COMMENT '키워드',
    keyword_category  VARCHAR(30)   NOT NULL COMMENT 'pain_point/search/crawl/used_item',
    related_hypothesis VARCHAR(10)  NULL     COMMENT '주 연관 가설',
    PRIMARY KEY (keyword_id),
    UNIQUE KEY uq_keyword_text (keyword_text)
) ENGINE=InnoDB COMMENT='크롤링/검색 키워드 마스터';

-- ------------------------------------------------------------
-- 6. 지역 마스터 (행정동)
-- ------------------------------------------------------------
CREATE TABLE regions (
    region_id         INT           NOT NULL AUTO_INCREMENT,
    admin_dong_code   VARCHAR(10)   NULL     COMMENT '행정동 코드',
    sido              VARCHAR(20)   NULL     COMMENT '시도',
    sigungu           VARCHAR(30)   NULL     COMMENT '시군구',
    dong              VARCHAR(30)   NULL     COMMENT '행정동',
    region_name       VARCHAR(80)   NOT NULL COMMENT '표시용 지역명',
    is_univ_area      TINYINT(1)    NOT NULL DEFAULT 0 COMMENT '대학가 여부',
    PRIMARY KEY (region_id),
    UNIQUE KEY uq_admin_dong (admin_dong_code),
    KEY idx_region_name (region_name)
) ENGINE=InnoDB COMMENT='지역(행정동) 마스터';

-- ------------------------------------------------------------
-- 7. 대학 마스터
-- ------------------------------------------------------------
CREATE TABLE universities (
    univ_id           INT           NOT NULL AUTO_INCREMENT,
    university_name   VARCHAR(100)  NOT NULL,
    region_id         INT           NULL,
    PRIMARY KEY (univ_id),
    UNIQUE KEY uq_university_name (university_name),
    CONSTRAINT fk_univ_region FOREIGN KEY (region_id)
        REFERENCES regions (region_id)
) ENGINE=InnoDB COMMENT='대학 마스터';

-- ------------------------------------------------------------
-- 8. 주거노마드 세그먼트
-- ------------------------------------------------------------
CREATE TABLE housing_nomad_segments (
    segment_id        INT           NOT NULL AUTO_INCREMENT,
    segment_code      VARCHAR(30)   NOT NULL COMMENT '세그먼트 코드',
    segment_name      VARCHAR(50)   NOT NULL COMMENT '세그먼트명',
    description       TEXT          NULL,
    estimated_population INT          NULL     COMMENT '추정 인구수',
    peak_season       VARCHAR(50)   NULL     COMMENT '성수기 (예: 5-6월, 11-12월)',
    primary_region    VARCHAR(100)  NULL     COMMENT '주요 발생 지역',
    avg_storage_months DECIMAL(4,1) NULL     COMMENT '평균 보관 기간(월)',
    need_type         VARCHAR(30)   NULL     COMMENT '보관/처분/대여',
    PRIMARY KEY (segment_id),
    UNIQUE KEY uq_segment_code (segment_code)
) ENGINE=InnoDB COMMENT='주거노마드 세그먼트 정의';

-- ------------------------------------------------------------
-- 9. 데이터 수집 배치 (ETL Lineage)
-- ------------------------------------------------------------
CREATE TABLE crawl_batches (
    batch_id          BIGINT        NOT NULL AUTO_INCREMENT,
    data_id           VARCHAR(10)   NOT NULL COMMENT '수집 항목 ID',
    platform_id       SMALLINT      NULL,
    started_at        DATETIME      NOT NULL,
    finished_at       DATETIME      NULL,
    status            VARCHAR(20)   NOT NULL DEFAULT 'running' COMMENT 'running/success/failed',
    record_count      INT           NULL     COMMENT '수집 건수',
    error_message     TEXT          NULL,
    PRIMARY KEY (batch_id),
    KEY idx_batch_data (data_id),
    KEY idx_batch_started (started_at),
    CONSTRAINT fk_batch_data FOREIGN KEY (data_id)
        REFERENCES data_collection_items (data_id),
    CONSTRAINT fk_batch_platform FOREIGN KEY (platform_id)
        REFERENCES platforms (platform_id)
) ENGINE=InnoDB COMMENT='데이터 수집 배치 이력';
