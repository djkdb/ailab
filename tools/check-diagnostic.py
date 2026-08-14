"""진단 문항의 '찍기 가능성'을 점검한다. 문항을 고칠 때마다 돌릴 것.

  python3 tools/check-diagnostic.py

기준을 벗어나면 종료 코드 1을 반환한다:
  - 3점 보기가 최장인 비율 35% 초과 (우연 수준 25%)
  - 한 문항 안 보기 길이 편차 20% 초과
  - 찍기 전략 중 무작위 기댓값보다 5%p 이상 유리한 것이 있음
"""
import json, statistics, collections, sys
s=open('assets/js/data/diagnostic.js',encoding='utf-8').read()
d=json.loads(s[s.index('{',s.index('window.ZUN_DIAGNOSTIC')):s.rindex('}')+1])
qs=d['questions']; mcq=[q for q in qs if q['type']!='input']
MAX=len(qs)*3
lvl=lambda got: round(got/MAX*100*0.6)

print(f"문항 {len(qs)} · choice {sum(1 for q in qs if q['type']=='choice')}"
      f" · spot {sum(1 for q in qs if q['type']=='spot')}"
      f" · input {sum(1 for q in qs if q['type']=='input')}")
print('역량', dict(collections.Counter(q['competency'] for q in qs)))

longest=0; p3=collections.Counter(); p0=collections.Counter(); dev=[]
for q in mcq:
    L=[len(o['text']) for o in q['options']]
    b=max(range(4), key=lambda i:q['options'][i]['score'])
    z=min(range(4), key=lambda i:q['options'][i]['score'])
    if L[b]==max(L): longest+=1
    p3[b+1]+=1; p0[z+1]+=1
    sp=(max(L)-min(L))/statistics.mean(L); dev.append(sp)
    if sp>0.20: print(f'  ⚠ Q{q["id"]} 길이 편차 {sp*100:.0f}% {L}')

print(f'\n3점 보기가 최장  {longest}/{len(mcq)} ({longest/len(mcq)*100:.0f}%)   ← 25%가 우연 수준')
print(f'길이 편차 평균   {statistics.mean(dev)*100:.1f}%')
print(f'3점 위치 분포    {dict(sorted(p3.items()))}')
print(f'0점 위치 분포    {dict(sorted(p0.items()))}')

print('\n── 지식 0인 사람이 얻을 수 있는 점수 (input은 0점) ──')
n=sum(q['options'][max(range(4),key=lambda i:len(q['options'][i]['text']))]['score'] for q in mcq)
print(f'  제일 긴 보기 찍기   {n}/{MAX} = {n/MAX*100:>3.0f}%  → 레벨 {lvl(n)}')
for k in (1,2,3,4):
    v=sum(q['options'][k-1]['score'] for q in mcq)
    print(f'  {k}번만 찍기         {v}/{MAX} = {v/MAX*100:>3.0f}%  → 레벨 {lvl(v)}')
avg=sum(sum(o['score'] for o in q['options'])/4 for q in mcq)
print(f'  무작위 찍기(기댓값) {avg:.0f}/{MAX} = {avg/MAX*100:>3.0f}%  → 레벨 {lvl(avg)}')
print(f'  전부 정답            {MAX}/{MAX} = 100%  → 레벨 {lvl(MAX)}')

bad = []
if longest/len(mcq) > 0.35: bad.append(f'3점 보기가 최장인 비율 {longest/len(mcq)*100:.0f}% > 35%')
over = [q['id'] for q in mcq
        if (lambda L: (max(L)-min(L))/statistics.mean(L) > 0.20)([len(o['text']) for o in q['options']])]
if over: bad.append(f'보기 길이 편차 20% 초과: Q{over}')
best_cheat = max([n] + [sum(q['options'][k]['score'] for q in mcq) for k in range(4)])
if best_cheat > avg + MAX*0.05:
    bad.append(f'찍기 전략이 무작위보다 유리함 ({best_cheat} vs {avg:.0f})')
if bad:
    print('\n실패:'); [print(' -', b) for b in bad]; sys.exit(1)
print('\n통과 — 지식 없이 찍어서 얻는 이득이 없습니다.')
