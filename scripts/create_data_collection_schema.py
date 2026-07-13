"""가설별 데이터 수집 목록 통합 및 MySQL 스키마 Excel 생성"""
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

OUTPUT_PATH = r"c:\Users\HJkim\final_project_my\final_team_project01\data\가설별_데이터수집_통합스키마.xlsx"

# Sheet 1: 통합 데이터 수집 목록
summary_rows = [
    ["데이터_ID", "데이터명", "관련_가설", "담당자", "수집_채널/출처", "수집_방법", "검증_목적", "중복_통합_여부", "비고"],
    ["D001", "커뮤니티_키워드_크롤링", "H1,H3,H6", "하연,지웅,자영", "에브리타임, 네이버카페, 당근마켓", "크롤링/API", "주거공백기 페인포인트·단기임대 수요·이동시기 불편 검증", "통합", "키워드: 기숙사짐, 방학짐, 본가택배, 방학월세, 짐보관, 단기임대, 처분, 판매"],
    ["D002", "부동산_방양도_게시글", "H1", "하연", "다방 등 부동산 플랫폼", "크롤링", "방학 직전 방 양도 급증·매칭 실패로 월세 낭비 페인 검증", "단독", "방학 시즌별 게시글 수·조회수·댓글수"],
    ["D003", "검색량_시계열_키워드", "H1,H3,H5,H6", "하연,지웅,지훈,자영", "네이버 데이터랩, 구글 트렌드", "API", "시즌성 주거공백·렌탈·대여 관심도 추이", "통합", "기숙사짐, 방학짐보관, 단기창고대여, 렌탈, 대여, 물품대여, 단기렌탈 등"],
    ["D004", "대학알리미_기숙사_공시", "H1,H3,H6", "하연,지웅,자영", "대학알리미", "직접수집/크롤링", "기숙사 수용률·방학 전원퇴소 규정·주거공백 규모", "통합", "지방출신비율, 기숙사수용률, 퇴소규정, 입퇴소일정"],
    ["D005", "청년_주거_계약유지기간", "H1", "하연", "국토교통부 주거실태조사, 통계청", "공공데이터", "2030 주거노마드 짧은 거주기간·제도 미스매치 검증", "단독", "연령별 평균 계약유지기간, 주거형태"],
    ["D006", "경쟁사_창고서비스_비교", "H1", "하연", "다락 등 창고형 서비스", "직접수집", "기존 대안 부재·진입장벽(자차필수, 픽업비) 검증", "단독", "매장위치, 최소계약기간, 픽업서비스유무, 요금"],
    ["D007", "우회대안_비용_데이터", "H1,H6", "하연,자영", "우체국, 이사업체", "직접수집/설문", "왕복택배·용달 비용·체력적 피로 페인 검증", "통합", "5호박스 택배비, 용달비, 평균 짐량(박스수)"],
    ["D008", "공유경제_시장_통계", "H2,H5", "강성웅,지훈", "KOSIS, 통계청, 정책보고서", "공공데이터/리서치", "유휴자산 수익화·공유경제 성장 검증", "통합", "공유경제 시장규모, 성장률"],
    ["D009", "중고거래_이용률_통계", "H2,H5", "강성웅,지훈", "한국리서치, 당근리포트 등", "리서치보고서", "중고거래 일상화·2030 이용률 검증", "통합", "앱이용경험률, 세대별 플랫폼 점유율"],
    ["D010", "렌탈_시장_규모_성장", "H2,H3,H5", "강성웅,지웅,지훈", "KT경제경영연구소, 스타트업투데이, KOSIS", "리서치/뉴스", "렌탈 소비 확대·단기이용 수요 검증", "통합", "시장규모, CAGR, 합리적소비 동기"],
    ["D011", "짐보관_서비스_시장", "H3", "지웅", "다락, 업계 리포트", "직접수집/리서치", "실제 유료 보관 수요·시장성 검증", "단독", "이용자수, 매출, 성장률"],
    ["D012", "단기임대_시장_데이터", "H3,H6", "지웅,자영", "직방, 다방, 국토교통부", "API/크롤링/공공데이터", "한달살기·단기월세 증가·수요 검증", "통합", "단기임대 매물수, 평균월세, 한달살기 증가율"],
    ["D013", "인구이동_통계", "H3,H6", "지웅,자영", "통계청, KOSIS", "공공데이터", "20대·1인가구 이동률·주거공백 발생 가능성", "통합", "연령별 전입전출, 행정동별 시계열"],
    ["D014", "대학가_단기월세_보관가격", "H3", "지웅", "직방, 다방, 다락", "크롤링", "기숙사 퇴소 시 대안 비용 비교", "단독", "대학가 단기월세, 보관창고 월요금"],
    ["D015", "위탁대여_신뢰_리서치", "H4", "승환", "설문/인터뷰", "유저리서치", "위탁 의향·불안요소·카테고리별 수용도", "단독", "위탁동의율, 신뢰요인, 위험인식"],
    ["D016", "빌릿지_벤치마킹", "H4", "승환", "빌릿지 웹/앱", "직접수집", "보험·검수·보상 등 신뢰장치 벤치마킹", "단독", "이용약관, FAQ, 보험정책, 검수프로세스"],
    ["D017", "프로토타입_행동데이터", "H4", "승환", "자체 프로토타입", "이벤트로깅", "대여동의 버튼 클릭 등 행동 의향", "단독", "클릭률, 전환율"],
    ["D018", "중고플랫폼_단기사용_크롤링", "H5", "지훈", "당근마켓, 중고나라", "Python 크롤링", "1회사용·여행후판매 등 단기사용 수요", "단독", "키워드: 1회사용, 한번사용, 잠깐사용, 거의새상품"],
    ["D019", "지역별_1인가구_주거형태", "H6", "자영", "통계청, 국토교통부", "공공데이터", "타겟 지역 청년·1인가구 밀집도", "단독", "행정동별 1인가구비율, 월세전세비율, 평균계약기간"],
    ["D020", "주거노마드_세그먼트_추가", "전체", "팀공통", "통계청, 대학알리미, 리서치", "통합분석", "세그먼트 규모·시즌·지역·보관기간", "추가", "세그먼트별 분류, 성수기 시즌"],
]

# Sheet 2: MySQL 테이블 스키마
schema_rows = [
    ["테이블명", "컬럼명", "데이터타입", "NULL", "PK/FK", "설명", "관련_데이터_ID", "수집_출처"],
    # community_keyword_posts
    ["community_keyword_posts", "post_id", "BIGINT", "NO", "PK", "게시글 고유 ID", "D001", "에브리타임/네이버카페/당근"],
    ["community_keyword_posts", "platform", "VARCHAR(30)", "NO", "", "플랫폼명 (everytime, naver_cafe, carrot)", "D001", ""],
    ["community_keyword_posts", "keyword", "VARCHAR(100)", "NO", "", "매칭 키워드", "D001", ""],
    ["community_keyword_posts", "hypothesis_id", "VARCHAR(10)", "YES", "FK", "관련 가설 (H1~H6)", "D001", ""],
    ["community_keyword_posts", "title", "VARCHAR(500)", "YES", "", "게시글 제목", "D001", ""],
    ["community_keyword_posts", "content", "TEXT", "YES", "", "게시글 본문", "D001", ""],
    ["community_keyword_posts", "view_count", "INT", "YES", "", "조회수", "D001", ""],
    ["community_keyword_posts", "comment_count", "INT", "YES", "", "댓글수", "D001", ""],
    ["community_keyword_posts", "posted_at", "DATETIME", "YES", "", "작성일시", "D001", ""],
    ["community_keyword_posts", "region", "VARCHAR(50)", "YES", "", "지역(대학가 등)", "D001", ""],
    ["community_keyword_posts", "crawled_at", "DATETIME", "NO", "", "수집일시", "D001", ""],
    # real_estate_transfer_posts
    ["real_estate_transfer_posts", "post_id", "BIGINT", "NO", "PK", "게시글 ID", "D002", "다방"],
    ["real_estate_transfer_posts", "platform", "VARCHAR(30)", "NO", "", "플랫폼명", "D002", ""],
    ["real_estate_transfer_posts", "region", "VARCHAR(50)", "YES", "", "지역", "D002", ""],
    ["real_estate_transfer_posts", "monthly_rent", "INT", "YES", "", "월세(원)", "D002", ""],
    ["real_estate_transfer_posts", "deposit", "INT", "YES", "", "보증금(원)", "D002", ""],
    ["real_estate_transfer_posts", "lease_period_months", "INT", "YES", "", "임대기간(월)", "D002", ""],
    ["real_estate_transfer_posts", "status", "VARCHAR(20)", "YES", "", "매칭상태", "D002", ""],
    ["real_estate_transfer_posts", "posted_at", "DATETIME", "YES", "", "게시일", "D002", ""],
    ["real_estate_transfer_posts", "crawled_at", "DATETIME", "NO", "", "수집일시", "D002", ""],
    # search_trend_keywords
    ["search_trend_keywords", "trend_id", "BIGINT", "NO", "PK", "트렌드 ID", "D003", "네이버데이터랩/구글트렌드"],
    ["search_trend_keywords", "source", "VARCHAR(30)", "NO", "", "데이터소스", "D003", ""],
    ["search_trend_keywords", "keyword", "VARCHAR(100)", "NO", "", "검색키워드", "D003", ""],
    ["search_trend_keywords", "hypothesis_id", "VARCHAR(10)", "YES", "FK", "관련 가설", "D003", ""],
    ["search_trend_keywords", "period_date", "DATE", "NO", "", "기준일(주/월)", "D003", ""],
    ["search_trend_keywords", "search_volume", "INT", "YES", "", "검색량/지수", "D003", ""],
    ["search_trend_keywords", "period_type", "VARCHAR(10)", "NO", "", "daily/weekly/monthly", "D003", ""],
    ["search_trend_keywords", "crawled_at", "DATETIME", "NO", "", "수집일시", "D003", ""],
    # university_dormitory_info
    ["university_dormitory_info", "univ_id", "INT", "NO", "PK", "대학 ID", "D004", "대학알리미"],
    ["university_dormitory_info", "university_name", "VARCHAR(100)", "NO", "", "대학명", "D004", ""],
    ["university_dormitory_info", "region", "VARCHAR(50)", "YES", "", "소재지", "D004", ""],
    ["university_dormitory_info", "dorm_capacity_rate", "DECIMAL(5,2)", "YES", "", "기숙사 수용률(%)", "D004", ""],
    ["university_dormitory_info", "local_student_rate", "DECIMAL(5,2)", "YES", "", "지방출신 비율(%)", "D004", ""],
    ["university_dormitory_info", "vacation_eviction_rule", "TEXT", "YES", "", "방학 전원퇴소 규정", "D004", ""],
    ["university_dormitory_info", "move_out_date", "DATE", "YES", "", "퇴소 시작일", "D004", ""],
    ["university_dormitory_info", "move_in_date", "DATE", "YES", "", "재입소 시작일", "D004", ""],
    ["university_dormitory_info", "academic_year", "VARCHAR(10)", "YES", "", "학년도", "D004", ""],
    ["university_dormitory_info", "crawled_at", "DATETIME", "NO", "", "수집일시", "D004", ""],
    # youth_housing_contract
    ["youth_housing_contract", "record_id", "INT", "NO", "PK", "레코드 ID", "D005", "국토교통부"],
    ["youth_housing_contract", "age_group", "VARCHAR(20)", "NO", "", "연령대", "D005", ""],
    ["youth_housing_contract", "avg_contract_months", "DECIMAL(5,1)", "YES", "", "평균 계약유지(월)", "D005", ""],
    ["youth_housing_contract", "housing_type", "VARCHAR(30)", "YES", "", "주거형태", "D005", ""],
    ["youth_housing_contract", "survey_year", "YEAR", "NO", "", "조사연도", "D005", ""],
    ["youth_housing_contract", "source", "VARCHAR(50)", "YES", "", "출처", "D005", ""],
    # competitor_storage_services
    ["competitor_storage_services", "service_id", "INT", "NO", "PK", "서비스 ID", "D006", "다락 등"],
    ["competitor_storage_services", "service_name", "VARCHAR(50)", "NO", "", "서비스명", "D006", ""],
    ["competitor_storage_services", "location", "VARCHAR(100)", "YES", "", "매장/지점 위치", "D006", ""],
    ["competitor_storage_services", "min_contract_months", "INT", "YES", "", "최소계약기간(월)", "D006", ""],
    ["competitor_storage_services", "pickup_available", "BOOLEAN", "YES", "", "픽업서비스 유무", "D006", ""],
    ["competitor_storage_services", "pickup_fee", "INT", "YES", "", "픽업비용(원)", "D006", ""],
    ["competitor_storage_services", "monthly_fee_min", "INT", "YES", "", "최소 월요금(원)", "D006", ""],
    ["competitor_storage_services", "space_unit", "VARCHAR(20)", "YES", "", "공간단위(평/큐브)", "D006", ""],
    ["competitor_storage_services", "crawled_at", "DATETIME", "NO", "", "수집일시", "D006", ""],
    # alternative_cost_benchmark
    ["alternative_cost_benchmark", "cost_id", "INT", "NO", "PK", "비용 ID", "D007", "우체국/이사업체"],
    ["alternative_cost_benchmark", "cost_type", "VARCHAR(30)", "NO", "", "택배/용달/박스", "D007", ""],
    ["alternative_cost_benchmark", "box_size", "VARCHAR(20)", "YES", "", "박스규격(5호 등)", "D007", ""],
    ["alternative_cost_benchmark", "one_way_cost", "INT", "YES", "", "편도비용(원)", "D007", ""],
    ["alternative_cost_benchmark", "round_trip_cost", "INT", "YES", "", "왕복비용(원)", "D007", ""],
    ["alternative_cost_benchmark", "avg_box_count", "DECIMAL(4,1)", "YES", "", "평균 박스수", "D007", ""],
    ["alternative_cost_benchmark", "appliance_ratio", "DECIMAL(5,2)", "YES", "", "소형가전 비율(%)", "D007", ""],
    ["alternative_cost_benchmark", "survey_date", "DATE", "YES", "", "조사일", "D007", ""],
    # market_statistics
    ["market_statistics", "stat_id", "INT", "NO", "PK", "통계 ID", "D008,D009,D010,D011", "KOSIS/리서치"],
    ["market_statistics", "market_category", "VARCHAR(50)", "NO", "", "공유경제/중고거래/렌탈/보관", "D008~D011", ""],
    ["market_statistics", "metric_name", "VARCHAR(100)", "NO", "", "지표명", "D008~D011", ""],
    ["market_statistics", "metric_value", "DECIMAL(18,2)", "YES", "", "지표값", "D008~D011", ""],
    ["market_statistics", "unit", "VARCHAR(20)", "YES", "", "단위(억원, %, 명)", "D008~D011", ""],
    ["market_statistics", "year", "YEAR", "YES", "", "기준연도", "D008~D011", ""],
    ["market_statistics", "age_group", "VARCHAR(20)", "YES", "", "연령대(해당시)", "D009", ""],
    ["market_statistics", "source", "VARCHAR(100)", "YES", "", "출처", "D008~D011", ""],
    ["market_statistics", "hypothesis_id", "VARCHAR(10)", "YES", "FK", "관련 가설", "D008~D011", ""],
    # short_term_rental_listings
    ["short_term_rental_listings", "listing_id", "BIGINT", "NO", "PK", "매물 ID", "D012,D014", "직방/다방"],
    ["short_term_rental_listings", "platform", "VARCHAR(30)", "NO", "", "플랫폼", "D012,D014", ""],
    ["short_term_rental_listings", "region", "VARCHAR(50)", "YES", "", "지역/대학가", "D012,D014", ""],
    ["short_term_rental_listings", "rent_type", "VARCHAR(20)", "YES", "", "월세/한달살기", "D012", ""],
    ["short_term_rental_listings", "monthly_rent", "INT", "YES", "", "월세(원)", "D012,D014", ""],
    ["short_term_rental_listings", "lease_period_months", "INT", "YES", "", "임대기간(월)", "D012", ""],
    ["short_term_rental_listings", "area_sqm", "DECIMAL(6,2)", "YES", "", "전용면적(㎡)", "D012", ""],
    ["short_term_rental_listings", "listed_at", "DATE", "YES", "", "등록일", "D012,D014", ""],
    ["short_term_rental_listings", "crawled_at", "DATETIME", "NO", "", "수집일시", "D012,D014", ""],
    # population_migration_stats
    ["population_migration_stats", "migration_id", "BIGINT", "NO", "PK", "이동 ID", "D013", "통계청"],
    ["population_migration_stats", "admin_dong_code", "VARCHAR(10)", "YES", "", "행정동 코드", "D013", ""],
    ["population_migration_stats", "region_name", "VARCHAR(50)", "YES", "", "지역명", "D013", ""],
    ["population_migration_stats", "age_group", "VARCHAR(20)", "YES", "", "연령대", "D013", ""],
    ["population_migration_stats", "period_year_month", "CHAR(7)", "NO", "", "기준년월", "D013", ""],
    ["population_migration_stats", "move_in_count", "INT", "YES", "", "전입인구", "D013", ""],
    ["population_migration_stats", "move_out_count", "INT", "YES", "", "전출인구", "D013", ""],
    ["population_migration_stats", "net_migration", "INT", "YES", "", "순이동", "D013", ""],
    ["population_migration_stats", "household_type", "VARCHAR(20)", "YES", "", "1인가구 등", "D013", ""],
    # used_item_short_use_posts
    ["used_item_short_use_posts", "post_id", "BIGINT", "NO", "PK", "게시글 ID", "D018", "당근/중고나라"],
    ["used_item_short_use_posts", "platform", "VARCHAR(30)", "NO", "", "플랫폼", "D018", ""],
    ["used_item_short_use_posts", "keyword", "VARCHAR(50)", "NO", "", "매칭키워드", "D018", ""],
    ["used_item_short_use_posts", "category", "VARCHAR(50)", "YES", "", "물품카테고리", "D018", ""],
    ["used_item_short_use_posts", "title", "VARCHAR(500)", "YES", "", "제목", "D018", ""],
    ["used_item_short_use_posts", "price", "INT", "YES", "", "가격(원)", "D018", ""],
    ["used_item_short_use_posts", "condition_desc", "VARCHAR(100)", "YES", "", "상태설명", "D018", ""],
    ["used_item_short_use_posts", "posted_at", "DATETIME", "YES", "", "등록일", "D018", ""],
    ["used_item_short_use_posts", "crawled_at", "DATETIME", "NO", "", "수집일시", "D018", ""],
    # single_household_housing_stats
    ["single_household_housing_stats", "stat_id", "INT", "NO", "PK", "통계 ID", "D019", "통계청/국토부"],
    ["single_household_housing_stats", "admin_dong_code", "VARCHAR(10)", "YES", "", "행정동코드", "D019", ""],
    ["single_household_housing_stats", "region_name", "VARCHAR(50)", "NO", "", "지역명", "D019", ""],
    ["single_household_housing_stats", "single_household_ratio", "DECIMAL(5,2)", "YES", "", "1인가구비율(%)", "D019", ""],
    ["single_household_housing_stats", "youth_ratio", "DECIMAL(5,2)", "YES", "", "청년비율(%)", "D019", ""],
    ["single_household_housing_stats", "monthly_rent_ratio", "DECIMAL(5,2)", "YES", "", "월세비율(%)", "D019", ""],
    ["single_household_housing_stats", "avg_contract_months", "DECIMAL(5,1)", "YES", "", "평균계약기간(월)", "D019", ""],
    ["single_household_housing_stats", "survey_year", "YEAR", "NO", "", "조사연도", "D019", ""],
    # user_research_trust
    ["user_research_trust", "response_id", "INT", "NO", "PK", "응답 ID", "D015,D017", "설문/프로토타입"],
    ["user_research_trust", "user_segment", "VARCHAR(30)", "YES", "", "세그먼트", "D015", ""],
    ["user_research_trust", "consignment_intent", "TINYINT", "YES", "", "위탁의향(1-5)", "D015", ""],
    ["user_research_trust", "trust_factor", "VARCHAR(50)", "YES", "", "신뢰요인", "D015", ""],
    ["user_research_trust", "risk_concern", "VARCHAR(50)", "YES", "", "불안요소", "D015", ""],
    ["user_research_trust", "item_category", "VARCHAR(50)", "YES", "", "물품카테고리", "D015", ""],
    ["user_research_trust", "rental_consent_clicked", "BOOLEAN", "YES", "", "대여동의 클릭", "D017", ""],
    ["user_research_trust", "survey_date", "DATE", "YES", "", "조사일", "D015,D017", ""],
    # competitor_trust_benchmark
    ["competitor_trust_benchmark", "benchmark_id", "INT", "NO", "PK", "벤치마크 ID", "D016", "빌릿지"],
    ["competitor_trust_benchmark", "service_name", "VARCHAR(50)", "NO", "", "서비스명", "D016", ""],
    ["competitor_trust_benchmark", "insurance_policy", "TEXT", "YES", "", "보험정책", "D016", ""],
    ["competitor_trust_benchmark", "inspection_process", "TEXT", "YES", "", "검수프로세스", "D016", ""],
    ["competitor_trust_benchmark", "compensation_policy", "TEXT", "YES", "", "보상정책", "D016", ""],
    ["competitor_trust_benchmark", "verification_system", "TEXT", "YES", "", "인증/평판시스템", "D016", ""],
    ["competitor_trust_benchmark", "crawled_at", "DATETIME", "NO", "", "수집일시", "D016", ""],
    # housing_nomad_segments
    ["housing_nomad_segments", "segment_id", "INT", "NO", "PK", "세그먼트 ID", "D020", "통합분석"],
    ["housing_nomad_segments", "segment_name", "VARCHAR(50)", "NO", "", "세그먼트명", "D020", ""],
    ["housing_nomad_segments", "estimated_population", "INT", "YES", "", "추정 인구수", "D020", ""],
    ["housing_nomad_segments", "peak_season", "VARCHAR(50)", "YES", "", "성수기 시즌", "D020", ""],
    ["housing_nomad_segments", "primary_region", "VARCHAR(100)", "YES", "", "주요 발생지역", "D020", ""],
    ["housing_nomad_segments", "avg_storage_months", "DECIMAL(4,1)", "YES", "", "평균 보관기간(월)", "D020", ""],
    ["housing_nomad_segments", "need_type", "VARCHAR(30)", "YES", "", "보관/처분/대여", "D020", ""],
]

# Sheet 3: 가설 매핑
hypothesis_rows = [
    ["가설_ID", "가설_내용", "담당자", "핵심_검증_질문", "연결_데이터_ID"],
    ["H1", "주거 공백기 유저는 짐 보관·처리에 불편·페인포인트를 겪고, 마땅한 대안이 부재할 것", "하연", "페인포인트 실재·대안 부재 여부", "D001,D002,D003,D004,D005,D006,D007"],
    ["H2", "단순 보관보다 위탁 대여로 부가가치 창출에 관심을 보일 것", "강성웅", "공유경제·중고·렌탈 수용 문화", "D008,D009,D010"],
    ["H3", "타겟은 주거 공백기 짐보관에 단기 임대·대여 이용료 지불 의향이 있을 것", "지웅", "수요 존재·지불 의향", "D001,D003,D004,D010,D011,D012,D013,D014"],
    ["H4", "위탁 대여 시 플랫폼에 물품 위탁 신뢰·의향이 있을 것", "승환", "신뢰장치 충족 시 위탁 의향", "D015,D016,D017"],
    ["H5", "외부 이용자는 위탁 중고물품 일시 대여 니즈가 있을 것", "지훈", "단기사용·대여 수요", "D008,D009,D010,D003,D018"],
    ["H6", "(메인타겟) 자취생/기숙사생 이동 시기 물품 처분·보관 필요 증가", "자영", "규모·시기·페인 깊이", "D001,D003,D004,D007,D012,D013,D019"],
]

# Sheet 4: ER 관계 요약
er_rows = [
    ["관계", "부모_테이블", "자식_테이블", "FK_컬럼", "설명"],
    ["1:N", "hypotheses(가설)", "community_keyword_posts", "hypothesis_id", "가설별 커뮤니티 게시글 분류"],
    ["1:N", "hypotheses(가설)", "search_trend_keywords", "hypothesis_id", "가설별 검색 트렌드"],
    ["1:N", "hypotheses(가설)", "market_statistics", "hypothesis_id", "가설별 시장통계"],
    ["1:N", "regions(지역)", "population_migration_stats", "admin_dong_code", "지역별 인구이동"],
    ["1:N", "regions(지역)", "single_household_housing_stats", "admin_dong_code", "지역별 1인가구"],
    ["1:N", "university_dormitory_info", "community_keyword_posts", "region", "대학가 커뮤니티 연계(논리적)"],
    ["독립", "-", "competitor_storage_services", "-", "경쟁사 벤치마킹 마스터"],
    ["독립", "-", "competitor_trust_benchmark", "-", "신뢰장치 벤치마킹"],
    ["독립", "-", "housing_nomad_segments", "-", "세그먼트 분석 결과"],
]


def style_header(ws, row_num=1):
    header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
    header_font = Font(bold=True, color="FFFFFF", size=11)
    thin = Side(style="thin")
    border = Border(left=thin, right=thin, top=thin, bottom=thin)
    for cell in ws[row_num]:
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = border


def auto_width(ws, min_width=12, max_width=45):
    for col_idx, col in enumerate(ws.columns, 1):
        max_len = 0
        col_letter = get_column_letter(col_idx)
        for cell in col:
            if cell.value:
                max_len = max(max_len, len(str(cell.value)))
        ws.column_dimensions[col_letter].width = min(max(max_len + 2, min_width), max_width)


def write_sheet(wb, title, rows):
    ws = wb.create_sheet(title=title)
    for r_idx, row in enumerate(rows, 1):
        for c_idx, val in enumerate(row, 1):
            cell = ws.cell(row=r_idx, column=c_idx, value=val)
            if r_idx > 1:
                cell.alignment = Alignment(vertical="top", wrap_text=True)
    style_header(ws)
    ws.freeze_panes = "A2"
    auto_width(ws)
    return ws


def main():
    import os
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

    wb = Workbook()
    wb.remove(wb.active)

    write_sheet(wb, "1_통합_데이터수집목록", summary_rows)
    write_sheet(wb, "2_MySQL_스키마", schema_rows)
    write_sheet(wb, "3_가설_매핑", hypothesis_rows)
    write_sheet(wb, "4_ER_관계요약", er_rows)

    # 프로젝트 개요 시트
    overview = [
        ["항목", "내용"],
        ["프로젝트명", "시즌성 주거 노마드(Seasonal Housing Nomad) 짐 보관·위탁대여 플랫폼"],
        ["한줄정의", "거주지 일시적 단절을 겪지만 동일 지역으로 회귀하는 시즌성 주거 노마드의 공백기 짐 보관 문제 해결"],
        ["메인타겟", "대학 기숙사생 (방학 퇴소 → 재입학 전 공백기)"],
        ["서브타겟", "계절성/단기 근로자, 장기 출장자·연구원, 신축 아파트 입주 대기자"],
        ["솔루션1", "문 앞 비대면 픽업 + 공간 구독형 마이크로 스토리지"],
        ["솔루션2", "보관 공백기 위탁 대여(풀-위탁)로 수익 창출"],
        ["NSM", "보관서비스 사용자 확보를 통한 서비스 지속가능성 검증"],
        ["데이터 전략", "공공통계 + 커뮤니티/플랫폼 크롤링 + 검색트렌드 + 유저리서치"],
        ["성수기 시즌", "5~6월(여름방학), 11~12월(겨울방학)"],
        ["통합 테이블 수", "14개"],
        ["통합 데이터 항목", "20개 (중복 8건 통합)"],
    ]
    ws0 = write_sheet(wb, "0_프로젝트_개요", overview)
    # move overview to first position
    wb.move_sheet(ws0, offset=-4)

    wb.save(OUTPUT_PATH)
    print(f"Created: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
