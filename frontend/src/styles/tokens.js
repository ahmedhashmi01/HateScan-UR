export const LABELS = [
  { id: 0, name: 'Abusive/Offensive', key: 'abusive', color: '#E24B4A' },
  { id: 1, name: 'Normal', key: 'accent', color: '#1D9E75' },
  { id: 2, name: 'Religious Hate', key: 'religious', color: '#D85A30' },
  { id: 3, name: 'Sexism', key: 'sexism', color: '#7F77DD' },
  { id: 4, name: 'Profane/Untargeted', key: 'profane', color: '#BA7517' },
]

export function labelMetaFromId(id) {
  return LABELS.find((l) => l.id === Number(id)) ?? LABELS[1]
}

