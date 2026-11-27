import { useEffect, useMemo, useState } from 'react';
import { Copy, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { toast } from 'sonner';
import {
  differenceInCalendarDays, eachDayOfInterval, eachMonthOfInterval, eachWeekOfInterval,
  endOfDay, format, startOfDay, startOfMonth, startOfWeek, subDays,
} from 'date-fns';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BannerService } from '../../services/bannerService';
import type { Banner } from '../../types/banner';
import { MultiSelectFilter, PillSelect } from '../components/FilterBar';
import { TiketSnackbar } from '../components/ui/TiketSnackbar';

type RangeKey = 'week' | 'month' | 'year' | 'semester' | 'custom';

const RANGES: { key: RangeKey; label: string; days?: number }[] = [
  { key: 'week', label: 'Weekly', days: 7 },
  { key: 'month', label: 'Monthly', days: 30 },
  { key: 'year', label: 'Yearly', days: 365 },
  { key: 'semester', label: 'Semester' },
  { key: 'custom', label: 'Custom' },
];

const MINUTES_KEY = 'analytics_minutes_per_banner';

// Legacy "Transport" banners are counted as Flight, same as in the list filter
const verticalOf = (b: Banner) => (b.product === 'Transport' ? 'Flight' : (b.product === 'Hotel' || b.product === 'Accommodation') ? 'Accom' : (b.product || 'Unknown'));
const creatorOf = (b: Banner) => (b.creatorName || '').trim() || 'Unknown';
const ratioOf = (b: Banner) => ((b as any).form_data?.bannerRatio as string | undefined) || 'Unknown';

/** EN + ID versions count as separate deliverables. A DLP project counts every entry point / header it contains. */
function assetsOf(b: Banner): number {
  const dlp = (b as any).form_data?.dlp;
  if (b.category === 'DLP Assets' && dlp) {
    const n = Object.keys(dlp.entryPoints || {}).length + (dlp.header?.mobile ? 1 : 0) + (dlp.header?.desktop ? 1 : 0);
    return Math.max(1, n) * 2;
  }
  return 2;
}

// Active time recorded by the create flow (seconds); 0 = banner made before tracking existed
const secsOf = (b: Banner) => Number((b as any).metadata?.creation_seconds) || 0;

function summarize(list: Banner[]) {
  return {
    created: list.length,
    published: list.filter((b) => b.status === 'published').length,
    assets: list.reduce((n, b) => n + assetsOf(b), 0),
    creators: new Set(list.map(creatorOf)).size,
  };
}

function countBy(list: Banner[], key: (b: Banner) => string) {
  const m = new Map<string, number>();
  list.forEach((b) => m.set(key(b), (m.get(key(b)) || 0) + 1));
  return Array.from(m, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

function Delta({ now, before }: { now: number; before: number }) {
  if (before === 0 && now === 0) return <span className="text-[12px] text-[#71747d] flex items-center gap-1"><Minus size={12} /> no change</span>;
  if (before === 0) return <span className="text-[12px] text-[#1a9e5f] flex items-center gap-1"><TrendingUp size={12} /> new vs previous period</span>;
  const pct = Math.round(((now - before) / before) * 100);
  if (pct === 0) return <span className="text-[12px] text-[#71747d] flex items-center gap-1"><Minus size={12} /> same as previous period</span>;
  const up = pct > 0;
  return (
    <span className={`text-[12px] flex items-center gap-1 ${up ? 'text-[#1a9e5f]' : 'text-[#dc2626]'}`}>
      {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {up ? '+' : ''}{pct}% vs previous period
    </span>
  );
}

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[12px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.08)] p-[24px] flex flex-col gap-[16px]">
      <div className="flex items-center justify-between gap-[12px]">
        <h2 className="text-[16px] font-bold text-[#303135]">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

// Categorical palette (validated set, fixed order). Colors follow the entity, not its rank,
// so filtering never repaints the survivors. Anything past 7 entities folds into "Other".
const SERIES = ['#007bff', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6'];
const OTHER = '#aeb2be';

type Slice = { name: string; value: number; color: string };

function toSlices(data: { name: string; value: number }[], order: string[]): Slice[] {
  const colorOf = (name: string) => {
    const i = order.indexOf(name);
    return i >= 0 && i < SERIES.length ? SERIES[i] : null;
  };
  const known = data.filter((d) => colorOf(d.name));
  const rest = data.filter((d) => !colorOf(d.name));
  const slices: Slice[] = known.map((d) => ({ ...d, color: colorOf(d.name)! }));
  const other = rest.reduce((n, d) => n + d.value, 0);
  if (other > 0) slices.push({ name: 'Other', value: other, color: OTHER });
  return slices;
}

function ChartTooltip({ active, payload, label, unit = 'banners' }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="bg-white rounded-[8px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.24)] border border-[#e8eaee] px-[12px] py-[8px] text-[13px]">
      <div className="font-bold text-[#303135]">{label ?? p.name}</div>
      <div className="text-[#71747d]">{p.value} {unit}</div>
    </div>
  );
}

function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="flex bg-[#f8f9fd] rounded-[8px] p-[2px] gap-[2px]">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-[10px] py-[4px] rounded-[6px] text-[12px] font-bold transition-colors ${value === o.value ? 'bg-white text-[#007bff] shadow-[0px_1px_3px_0px_rgba(48,49,53,0.16)]' : 'text-[#71747d] hover:text-[#303135]'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

type Style = 'bar' | 'donut' | 'pie';

function BreakdownCard({ title, data, order }: { title: string; data: { name: string; value: number }[]; order: string[] }) {
  const [style, setStyle] = useState<Style>('donut');
  const slices = useMemo(() => toSlices(data, order), [data, order]);
  const total = slices.reduce((n, d) => n + d.value, 0);
  const max = Math.max(1, ...slices.map((d) => d.value));
  const pct = (v: number) => (total ? Math.round((v / total) * 100) : 0);

  return (
    <Card title={title} action={<Segmented<Style> value={style} onChange={setStyle} options={[{ value: 'bar', label: 'Bar' }, { value: 'donut', label: 'Donut' }, { value: 'pie', label: 'Pie' }]} />}>
      {slices.length === 0 ? <p className="text-[14px] text-[#71747d]">No data in this range.</p> : (
        <div className="flex flex-col gap-[16px]">
          {style !== 'bar' && (
            <div className="relative h-[190px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={slices}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={style === 'donut' ? 58 : 0}
                    outerRadius={84}
                    stroke="#ffffff"
                    strokeWidth={2}
                    startAngle={90}
                    endAngle={-270}
                    isAnimationActive={false}
                  >
                    {slices.map((d) => <Cell key={d.name} fill={d.color} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {style === 'donut' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[26px] font-bold leading-[30px] text-[#303135]">{total}</span>
                  <span className="text-[12px] text-[#71747d]">banners</span>
                </div>
              )}
            </div>
          )}

          {/* Legend / bars: names and values are always visible, so identity is never color-only */}
          <ul className="flex flex-col gap-[10px]">
            {slices.map((d) => (
              <li key={d.name} className="flex flex-col gap-[6px]">
                <div className="flex items-center justify-between gap-[8px] text-[13px]">
                  <span className="flex items-center gap-[8px] min-w-0">
                    <span className="size-[10px] rounded-full shrink-0" style={{ background: d.color }} />
                    <span className="text-[#303135] truncate">{d.name}</span>
                  </span>
                  <span className="shrink-0 text-[#71747d]"><span className="font-bold text-[#303135]">{d.value}</span> · {pct(d.value)}%</span>
                </div>
                {style === 'bar' && (
                  <div className="h-[8px] rounded-full bg-[#f0f2f7] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(d.value / max) * 100}%`, background: d.color }} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

export function AnalyticsPage({ isSidebarCollapsed = false }: { isSidebarCollapsed?: boolean }) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<RangeKey>('month');
  const [customFrom, setCustomFrom] = useState(() => format(subDays(new Date(), 29), 'yyyy-MM-dd'));
  const [customTo, setCustomTo] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const now = new Date();
  const [semYear, setSemYear] = useState(now.getFullYear());
  const [semHalf, setSemHalf] = useState<1 | 2>(now.getMonth() < 6 ? 1 : 2);
  const [creators, setCreators] = useState<string[]>([]); // [] = everyone
  const [minutes, setMinutes] = useState<number>(() => {
    try { const v = Number(localStorage.getItem(MINUTES_KEY)); return v > 0 ? v : 30; } catch { return 30; }
  });

  useEffect(() => {
    BannerService.listBanners()
      .then(setBanners)
      .catch(() => toast.custom((id) => <TiketSnackbar id={id} message="Failed to load banners" variant="error" />))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { try { localStorage.setItem(MINUTES_KEY, String(minutes)); } catch {} }, [minutes]);

  // Period [from, to] and the previous period of the same length right before it
  const { from, to, prevFrom, prevTo } = useMemo(() => {
    let f: Date, t: Date;
    if (range === 'semester') {
      // H1 = Jan–Jun, H2 = Jul–Dec; the previous period is the semester right before
      f = startOfDay(new Date(semYear, semHalf === 1 ? 0 : 6, 1));
      t = endOfDay(new Date(semYear, semHalf === 1 ? 5 : 11, semHalf === 1 ? 30 : 31));
      const pf = startOfDay(new Date(semHalf === 1 ? semYear - 1 : semYear, semHalf === 1 ? 6 : 0, 1));
      const pt = endOfDay(subDays(f, 1));
      return { from: f, to: t, prevFrom: pf, prevTo: pt };
    }
    if (range === 'custom') {
      f = startOfDay(new Date(customFrom || Date.now()));
      t = endOfDay(new Date(customTo || Date.now()));
      if (f > t) [f, t] = [startOfDay(t), endOfDay(f)];
    } else {
      const days = RANGES.find((r) => r.key === range)!.days!;
      t = endOfDay(new Date());
      f = startOfDay(subDays(new Date(), days - 1));
    }
    const len = differenceInCalendarDays(t, f) + 1;
    return { from: f, to: t, prevFrom: startOfDay(subDays(f, len)), prevTo: endOfDay(subDays(f, 1)) };
  }, [range, customFrom, customTo, semYear, semHalf]);

  const yearOptions = useMemo(() => {
    const years = banners.map((b) => new Date(b.createdAt).getFullYear()).filter((y) => !isNaN(y));
    const min = Math.min(now.getFullYear(), ...years);
    return Array.from({ length: now.getFullYear() - min + 1 }, (_, i) => now.getFullYear() - i);
  }, [banners]);

  const allCreators = useMemo(() => Array.from(new Set(banners.map(creatorOf))).sort(), [banners]);

  const inPeriod = (b: Banner, a: Date, z: Date) => {
    const d = new Date(b.createdAt);
    return !isNaN(d.getTime()) && d >= a && d <= z && (creators.length === 0 || creators.includes(creatorOf(b)));
  };
  const current = useMemo(() => banners.filter((b) => inPeriod(b, from, to)), [banners, from, to, creators]);
  const previous = useMemo(() => banners.filter((b) => inPeriod(b, prevFrom, prevTo)), [banners, prevFrom, prevTo, creators]);

  const cur = summarize(current);
  const prev = summarize(previous);
  // Time in tool: measured per banner when tracked; untracked banners use the average of the tracked ones (0 if none yet)
  const allTracked = banners.filter((b) => secsOf(b) > 0);
  const globalAvgMin = allTracked.length ? allTracked.reduce((n, b) => n + secsOf(b), 0) / 60 / allTracked.length : 0;
  const toolMin = (b: Banner) => (secsOf(b) > 0 ? secsOf(b) / 60 : globalAvgMin);
  // Saved = manual baseline − time spent in the tool, per banner
  const savedHours = (list: Banner[]) => list.reduce((n, b) => n + Math.max(0, minutes - toolMin(b)), 0) / 60;
  const hoursSaved = savedHours(current);
  const prevHours = savedHours(previous);
  const tracked = current.filter((b) => secsOf(b) > 0);
  const avgToolMin = tracked.length ? tracked.reduce((n, b) => n + secsOf(b), 0) / 60 / tracked.length : null;
  const fmtMin = (m: number) => String(Number(m.toFixed(1)));
  const days = differenceInCalendarDays(to, from) + 1;

  // Trend buckets: daily up to a month, weekly up to ~4 months, monthly beyond
  const trend = useMemo(() => {
    const mode = days <= 31 ? 'day' : days <= 140 ? 'week' : 'month';
    const keyOf = (d: Date) => format(mode === 'day' ? d : mode === 'week' ? startOfWeek(d, { weekStartsOn: 1 }) : startOfMonth(d), 'yyyy-MM-dd');
    const starts = mode === 'day' ? eachDayOfInterval({ start: from, end: to })
      : mode === 'week' ? eachWeekOfInterval({ start: from, end: to }, { weekStartsOn: 1 })
      : eachMonthOfInterval({ start: from, end: to });
    const m = new Map(starts.map((d) => [keyOf(d), 0]));
    current.forEach((b) => { const k = keyOf(new Date(b.createdAt)); if (m.has(k)) m.set(k, (m.get(k) || 0) + 1); });
    return Array.from(m, ([k, value]) => ({
      name: format(new Date(k), mode === 'month' ? 'MMM yy' : 'd MMM'),
      value,
    }));
  }, [current, from, to, days]);

  // Stable entity order (alphabetical over ALL banners) so a color never moves when filters change
  const orderOf = (key: (b: Banner) => string) => Array.from(new Set(banners.map(key))).sort();
  const categoryOrder = useMemo(() => orderOf((b) => b.category || 'Unknown'), [banners]);
  const verticalOrder = useMemo(() => orderOf(verticalOf), [banners]);
  const ratioOrder = useMemo(() => orderOf(ratioOf), [banners]);
  const [trendStyle, setTrendStyle] = useState<'bar' | 'area'>('bar');

  const byCategory = useMemo(() => countBy(current, (b) => b.category || 'Unknown'), [current]);
  const byVertical = useMemo(() => countBy(current, verticalOf), [current]);
  const byRatio = useMemo(() => countBy(current, ratioOf), [current]);
  const leaderboard = useMemo(() => {
    const m = new Map<string, Banner[]>();
    current.forEach((b) => m.set(creatorOf(b), [...(m.get(creatorOf(b)) || []), b]));
    return Array.from(m, ([name, list]) => ({ name, ...summarize(list) })).sort((a, b) => b.created - a.created);
  }, [current]);

  const rangeLabel = range === 'semester' ? `${semYear} H${semHalf} (${format(from, 'd MMM')} – ${format(to, 'd MMM yyyy')})` : `${format(from, 'd MMM yyyy')} – ${format(to, 'd MMM yyyy')}`;
  const who = creators.length === 0 ? 'the team' : creators.join(', ');
  const hoursText = String(Number(hoursSaved.toFixed(2))); // exact, up to 2 decimals (29.5 stays 29.5)
  const summaryText =
    `Between ${rangeLabel}, ${who} created ${cur.created} banner${cur.created === 1 ? '' : 's'} with TDS Lab ` +
    `(${cur.assets} deliverable assets across EN and ID), ${cur.published} of them published. ` +
    (avgToolMin !== null ? `Each took on average ${fmtMin(avgToolMin)} minutes in the tool (measured on ${tracked.length} banner${tracked.length === 1 ? '' : 's'}) ` : 'Each took far less time in the tool ') +
    `against an estimated ${minutes}-minute manual baseline, saving about ${hoursText} hours of design time.`;

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      toast.custom((id) => <TiketSnackbar id={id} message="Summary copied" variant="default" />);
    } catch {
      toast.custom((id) => <TiketSnackbar id={id} message="Could not copy" variant="error" />);
    }
  };

  const kpi = (label: string, value: string | number, d?: React.ReactNode, hint?: string) => (
    <div className="bg-white rounded-[12px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.08)] p-[20px] flex flex-col gap-[6px]">
      <span className="text-[13px] text-[#71747d]">{label}</span>
      <span className="text-[32px] font-bold leading-[38px] text-[#303135]">{loading ? '–' : value}</span>
      {d}
      {hint && <span className="text-[12px] text-[#aeb2be]">{hint}</span>}
    </div>
  );

  return (
    <div className={`min-h-full bg-[#f8f9fd] p-[24px] transition-all duration-300`}>
      <div className="max-w-[1200px] mx-auto flex flex-col gap-[24px]">
        {/* Title + controls */}
        <div className="flex flex-col gap-[16px]">
          <h3 className="text-[18px] font-bold text-[#303135] leading-[24px]">{rangeLabel}</h3>

          <div className="flex flex-wrap items-center gap-[12px]">
            <div className="flex bg-white rounded-[8px] border border-[#d8dce8] p-[4px] gap-[4px]">
              {RANGES.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setRange(r.key)}
                  className={`px-[14px] py-[6px] rounded-[6px] text-[14px] font-bold transition-colors ${range === r.key ? 'bg-[#e7f2ff] text-[#007bff]' : 'text-[#71747d] hover:bg-[#f8f9fd]'}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            {range === 'semester' && (
              <div className="flex items-center gap-[8px] text-[14px] text-[#303135]">
                <PillSelect options={yearOptions.map((y) => ({ label: String(y), value: String(y) }))} value={String(semYear)} onChange={(v) => setSemYear(Number(v))} width={140} />
                <PillSelect options={[{ label: 'H1 (Jan – Jun)', value: '1' }, { label: 'H2 (Jul – Dec)', value: '2' }]} value={String(semHalf)} onChange={(v) => setSemHalf(Number(v) as 1 | 2)} width={200} />
              </div>
            )}
            {range === 'custom' && (
              <div className="flex items-center gap-[8px] text-[14px] text-[#303135]">
                <input type="date" value={customFrom} max={customTo} onChange={(e) => setCustomFrom(e.target.value)} className="h-[38px] px-[10px] rounded-[8px] border border-[#d8dce8] bg-white" />
                <span className="text-[#71747d]">to</span>
                <input type="date" value={customTo} min={customFrom} onChange={(e) => setCustomTo(e.target.value)} className="h-[38px] px-[10px] rounded-[8px] border border-[#d8dce8] bg-white" />
              </div>
            )}
            <MultiSelectFilter allLabel="All creators" pluralLabel="Creators" options={allCreators} selected={creators} onChange={setCreators} />
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-[16px]">
          {kpi('Banners created', cur.created, <Delta now={cur.created} before={prev.created} />)}
          {kpi('Assets delivered', cur.assets, <Delta now={cur.assets} before={prev.assets} />, 'EN + ID counted separately')}
          {kpi('Estimated hours saved', hoursText, <Delta now={hoursSaved} before={prevHours} />, `${minutes} min manual − time in tool`)}
          {kpi('Avg time in tool', avgToolMin !== null ? `${fmtMin(avgToolMin)} min` : '–', undefined, avgToolMin !== null ? `Measured on ${tracked.length} of ${cur.created} banners` : 'No tracked banners yet (tracking started recently)')}
          {kpi('Published', cur.created ? `${Math.round((cur.published / cur.created) * 100)}%` : '–', <span className="text-[12px] text-[#71747d]">{cur.published} of {cur.created} banners</span>)}
        </div>

        {/* Trend */}
        <Card
          title="Banners created over time"
          action={<Segmented<'bar' | 'area'> value={trendStyle} onChange={setTrendStyle} options={[{ value: 'bar', label: 'Bar' }, { value: 'area', label: 'Area' }]} />}
        >
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              {trendStyle === 'bar' ? (
                <BarChart data={trend} margin={{ left: -20, right: 8, top: 8 }} barCategoryGap="14%">
                  <CartesianGrid vertical={false} stroke="#eceef4" strokeDasharray="3 3" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#71747d' }} interval="preserveStartEnd" minTickGap={24} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#71747d' }} />
                  <Tooltip cursor={{ fill: '#f8f9fd' }} content={<ChartTooltip />} />
                  <Bar dataKey="value" name="Banners" fill={SERIES[0]} radius={[4, 4, 0, 0]} maxBarSize={64} isAnimationActive={false} />
                </BarChart>
              ) : (
                <AreaChart data={trend} margin={{ left: -20, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={SERIES[0]} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={SERIES[0]} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#eceef4" strokeDasharray="3 3" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#71747d' }} interval="preserveStartEnd" minTickGap={24} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#71747d' }} />
                  <Tooltip cursor={{ stroke: '#d8dce8' }} content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="value" name="Banners" stroke={SERIES[0]} strokeWidth={2} fill="url(#trendFill)" dot={{ r: 3, fill: SERIES[0], stroke: '#ffffff', strokeWidth: 2 }} activeDot={{ r: 5, fill: SERIES[0], stroke: '#ffffff', strokeWidth: 2 }} isAnimationActive={false} />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Breakdowns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-[16px]">
          <BreakdownCard title="By category" data={byCategory} order={categoryOrder} />
          <BreakdownCard title="By vertical" data={byVertical} order={verticalOrder} />
          <BreakdownCard title="By ratio" data={byRatio} order={ratioOrder} />
        </div>

        {/* Creators */}
        <Card title="By creator">
          {leaderboard.length === 0 ? <p className="text-[14px] text-[#71747d]">No data in this range.</p> : (
            <table className="w-full text-[14px]">
              <thead>
                <tr className="text-left text-[12px] text-[#71747d] border-b border-[#f0f2f7]">
                  <th className="py-[8px] font-medium">Creator</th>
                  <th className="py-[8px] font-medium text-right">Banners</th>
                  <th className="py-[8px] font-medium text-right">Published</th>
                  <th className="py-[8px] font-medium text-right">Assets</th>
                  <th className="py-[8px] font-medium text-right">Share</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((r) => (
                  <tr key={r.name} className="border-b border-[#f0f2f7] last:border-b-0 text-[#303135]">
                    <td className="py-[10px] font-medium">{r.name}</td>
                    <td className="py-[10px] text-right">{r.created}</td>
                    <td className="py-[10px] text-right">{r.published}</td>
                    <td className="py-[10px] text-right">{r.assets}</td>
                    <td className="py-[10px] text-right">{cur.created ? Math.round((r.created / cur.created) * 100) : 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        {/* CV / report summary */}
        <Card title="One liner summary">
          <p className="text-[14px] leading-[22px] text-[#303135] bg-[#f8f9fd] rounded-[8px] p-[16px]">{summaryText}</p>
          <div className="flex flex-wrap items-center justify-between gap-[12px]">
            <label className="flex items-center gap-[8px] text-[13px] text-[#71747d]">
              Manual time per banner (baseline, assumption)
              <input
                type="number"
                min={1}
                value={minutes}
                onChange={(e) => setMinutes(Math.max(1, Number(e.target.value) || 1))}
                className="w-[80px] h-[34px] px-[10px] rounded-[8px] border border-[#d8dce8] bg-white text-[#303135]"
              />
            </label>
            <button type="button" onClick={copySummary} className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-bold bg-[#e7f2ff] text-[#007bff] hover:bg-[#d1e6ff] transition-colors">
              <Copy size={14} />
              Copy summary
            </button>
          </div>
          <p className="text-[12px] text-[#aeb2be]">
            Counts only banners that still exist: deleted banners are not included. The creation date is when the banner was first saved.
          </p>
        </Card>
      </div>
    </div>
  );
}
