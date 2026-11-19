// 배포 위치(깃허브 페이지는 저장소 이름 아래 경로)에 맞춰 공개 파일 주소를 만든다.
export const base = import.meta.env.BASE_URL
export function asset(path) {
  return base + path.replace(/^\//, '')
}
