import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine
} from "recharts";

const SHEET_ID = "10OAjFB5QXQFxCNLmysNdaTdwoY83bvUBDJ2Tv6sBD-Y";
const R = v => `R$ ${Math.round(v).toLocaleString("pt-BR")}`;
const Rk = v => Math.abs(v) >= 1000 ? `R$${(v/1000).toFixed(0)}k` : `R$${v}`;

const P = {
  azul:"#1B3A6B", azul2:"#2563EB", amber:"#F59E0B",
  verde:"#10B981", verm:"#EF4444", roxo:"#7C3AED",
  slate:"#475569", muted:"#94A3B8",
};

const COR_TIPO = { fixo: P.azul2, misto: P.amber, extra: P.verm };

const CAT_COR = {
  "Supermercado":"#0284c7","Alimentação":"#1B3A6B","Seguros/Prev.":"#2563EB",
  "Vestuário":"#8B5CF6","Transporte/Veículos":"#F59E0B","Saúde/Farmácia":"#10B981",
  "Tecnologia":"#06B6D4","Lazer/Entretenimento":"#EC4899","Educação":"#84CC16",
  "Viagens":"#F97316","Beleza/Bem-estar":"#A78BFA","Doações/Igreja":"#6366F1",
  "Compras Online":"#FB7185","Tecnologia (Baze)":"#0EA5E9",
  "Serviços (Baze)":"#3B82F6","Seguros (Baze)":"#1D4ED8",
  "Facebook/Mídia":"#F43F5E","⚠️ Encargos":"#EF4444",
};

const CAT_ICON = {
  "Supermercado":"🛒","Alimentação":"🍽️","Seguros/Prev.":"🛡️",
  "Vestuário":"👗","Transporte/Veículos":"🚗","Saúde/Farmácia":"💊",
  "Tecnologia":"📱","Lazer/Entretenimento":"🎭","Educação":"🎓",
  "Viagens":"✈️","Beleza/Bem-estar":"💅","Doações/Igreja":"⛪",
  "Compras Online":"🛍️","Tecnologia (Baze)":"💻",
  "Serviços (Baze)":"🏢","Seguros (Baze)":"🏦",
  "Facebook/Mídia":"📣","⚠️ Encargos":"⚠️",
};

// Mês atual no formato "Ago/26"
function mesAtual() {
  const d = new Date();
  const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  return `${meses[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
}

// Buscar dados da planilha via JSON público
async function fetchSheet(range) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(range)}`;
  const res = await fetch(url);
  const text = await res.text();
  const json = JSON.parse(text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\)/)[1]);
  return json.table;
}

function parseRows(table) {
  if (!table || !table.rows) return [];
  const cols = table.cols.map(c => c.label);
  return table.rows.map(row => {
    const obj = {};
    row.c.forEach((cell, i) => { obj[cols[i]] = cell ? cell.v : null; });
    return obj;
  });
}

const Tip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", boxShadow: "0 4px 16px rgba(0,0,0,.12)", fontSize: 12 }}>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || "#374151", fontWeight: 700, marginBottom: 2 }}>
          {p.name}: {R(p.value)}
        </div>
      ))}
    </div>
  );
};

export default function GastosLive() {
  const [lancamentos, setLancamentos] = useState([]);
  const [metas, setMetas]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [erro, setErro]               = useState(null);
  const [ultimaAtu, setUltimaAtu]     = useState(null);
  const [aba, setAba]                 = useState("resumo");
  const mes = mesAtual();

  async function carregar() {
    try {
      setLoading(true);
      setErro(null);
      const [tLanc, tMetas] = await Promise.all([
        fetchSheet("Lançamentos"),
        fetchSheet("Metas"),
      ]);
      const lanc  = parseRows(tLanc).filter(r => r["Mês"] === mes && r["Valor"]);
      const metaRows = parseRows(tMetas).filter(r => r["Categoria"]);
      setLancamentos(lanc);
      setMetas(metaRows);
      setUltimaAtu(new Date());
    } catch (e) {
      setErro("Planilha não encontrada ou sem permissão pública. Verifique o compartilhamento.");
    } finally {
      setLoading(false);
    }
  }

  // Atualiza a cada 5 minutos
  useEffect(() => {
    carregar();
    const iv = setInterval(carregar, 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, []);

  const totalGasto = useMemo(() => lancamentos.reduce((a, l) => a + (l["Valor"] || 0), 0), [lancamentos]);
  const totalMeta  = useMemo(() => metas.reduce((a, m) => a + (m["Meta Mensal (R$)"] || 0), 0), [metas]);
  const saldo      = totalMeta - totalGasto;
  const pctTotal   = totalMeta > 0 ? Math.min(Math.round(totalGasto / totalMeta * 100), 150) : 0;

  // Agrupar lançamentos por categoria
  const porCat = useMemo(() => {
    const acc = {};
    lancamentos.forEach(l => {
      const cat = l["Categoria"] || "Outros";
      acc[cat] = (acc[cat] || 0) + (l["Valor"] || 0);
    });
    return acc;
  }, [lancamentos]);

  // Juntar com metas
  const resumo = useMemo(() => metas.map(m => ({
    cat: m["Categoria"],
    tipo: m["Tipo"],
    meta: m["Meta Mensal (R$)"] || 0,
    gasto: Math.round(porCat[m["Categoria"]] || 0),
  })).filter(r => r.meta > 0 || r.gasto > 0), [metas, porCat]);

  const resumoPorTipo = useMemo(() => {
    const acc = { fixo: { meta: 0, gasto: 0 }, misto: { meta: 0, gasto: 0 }, extra: { meta: 0, gasto: 0 } };
    resumo.forEach(r => {
      if (acc[r.tipo]) { acc[r.tipo].meta += r.meta; acc[r.tipo].gasto += r.gasto; }
    });
    return acc;
  }, [resumo]);

  const MTAB = (k) => ({
    padding: "8px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12,
    fontWeight: aba === k ? 700 : 500,
    background: aba === k ? P.azul : "#fff",
    color: aba === k ? "#fff" : "#64748b",
    boxShadow: aba === k ? "0 2px 8px rgba(27,58,107,.3)" : "0 1px 3px rgba(0,0,0,.08)",
  });

  if (loading && !ultimaAtu) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <div style={{ width: 44, height: 44, border: `4px solid #e2e8f0`, borderTopColor: P.azul2, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <div style={{ fontSize: 14, color: P.slate }}>Carregando dados da planilha…</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter',system-ui,sans-serif", maxWidth: 700, margin: "0 auto", padding: "0 0 60px", background: "#f8fafc", minHeight: "100vh" }}>

      {/* HEADER */}
      <div style={{ background: `linear-gradient(135deg,#0f2a56 0%,#1B3A6B 50%,#2563EB 100%)`, padding: "18px 16px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ color: "#93c5fd", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>
              📊 Gastos em Tempo Real · {mes}
            </div>
            <div style={{ color: "#fff", fontSize: 28, fontWeight: 900, lineHeight: 1 }}>{R(totalGasto)}</div>
            <div style={{ color: "#bfdbfe", fontSize: 11, marginTop: 4 }}>
              de {R(totalMeta)} · saldo {saldo >= 0 ? "+" : ""}{R(saldo)}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <button onClick={carregar} disabled={loading}
              style={{ background: "rgba(255,255,255,.15)", color: "#fff", border: "1px solid rgba(255,255,255,.3)", borderRadius: 10, padding: "6px 12px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>
              {loading ? "⏳" : "🔄"} Atualizar
            </button>
            {ultimaAtu && (
              <div style={{ color: "rgba(255,255,255,.6)", fontSize: 9 }}>
                {ultimaAtu.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </div>
            )}
          </div>
        </div>

        {/* BARRA DE PROGRESSO TOTAL */}
        <div style={{ marginTop: 14 }}>
          <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, height: 10, overflow: "hidden" }}>
            <div style={{ width: `${pctTotal}%`, height: "100%", background: pctTotal > 90 ? "#EF4444" : pctTotal > 70 ? "#F59E0B" : "#10B981", borderRadius: 8, transition: "width .5s" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 10, color: "rgba(255,255,255,.6)" }}>
            <span>{pctTotal}% do orçamento mensal</span>
            <span>{lancamentos.length} lançamentos</span>
          </div>
        </div>

        {/* 3 MINI CARDS TIPO */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 14 }}>
          {[["fixo","🔵 Fixos"],["misto","🟡 Mistos"],["extra","🔴 Extras"]].map(([tipo, label]) => {
            const d = resumoPorTipo[tipo];
            const pct = d.meta > 0 ? Math.min(Math.round(d.gasto / d.meta * 100), 150) : 0;
            return (
              <div key={tipo} style={{ background: "rgba(255,255,255,.1)", borderRadius: 10, padding: "8px 10px" }}>
                <div style={{ color: "rgba(255,255,255,.65)", fontSize: 9, fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>{label}</div>
                <div style={{ color: "#fff", fontSize: 13, fontWeight: 900 }}>{Rk(d.gasto)}</div>
                <div style={{ background: "rgba(255,255,255,.2)", borderRadius: 4, height: 4, marginTop: 4, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: pct > 100 ? "#EF4444" : "#10B981", borderRadius: 4 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ERRO */}
      {erro && (
        <div style={{ margin: 12, padding: "12px 14px", background: "#FEF2F2", borderRadius: 12, border: "1px solid #FECACA", fontSize: 12, color: "#991B1B" }}>
          ⚠️ {erro}
        </div>
      )}

      {/* ABAS */}
      <div style={{ padding: "12px 12px 0", display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12 }}>
        {[["resumo","📋 Resumo"],["categorias","📊 Categorias"],["lancamentos","🧾 Lançamentos"]].map(([k, l]) => (
          <button key={k} style={MTAB(k)} onClick={() => setAba(k)}>{l}</button>
        ))}
      </div>

      <div style={{ padding: "0 12px" }}>

        {/* ── ABA RESUMO ── */}
        {aba === "resumo" && (
          <div>
            {/* GRÁFICO BARRAS — gasto vs meta por tipo */}
            <div style={{ background: "#fff", borderRadius: 14, padding: "14px 12px", marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,.06)" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#374151", marginBottom: 12 }}>Gasto vs Meta — {mes}</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={["fixo","misto","extra"].map(tipo => ({
                  tipo: tipo === "fixo" ? "Fixos" : tipo === "misto" ? "Mistos" : "Extras",
                  Meta: resumoPorTipo[tipo].meta,
                  Gasto: resumoPorTipo[tipo].gasto,
                }))} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="tipo" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={Rk} tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<Tip />} />
                  <Bar dataKey="Meta" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Meta" />
                  <Bar dataKey="Gasto" radius={[4, 4, 0, 0]} name="Gasto">
                    {["fixo","misto","extra"].map((tipo, i) => {
                      const d = resumoPorTipo[tipo];
                      return <Cell key={i} fill={d.gasto > d.meta ? P.verm : COR_TIPO[tipo]} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* TOP CATEGORIAS COM MAIS GASTO */}
            <div style={{ background: "#fff", borderRadius: 14, padding: "14px 12px", boxShadow: "0 1px 6px rgba(0,0,0,.06)" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#374151", marginBottom: 12 }}>Top categorias — {mes}</div>
              {resumo.filter(r => r.gasto > 0).sort((a, b) => b.gasto - a.gasto).slice(0, 8).map(r => {
                const pct = r.meta > 0 ? Math.min(Math.round(r.gasto / r.meta * 100), 150) : 0;
                const ok = r.meta === 0 || r.gasto <= r.meta;
                return (
                  <div key={r.cat} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span>{CAT_ICON[r.cat] || "📌"}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{r.cat}</span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: ok ? "#374151" : P.verm }}>{R(r.gasto)}</span>
                        {r.meta > 0 && <span style={{ fontSize: 10, color: "#94a3b8" }}> / {R(r.meta)}</span>}
                      </div>
                    </div>
                    {r.meta > 0 && (
                      <div style={{ background: "#f1f5f9", borderRadius: 5, height: 6, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: ok ? CAT_COR[r.cat] || P.azul2 : P.verm, borderRadius: 5, transition: "width .4s" }} />
                      </div>
                    )}
                  </div>
                );
              })}
              {resumo.filter(r => r.gasto > 0).length === 0 && (
                <div style={{ textAlign: "center", padding: "20px 0", color: "#94a3b8", fontSize: 13 }}>
                  Nenhum lançamento em {mes} ainda.<br />
                  <span style={{ fontSize: 11 }}>Adicione na planilha Google Sheets.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ABA CATEGORIAS ── */}
        {aba === "categorias" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {["fixo","misto","extra"].map(tipo => {
              const label = tipo === "fixo" ? "🔵 Fixos" : tipo === "misto" ? "🟡 Mistos" : "🔴 Extras";
              const cor   = COR_TIPO[tipo];
              const cats  = resumo.filter(r => r.tipo === tipo);
              return (
                <div key={tipo}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: cor, padding: "8px 2px 4px", borderBottom: `2px solid ${cor}33`, marginBottom: 8 }}>{label}</div>
                  {cats.map(r => {
                    const pct = r.meta > 0 ? Math.min(Math.round(r.gasto / r.meta * 100), 150) : 0;
                    const ok  = r.meta === 0 || r.gasto <= r.meta;
                    const falta = r.meta > 0 ? r.meta - r.gasto : 0;
                    return (
                      <div key={r.cat} style={{ background: "#fff", borderRadius: 12, padding: "12px 14px", marginBottom: 8, boxShadow: "0 1px 4px rgba(0,0,0,.06)", borderLeft: `3px solid ${ok || r.meta === 0 ? cor : P.verm}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: r.meta > 0 ? 8 : 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 16 }}>{CAT_ICON[r.cat] || "📌"}</span>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>{r.cat}</div>
                              {r.meta > 0 && (
                                <div style={{ fontSize: 10, color: "#64748b" }}>
                                  Meta: {R(r.meta)} · {ok ? `Falta: ${R(falta)}` : `Excesso: ${R(-falta)}`}
                                </div>
                              )}
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 15, fontWeight: 900, color: ok || r.meta === 0 ? "#374151" : P.verm }}>{R(r.gasto)}</div>
                            {r.meta > 0 && <div style={{ fontSize: 9, color: ok ? P.verde : P.verm, fontWeight: 700 }}>{ok ? "✅ OK" : "🔴 Acima"} · {pct}%</div>}
                          </div>
                        </div>
                        {r.meta > 0 && (
                          <div style={{ background: "#f1f5f9", borderRadius: 5, height: 7, overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: ok ? cor : P.verm, borderRadius: 5, transition: "width .4s" }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* ── ABA LANÇAMENTOS ── */}
        {aba === "lancamentos" && (
          <div style={{ background: "#fff", borderRadius: 14, padding: "14px 12px", boxShadow: "0 1px 6px rgba(0,0,0,.06)" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#374151", marginBottom: 12 }}>
              Lançamentos — {mes} ({lancamentos.length})
            </div>
            {lancamentos.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0", color: "#94a3b8", fontSize: 13 }}>
                Nenhum lançamento registrado em {mes}.<br />
                <span style={{ fontSize: 11 }}>Adicione na planilha Google Sheets.</span>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", minWidth: 420, borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #f1f5f9" }}>
                      {["Data","Descrição","Cat","Valor"].map(h => (
                        <th key={h} style={{ padding: "6px 8px", textAlign: h === "Valor" ? "right" : "left", color: "#94a3b8", fontSize: 9, fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...lancamentos].sort((a, b) => (b["Data"] || "").localeCompare(a["Data"] || "")).map((l, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f8fafc", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={{ padding: "7px 8px", color: "#64748b", whiteSpace: "nowrap" }}>{l["Data"]}</td>
                        <td style={{ padding: "7px 8px", fontWeight: 600, color: "#1e293b" }}>{l["Descrição"]}</td>
                        <td style={{ padding: "7px 8px" }}>
                          <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 8, background: "#f1f5f9", color: "#475569", whiteSpace: "nowrap" }}>
                            {CAT_ICON[l["Categoria"]] || ""} {l["Categoria"]}
                          </span>
                        </td>
                        <td style={{ padding: "7px 8px", textAlign: "right", fontWeight: 800, color: l["Categoria"]?.includes("⚠️") ? P.verm : "#0f172a", whiteSpace: "nowrap" }}>
                          {R(l["Valor"])}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: "2px solid #e2e8f0", background: "#f8fafc" }}>
                      <td colSpan={3} style={{ padding: "8px 8px", fontWeight: 700, color: "#374151", fontSize: 11 }}>Total {mes}</td>
                      <td style={{ padding: "8px 8px", textAlign: "right", fontWeight: 900, fontSize: 13, color: P.azul }}>{R(totalGasto)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* FOOTER */}
      <div style={{ marginTop: 20, fontSize: 10, color: "#cbd5e1", textAlign: "center", paddingBottom: 10 }}>
        Atualiza automaticamente a cada 5 min · Baze Segs {mes}
      </div>
    </div>
  );
}
