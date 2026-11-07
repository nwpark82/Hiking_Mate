'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  VERDICT_LABELS,
  ENDPOINT_LABELS,
  type AdminTrailWithPath,
  type TrailEndpoint,
} from '@/lib/services/admin';

const KakaoMap = dynamic(() => import('@/components/map/KakaoMap').then((mod) => ({ default: mod.KakaoMap })), {
  ssr: false,
  loading: () => <div className="h-80 bg-gray-100 rounded-xl animate-pulse" />,
});

const VERDICT_STYLES: Record<string, string> = {
  USABLE: 'bg-green-100 text-green-800 border-green-200',
  FIXABLE: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  UNUSABLE: 'bg-red-50 text-red-800 border-red-200',
};

const R = 6371000;
const rad = (d: number) => (d * Math.PI) / 180;
function dist(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const x =
    Math.sin(rad(b.lat - a.lat) / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

// 현재 경로 기준 즉시 계산 (분석 스크립트와 같은 끊김 기준: max(100m, 좌표 간격 중앙값 × 8))
function inspectPath(path: AdminTrailWithPath['path_coordinates']) {
  const seg: number[] = [];
  let length = 0;
  for (let i = 1; i < path.length; i++) {
    const d = dist(path[i - 1], path[i]);
    seg.push(d);
    length += d;
  }
  const sorted = seg.filter((d) => d > 0).sort((a, b) => a - b);
  const medianSeg = sorted[sorted.length >> 1] || 0;
  const threshold = Math.max(100, medianSeg * 8);
  const gaps = seg.map((d, i) => ({ i, d })).filter((g) => g.d >= threshold);
  return {
    points: path.length,
    lengthKm: length / 1000,
    gaps,
    bigGaps: gaps.filter((g) => g.d >= 300).length,
    maxGap: gaps.length ? Math.max(...gaps.map((g) => g.d)) : 0,
    startEnd: path.length > 1 ? dist(path[0], path[path.length - 1]) : 0,
  };
}

const endpointLabel = (type: TrailEndpoint | null) => (type ? ENDPOINT_LABELS[type] : '-');

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-1.5 text-sm">
      <span className="w-28 flex-shrink-0 text-gray-500">{label}</span>
      <span className="flex-1 text-gray-900">{children}</span>
    </div>
  );
}

export function TrailQualityPanel({ trail }: { trail: AdminTrailWithPath }) {
  const path = trail.path_coordinates || [];
  const live = useMemo(() => inspectPath(path), [path]);
  const q = trail.quality_detail;

  // KakaoMap 은 props 가 바뀌면 지도를 다시 그리므로 참조를 고정
  const mapPath = useMemo(() => path.map((p) => ({ lat: p.lat, lng: p.lng })), [path]);
  const highlight = useMemo(
    () => live.gaps.map((g) => [mapPath[g.i], mapPath[g.i + 1]] as [typeof mapPath[0], typeof mapPath[0]]),
    [live, mapPath]
  );
  const markers = useMemo(
    () =>
      mapPath.length
        ? [
            { ...mapPath[0], title: `출발 (${endpointLabel(q?.start ?? null)})` },
            { ...mapPath[mapPath.length - 1], title: `도착 (${endpointLabel(q?.end ?? null)})` },
          ]
        : [],
    [mapPath, q]
  );

  return (
    <section className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100 mb-6 space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-lg font-bold text-gray-900">경로 점검</h2>
        {q && (
          <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${VERDICT_STYLES[q.verdict]}`}>
            {VERDICT_LABELS[q.verdict]}
            {q.fix.length > 0 && ` · ${q.fix.join(' + ')}`}
          </span>
        )}
      </div>

      {mapPath.length > 0 ? (
        <div className="rounded-xl overflow-hidden border border-gray-200 h-80">
          <KakaoMap
            latitude={mapPath[0].lat}
            longitude={mapPath[0].lng}
            level={6}
            pathCoordinates={mapPath}
            markers={markers}
            highlightSegments={highlight}
          />
        </div>
      ) : (
        <p className="text-sm text-red-600">경로 좌표가 없습니다.</p>
      )}
      <p className="text-xs text-gray-500">
        초록 실선: 경로 / <span className="text-red-600 font-semibold">빨간 점선: 끊긴 구간</span> (지도에서 직선으로
        보이는 곳은 실제 길이 아닐 수 있음)
      </p>

      <div className="grid sm:grid-cols-2 gap-x-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">현재 경로 (실시간 계산)</h3>
          <Row label="좌표 / 길이">
            {live.points.toLocaleString()}개 / {live.lengthKm.toFixed(2)}km
          </Row>
          <Row label="끊긴 구간">
            {live.gaps.length}개{live.bigGaps > 0 && <span className="text-red-600"> (300m 이상 {live.bigGaps}개)</span>}
            {live.gaps.length > 0 && ` · 최대 ${Math.round(live.maxGap)}m`}
          </Row>
          <Row label="시작-끝 거리">{Math.round(live.startEnd).toLocaleString()}m</Row>
        </div>

        {q && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">
              분석 결과 ({new Date(q.analyzed_at).toLocaleDateString('ko-KR')})
            </h3>
            <Row label="출발">
              {endpointLabel(q.start)}
              {q.start_hint && <span className="text-gray-500"> · {q.start_hint}</span>}
            </Row>
            <Row label="도착">
              {endpointLabel(q.end)}
              {q.end_hint && <span className="text-gray-500"> · {q.end_hint}</span>}
            </Row>
            <Row label="끊김 메우기">
              {q.gap_count > 0 ? `${q.gap_count}개 중 ${q.gap_fillable}개 가능` : '끊김 없음'}
              {q.fill_sources && <span className="text-gray-500"> ({q.fill_sources})</span>}
            </Row>
            <Row label="300m+ 끊김 원인">
              {Object.entries(q.big_gap_causes)
                .filter(([, v]) => v > 0)
                .map(([k, v]) => `${k} ${v}`)
                .join(', ') || '-'}
            </Row>
            <Row label="같은 길 3회+">{Math.round(q.repeat3_share * 100)}%</Row>
            <Row label="고도 급변">
              {q.alt_spikes}곳
              {q.alt_spikes > 0 &&
                ` (${Object.entries(q.alt_spike_causes)
                  .filter(([, v]) => v > 0)
                  .map(([k, v]) => `${k} ${v}`)
                  .join(', ')})`}
            </Row>
            <Row label="소요시간">
              안내 {trail.duration}분 / 계산 {q.est_min ?? '-'}분
              {q.duration_ratio !== null && ` (${q.duration_ratio}배)`}
            </Row>
          </div>
        )}
      </div>

      {q && (q.reasons.length > 0 || q.reliability_reasons.length > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900">
          <p className="font-semibold mb-1">판정 사유</p>
          <ul className="list-disc pl-5 space-y-0.5">
            {[...new Set([...q.reasons, ...q.reliability_reasons])].map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      {!q && (
        <p className="text-sm text-gray-500">
          분석 결과가 아직 저장되지 않았습니다. (scripts/trail-review/sync_quality.js --apply)
        </p>
      )}
    </section>
  );
}
