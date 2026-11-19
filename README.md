# BEYOND THE KNOWN

2026-2 한림대학교 디지털인문예술전공 프로젝트 전시회 포스터 공모전 사이트.

출품작 19점(1번부터 20번, 9번 없음)이 실제 밤하늘의 별 하나씩에 놓인다. 하늘은 전시 첫날(2026. 11. 23.) 밤 11시 30분에 한림대학교(북위 37.8868도, 동경 127.7385도)에서 올려다본 하늘이고, Stellarium Web Engine으로 그린다.

## 화면

- `/` 홈: 공모전 이름과 전시 기간, 장소, 시상
- `/sky` 하늘: 번호가 붙은 별 19개와 별을 잇는 선. 별을 누르면 작품 창이 열린다
- `/sky/:id` 작품 창: 포스터(모션 포스터는 소리 없이 반복 재생), 작품명, 작가, 학번과 학과, 작품소개, 이전과 다음 작품

## 자료 고치는 곳

- 출품작 원문: `client/src/data/works.source.json` (출품자 명단 엑셀과 10점 작품소개 엑셀을 글자 그대로 옮김)
- 작품과 별 짝, 영상 여부, 빠진 작품, 수상 결과: `client/src/data/works.js`
  - 수상 결과가 나오면 `awards`에 `'07': 'grand'`처럼 넣는다 (`grand` 최우수상, `excellence` 우수상, `encouragement` 장려상)
- 홈 문구와 관측 위치, 시각: `client/src/data/site.js`
- 색, 글자, 간격, 그림자, 움직임: `client/src/tokens.js` (스타일 파일은 이 값만 쓴다)
- 하늘 색감과 별 크기: `tokens.js`의 `sky` (엔진 화면에 남보라 색을 입히는 투명도와 필터, 별 크기 배율)

## 배포

- 깃허브 페이지: https://hyunho2378.github.io/26-2-dah-exhibition-poster-contest/
- `main`에 올리면 `.github/workflows/pages.yml`이 `BASE_PATH=/26-2-dah-exhibition-poster-contest/`로 빌드해 배포한다

## 실행

```
cd client
npm install
npm run dev      # http://127.0.0.1:5188
npm run build    # client/dist
```

## 하늘 엔진

- 원본: [Stellarium Web Engine](https://github.com/Stellarium/stellarium-web-engine), 커밋은 `engine-src/UPSTREAM_COMMIT`
- 라이선스: GNU AGPL v3. 이 저장소도 같은 라이선스로 공개한다 (`LICENSE`)
- 최신 emscripten(emsdk latest)으로 빌드하려고 고친 내용: `engine-src/stellarium-web-engine-build.patch`
  - 빌드 옵션 정리, 화면 밖에 있을 때 그리기 멈춤(`paused`), 고해상도 화면 배율 상한 2
- 빌드 결과: `client/public/engine/stellarium-web-engine.js`, `.wasm`
- 별과 은하수, 지평선 자료: `client/public/skydata` (엔진 저장소의 `apps/test-skydata`)

```
git clone https://github.com/Stellarium/stellarium-web-engine
cd stellarium-web-engine
git checkout $(cat ../engine-src/UPSTREAM_COMMIT)
git apply ../engine-src/stellarium-web-engine-build.patch
source <emsdk>/emsdk_env.sh
emscons scons -j8 mode=release
```
