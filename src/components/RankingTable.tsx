import React from "react";

const LEVEL_PRIORITY = ["Rxd", "Scaled", "A", "B", "C"];

type RecordRow = {
  id: string;
  member_name: string;
  score_value: number;
  score_raw: string;
  level: string;
  wod_id: string;
  wod_date: string;
  wod_title?: string;
  remark?: string;
  rank: number; // DB에서 온 레벨별 rank
};

type RankingTableProps = {
  records: RecordRow[];
  selectedLevel: string;
  levelPriority?: string[];
};

// remark에서 lb 앞의 숫자 추출 (없으면 0)
function getLbValue(remark?: string): number {
  if (!remark) return 0;
  const match = remark.match(/(\d+)\s*lb/i);
  return match ? parseInt(match[1], 10) : 0;
}

// 타이 방식 순위 계산 함수 (공동 순위, 건너뛰기)
function getOverallRanks(records: RecordRow[], levelPriority: string[]) {
  // level 우선순위, score_value, lb값, member_name 순 정렬
  const sorted = [...records].sort((a, b) => {
    const levelDiff =
      (levelPriority.indexOf(a.level) === -1
        ? 999
        : levelPriority.indexOf(a.level)) -
      (levelPriority.indexOf(b.level) === -1
        ? 999
        : levelPriority.indexOf(b.level));
    if (levelDiff !== 0) return levelDiff;
    if (a.rank !== undefined && b.rank !== undefined && a.rank !== b.rank) {
      // DB에서 온 rank가 있으면 우선 사용 (레벨별)
      return a.rank - b.rank;
    }
    if (b.score_value !== a.score_value) return b.score_value - a.score_value;
    // score_value가 같으면 lb값 내림차순
    const lbA = getLbValue(a.remark);
    const lbB = getLbValue(b.remark);
    if (lbB !== lbA) return lbB - lbA;
    // lb값도 같으면 이름순
    return a.member_name.localeCompare(b.member_name);
  });

  // 전체 순위 부여 (타이 방식)
  let prevScore: number | null = null;
  let prevLb: number | null = null;
  let prevLevel: string | null = null;
  let prevRank = 0;
  let skip = 1;
  const ranked = sorted.map((r, idx) => {
    const lb = getLbValue(r.remark);
    if (prevScore === r.score_value && prevLevel === r.level && prevLb === lb) {
      // 동점, 같은 레벨, 같은 lb면 같은 순위
      skip++;
      return { ...r, overallRank: prevRank };
    } else {
      const rank = idx + 1;
      prevScore = r.score_value;
      prevLevel = r.level;
      prevLb = lb;
      prevRank = rank;
      skip = 1;
      return { ...r, overallRank: rank };
    }
  });
  return ranked;
}

function formatDate(dateStr: string) {
  // dateStr: YYYY-MM-DD or ISO
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const RankingTable: React.FC<RankingTableProps> = ({
  records,
  selectedLevel,
  levelPriority = LEVEL_PRIORITY,
}) => {
  // level 필터링
  const filtered =
    selectedLevel === "전체"
      ? records
      : records.filter((r) => r.level === selectedLevel);

  // 전체/레벨별 순위 계산
  let displayRows: (RecordRow & { overallRank?: number })[] = [];
  if (selectedLevel === "전체") {
    displayRows = getOverallRanks(filtered, levelPriority);
  } else {
    // 레벨별: DB에서 온 rank 사용
    displayRows = [...filtered].sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      return a.member_name.localeCompare(b.member_name);
    });
  }

  // WOD 정보 추출 (records가 비어있지 않으면)
  let wodTitle = "";
  let wodDate = "";
  if (records.length > 0) {
    const first = records[0];
    wodTitle = first.wod_title || "";
    wodDate = formatDate(first.wod_date);
  }

  return (
    <div className="overflow-x-auto">
      {/* WOD 정보 */}
      {records.length > 0 && (
        <div className="mb-4 flex flex-col items-start gap-1">
          <span className="text-lg font-bold text-[#3b2ff5]">{wodTitle}</span>
          <span className="text-sm text-gray-500">{wodDate}</span>
        </div>
      )}
      <table className="min-w-full bg-white/80 shadow-lg rounded-2xl border-separate border-spacing-0">
        <thead>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-bold text-[#3b2ff5] bg-[#f3f0ff] rounded-tl-2xl">
              순위
            </th>
            <th className="px-6 py-3 text-left text-xs font-bold text-[#3b2ff5] bg-[#f3f0ff]">
              이름
            </th>
            <th className="px-6 py-3 text-left text-xs font-bold text-[#3b2ff5] bg-[#f3f0ff]">
              레벨
            </th>
            <th className="px-6 py-3 text-left text-xs font-bold text-[#3b2ff5] bg-[#f3f0ff]">
              메모
            </th>
            <th className="px-6 py-3 text-right text-xs font-bold text-[#3b2ff5] bg-[#f3f0ff] rounded-tr-2xl">
              기록
            </th>
          </tr>
        </thead>
        <tbody>
          {displayRows.map((r, idx) => (
            <tr
              key={r.id}
              className={
                idx === 0
                  ? "bg-gradient-to-r from-[#a18fff]/60 to-[#3b2ff5]/60 text-white font-bold"
                  : idx % 2 === 0
                  ? "bg-[#f8f7fd] hover:bg-[#ecebfa]"
                  : "bg-white hover:bg-[#f3f0ff]"
              }
            >
              <td className="px-6 py-3 text-center rounded-l-2xl">
                {selectedLevel === "전체" ? r.overallRank : r.rank}
              </td>
              <td className="px-6 py-3">{r.member_name}</td>
              <td className="px-6 py-3">{r.level}</td>
              <td className="px-6 py-3 text-gray-600 whitespace-pre-line text-sm">
                {r.remark || ""}
              </td>
              <td className="px-6 py-3 text-right rounded-r-2xl">
                {r.score_raw}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RankingTable;
