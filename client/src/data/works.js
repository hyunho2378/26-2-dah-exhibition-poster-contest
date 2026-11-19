import source from './works.source.json'

// 출품작 번호 순서대로 겨울 하늘의 밝은 별 20개에 놓는다.
// 전시 첫날 밤 한림대학교 하늘에서 지평선 위 12도보다 높고, 서로 7도 넘게 떨어진 밝은 별을 골랐다.
// 1번 카펠라에서 출발해 페르세우스와 황소, 쌍둥이, 오리온, 큰개자리를 지나 20번 폴룩스까지 한 줄로 잇는다.
const stars = {
  '01': { star: '* alf Aur', starName: 'Capella' },
  '02': { star: '* bet Aur', starName: 'Menkalinan' },
  '03': { star: '* alf Per', starName: 'Mirfak' },
  '04': { star: '* eps Per', starName: 'eps Per' },
  '05': { star: '* eta Tau', starName: 'Alcyone' },
  '06': { star: '* alf Tau', starName: 'Aldebaran' },
  '07': { star: '* iot Aur', starName: 'iot Aur' },
  '08': { star: '* bet Tau', starName: 'Elnath' },
  '09': { star: '* zet Tau', starName: 'zet Tau' },
  '10': { star: '* mu. Gem', starName: 'Tejat' },
  '11': { star: '* gam Gem', starName: 'Alhena' },
  '12': { star: '* alf Ori', starName: 'Betelgeuse' },
  '13': { star: '* gam Ori', starName: 'Bellatrix' },
  '14': { star: '* eps Ori', starName: 'Alnilam' },
  '15': { star: '* bet Ori', starName: 'Rigel' },
  '16': { star: '* kap Ori', starName: 'Saiph' },
  '17': { star: '* alf Lep', starName: 'Arneb' },
  '18': { star: '* alf CMa', starName: 'Sirius' },
  '19': { star: '* alf CMi', starName: 'Procyon' },
  '20': { star: '* bet Gem', starName: 'Pollux' },
}

// 영상이 함께 들어온 작품
const motion = new Set(['04', '05', '20'])
// 파일이 아직 없는 작품은 하늘과 목록에 넣지 않는다
const missing = new Set(['09'])

// 수상 결과가 나오면 여기만 채운다: 'grand' | 'excellence' | 'encouragement'
export const awards = {}

export const awardNames = { grand: '최우수상', excellence: '우수상', encouragement: '장려상' }

export const works = source
  .filter((w) => !missing.has(w.id))
  .map((w) => ({
    ...w,
    ...stars[w.id],
    thumb: `/works/${w.id}-thumb.jpg`,
    full: `/works/${w.id}-full.jpg`,
    motion: motion.has(w.id) ? `/works/${w.id}-motion.mp4` : null,
    award: awards[w.id] ?? null,
  }))

export function getWork(id) {
  return works.find((w) => w.id === id) ?? null
}

export function getAdjacent(id) {
  const i = works.findIndex((w) => w.id === id)
  return {
    prev: i > 0 ? works[i - 1] : works[works.length - 1],
    next: i < works.length - 1 ? works[i + 1] : works[0],
  }
}
