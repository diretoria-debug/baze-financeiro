import React from "react";
import { useState, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, AreaChart, Area, ReferenceLine,
  ComposedChart
} from "recharts";

// ─── PALETA ───────────────────────────────────────────────────────────────────
const P = {
  azul:"#1B3A6B", azul2:"#2563EB", amber:"#F59E0B",
  verde:"#10B981", verm:"#EF4444", roxo:"#8B5CF6",
  slate:"#475569", muted:"#94A3B8", cyan:"#06B6D4",
  pink:"#EC4899", lime:"#84CC16", orange:"#F97316",
};

const CAT_COR = {
  "Alimentação":"#1B3A6B","Seguros/Prev.":"#2563EB","Vestuário":"#8B5CF6",
  "Transporte/Veículos":"#F59E0B","Saúde/Farmácia":"#10B981","Tecnologia":"#06B6D4",
  "Lazer/Entretenimento":"#EC4899","Educação":"#84CC16","Viagens":"#F97316",
  "Beleza/Bem-estar":"#A78BFA","Doações/Igreja":"#6366F1","Compras Online":"#FB7185",
  "Tecnologia (Baze)":"#0EA5E9","Serviços (Baze)":"#3B82F6","Seguros (Baze)":"#1D4ED8",
  "⚠️ Encargos":"#EF4444","Facebook/Mídia":"#4267B2","Outros":"#94A3B8",
};

// FIXO = recorrente todo mês com valor previsível
// EXTRA = compra pontual, parcelamento novo, gasto variável
const TIPO = {
  "Seguros/Prev.":"fixo","Educação":"fixo","Serviços (Baze)":"fixo",
  "Tecnologia (Baze)":"fixo","Seguros (Baze)":"fixo","Tecnologia":"fixo",
  "Alimentação":"misto","Transporte/Veículos":"misto",
  "Vestuário":"extra","Lazer/Entretenimento":"extra","Viagens":"extra",
  "Beleza/Bem-estar":"extra","Compras Online":"extra","Facebook/Mídia":"extra",
  "Doações/Igreja":"misto","Saúde/Farmácia":"misto","⚠️ Encargos":"extra","Outros":"extra",
};

// Categorias que pertencem à Baze Segs (operacional da corretora)
const CAT_BAZE = new Set([
  "Serviços (Baze)","Tecnologia (Baze)","Seguros (Baze)","Facebook/Mídia",
]);
const isBaze = l => CAT_BAZE.has(l.cat);

// ─── BASE DE DADOS COMPLETA JAN–JUL ──────────────────────────────────────────
const MESES_DATA = {
  Jan: {
    total: 32837,
    black: 3784, azul: 24307, sant: 4111, pao: 635,
    lancamentos: [
      // BLACK
      {desc:"Prudential D*APOL",          valor:1325, cat:"Seguros/Prev.",        cartao:"black", portador:"Angélica", tipo:"fixo"},
      {desc:"HNT Loja / Alimentação",     valor:600,  cat:"Alimentação",          cartao:"black", portador:"Ambos",    tipo:"misto"},
      {desc:"Demais Black",               valor:1859, cat:"Alimentação",          cartao:"black", portador:"Ambos",    tipo:"misto"},
      // AZUL
      {desc:"Sta Monica Taquara 1/12",    valor:2155, cat:"Educação",             cartao:"azul",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Igreja Batista Atitude",     valor:1500, cat:"Doações/Igreja",       cartao:"azul",  portador:"Eduardo",  tipo:"misto"},
      {desc:"AZOS Seguros Eduardo",       valor:887,  cat:"Seguros/Prev.",        cartao:"azul",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Prudential (Azul)",          valor:486,  cat:"Seguros/Prev.",        cartao:"azul",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"AZOS Seguros Angélica",      valor:369,  cat:"Seguros/Prev.",        cartao:"azul",  portador:"Angélica", tipo:"fixo"},
      {desc:"RJ Pneus 1/10",             valor:409,  cat:"Transporte/Veículos",  cartao:"azul",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"AutoescolaLopes 1/5",        valor:244,  cat:"Educação",             cartao:"azul",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Netflix + Prime",            valor:178,  cat:"Lazer/Entretenimento", cartao:"azul",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Uber/99",                    valor:380,  cat:"Transporte/Veículos",  cartao:"azul",  portador:"Eduardo",  tipo:"misto"},
      {desc:"Supermercados / Alimentação",valor:2800, cat:"Alimentação",          cartao:"azul",  portador:"Ambos",    tipo:"misto"},
      {desc:"Restaurantes",               valor:1800, cat:"Alimentação",          cartao:"azul",  portador:"Ambos",    tipo:"extra"},
      {desc:"Postos / Combustível",       valor:600,  cat:"Transporte/Veículos",  cartao:"azul",  portador:"Angélica", tipo:"misto"},
      {desc:"Vestuário / Compras",        valor:800,  cat:"Vestuário",            cartao:"azul",  portador:"Eduardo",  tipo:"extra"},
      {desc:"Demais Azul",                valor:11699,cat:"Alimentação",          cartao:"azul",  portador:"Ambos",    tipo:"misto"},
      // SANT
      {desc:"Vindi *Splitc",              valor:2311, cat:"Serviços (Baze)",      cartao:"sant",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"SunCoast Operadora 5/10",    valor:1494, cat:"Serviços (Baze)",      cartao:"sant",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Bradesco AUT 3/10",          valor:307,  cat:"Seguros (Baze)",       cartao:"sant",  portador:"Eduardo",  tipo:"fixo"},
      // PAO
      {desc:"Google Workspace",           valor:490,  cat:"Tecnologia (Baze)",    cartao:"pao",   portador:"Eduardo",  tipo:"fixo"},
      {desc:"Zoom.com",                   valor:100,  cat:"Tecnologia (Baze)",    cartao:"pao",   portador:"Eduardo",  tipo:"fixo"},
      {desc:"Envio Mens.Automatica",      valor:8,    cat:"Serviços (Baze)",      cartao:"pao",   portador:"Eduardo",  tipo:"fixo"},
      {desc:"PICPAY*Drogaria 10/12",      valor:37,   cat:"Saúde/Farmácia",       cartao:"pao",   portador:"Eduardo",  tipo:"fixo"},
    ]
  },
  Fev: {
    total: 35056,
    black: 8526, azul: 20184, sant: 5416, pao: 929,
    lancamentos: [
      {desc:"Prudential D*APOL",          valor:1325, cat:"Seguros/Prev.",        cartao:"black", portador:"Angélica", tipo:"fixo"},
      {desc:"MundialAbelar (Picpay)",     valor:894,  cat:"Alimentação",          cartao:"black", portador:"Angélica", tipo:"misto"},
      {desc:"Arezzo / Vestuário",         valor:800,  cat:"Vestuário",            cartao:"black", portador:"Angélica", tipo:"extra"},
      {desc:"Demais Black",               valor:5507, cat:"Alimentação",          cartao:"black", portador:"Ambos",    tipo:"misto"},
      {desc:"Sta Monica Taquara 2/12",    valor:2155, cat:"Educação",             cartao:"azul",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Igreja Batista Atitude",     valor:2000, cat:"Doações/Igreja",       cartao:"azul",  portador:"Eduardo",  tipo:"misto"},
      {desc:"AZOS Seguros Eduardo",       valor:887,  cat:"Seguros/Prev.",        cartao:"azul",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Prudential (Azul)",          valor:486,  cat:"Seguros/Prev.",        cartao:"azul",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"AZOS Seguros Angélica",      valor:369,  cat:"Seguros/Prev.",        cartao:"azul",  portador:"Angélica", tipo:"fixo"},
      {desc:"RJ Pneus 2/10",             valor:409,  cat:"Transporte/Veículos",  cartao:"azul",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"AutoescolaLopes 2/5",        valor:244,  cat:"Educação",             cartao:"azul",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Netflix + Prime",            valor:178,  cat:"Lazer/Entretenimento", cartao:"azul",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Supermercados / Alimentação",valor:2500, cat:"Alimentação",          cartao:"azul",  portador:"Ambos",    tipo:"misto"},
      {desc:"Restaurantes",               valor:1400, cat:"Alimentação",          cartao:"azul",  portador:"Ambos",    tipo:"extra"},
      {desc:"Postos / Combustível",       valor:500,  cat:"Transporte/Veículos",  cartao:"azul",  portador:"Angélica", tipo:"misto"},
      {desc:"Uber/99",                    valor:350,  cat:"Transporte/Veículos",  cartao:"azul",  portador:"Eduardo",  tipo:"misto"},
      {desc:"Demais Azul",                valor:8706, cat:"Alimentação",          cartao:"azul",  portador:"Ambos",    tipo:"misto"},
      {desc:"Vindi *Splitc",              valor:2311, cat:"Serviços (Baze)",      cartao:"sant",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"SunCoast Operadora 6/10",    valor:1494, cat:"Serviços (Baze)",      cartao:"sant",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Pipefy Com",                 valor:450,  cat:"Tecnologia (Baze)",    cartao:"sant",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Facebook Ads",               valor:735,  cat:"Facebook/Mídia",       cartao:"sant",  portador:"Eduardo",  tipo:"extra"},
      {desc:"Bradesco AUT 4/10",          valor:307,  cat:"Seguros (Baze)",       cartao:"sant",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Buddhaspa 1/2",              valor:119,  cat:"Serviços (Baze)",      cartao:"sant",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Google Workspace",           valor:566,  cat:"Tecnologia (Baze)",    cartao:"pao",   portador:"Eduardo",  tipo:"fixo"},
      {desc:"Zoom.com",                   valor:100,  cat:"Tecnologia (Baze)",    cartao:"pao",   portador:"Eduardo",  tipo:"fixo"},
      {desc:"MundialAbelar (Pao)",        valor:218,  cat:"Alimentação",          cartao:"pao",   portador:"Eduardo",  tipo:"misto"},
      {desc:"Envio Mens.Automatica",      valor:8,    cat:"Serviços (Baze)",      cartao:"pao",   portador:"Eduardo",  tipo:"fixo"},
      {desc:"PICPAY*Drogaria 11/12",      valor:37,   cat:"Saúde/Farmácia",       cartao:"pao",   portador:"Eduardo",  tipo:"fixo"},
    ]
  },
  Mar: {
    total: 43874,
    black: 13192, azul: 23508, sant: 6444, pao: 730,
    lancamentos: [
      {desc:"Prudential D*APOL",          valor:1825, cat:"Seguros/Prev.",        cartao:"black", portador:"Angélica", tipo:"fixo"},
      {desc:"Demais Black",               valor:11367,cat:"Alimentação",          cartao:"black", portador:"Ambos",    tipo:"misto"},
      {desc:"Sta Monica Taquara 3/12",    valor:2155, cat:"Educação",             cartao:"azul",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Igreja Batista Atitude",     valor:2500, cat:"Doações/Igreja",       cartao:"azul",  portador:"Eduardo",  tipo:"misto"},
      {desc:"AZOS Seguros Eduardo",       valor:887,  cat:"Seguros/Prev.",        cartao:"azul",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Prudential (Azul)",          valor:486,  cat:"Seguros/Prev.",        cartao:"azul",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"AZOS Seguros Angélica",      valor:369,  cat:"Seguros/Prev.",        cartao:"azul",  portador:"Angélica", tipo:"fixo"},
      {desc:"RJ Pneus 3/10",             valor:409,  cat:"Transporte/Veículos",  cartao:"azul",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"AutoescolaLopes 3/5",        valor:244,  cat:"Educação",             cartao:"azul",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Netflix + Prime",            valor:178,  cat:"Lazer/Entretenimento", cartao:"azul",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Supermercados / Alimentação",valor:2800, cat:"Alimentação",          cartao:"azul",  portador:"Ambos",    tipo:"misto"},
      {desc:"Restaurantes / Alimentação", valor:2200, cat:"Alimentação",          cartao:"azul",  portador:"Ambos",    tipo:"extra"},
      {desc:"Postos / Combustível",       valor:600,  cat:"Transporte/Veículos",  cartao:"azul",  portador:"Angélica", tipo:"misto"},
      {desc:"Uber/99",                    valor:400,  cat:"Transporte/Veículos",  cartao:"azul",  portador:"Eduardo",  tipo:"misto"},
      {desc:"Vestuário",                  valor:700,  cat:"Vestuário",            cartao:"azul",  portador:"Eduardo",  tipo:"extra"},
      {desc:"Demais Azul",                valor:9580, cat:"Alimentação",          cartao:"azul",  portador:"Ambos",    tipo:"misto"},
      {desc:"Vindi *Splitc",              valor:2521, cat:"Serviços (Baze)",      cartao:"sant",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"SunCoast Operadora 7/10",    valor:1494, cat:"Serviços (Baze)",      cartao:"sant",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Pipefy Com",                 valor:430,  cat:"Tecnologia (Baze)",    cartao:"sant",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Facebook Ads",               valor:734,  cat:"Facebook/Mídia",       cartao:"sant",  portador:"Eduardo",  tipo:"extra"},
      {desc:"Bradesco AUT 5/10",          valor:307,  cat:"Seguros (Baze)",       cartao:"sant",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Buddhaspa 2/2",              valor:353,  cat:"Serviços (Baze)",      cartao:"sant",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Claude AI Subscription",     valor:117,  cat:"Tecnologia (Baze)",    cartao:"sant",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"BMB*Light",                  valor:339,  cat:"Serviços (Baze)",      cartao:"sant",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Google Workspace",           valor:588,  cat:"Tecnologia (Baze)",    cartao:"pao",   portador:"Eduardo",  tipo:"fixo"},
      {desc:"Zoom.com",                   valor:98,   cat:"Tecnologia (Baze)",    cartao:"pao",   portador:"Eduardo",  tipo:"fixo"},
      {desc:"Drogaria 12/12",             valor:37,   cat:"Saúde/Farmácia",       cartao:"pao",   portador:"Eduardo",  tipo:"fixo"},
      {desc:"Envio Mens.Automatica",      valor:8,    cat:"Serviços (Baze)",      cartao:"pao",   portador:"Eduardo",  tipo:"fixo"},
    ]
  },
  Abr: {
    total: 40319,
    black: 11803, azul: 21226, sant: 6595, pao: 694,
    lancamentos: [
      {desc:"Prudential D*APOL",          valor:2435, cat:"Seguros/Prev.",        cartao:"black", portador:"Angélica", tipo:"fixo"},
      {desc:"Demais Black",               valor:9368, cat:"Alimentação",          cartao:"black", portador:"Ambos",    tipo:"misto"},
      {desc:"Sta Monica Taquara 4/12",    valor:2155, cat:"Educação",             cartao:"azul",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Igreja Batista Atitude",     valor:2200, cat:"Doações/Igreja",       cartao:"azul",  portador:"Eduardo",  tipo:"misto"},
      {desc:"AZOS Seguros Eduardo",       valor:887,  cat:"Seguros/Prev.",        cartao:"azul",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Prudential (Azul)",          valor:486,  cat:"Seguros/Prev.",        cartao:"azul",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"AZOS Seguros Angélica",      valor:369,  cat:"Seguros/Prev.",        cartao:"azul",  portador:"Angélica", tipo:"fixo"},
      {desc:"RJ Pneus 4/10",             valor:409,  cat:"Transporte/Veículos",  cartao:"azul",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"AutoescolaLopes 4/5",        valor:244,  cat:"Educação",             cartao:"azul",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Netflix + Prime",            valor:178,  cat:"Lazer/Entretenimento", cartao:"azul",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Supermercados / Alimentação",valor:2500, cat:"Alimentação",          cartao:"azul",  portador:"Ambos",    tipo:"misto"},
      {desc:"Restaurantes",               valor:1600, cat:"Alimentação",          cartao:"azul",  portador:"Ambos",    tipo:"extra"},
      {desc:"Postos / Combustível",       valor:600,  cat:"Transporte/Veículos",  cartao:"azul",  portador:"Angélica", tipo:"misto"},
      {desc:"Centauro 1/2",               valor:423,  cat:"Lazer/Entretenimento", cartao:"azul",  portador:"Eduardo",  tipo:"extra"},
      {desc:"Uber/99",                    valor:350,  cat:"Transporte/Veículos",  cartao:"azul",  portador:"Eduardo",  tipo:"misto"},
      {desc:"Demais Azul",                valor:8825, cat:"Alimentação",          cartao:"azul",  portador:"Ambos",    tipo:"misto"},
      {desc:"Vindi *Splitc",              valor:2364, cat:"Serviços (Baze)",      cartao:"sant",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"SunCoast Operadora 8/10",    valor:1494, cat:"Serviços (Baze)",      cartao:"sant",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Pipefy Com",                 valor:430,  cat:"Tecnologia (Baze)",    cartao:"sant",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Bradesco AUT 6/10",          valor:307,  cat:"Seguros (Baze)",       cartao:"sant",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Claude AI Subscription",     valor:117,  cat:"Tecnologia (Baze)",    cartao:"sant",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Cakto Pay / Compras",        valor:698,  cat:"Compras Online",       cartao:"sant",  portador:"Eduardo",  tipo:"extra"},
      {desc:"BMB*Light",                  valor:339,  cat:"Serviços (Baze)",      cartao:"sant",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Facebook Ads",               valor:847,  cat:"Facebook/Mídia",       cartao:"sant",  portador:"Eduardo",  tipo:"extra"},
      {desc:"Google Workspace",           valor:588,  cat:"Tecnologia (Baze)",    cartao:"pao",   portador:"Eduardo",  tipo:"fixo"},
      {desc:"Zoom.com",                   valor:98,   cat:"Tecnologia (Baze)",    cartao:"pao",   portador:"Eduardo",  tipo:"fixo"},
      {desc:"Envio Mens.Automatica",      valor:8,    cat:"Serviços (Baze)",      cartao:"pao",   portador:"Eduardo",  tipo:"fixo"},
    ]
  },
  Mai: {
    total: 48026,
    black: 11189, azul: 29842, sant: 6256, pao: 739,
    lancamentos: [
      {desc:"Prudential D*APOL",          valor:1988, cat:"Seguros/Prev.",        cartao:"black", portador:"Angélica", tipo:"fixo"},
      {desc:"MundialAbelar",              valor:795,  cat:"Alimentação",          cartao:"black", portador:"Angélica", tipo:"misto"},
      {desc:"Demais Black",               valor:8406, cat:"Alimentação",          cartao:"black", portador:"Ambos",    tipo:"misto"},
      {desc:"Sta Monica Taquara 5/12",    valor:2155, cat:"Educação",             cartao:"azul",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Igreja Batista Atitude",     valor:5960, cat:"Doações/Igreja",       cartao:"azul",  portador:"Eduardo",  tipo:"misto"},
      {desc:"AZOS Seguros Eduardo",       valor:887,  cat:"Seguros/Prev.",        cartao:"azul",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Prudential (Azul)",          valor:486,  cat:"Seguros/Prev.",        cartao:"azul",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"AZOS Seguros Angélica",      valor:369,  cat:"Seguros/Prev.",        cartao:"azul",  portador:"Angélica", tipo:"fixo"},
      {desc:"RJ Pneus 5/10",             valor:409,  cat:"Transporte/Veículos",  cartao:"azul",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"AutoescolaLopes 5/5",        valor:244,  cat:"Educação",             cartao:"azul",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Netflix + Prime",            valor:178,  cat:"Lazer/Entretenimento", cartao:"azul",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Azul Linhas Aéreas",         valor:1200, cat:"Viagens",              cartao:"azul",  portador:"Eduardo",  tipo:"extra"},
      {desc:"BT Barra Vogue 7/12",        valor:579,  cat:"Lazer/Entretenimento", cartao:"azul",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Supermercados / Alimentação",valor:2800, cat:"Alimentação",          cartao:"azul",  portador:"Ambos",    tipo:"misto"},
      {desc:"Restaurantes",               valor:2500, cat:"Alimentação",          cartao:"azul",  portador:"Ambos",    tipo:"extra"},
      {desc:"Postos / Combustível",       valor:600,  cat:"Transporte/Veículos",  cartao:"azul",  portador:"Angélica", tipo:"misto"},
      {desc:"Vestuário / Roupas",         valor:1200, cat:"Vestuário",            cartao:"azul",  portador:"Eduardo",  tipo:"extra"},
      {desc:"Uber/99",                    valor:430,  cat:"Transporte/Veículos",  cartao:"azul",  portador:"Eduardo",  tipo:"misto"},
      {desc:"Demais Azul",                valor:9805, cat:"Alimentação",          cartao:"azul",  portador:"Ambos",    tipo:"misto"},
      {desc:"Vindi *Splitc",              valor:2563, cat:"Serviços (Baze)",      cartao:"sant",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"SunCoast Operadora 9/10",    valor:1494, cat:"Serviços (Baze)",      cartao:"sant",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Pipefy Com",                 valor:413,  cat:"Tecnologia (Baze)",    cartao:"sant",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Bradesco AUT 7/10",          valor:307,  cat:"Seguros (Baze)",       cartao:"sant",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Claude AI Subscription",     valor:117,  cat:"Tecnologia (Baze)",    cartao:"sant",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Cakto Pay / Compras",        valor:698,  cat:"Compras Online",       cartao:"sant",  portador:"Eduardo",  tipo:"extra"},
      {desc:"ASAAS *GBPO",               valor:330,  cat:"Serviços (Baze)",      cartao:"sant",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Google Workspace",           valor:638,  cat:"Tecnologia (Baze)",    cartao:"pao",   portador:"Eduardo",  tipo:"fixo"},
      {desc:"Zoom.com",                   valor:93,   cat:"Tecnologia (Baze)",    cartao:"pao",   portador:"Eduardo",  tipo:"fixo"},
      {desc:"Envio Mens.Automatica",      valor:8,    cat:"Serviços (Baze)",      cartao:"pao",   portador:"Eduardo",  tipo:"fixo"},
    ]
  },
  Jun: {
    total: 43814,
    black: 8625, azul: 28970, sant: 5207, pao: 1012,
    lancamentos: [
      {desc:"Prudential D*APOL",          valor:1988, cat:"Seguros/Prev.",        cartao:"black", portador:"Angélica", tipo:"fixo"},
      {desc:"MundialAbelar",              valor:752,  cat:"Alimentação",          cartao:"black", portador:"Angélica", tipo:"misto"},
      {desc:"Demais Black",               valor:5885, cat:"Alimentação",          cartao:"black", portador:"Ambos",    tipo:"misto"},
      {desc:"Sta Monica Taquara 6/12",    valor:2155, cat:"Educação",             cartao:"azul",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Igreja Batista Atitude",     valor:3000, cat:"Doações/Igreja",       cartao:"azul",  portador:"Eduardo",  tipo:"misto"},
      {desc:"AZOS Seguros Eduardo",       valor:887,  cat:"Seguros/Prev.",        cartao:"azul",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Prudential (Azul)",          valor:486,  cat:"Seguros/Prev.",        cartao:"azul",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"AZOS Seguros Angélica",      valor:369,  cat:"Seguros/Prev.",        cartao:"azul",  portador:"Angélica", tipo:"fixo"},
      {desc:"Azul Linhas Aéreas",         valor:850,  cat:"Viagens",              cartao:"azul",  portador:"Eduardo",  tipo:"extra"},
      {desc:"Azulmmfkyw parcela",         valor:475,  cat:"Viagens",              cartao:"azul",  portador:"Eduardo",  tipo:"extra"},
      {desc:"BT Barra Vogue 8/12",        valor:579,  cat:"Lazer/Entretenimento", cartao:"azul",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Netflix + Prime",            valor:178,  cat:"Lazer/Entretenimento", cartao:"azul",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"RJ Pneus",                   valor:780,  cat:"Transporte/Veículos",  cartao:"azul",  portador:"Angélica", tipo:"extra"},
      {desc:"Uber/99",                    valor:520,  cat:"Transporte/Veículos",  cartao:"azul",  portador:"Eduardo",  tipo:"misto"},
      {desc:"Postos / Combustível",       valor:420,  cat:"Transporte/Veículos",  cartao:"azul",  portador:"Eduardo",  tipo:"misto"},
      {desc:"Vestuário diverso",          valor:1367, cat:"Vestuário",            cartao:"azul",  portador:"Eduardo",  tipo:"extra"},
      {desc:"Supermercados / Alimentação",valor:2700, cat:"Alimentação",          cartao:"azul",  portador:"Ambos",    tipo:"misto"},
      {desc:"Restaurantes / Alimentação", valor:2700, cat:"Alimentação",          cartao:"azul",  portador:"Ambos",    tipo:"extra"},
      {desc:"Demais Azul",                valor:9404, cat:"Alimentação",          cartao:"azul",  portador:"Ambos",    tipo:"misto"},
      {desc:"Vindi *Splitc",              valor:2399, cat:"Serviços (Baze)",      cartao:"sant",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"SunCoast Operadora 10/10",   valor:1494, cat:"Serviços (Baze)",      cartao:"sant",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Pipefy Com",                 valor:419,  cat:"Tecnologia (Baze)",    cartao:"sant",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Bradesco AUT 8/10",          valor:307,  cat:"Seguros (Baze)",       cartao:"sant",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Claude AI Subscription",     valor:115,  cat:"Tecnologia (Baze)",    cartao:"sant",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"ASAAS *GBPO",               valor:330,  cat:"Serviços (Baze)",      cartao:"sant",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"IOF Exterior",               valor:19,   cat:"⚠️ Encargos",         cartao:"sant",  portador:"Eduardo",  tipo:"extra"},
      {desc:"Google Workspace",           valor:588,  cat:"Tecnologia (Baze)",    cartao:"pao",   portador:"Eduardo",  tipo:"fixo"},
      {desc:"Zoom.com",                   valor:94,   cat:"Tecnologia (Baze)",    cartao:"pao",   portador:"Eduardo",  tipo:"fixo"},
      {desc:"McAfee",                     valor:60,   cat:"Tecnologia",           cartao:"pao",   portador:"Eduardo",  tipo:"fixo"},
      {desc:"MundialAbelar (Pao)",        valor:226,  cat:"Alimentação",          cartao:"pao",   portador:"Eduardo",  tipo:"misto"},
      {desc:"⚠️ Encargos atraso Pão",    valor:31,   cat:"⚠️ Encargos",         cartao:"pao",   portador:"Eduardo",  tipo:"extra"},
      {desc:"Envio Mens.Automatica",      valor:8,    cat:"Serviços (Baze)",      cartao:"pao",   portador:"Eduardo",  tipo:"fixo"},
    ]
  },
  Jul: {
    total: 32437,
    black: 6099, azul: 21348, sant: 4292, pao: 697,
    lancamentos: [
      {desc:"Prudential D*APOL",          valor:1489, cat:"Seguros/Prev.",        cartao:"black", portador:"Angélica", tipo:"fixo"},
      {desc:"MundialAbelar",              valor:895,  cat:"Alimentação",          cartao:"black", portador:"Angélica", tipo:"misto"},
      {desc:"Arezzo Barra 2/2",           valor:480,  cat:"Vestuário",            cartao:"black", portador:"Eduardo",  tipo:"extra"},
      {desc:"Apple.com/Bill",             valor:223,  cat:"Tecnologia",           cartao:"black", portador:"Angélica", tipo:"fixo"},
      {desc:"Demais Black",               valor:3012, cat:"Alimentação",          cartao:"black", portador:"Ambos",    tipo:"misto"},
      {desc:"Sta Monica Taquara 7/12",    valor:2155, cat:"Educação",             cartao:"azul",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Igreja Batista Atitude",     valor:2000, cat:"Doações/Igreja",       cartao:"azul",  portador:"Eduardo",  tipo:"misto"},
      {desc:"AZOS Seguros Eduardo",       valor:887,  cat:"Seguros/Prev.",        cartao:"azul",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Prudential (Azul)",          valor:486,  cat:"Seguros/Prev.",        cartao:"azul",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"AZOS Seguros Angélica",      valor:369,  cat:"Seguros/Prev.",        cartao:"azul",  portador:"Angélica", tipo:"fixo"},
      {desc:"BT Barra Vogue 9/12",        valor:579,  cat:"Lazer/Entretenimento", cartao:"azul",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Netflix + Prime",            valor:178,  cat:"Lazer/Entretenimento", cartao:"azul",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Azul Linhas Aéreas parcela", valor:475,  cat:"Viagens",              cartao:"azul",  portador:"Eduardo",  tipo:"extra"},
      {desc:"RJ Pneus 8/10",             valor:409,  cat:"Transporte/Veículos",  cartao:"azul",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Uber/99",                    valor:437,  cat:"Transporte/Veículos",  cartao:"azul",  portador:"Eduardo",  tipo:"misto"},
      {desc:"RJ Pneus Angélica",          valor:693,  cat:"Transporte/Veículos",  cartao:"azul",  portador:"Angélica", tipo:"extra"},
      {desc:"Posto Praia da Barra",       valor:325,  cat:"Transporte/Veículos",  cartao:"azul",  portador:"Eduardo",  tipo:"misto"},
      {desc:"Centauro 2/2",               valor:423,  cat:"Lazer/Entretenimento", cartao:"azul",  portador:"Eduardo",  tipo:"extra"},
      {desc:"Gracie Barra",               valor:309,  cat:"Lazer/Entretenimento", cartao:"azul",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Wink Metropolitano",         valor:307,  cat:"Lazer/Entretenimento", cartao:"azul",  portador:"Angélica", tipo:"fixo"},
      {desc:"Vestuário diverso",          valor:1479, cat:"Vestuário",            cartao:"azul",  portador:"Eduardo",  tipo:"extra"},
      {desc:"Supermercados / Alimentação",valor:2500, cat:"Alimentação",          cartao:"azul",  portador:"Ambos",    tipo:"misto"},
      {desc:"Restaurantes",               valor:1400, cat:"Alimentação",          cartao:"azul",  portador:"Ambos",    tipo:"extra"},
      {desc:"Apple.com Angélica",         valor:492,  cat:"Tecnologia",           cartao:"azul",  portador:"Angélica", tipo:"fixo"},
      {desc:"AutoEscola Lopes",           valor:244,  cat:"Educação",             cartao:"azul",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Demais Azul",                valor:2078, cat:"Alimentação",          cartao:"azul",  portador:"Ambos",    tipo:"misto"},
      {desc:"Vindi *Splitc",              valor:2399, cat:"Serviços (Baze)",      cartao:"sant",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Anthropic Claude Sub",       valor:506,  cat:"Tecnologia (Baze)",    cartao:"sant",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Pipefy Com",                 valor:433,  cat:"Tecnologia (Baze)",    cartao:"sant",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"ASAAS *GBPO",               valor:330,  cat:"Serviços (Baze)",      cartao:"sant",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"Bradesco AUT 9/10",          valor:307,  cat:"Seguros (Baze)",       cartao:"sant",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"ASAASIP*ROCO 6/6",          valor:125,  cat:"Serviços (Baze)",      cartao:"sant",  portador:"Eduardo",  tipo:"fixo"},
      {desc:"IOF + Encargos Santander",   valor:193,  cat:"⚠️ Encargos",         cartao:"sant",  portador:"Eduardo",  tipo:"extra"},
      {desc:"Google Workspace",           valor:588,  cat:"Tecnologia (Baze)",    cartao:"pao",   portador:"Eduardo",  tipo:"fixo"},
      {desc:"McAfee 2/3",                valor:60,   cat:"Tecnologia",           cartao:"pao",   portador:"Eduardo",  tipo:"fixo"},
      {desc:"⚠️ Encargos atraso Pão",    valor:37,   cat:"⚠️ Encargos",         cartao:"pao",   portador:"Eduardo",  tipo:"extra"},
      {desc:"Envio Mens.Automatica",      valor:8,    cat:"Serviços (Baze)",      cartao:"pao",   portador:"Eduardo",  tipo:"fixo"},
    ]
  }
};

const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul"];
const CARTAO_COR = {black:"#1B3A6B",azul:"#2563EB",sant:"#3B82F6",pao:"#93c5fd"};
const CARTAO_NOME = {black:"Black",azul:"Azul",sant:"Santander",pao:"Pão de Açúcar"};

// ─── UTILS ────────────────────────────────────────────────────────────────────
const R  = v => `R$\u00A0${Math.abs(v).toLocaleString("pt-BR",{minimumFractionDigits:0,maximumFractionDigits:0})}`;
const R2 = v => `R$\u00A0${Math.abs(v).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const Rk = v => v>=1000?`R$${(v/1000).toFixed(0)}k`:`R$${Math.round(v)}`;
const pct= (a,b) => b?((a-b)/b*100):0;

const Tip = ({active,payload,label}) => {
  if(!active||!payload?.length) return null;
  return(
    <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,padding:"10px 14px",fontSize:12,boxShadow:"0 2px 8px rgba(0,0,0,.1)"}}>
      {label&&<div style={{fontWeight:700,color:"#1e293b",marginBottom:4}}>{label}</div>}
      {payload.map((p,i)=>(
        <div key={i} style={{color:p.color||P.azul2,marginTop:2}}>
          {p.name}: {typeof p.value==="number"&&p.value>100?R(p.value):p.value}
        </div>
      ))}
    </div>
  );
};

// ─── CALCULAR FIXOS E EXTRAS POR MÊS ──────────────────────────────────────────
function calcMes(nome) {
  const d = MESES_DATA[nome];
  const lanc = d.lancamentos;
  const fixo = lanc.filter(l=>l.tipo==="fixo").reduce((a,l)=>a+l.valor,0);
  const misto = lanc.filter(l=>l.tipo==="misto").reduce((a,l)=>a+l.valor,0);
  const extra = lanc.filter(l=>l.tipo==="extra").reduce((a,l)=>a+l.valor,0);
  const byCat = {};
  lanc.forEach(l=>{ byCat[l.cat]=(byCat[l.cat]||0)+l.valor; });
  return { ...d, nome, fixo, misto, extra, byCat };
}

// série evolutiva
const SERIE = MESES.map(m => {
  const c = calcMes(m);
  const lanc = MESES_DATA[m].lancamentos;
  const baze    = Math.round(lanc.filter(isBaze).reduce((a,l)=>a+l.valor,0));
  const pessoal = Math.round(c.total - baze);
  return { mes:m, total:c.total, fixo:Math.round(c.fixo), misto:Math.round(c.misto), extra:Math.round(c.extra),
           black:c.black, azul:c.azul, sant:c.sant, pao:c.pao, baze, pessoal };
});

// análise comportamental
const COMPORTAMENTOS = [
  {icon:"⛪",titulo:"Igreja oscilante — pico em maio",
   desc:"Doações variaram de R$1.500 (jan) a R$5.960 (mai), sem padrão fixo. Pico de mai coincide com o maior mês consolidado do histórico (R$48k). Definir teto de R$2.500/mês evitaria R$12k em extrapolações nos 7 meses."},
  {icon:"👗",titulo:"Vestuário concentrado em momentos",
   desc:"Compras de roupa aparecem em picos (fev, mar, mai, jun, jul) com valores entre R$700 e R$1.479. Padrão sugere compras por impulso ou datas comemorativas, não reposição planejada. Total jan–jul estimado: R$7.800+."},
  {icon:"🍽️",titulo:"Alimentação fora de casa consistentemente alta",
   desc:"Restaurantes todo mês: R$1.400–R$2.500. Somados ao supermercado, alimentação consome ~30–35% do total mensal. Há sobreposição de canais (MundialAbelar, Picpay, restaurantes) sugerindo múltiplos fluxos de alimentação não consolidados."},
  {icon:"✈️",titulo:"Viagens geram compromissos futuros",
   desc:"Azul Linhas Aéreas aparece em mai e jun. Parcelas de viagem (Azulmmfkyw 6/10) ainda ativas. Viagens compradas parceladas aumentam o peso de parcelas futuras do Azul (ainda R$19.4k em jul)."},
  {icon:"⚠️",titulo:"Pão de Açúcar — atrasos recorrentes",
   desc:"Encargos por atraso em jun (R$31) e jul (R$37). Cartão com gasto baixo mas gerando juros desnecessários. Débito automático eliminaria o problema imediatamente."},
  {icon:"📉",titulo:"Black em queda estrutural — pico em março",
   desc:"R$13.192 em mar → R$6.099 em jul (-54%). Queda reflete redução de parcelamentos no Black (parcFut de R$2.803 → R$400). Tendência positiva e consistente."},
  {icon:"🏢",titulo:"Santander Baze — custos operacionais previsíveis",
   desc:"Vindi R$2.300–2.563 e SunCoast R$1.494 dominam o cartão corporativo. SunCoast encerrou em jun (10/10), reduzindo o Santander estruturalmente a partir de jul (R$4.292 vs R$6.595 no pico de abr)."},
  {icon:"📊",titulo:"Parcelas futuras do Azul em queda consistente",
   desc:"Caíram de R$41.650 (jan) para R$19.424 (jul) — redução de R$22.226 em 7 meses. Sem novas compras parceladas grandes, o compromisso mensal vai continuar caindo, liberando fluxo de caixa nos próximos meses."},
];

// ─── PARCELAS ENCERRADAS (jun–jul/26) ────────────────────────────────────────
const ENCERRADAS = [
  {desc:"SunCoastUSA Operadora 10/10", valor:1494, mes:"Jun/26", cat:"Serviços (Baze)"},
  {desc:"Arezzo / Vestuário 2/2",       valor:480,  mes:"Jul/26", cat:"Vestuário"},
  {desc:"Centauro Esportes 2/2",        valor:423,  mes:"Jul/26", cat:"Lazer"},
  {desc:"FS Barra da Tijuca 5/5",       valor:345,  mes:"Jul/26", cat:"Vestuário"},
  {desc:"AutoescolaLopes 5/5",          valor:244,  mes:"Jul/26", cat:"Educação"},
  {desc:"ASAASIP*ROCO 6/6",            valor:125,  mes:"Jul/26", cat:"Serviços (Baze)"},
];

// ─── PARCELAS AINDA ATIVAS (a partir de ago/26) ───────────────────────────────
const ATIVAS = [
  {desc:"Sta Monica Taquara",   cat:"Educação",        cartao:"azul",  valor:2155, restantes:5, termina:"Dez/26"},
  {desc:"BT Barra Vogue",       cat:"Lazer",           cartao:"azul",  valor:579,  restantes:3, termina:"Out/26"},
  {desc:"Azul Linhas (viagem)", cat:"Viagens",         cartao:"azul",  valor:475,  restantes:4, termina:"Nov/26"},
  {desc:"RJ Pneus Eduardo",     cat:"Transporte",      cartao:"azul",  valor:409,  restantes:2, termina:"Set/26"},
  {desc:"Bradesco AUT",         cat:"Seguros (Baze)",  cartao:"sant",  valor:307,  restantes:1, termina:"Ago/26"},
  {desc:"McAfee",               cat:"Tecnologia",      cartao:"pao",   valor:60,   restantes:1, termina:"Ago/26"},
];

// ─── PROJEÇÃO MENSAL AGO/26 → DEZ/26 ─────────────────────────────────────────
const PROJ_MESES = [
  {mes:"Ago/26", total:29800, saidas:["McAfee","Bradesco AUT"], libera:367},
  {mes:"Set/26", total:28500, saidas:["RJ Pneus Eduardo"],      libera:409},
  {mes:"Out/26", total:27800, saidas:["BT Barra Vogue"],        libera:579},
  {mes:"Nov/26", total:27200, saidas:["Azul Linhas viagem"],    libera:475},
  {mes:"Dez/26", total:29500, saidas:["Sta Monica Taquara"],    libera:2155},
];

// ─── SUGESTÕES PRÁTICAS ───────────────────────────────────────────────────────
const SUGESTOES = [
  {prioridade:1, urgencia:"🔴 AGORA",        cor:"#EF4444", bgCor:"#FEF2F2", tcCor:"#991B1B",
   titulo:"Débito automático — Pão de Açúcar",
   impacto:"Elimina R$37+/mês em juros desnecessários",
   economia_anual:444,
   como:"App Itaú > Cartão Pão de Açúcar > Débito automático > Vincular conta corrente. Leva 2 minutos.",
   resultado:"Zero encargos a partir do próximo ciclo."},
  {prioridade:2, urgencia:"🔴 ESTA SEMANA",  cor:"#EF4444", bgCor:"#FEF2F2", tcCor:"#991B1B",
   titulo:"Teto mensal para Igreja — R$2.500",
   impacto:"Maior extra variável: acumulou R$19.160 em 7 meses",
   economia_anual:7000,
   como:"Definir R$2.500/mês como teto fixo. Meses com eventos: planejamento prévio. Não impulsivo.",
   resultado:"Redução de R$7.160 nos 7 meses vs ritmo atual. ~R$7.000/ano de diferença."},
  {prioridade:3, urgencia:"🟡 ESTE MÊS",     cor:"#F59E0B", bgCor:"#FFFBEB", tcCor:"#92400E",
   titulo:"Investigar e renegociar Vindi *Splitc",
   impacto:"R$2.399/mês = R$28.788/ano — maior custo fixo da Baze",
   economia_anual:3600,
   como:"Identificar qual sistema usa o Vindi no Santander. Verificar se há plano anual (-15%) ou substituto.",
   resultado:"Desconto de 15% = R$3.600/ano economizados."},
  {prioridade:4, urgencia:"🟡 ESTE MÊS",     cor:"#F59E0B", bgCor:"#FFFBEB", tcCor:"#92400E",
   titulo:"Revisão dos seguros Prudential",
   impacto:"R$12.375 em 7 meses sem análise recente de cobertura",
   economia_anual:3000,
   como:"Solicitar comparativo de mercado via Baze Segs. Checar sobreposição com AZOS. Verificar cobertura real.",
   resultado:"Redução de 20–25% na apólice = R$2.500–3.000/ano."},
  {prioridade:5, urgencia:"🟡 30 DIAS",      cor:"#F59E0B", bgCor:"#FFFBEB", tcCor:"#92400E",
   titulo:"Consolidar alimentação em menos canais",
   impacto:"4+ canais simultâneos: supermercado, restaurante, Picpay, MundialAbelar",
   economia_anual:4800,
   como:"Limite semanal: supermercado R$1.500, restaurante R$400. Reduzir uso do MundialAbelar como canal.",
   resultado:"Redução de 10–15% na categoria = R$4.800–7.200/ano."},
  {prioridade:6, urgencia:"🟢 TRIMESTRE",    cor:"#10B981", bgCor:"#F0FDF4", tcCor:"#166534",
   titulo:"Zero novos parcelamentos longos no Azul",
   impacto:"Parcelas futuras caindo R$41.6k→R$19.4k — não reverter",
   economia_anual:0,
   como:"Regra: compras acima de R$500 no Azul: à vista ou máx. 3x. Parcelamentos 6x+ só com decisão deliberada.",
   resultado:"Parcelas futuras chegam a R$0 em mar/27 sem novos parcelamentos."},
  {prioridade:7, urgencia:"🟢 TRIMESTRE",    cor:"#10B981", bgCor:"#F0FDF4", tcCor:"#166534",
   titulo:"Negociar renovação escolar à vista",
   impacto:"Sta Monica encerra dez/26 — decisão em nov/26",
   economia_anual:2500,
   como:"Decidir em novembro. Se renovar: negociar desconto à vista ou semestral (8–12% de desconto típico).",
   resultado:"Desconto à vista de anuidade: R$2.500–3.000 vs pagamento mensal."},
  {prioridade:8, urgencia:"🟢 TRIMESTRE",    cor:"#10B981", bgCor:"#F0FDF4", tcCor:"#166534",
   titulo:"Orçamento trimestral para vestuário",
   impacto:"Vestuário em 5/7 meses sem controle — total R$7.800+",
   economia_anual:2400,
   como:"R$1.500/trimestre (R$500/mês). Concentrar em trocas de estação. Evitar parcelas de roupas no Black.",
   resultado:"Redução de ~30% na categoria = R$2.400/ano."},
];

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [mesSel, setMesSel] = useState("Jul");
  const [aba, setAba] = useState("evolucao");

  const mesData = useMemo(()=>calcMes(mesSel),[mesSel]);
  const mesAnterior = MESES[MESES.indexOf(mesSel)-1];
  const mesAntData  = mesAnterior ? calcMes(mesAnterior) : null;

  const byCatArr = Object.entries(mesData.byCat)
    .map(([n,v])=>({name:n,value:Math.round(v)}))
    .sort((a,b)=>b.value-a.value);

  const fixoPct = Math.round(mesData.fixo/mesData.total*100);
  const mistoPct = Math.round(mesData.misto/mesData.total*100);
  const extraPct = Math.round(mesData.extra/mesData.total*100);

  const varTotal = mesAntData ? pct(mesData.total, mesAntData.total) : 0;
  const media = Math.round(SERIE.reduce((a,s)=>a+s.total,0)/7);

  const TAB = t => ({
    padding:"8px 18px", borderRadius:8, border:"none", cursor:"pointer", fontSize:13,
    fontWeight:aba===t?700:400, background:aba===t?P.azul:"#f1f5f9",
    color:aba===t?"#fff":P.slate, transition:"all .15s"
  });
  const MTAB = m => ({
    padding:"6px 14px", borderRadius:20, border:"none", cursor:"pointer", fontSize:12,
    fontWeight:mesSel===m?700:500,
    background:mesSel===m?P.azul2:"#f1f5f9",
    color:mesSel===m?"#fff":P.slate, transition:"all .1s"
  });

  return (
    <div style={{fontFamily:"'Inter',system-ui,sans-serif",maxWidth:980,margin:"0 auto",padding:"0 0 60px",color:"#1e293b",background:"#f8fafc",minHeight:"100vh"}} className="dash-root">

      {/* HEADER */}
      <div style={{background:`linear-gradient(135deg,#0f2a56 0%,#1B3A6B 50%,#2563EB 100%)`,padding:"18px 16px 16px",marginBottom:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
          <div>
            <div style={{color:"#93c5fd",fontSize:11,fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",marginBottom:6}}>
              Análise Financeira Pessoal · Baze Segs
            </div>
            <div style={{color:"#fff",fontSize:22,fontWeight:900,lineHeight:1.1}}>Jan → Jul 2026</div>
            <div style={{color:"#bfdbfe",fontSize:13,marginTop:6}}>Eduardo & Angélica · 4 cartões · 7 meses completos</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{color:"#93c5fd",fontSize:11,marginBottom:2}}>Total acumulado 7 meses</div>
            <div style={{color:"#fff",fontSize:26,fontWeight:900,lineHeight:1}}>{R(SERIE.reduce((a,s)=>a+s.total,0))}</div>
            <div style={{marginTop:6,display:"flex",gap:8,justifyContent:"flex-end",flexWrap:"wrap"}}>
              <span style={{background:"rgba(255,255,255,.12)",color:"#e2e8f0",borderRadius:20,padding:"3px 12px",fontSize:11,fontWeight:600}}>Média: {Rk(media)}/mês</span>
              <span style={{background:"#10B981",color:"#fff",borderRadius:20,padding:"3px 12px",fontSize:11,fontWeight:700}}>Melhor: Jul R$32.437</span>
              <span style={{background:"#EF4444",color:"#fff",borderRadius:20,padding:"3px 12px",fontSize:11,fontWeight:700}}>Pico: Mai R$48.026</span>
            </div>
          </div>
        </div>

        {/* ABAS PRINCIPAIS */}
        <div style={{display:"flex",gap:8,marginTop:18,flexWrap:"wrap"}}>
          {[["evolucao","📈 Evolução"],["mensal","📋 Mensal"],["fixoextra","🔵 Fixos × Extras"],["comportamento","🧠 Comportamental"],["parcelas","📉 Parcelas & Economia"]].map(([k,l])=>(
            <button key={k} style={{...TAB(k),background:aba===k?"rgba(255,255,255,.2)":"rgba(255,255,255,.08)",color:"#fff",fontWeight:aba===k?700:400,border:aba===k?"1.5px solid rgba(255,255,255,.5)":"1px solid rgba(255,255,255,.1)"}}
              onClick={()=>setAba(k)}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{padding:"12px 12px"}} className="dash-content">

      {/* ═══════════════ ABA EVOLUÇÃO ═══════════════ */}
      {aba==="evolucao"&&(
        <div>
          {/* KPIs RÁPIDOS */}
          <div style={{display:"flex",gap:8,marginBottom:20,overflowX:"auto",paddingBottom:4}}>
            {SERIE.map((s,i)=>{
              const prev = SERIE[i-1];
              const d = prev ? pct(s.total,prev.total) : null;
              return(
                <div key={s.mes} style={{background:"#fff",borderRadius:12,padding:"12px 10px",textAlign:"center",boxShadow:"0 1px 4px rgba(0,0,0,.06)",cursor:"pointer",border:`2px solid ${mesSel===s.mes?P.azul2:"transparent"}`,flexShrink:0,minWidth:80}}
                  onClick={()=>{setMesSel(s.mes);setAba("mensal");}}>
                  <div style={{fontSize:12,fontWeight:700,color:mesSel===s.mes?P.azul2:P.slate}}>{s.mes}</div>
                  <div style={{fontSize:15,fontWeight:900,color:"#0f172a",margin:"4px 0"}}>{Rk(s.total)}</div>
                  {d!==null&&<div style={{fontSize:10,fontWeight:700,color:d>0?P.verm:P.verde}}>{d>0?"▲":"▼"}{Math.abs(d).toFixed(0)}%</div>}
                </div>
              );
            })}
          </div>

          {/* GRÁFICO ÁREA TOTAL */}
          <div style={{background:"#fff",borderRadius:16,padding:"18px 20px",marginBottom:16,boxShadow:"0 1px 6px rgba(0,0,0,.06)"}}>
            <div style={{fontSize:14,fontWeight:700,color:"#374151",marginBottom:4}}>Total mensal consolidado</div>
            <div style={{fontSize:11,color:"#94a3b8",marginBottom:14}}>Linha azul = total · Linha tracejada = meta R$28k</div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={SERIE} margin={{top:4,right:8,bottom:0,left:0}}>
                <defs>
                  <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={P.azul2} stopOpacity={0.15}/>
                    <stop offset="95%" stopColor={P.azul2} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="mes" tick={{fontSize:12,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
                <YAxis tickFormatter={Rk} tick={{fontSize:10,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
                <Tooltip content={<Tip/>}/>
                <ReferenceLine y={28000} stroke={P.amber} strokeDasharray="5 3" label={{value:"Meta R$28k",fontSize:10,fill:P.amber,position:"right"}}/>
                <Area type="monotone" dataKey="total" name="Total" stroke={P.azul} strokeWidth={2.5} fill="url(#gradTotal)" dot={{r:4,fill:P.azul}}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* STACKED POR CARTÃO */}
          <div style={{background:"#fff",borderRadius:16,padding:"18px 20px",marginBottom:16,boxShadow:"0 1px 6px rgba(0,0,0,.06)"}}>
            <div style={{fontSize:14,fontWeight:700,color:"#374151",marginBottom:14}}>Evolução por cartão</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={SERIE} margin={{top:4,right:8,bottom:0,left:0}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="mes" tick={{fontSize:12,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
                <YAxis tickFormatter={Rk} tick={{fontSize:10,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
                <Tooltip content={<Tip/>}/>
                <Bar dataKey="black" name="Black"         stackId="a" fill="#1B3A6B"/>
                <Bar dataKey="azul"  name="Azul"          stackId="a" fill="#2563EB"/>
                <Bar dataKey="sant"  name="Santander"     stackId="a" fill="#60a5fa"/>
                <Bar dataKey="pao"   name="Pão de Açúcar" stackId="a" fill="#bfdbfe" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
            <div style={{display:"flex",gap:16,marginTop:8,flexWrap:"wrap"}}>
              {[["Black","#1B3A6B"],["Azul","#2563EB"],["Santander","#60a5fa"],["Pão de Açúcar","#bfdbfe"]].map(([l,c])=>(
                <span key={l} style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:"#64748b"}}>
                  <span style={{width:8,height:8,background:c,borderRadius:1,display:"inline-block"}}/>{l}
                </span>
              ))}
            </div>
          </div>

          {/* BAZE vs PESSOAL */}
          <div style={{background:"#fff",borderRadius:16,padding:"18px 20px",marginBottom:16,boxShadow:"0 1px 6px rgba(0,0,0,.06)"}}>
            <div style={{fontSize:14,fontWeight:700,color:"#374151",marginBottom:4}}>🏢 Baze Segs × 👨‍👩‍👧 Pessoal — evolução mensal</div>
            <div style={{fontSize:11,color:"#94a3b8",marginBottom:14}}>Baze = Serviços, Tecnologia, Seguros e Mídia da corretora · Pessoal = todos os demais gastos</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={SERIE} margin={{top:4,right:8,bottom:0,left:0}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="mes" tick={{fontSize:12,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
                <YAxis tickFormatter={Rk} tick={{fontSize:10,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
                <Tooltip content={<Tip/>}/>
                <Bar dataKey="baze"    name="🏢 Baze Segs" stackId="a" fill="#0EA5E9" radius={[0,0,0,0]}/>
                <Bar dataKey="pessoal" name="👨‍👩‍👧 Pessoal"   stackId="a" fill="#1B3A6B" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
            <div style={{display:"flex",gap:20,marginTop:10,flexWrap:"wrap"}}>
              {[["🏢 Baze Segs","#0EA5E9"],["👨‍👩‍👧 Pessoal","#1B3A6B"]].map(([l,c])=>(
                <span key={l} style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:"#64748b"}}>
                  <span style={{width:8,height:8,background:c,borderRadius:1,display:"inline-block"}}/>{l}
                </span>
              ))}
              <span style={{marginLeft:"auto",fontSize:11,color:"#64748b"}}>
                Baze acum: <strong style={{color:"#0EA5E9"}}>{R(SERIE.reduce((a,s)=>a+s.baze,0))}</strong>
                {" · "}Pessoal acum: <strong style={{color:"#1B3A6B"}}>{R(SERIE.reduce((a,s)=>a+s.pessoal,0))}</strong>
              </span>
            </div>
          </div>

          {/* FIXO vs EXTRA EVOLUÇÃO */}
          <div style={{background:"#fff",borderRadius:16,padding:"18px 20px",marginBottom:16,boxShadow:"0 1px 6px rgba(0,0,0,.06)"}}>
            <div style={{fontSize:14,fontWeight:700,color:"#374151",marginBottom:4}}>Fixos × Mistos × Extras — evolução</div>
            <div style={{fontSize:11,color:"#94a3b8",marginBottom:14}}>Fixo = recorrente/previsível · Misto = variável recorrente · Extra = pontual/impulsivo</div>
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={SERIE} margin={{top:4,right:8,bottom:0,left:0}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="mes" tick={{fontSize:12,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
                <YAxis tickFormatter={Rk} tick={{fontSize:10,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
                <Tooltip content={<Tip/>}/>
                <Bar dataKey="fixo"  name="Fixo"  stackId="a" fill={P.azul}/>
                <Bar dataKey="misto" name="Misto" stackId="a" fill={P.amber}/>
                <Bar dataKey="extra" name="Extra" stackId="a" fill={P.verm} radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
            <div style={{display:"flex",gap:16,marginTop:8}}>
              {[["Fixo",P.azul],["Misto",P.amber],["Extra",P.verm]].map(([l,c])=>(
                <span key={l} style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:"#64748b"}}>
                  <span style={{width:8,height:8,background:c,borderRadius:1,display:"inline-block"}}/>{l}
                </span>
              ))}
            </div>
          </div>

          {/* TABELA RESUMO */}
          <div style={{background:"#fff",borderRadius:16,padding:"16px 12px",boxShadow:"0 1px 6px rgba(0,0,0,.06)"}}>
            <div style={{fontSize:14,fontWeight:700,color:"#374151",marginBottom:14}}>Resumo jan–jul</div>
            <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead>
                <tr style={{borderBottom:"2px solid #f1f5f9"}}>
                  {["Mês","Total","🏢 Baze","👨‍👩‍👧 Pessoal","Black","Azul","Sant","Pão de Açúcar","Fixo","Extra","Var"].map(h=>(
                    <th key={h} style={{padding:"8px 6px",textAlign:h==="Mês"?"left":"right",color:"#64748b",fontSize:10,fontWeight:700}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SERIE.map((s,i)=>{
                  const prev = SERIE[i-1];
                  const d = prev ? pct(s.total,prev.total) : null;
                  const fd = calcMes(s.mes);
                  return(
                    <tr key={s.mes} style={{borderBottom:"1px solid #f8fafc",background:mesSel===s.mes?"#EFF6FF":"transparent",cursor:"pointer"}}
                      onClick={()=>{setMesSel(s.mes);setAba("mensal");}}>
                      <td style={{padding:"8px 6px",fontWeight:700,color:mesSel===s.mes?P.azul2:"#374151"}}>{s.mes}</td>
                      <td style={{padding:"8px 6px",textAlign:"right",fontWeight:800,color:"#0f172a"}}>{R(s.total)}</td>
                      <td style={{padding:"8px 6px",textAlign:"right",fontWeight:700,color:"#0EA5E9"}}>{Rk(s.baze)}</td>
                      <td style={{padding:"8px 6px",textAlign:"right",fontWeight:700,color:"#1B3A6B"}}>{Rk(s.pessoal)}</td>
                      <td style={{padding:"8px 6px",textAlign:"right",color:"#64748b"}}>{Rk(s.black)}</td>
                      <td style={{padding:"8px 6px",textAlign:"right",color:"#64748b"}}>{Rk(s.azul)}</td>
                      <td style={{padding:"8px 6px",textAlign:"right",color:"#64748b"}}>{Rk(s.sant)}</td>
                      <td style={{padding:"8px 6px",textAlign:"right",color:"#64748b"}}>{Rk(s.pao)}</td>
                      <td style={{padding:"8px 6px",textAlign:"right",color:P.azul}}>{Rk(fd.fixo)}</td>
                      <td style={{padding:"8px 6px",textAlign:"right",color:P.verm}}>{Rk(fd.extra)}</td>
                      <td style={{padding:"8px 6px",textAlign:"right"}}>
                        {d!==null&&<span style={{fontSize:11,fontWeight:700,color:d>0?P.verm:P.verde}}>{d>0?"▲":"▼"}{Math.abs(d).toFixed(0)}%</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{borderTop:"2px solid #e2e8f0",background:"#f8fafc"}}>
                  <td style={{padding:"10px 6px",fontWeight:800,fontSize:13}}>TOTAL</td>
                  <td style={{padding:"10px 6px",textAlign:"right",fontWeight:900,fontSize:13,color:P.azul}}>{R(SERIE.reduce((a,s)=>a+s.total,0))}</td>
                  {["black","azul","sant","pao"].map(k=>(
                    <td key={k} style={{padding:"10px 6px",textAlign:"right",fontWeight:700,color:"#374151"}}>{R(SERIE.reduce((a,s)=>a+s[k],0))}</td>
                  ))}
                  <td colSpan={3}/>
                </tr>
              </tfoot>
            </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ ABA MENSAL ═══════════════ */}
      {aba==="mensal"&&(
        <div>
          {/* SELETOR DE MÊS */}
          <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
            {MESES.map(m=>(
              <button key={m} style={MTAB(m)} onClick={()=>setMesSel(m)}>{m}/26</button>
            ))}
          </div>

          {/* HEADER MÊS */}
          <div style={{background:`linear-gradient(135deg,${P.azul} 0%,${P.azul2} 100%)`,borderRadius:16,padding:"14px 14px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
            <div>
              <div style={{color:"#93c5fd",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".1em"}}>{mesSel} / 2026</div>
              <div style={{color:"#fff",fontSize:28,fontWeight:900}}>{R2(mesData.total)}</div>
              {mesAntData&&<div style={{color:"#bfdbfe",fontSize:12,marginTop:4}}>
                vs {mesAnterior}: {varTotal>=0?"▲":"▼"}<span style={{color:varTotal>=0?"#fca5a5":"#86efac",fontWeight:700}}>{Math.abs(varTotal).toFixed(1)}%</span>
                {" "}({varTotal>=0?"+ ":"- "}{R(Math.abs(mesData.total-mesAntData.total))})
              </div>}
            </div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              {[["Fixo",mesData.fixo,P.azul2],["Misto",mesData.misto,P.amber],["Extra",mesData.extra,P.verm]].map(([l,v,c])=>(
                <div key={l} style={{background:"rgba(255,255,255,.12)",borderRadius:12,padding:"10px 16px",textAlign:"center"}}>
                  <div style={{color:"rgba(255,255,255,.7)",fontSize:10,fontWeight:600}}>{l}</div>
                  <div style={{color:"#fff",fontSize:16,fontWeight:800}}>{Rk(v)}</div>
                  <div style={{color:c==="#fff"?c:"rgba(255,255,255,.7)",fontSize:10}}>{Math.round(v/mesData.total*100)}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* BARRAS CARTÕES */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:16}}>
            {["black","azul","sant","pao"].map(k=>{
              const v=mesData[k];
              const prev=mesAntData?mesAntData[k]:null;
              const d=prev?pct(v,prev):null;
              return(
                <div key={k} style={{background:"#fff",borderRadius:12,padding:"14px 16px",boxShadow:"0 1px 4px rgba(0,0,0,.06)",borderLeft:`3px solid ${CARTAO_COR[k]}`}}>
                  <div style={{fontSize:11,color:"#64748b",fontWeight:600,marginBottom:3}}>{CARTAO_NOME[k]}</div>
                  <div style={{fontSize:20,fontWeight:900,color:CARTAO_COR[k]}}>{Rk(v)}</div>
                  {d!==null&&<div style={{fontSize:10,fontWeight:700,color:d>0?P.verm:P.verde,marginTop:3}}>{d>0?"▲":"▼"}{Math.abs(d).toFixed(0)}% vs {mesAnterior}</div>}
                </div>
              );
            })}
          </div>

          {/* BAZE vs PESSOAL — MÊS */}
          {(()=>{
            const lancM = mesData.lancamentos;
            const bazeM    = Math.round(lancM.filter(isBaze).reduce((a,l)=>a+l.valor,0));
            const pessoalM = Math.round(mesData.total - bazeM);
            const bazePct  = Math.round(bazeM/mesData.total*100);
            const pessPct  = 100-bazePct;
            const bazeItems = lancM.filter(isBaze).reduce((acc,l)=>{acc[l.desc]=(acc[l.desc]||0)+l.valor;return acc;},{});
            return(
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:10,marginBottom:16}}>
                <div style={{background:"#EFF6FF",borderRadius:14,padding:"14px 18px",border:"1px solid #BFDBFE"}}>
                  <div style={{fontSize:11,fontWeight:800,color:"#0EA5E9",marginBottom:6}}>🏢 Baze Segs — {mesSel}/26</div>
                  <div style={{fontSize:24,fontWeight:900,color:"#0f172a"}}>{R(bazeM)}</div>
                  <div style={{fontSize:10,color:"#64748b",marginTop:2,marginBottom:10}}>{bazePct}% do total do mês</div>
                  <div style={{background:"#DBEAFE",borderRadius:8,height:6,overflow:"hidden",marginBottom:10}}>
                    <div style={{width:`${bazePct}%`,height:"100%",background:"#0EA5E9",borderRadius:8}}/>
                  </div>
                  {Object.entries(bazeItems).sort((a,b)=>b[1]-a[1]).map(([d,v],i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:10.5,padding:"4px 0",borderBottom:"1px solid #DBEAFE",color:"#1e40af"}}>
                      <span>{d}</span><span style={{fontWeight:700}}>{R(v)}</span>
                    </div>
                  ))}
                </div>
                <div style={{background:"#f8fafc",borderRadius:14,padding:"14px 18px",border:"1px solid #e2e8f0"}}>
                  <div style={{fontSize:11,fontWeight:800,color:"#1B3A6B",marginBottom:6}}>👨‍👩‍👧 Pessoal/Familiar — {mesSel}/26</div>
                  <div style={{fontSize:24,fontWeight:900,color:"#0f172a"}}>{R(pessoalM)}</div>
                  <div style={{fontSize:10,color:"#64748b",marginTop:2,marginBottom:10}}>{pessPct}% do total do mês</div>
                  <div style={{background:"#e2e8f0",borderRadius:8,height:6,overflow:"hidden",marginBottom:10}}>
                    <div style={{width:`${pessPct}%`,height:"100%",background:"#1B3A6B",borderRadius:8}}/>
                  </div>
                  <div style={{fontSize:10,color:"#64748b",lineHeight:1.6}}>
                    Inclui: alimentação, seguros pessoais, educação, transporte, vestuário, lazer, viagens, saúde, doações e demais gastos de Eduardo & Angélica.
                  </div>
                </div>
              </div>
            );
          })()}

          {/* GRID CATEGORIA + PIE */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:14,marginBottom:16}}>
            <div style={{background:"#fff",borderRadius:16,padding:"16px 18px",boxShadow:"0 1px 6px rgba(0,0,0,.06)"}}>
              <div style={{fontSize:13,fontWeight:700,color:"#374151",marginBottom:14}}>Por categoria</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {byCatArr.slice(0,10).map((c,i)=>{
                  const pct2=Math.round(c.value/mesData.total*100);
                  const tipo=TIPO[c.name]||"extra";
                  return(
                    <div key={i}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:2,alignItems:"center"}}>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <span style={{width:8,height:8,borderRadius:2,background:CAT_COR[c.name]||"#94a3b8",flexShrink:0}}/>
                          <span style={{fontSize:11,color:"#374151",fontWeight:500}}>{c.name}</span>
                          <span style={{fontSize:9,padding:"1px 6px",borderRadius:10,fontWeight:600,
                            background:tipo==="fixo"?"#EFF6FF":tipo==="misto"?"#FFFBEB":"#FEF2F2",
                            color:tipo==="fixo"?P.azul:tipo==="misto"?P.amber:P.verm}}>{tipo}</span>
                        </div>
                        <span style={{fontSize:12,fontWeight:800,color:"#0f172a"}}>{R(c.value)}</span>
                      </div>
                      <div style={{background:"#f1f5f9",borderRadius:4,height:5,overflow:"hidden"}}>
                        <div style={{width:`${Math.min(pct2*3,100)}%`,height:"100%",background:CAT_COR[c.name]||"#94a3b8",borderRadius:4}}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{background:"#fff",borderRadius:16,padding:"16px 16px",boxShadow:"0 1px 6px rgba(0,0,0,.06)"}}>
              <div style={{fontSize:13,fontWeight:700,color:"#374151",marginBottom:10}}>Distribuição</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={byCatArr.slice(0,9)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                    label={({name,percent})=>percent>0.07?`${(percent*100).toFixed(0)}%`:""} labelLine={false}>
                    {byCatArr.slice(0,9).map((e,i)=><Cell key={i} fill={CAT_COR[e.name]||"#94a3b8"}/>)}
                  </Pie>
                  <Tooltip content={<Tip/>}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{marginTop:8,display:"flex",gap:"3px 10px",flexWrap:"wrap"}}>
                {byCatArr.slice(0,9).map((c,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:3,fontSize:9,color:"#475569"}}>
                    <span style={{width:6,height:6,borderRadius:1,background:CAT_COR[c.name]||"#94a3b8",flexShrink:0}}/>
                    {c.name}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* LANÇAMENTOS */}
          <div style={{background:"#fff",borderRadius:16,padding:"16px 18px",boxShadow:"0 1px 6px rgba(0,0,0,.06)"}}>
            <div style={{fontSize:13,fontWeight:700,color:"#374151",marginBottom:12}}>Todos os lançamentos — {mesSel}/26</div>
            <div style={{maxHeight:400,overflowY:"auto",overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                <thead>
                  <tr style={{background:"#f8fafc",position:"sticky",top:0}}>
                    {["Descrição","Cartão","Cat","Tipo","Portador","Valor"].map(h=>(
                      <th key={h} style={{padding:"7px 8px",textAlign:h==="Valor"?"right":"left",color:"#64748b",fontSize:10,fontWeight:700}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...mesData.lancamentos].sort((a,b)=>b.valor-a.valor).map((l,i)=>(
                    <tr key={i} style={{borderBottom:"1px solid #f1f5f9",background:i%2===0?"#fff":"#fafafa"}}>
                      <td style={{padding:"6px 8px",fontWeight:500,color:"#1e293b"}}>{l.desc}</td>
                      <td style={{padding:"6px 8px"}}>
                        <span style={{fontSize:9,fontWeight:700,color:CARTAO_COR[l.cartao]||"#64748b"}}>
                          {CARTAO_NOME[l.cartao]}
                        </span>
                      </td>
                      <td style={{padding:"6px 6px"}}>
                        <span style={{background:"#f1f5f9",color:"#475569",borderRadius:5,padding:"2px 5px",fontSize:9,whiteSpace:"nowrap"}}>{l.cat}</span>
                      </td>
                      <td style={{padding:"6px 6px"}}>
                        <span style={{fontSize:9,padding:"2px 6px",borderRadius:10,fontWeight:700,whiteSpace:"nowrap",
                          background:l.tipo==="fixo"?"#EFF6FF":l.tipo==="misto"?"#FFFBEB":"#FEF2F2",
                          color:l.tipo==="fixo"?P.azul:l.tipo==="misto"?P.amber:P.verm}}>
                          {l.tipo}
                        </span>
                      </td>
                      <td style={{padding:"6px 6px",color:"#64748b",fontSize:10}}>{l.portador}</td>
                      <td style={{padding:"6px 8px",fontWeight:800,textAlign:"right",
                        color:l.cat.includes("⚠️")?P.verm:P.azul}}>{R2(l.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ ABA FIXOS × EXTRAS ═══════════════ */}
      {aba==="fixoextra"&&(()=>{
        const POTENCIAL = [
          {cat:"Serviços (Baze)",    tipo:"fixo",  avg:3450, meta:2600, corte:850,  viavel:true,  como:"Renegociar Vindi plano anual (-15%) + SunCoast já encerrou"},
          {cat:"Seguros/Prev.",      tipo:"fixo",  avg:3142, meta:2400, corte:742,  viavel:true,  como:"Revisar Prudential — comparar mercado, checar sobreposição com AZOS"},
          {cat:"Seguros (Baze)",     tipo:"fixo",  avg:307,  meta:0,    corte:307,  viavel:true,  como:"Bradesco AUT encerra ago/26 — R$307 libera automaticamente"},
          {cat:"Educação",           tipo:"fixo",  avg:2250, meta:1800, corte:450,  viavel:true,  como:"Sta Monica encerra dez/26. Se renovar: negociar à vista (-10%)"},
          {cat:"Tecnologia (Baze)", tipo:"fixo",  avg:960,  meta:960,  corte:0,    viavel:false, como:"Google Workspace + Pipefy + Claude + Zoom — já otimizados"},
          {cat:"Tecnologia",         tipo:"fixo",  avg:280,  meta:200,  corte:80,   viavel:true,  como:"Apple Subs + McAfee: revisar duplicatas e cancelar o que não usa"},
          {cat:"Alimentação",        tipo:"misto", avg:14200,meta:10000,corte:4200, viavel:true,  como:"Limite semanal: supermercado R$1.500 + restaurante R$400. Consolidar canais"},
          {cat:"Doações/Igreja",     tipo:"misto", avg:2738, meta:2500, corte:238,  viavel:true,  como:"Teto fixo de R$2.500/mês — hoje oscila de R$1.500 a R$5.960"},
          {cat:"Transporte/Veículos",tipo:"misto", avg:2300, meta:1800, corte:500,  viavel:true,  como:"Reduzir Uber, RJ Pneus encerra set/26, consolidar manutenção"},
          {cat:"Saúde/Farmácia",     tipo:"misto", avg:420,  meta:350,  corte:70,   viavel:true,  como:"Farmácia com lista de necessidade, evitar compras por impulso"},
          {cat:"Vestuário",          tipo:"extra", avg:1114, meta:500,  corte:614,  viavel:true,  como:"Orçamento trimestral R$1.500 (R$500/mês). Sem parcelamentos no Black"},
          {cat:"Lazer/Entretenimento",tipo:"extra",avg:1200, meta:800,  corte:400,  viavel:true,  como:"BT Barra Vogue encerra out/26 (-R$579). Limitar lazer extra a R$200/mês"},
          {cat:"Viagens",            tipo:"extra", avg:490,  meta:200,  corte:290,  viavel:true,  como:"Parcelas encerram nov/26. Não parcelar novas viagens no Azul"},
          {cat:"Compras Online",     tipo:"extra", avg:342,  meta:150,  corte:192,  viavel:true,  como:"Cakto + avulsas: concentrar em datas planejadas, sem impulso"},
          {cat:"Facebook/Mídia",     tipo:"extra", avg:331,  meta:200,  corte:131,  viavel:true,  como:"Definir teto de R$200/mês e medir ROI por campanha"},
          {cat:"Encargos",           tipo:"extra", avg:47,   meta:0,    corte:47,   viavel:true,  como:"Débito automático no Pão de Açúcar elimina 100% deste custo"},
        ];
        const totalCorte = POTENCIAL.filter(p=>p.viavel).reduce((a,p)=>a+p.corte,0);
        const corFixo    = POTENCIAL.filter(p=>p.tipo==="fixo" &&p.viavel).reduce((a,p)=>a+p.corte,0);
        const corMisto   = POTENCIAL.filter(p=>p.tipo==="misto"&&p.viavel).reduce((a,p)=>a+p.corte,0);
        const corExtra   = POTENCIAL.filter(p=>p.tipo==="extra"&&p.viavel).reduce((a,p)=>a+p.corte,0);
        const mediaAtual = Math.round(SERIE.reduce((a,s)=>a+s.total,0)/7);
        const metaMes    = mediaAtual - totalCorte;
        const COR_TIPO   = {fixo:P.azul, misto:P.amber, extra:P.verm};
        const BG_TIPO    = {fixo:"#EFF6FF", misto:"#FFFBEB", extra:"#FEF2F2"};
        return(
          <div>
            {/* HEADER */}
            <div style={{background:"linear-gradient(135deg,#0f2a56 0%,#1B3A6B 60%,#2563EB 100%)",borderRadius:16,padding:"20px 26px",marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:16}}>
              <div>
                <div style={{color:"#93c5fd",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".1em",marginBottom:4}}>Potencial de Economia Real</div>
                <div style={{color:"#fff",fontSize:22,fontWeight:900}}>Baseado nos 7 meses de dados</div>
                <div style={{color:"#bfdbfe",fontSize:12,marginTop:4}}>Atual: {R(mediaAtual)}/mês → Com cortes: {R(metaMes)}/mês</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                {[["Corte/mês",totalCorte,"#86efac"],["Economia/ano",totalCorte*12,"#6ee7b7"],["Fixos",corFixo,"#93c5fd"],["Extras",corExtra,"#fca5a5"]].map(([l,v,c],i)=>(
                  <div key={i} style={{background:"rgba(255,255,255,.1)",borderRadius:12,padding:"10px 14px",textAlign:"center",border:"1px solid rgba(255,255,255,.15)"}}>
                    <div style={{color:"rgba(255,255,255,.65)",fontSize:9,fontWeight:700,textTransform:"uppercase",marginBottom:2}}>{l}</div>
                    <div style={{color:"#fff",fontSize:16,fontWeight:900}}>{R(v)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3 CARDS TIPO */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:20}}>
              {["fixo","misto","extra"].map(tipo=>{
                const cats=POTENCIAL.filter(p=>p.tipo===tipo);
                const avgT=cats.reduce((a,p)=>a+p.avg,0);
                const metaT=cats.reduce((a,p)=>a+p.meta,0);
                const corteT=cats.reduce((a,p)=>a+p.corte,0);
                const pctCorte=Math.round(corteT/avgT*100);
                const label=tipo==="fixo"?"🔵 Gastos Fixos":tipo==="misto"?"🟡 Gastos Mistos":"🔴 Gastos Extras";
                const desc=tipo==="fixo"?"Renegociação, cancelamento e revisão de apólices":tipo==="misto"?"Teto mensal, consolidação de canais e controle de variação":"Orçamentos trimestrais, eliminar impulso, encargos zero";
                const cor=COR_TIPO[tipo];
                return(
                  <div key={tipo} style={{background:"#fff",borderRadius:16,padding:"18px 20px",boxShadow:"0 1px 6px rgba(0,0,0,.06)",borderTop:`3px solid ${cor}`}}>
                    <div style={{fontSize:13,fontWeight:800,color:cor,marginBottom:4}}>{label}</div>
                    <div style={{fontSize:10.5,color:"#64748b",lineHeight:1.55,marginBottom:14}}>{desc}</div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <div style={{textAlign:"center"}}>
                        <div style={{fontSize:9,color:"#94a3b8",textTransform:"uppercase",marginBottom:2}}>Atual/mês</div>
                        <div style={{fontSize:17,fontWeight:900,color:"#374151"}}>{R(avgT)}</div>
                      </div>
                      <div style={{fontSize:18,color:"#e2e8f0"}}>→</div>
                      <div style={{textAlign:"center"}}>
                        <div style={{fontSize:9,color:"#94a3b8",textTransform:"uppercase",marginBottom:2}}>Meta/mês</div>
                        <div style={{fontSize:17,fontWeight:900,color:cor}}>{R(metaT)}</div>
                      </div>
                    </div>
                    <div style={{background:"#f1f5f9",borderRadius:6,height:7,overflow:"hidden",marginBottom:6}}>
                      <div style={{width:`${pctCorte}%`,height:"100%",background:cor,borderRadius:6}}/>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:10}}>
                      <span style={{color:"#64748b"}}>Corte possível: <strong style={{color:cor}}>{pctCorte}%</strong></span>
                      <span style={{color:cor,fontWeight:800}}>-{R(corteT)}/mês</span>
                    </div>
                    <div style={{padding:"8px 10px",background:`${cor}12`,borderRadius:8,fontSize:12,fontWeight:800,color:cor,textAlign:"center",border:`1px solid ${cor}30`}}>
                      Economia/ano: {R(corteT*12)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* TABELA DETALHADA */}
            <div style={{background:"#fff",borderRadius:16,padding:"18px 22px",marginBottom:16,boxShadow:"0 1px 6px rgba(0,0,0,.06)"}}>
              <div style={{fontSize:14,fontWeight:800,color:"#374151",marginBottom:14}}>Potencial de corte por categoria</div>
              {["fixo","misto","extra"].map(tipo=>{
                const cats=POTENCIAL.filter(p=>p.tipo===tipo);
                const avgT=cats.reduce((a,p)=>a+p.avg,0);
                const metaT=cats.reduce((a,p)=>a+p.meta,0);
                const corteT=cats.reduce((a,p)=>a+p.corte,0);
                const cor=COR_TIPO[tipo];
                const bg=BG_TIPO[tipo];
                const label=tipo==="fixo"?"🔵 FIXOS — renegociação / cancelamento":tipo==="misto"?"🟡 MISTOS — controle e teto mensal":"🔴 EXTRAS — orçamento e eliminação de impulso";
                return(
                  <div key={tipo} style={{marginBottom:20}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 14px",background:bg,borderRadius:10,marginBottom:8,border:`1px solid ${cor}33`}}>
                      <span style={{fontSize:12,fontWeight:800,color:cor}}>{label}</span>
                      <div style={{display:"flex",gap:20,fontSize:11}}>
                        <span style={{color:"#64748b"}}>Atual: <strong style={{color:"#374151"}}>{R(avgT)}/mês</strong></span>
                        <span>Meta: <strong style={{color:cor}}>{R(metaT)}/mês</strong></span>
                        <span style={{fontWeight:800,color:cor}}>Corte: <strong>-{R(corteT)}/mês · -{R(corteT*12)}/ano</strong></span>
                      </div>
                    </div>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                      <thead>
                        <tr style={{borderBottom:"1px solid #f1f5f9"}}>
                          {["Categoria","Média/mês","Meta/mês","Corte/mês","Corte/ano","Ação concreta",""].map((h,hi)=>(
                            <th key={hi} style={{padding:"6px 8px",textAlign:h==="Categoria"||h==="Ação concreta"||h===""?"left":"right",color:"#94a3b8",fontSize:9,fontWeight:700,textTransform:"uppercase"}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {cats.map((p,i)=>(
                          <tr key={i} style={{borderBottom:"1px solid #f8fafc",background:i%2===0?"#fff":"#fafafa"}}>
                            <td style={{padding:"8px 8px"}}>
                              <div style={{display:"flex",alignItems:"center",gap:6,fontWeight:700,color:"#1e293b"}}>
                                <span style={{width:7,height:7,borderRadius:2,background:CAT_COR[p.cat]||"#94a3b8",flexShrink:0}}/>
                                {p.cat}
                              </div>
                            </td>
                            <td style={{padding:"8px 8px",textAlign:"right",color:"#374151",fontWeight:600}}>{R(p.avg)}</td>
                            <td style={{padding:"8px 8px",textAlign:"right",color:cor,fontWeight:600}}>{R(p.meta)}</td>
                            <td style={{padding:"8px 8px",textAlign:"right",fontWeight:800,color:p.corte>0?cor:"#94a3b8"}}>
                              {p.corte>0?`-${R(p.corte)}`:"—"}
                            </td>
                            <td style={{padding:"8px 8px",textAlign:"right",fontWeight:700,color:p.corte>0?"#0f172a":"#94a3b8"}}>
                              {p.corte>0?R(p.corte*12):"—"}
                            </td>
                            <td style={{padding:"8px 8px",fontSize:10,color:"#475569"}}>{p.como}</td>
                            <td style={{padding:"8px 8px"}}>
                              <span style={{fontSize:10,fontWeight:700,color:p.viavel?P.verde:"#94a3b8"}}>{p.viavel?"✅":"➡️"}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{background:bg,borderTop:`2px solid ${cor}44`}}>
                          <td style={{padding:"8px 8px",fontWeight:800,color:cor,fontSize:12}}>Total {tipo}</td>
                          <td style={{padding:"8px 8px",textAlign:"right",fontWeight:800,color:"#374151"}}>{R(avgT)}</td>
                          <td style={{padding:"8px 8px",textAlign:"right",fontWeight:800,color:cor}}>{R(metaT)}</td>
                          <td style={{padding:"8px 8px",textAlign:"right",fontWeight:900,color:cor}}>-{R(corteT)}</td>
                          <td style={{padding:"8px 8px",textAlign:"right",fontWeight:900,color:"#0f172a"}}>{R(corteT*12)}</td>
                          <td colSpan={2}/>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                );
              })}
              {/* TOTAL GERAL */}
              <div style={{padding:"14px 18px",background:"linear-gradient(135deg,#EFF6FF,#F0FDF4)",borderRadius:12,border:"1px solid #BFDBFE",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
                {[["Total atual/mês",mediaAtual,"#374151"],["Meta/mês",metaMes,P.verde],["Redução mensal",totalCorte,P.verde],["Economia/ano",totalCorte*12,P.verde]].map(([l,v,c],i)=>(
                  <div key={i} style={{textAlign:"center"}}>
                    <div style={{fontSize:9,color:"#64748b",textTransform:"uppercase",fontWeight:700,marginBottom:3}}>{l}</div>
                    <div style={{fontSize:19,fontWeight:900,color:c}}>{R(v)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* WATERFALL */}
            <div style={{background:"#fff",borderRadius:16,padding:"18px 22px",boxShadow:"0 1px 6px rgba(0,0,0,.06)"}}>
              <div style={{fontSize:14,fontWeight:800,color:"#374151",marginBottom:4}}>Waterfall — de onde vem a economia</div>
              <div style={{fontSize:11,color:"#94a3b8",marginBottom:14}}>Contribuição de cada bloco de gasto para atingir a meta mensal</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  {nome:"Atual",v:mediaAtual},{nome:"- Fixos",v:corFixo},
                  {nome:"- Mistos",v:corMisto},{nome:"- Extras",v:corExtra},{nome:"Meta",v:metaMes},
                ]} margin={{top:4,right:8,bottom:0,left:0}}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                  <XAxis dataKey="nome" tick={{fontSize:11,fill:"#475569"}} axisLine={false} tickLine={false}/>
                  <YAxis tickFormatter={Rk} tick={{fontSize:10,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<Tip/>}/>
                  <Bar dataKey="v" name="Valor" radius={[4,4,0,0]}>
                    {["#94A3B8",P.azul,P.amber,P.verm,P.verde].map((c,i)=><Cell key={i} fill={c}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{display:"flex",gap:14,marginTop:10,flexWrap:"wrap",fontSize:10,color:"#64748b"}}>
                {[["Atual","#94A3B8"],["Redução Fixos",P.azul],["Redução Mistos",P.amber],["Redução Extras",P.verm],["Meta",P.verde]].map(([l,c])=>(
                  <span key={l} style={{display:"flex",alignItems:"center",gap:4}}>
                    <span style={{width:8,height:8,background:c,borderRadius:2,display:"inline-block"}}/>{l}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══════════════ ABA COMPORTAMENTAL ═══════════════ */}      {/* ═══════════════ ABA COMPORTAMENTAL ═══════════════ */}
      {aba==="comportamento"&&(
        <div>
          <div style={{background:"#fff",borderRadius:16,padding:"18px 22px",marginBottom:16,boxShadow:"0 1px 6px rgba(0,0,0,.06)"}}>
            <div style={{fontSize:14,fontWeight:700,color:"#374151",marginBottom:6}}>🧠 Análise comportamental de compra</div>
            <div style={{fontSize:12,color:"#64748b"}}>Padrões identificados com base em 7 meses de dados reais — jan a jul/2026</div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
            {COMPORTAMENTOS.map((c,i)=>(
              <div key={i} style={{background:"#fff",borderRadius:16,padding:"18px 20px",boxShadow:"0 1px 6px rgba(0,0,0,.06)"}}>
                <div style={{fontSize:22,marginBottom:8}}>{c.icon}</div>
                <div style={{fontSize:13,fontWeight:800,color:"#1e293b",marginBottom:8,lineHeight:1.3}}>{c.titulo}</div>
                <div style={{fontSize:11.5,color:"#475569",lineHeight:1.65}}>{c.desc}</div>
              </div>
            ))}
          </div>

          {/* GRÁFICOS DETALHADOS */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
            {/* Igreja por mês */}
            <div style={{background:"#fff",borderRadius:16,padding:"18px 20px",boxShadow:"0 1px 6px rgba(0,0,0,.06)"}}>
              <div style={{fontSize:13,fontWeight:700,color:"#374151",marginBottom:4}}>⛪ Igreja Batista Atitude</div>
              <div style={{fontSize:10,color:"#94a3b8",marginBottom:12}}>Doações mensais — alta variabilidade</div>
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={[
                  {mes:"Jan",v:1500},{mes:"Fev",v:2000},{mes:"Mar",v:2500},
                  {mes:"Abr",v:2200},{mes:"Mai",v:5960},{mes:"Jun",v:3000},{mes:"Jul",v:2000},
                ]} margin={{top:4,right:0,bottom:0,left:0}}>
                  <XAxis dataKey="mes" tick={{fontSize:9,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<Tip/>}/>
                  <ReferenceLine y={2500} stroke={P.amber} strokeDasharray="4 3" label={{value:"Teto sugerido",fontSize:8,fill:P.amber}}/>
                  <Bar dataKey="v" name="Igreja" fill="#6366F1" radius={[3,3,0,0]}>
                    {[1500,2000,2500,2200,5960,3000,2000].map((v,i)=>(
                      <Cell key={i} fill={v>2500?"#EF4444":"#6366F1"}/>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{marginTop:10,padding:"8px 12px",background:"#FEF2F2",borderRadius:8,fontSize:10.5,color:"#991B1B"}}>
                🔴 Acumulado: R$19.160 · Acima do teto R$2.500 em 4 de 7 meses
              </div>
            </div>
            {/* Prudential por mês */}
            <div style={{background:"#fff",borderRadius:16,padding:"18px 20px",boxShadow:"0 1px 6px rgba(0,0,0,.06)"}}>
              <div style={{fontSize:13,fontWeight:700,color:"#374151",marginBottom:4}}>🛡️ Prudential (seguros Angélica)</div>
              <div style={{fontSize:10,color:"#94a3b8",marginBottom:12}}>Valor variável — Black + Azul combinados</div>
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={[
                  {mes:"Jan",v:1325},{mes:"Fev",v:1325},{mes:"Mar",v:1825},
                  {mes:"Abr",v:2435},{mes:"Mai",v:1988},{mes:"Jun",v:1988},{mes:"Jul",v:1489},
                ]} margin={{top:4,right:0,bottom:0,left:0}}>
                  <XAxis dataKey="mes" tick={{fontSize:9,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<Tip/>}/>
                  <Bar dataKey="v" name="Prudential" fill={P.azul2} radius={[3,3,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
              <div style={{marginTop:10,padding:"8px 12px",background:"#EFF6FF",borderRadius:8,fontSize:10.5,color:"#1D4ED8"}}>
                💡 Acumulado jan–jul: ~R$12.375 · Revisar cobertura e valores com corretora
              </div>
            </div>
          </div>

          {/* INSIGHTS PRIORITÁRIOS */}
          <div style={{background:"#fff",borderRadius:16,padding:"18px 22px",boxShadow:"0 1px 6px rgba(0,0,0,.06)"}}>
            <div style={{fontSize:14,fontWeight:700,color:"#374151",marginBottom:14}}>🎯 Ações prioritárias baseadas nos dados</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {[
                {p:"🔴 URGENTE",bg:"#FEF2F2",bc:"#EF4444",tc:"#991B1B",
                  msg:"Incluir Itaú Pão de Açúcar no débito automático. R$68,10 desperdiçados em 2 meses de encargos desnecessários."},
                {p:"🔴 URGENTE",bg:"#FEF2F2",bc:"#EF4444",tc:"#991B1B",
                  msg:"Definir teto mensal para doações Igreja de R$2.500. Sem controle, acumulou R$19.160 em 7 meses (+R$7.160 vs teto)."},
                {p:"🟡 MÉDIO PRAZO",bg:"#FFFBEB",bc:"#F59E0B",tc:"#92400E",
                  msg:"Investigar Vindi *Splitc (R$2.399/mês). Maior gasto fixo da Baze Segs — confirmar necessidade e renegociar."},
                {p:"🟡 MÉDIO PRAZO",bg:"#FFFBEB",bc:"#F59E0B",tc:"#92400E",
                  msg:"Revisar seguros Prudential. R$12.375 em 7 meses. Cobertura proporcional ao custo? Comparar com mercado."},
                {p:"🟢 TENDÊNCIA BOA",bg:"#F0FDF4",bc:"#10B981",tc:"#166534",
                  msg:"Black em queda consistente (-54% mar→jul). Parcelas futuras Azul caindo R$41.6k→R$19.4k. Não fazer novos parcelamentos grandes no Azul."},
                {p:"🟢 TENDÊNCIA BOA",bg:"#F0FDF4",bc:"#10B981",tc:"#166534",
                  msg:"SunCoast encerrou em jun/26. Santander deve cair de R$5.200 para ~R$3.700 a partir de jul — confirmar no próximo mês."},
                {p:"📌 ATENÇÃO",bg:"#F8FAFC",bc:"#94A3B8",tc:"#475569",
                  msg:"Alimentação consome 30–35% do total. Supermercado + restaurante + Picpay + MundialAbelar = múltiplos fluxos. Consolidar em 1–2 canais."},
                {p:"📌 ATENÇÃO",bg:"#F8FAFC",bc:"#94A3B8",tc:"#475569",
                  msg:"Vestuário aparece em 5 de 7 meses. Total estimado jan–jul: R$7.800+. Definir orçamento trimestral de R$2.000–2.500 e controlar."},
              ].map((a,i)=>(
                <div key={i} style={{padding:"12px 14px",borderRadius:12,background:a.bg,borderLeft:`3px solid ${a.bc}`}}>
                  <div style={{fontSize:10,fontWeight:800,color:a.bc,marginBottom:5}}>{a.p}</div>
                  <div style={{fontSize:11.5,color:a.tc,lineHeight:1.5}}>{a.msg}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ ABA PARCELAS & ECONOMIA ═══════════════ */}
      {aba==="parcelas"&&(()=>{
        const totalEncerradas = ENCERRADAS.reduce((a,e)=>a+e.valor,0);
        const totalAtivas = ATIVAS.reduce((a,p)=>a+(p.valor*p.restantes),0);
        const totalEco = SUGESTOES.reduce((a,s)=>a+s.economia_anual,0);
        let acum = totalEncerradas;
        const projAcum = PROJ_MESES.map(p=>{ acum+=p.libera; return {...p,acum}; });
        const MAPA_IDX = {"Ago/26":0,"Set/26":1,"Out/26":2,"Nov/26":3,"Dez/26":4};
        const CAT_COR2 = {"Educação":"#84CC16","Lazer":"#EC4899","Viagens":"#F97316","Transporte":"#F59E0B","Seguros (Baze)":"#1D4ED8","Tecnologia":"#06B6D4","Serviços (Baze)":"#3B82F6","Vestuário":"#8B5CF6"};
        return(
        <div>
          {/* KPIs TOPO */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>
            {[
              {l:"✅ Liberado (Jun–Jul)",v:totalEncerradas,c:P.verde,sub:`${ENCERRADAS.length} parcelas encerradas · +${R(totalEncerradas)}/mês a partir de ago`},
              {l:"⏳ Ainda a pagar",v:totalAtivas,c:P.amber,sub:`${ATIVAS.length} parcelas ativas · encerram até dez/26`},
              {l:"💡 Economia potencial",v:totalEco,c:P.roxo,sub:"com as 8 ações práticas sugeridas / ano"},
            ].map(({l,v,c,sub},i)=>(
              <div key={i} style={{background:"#fff",borderRadius:16,padding:"18px 20px",boxShadow:"0 1px 6px rgba(0,0,0,.06)",borderTop:`3px solid ${c}`}}>
                <div style={{fontSize:11,fontWeight:700,color:c,marginBottom:4}}>{l}</div>
                <div style={{fontSize:26,fontWeight:900,color:"#0f172a"}}>{R(v)}</div>
                <div style={{fontSize:10,color:"#64748b",marginTop:4,lineHeight:1.5}}>{sub}</div>
              </div>
            ))}
          </div>

          {/* ENCERRADAS */}
          <div style={{background:"#fff",borderRadius:16,padding:"18px 22px",marginBottom:16,boxShadow:"0 1px 6px rgba(0,0,0,.06)",borderLeft:`4px solid ${P.verde}`}}>
            <div style={{fontSize:13,fontWeight:800,color:P.verde,marginBottom:12}}>✅ Parcelas encerradas em Jun–Jul/26 — caixa liberado a partir de Ago</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
              {ENCERRADAS.map((e,i)=>(
                <div key={i} style={{background:"#F0FDF4",borderRadius:12,padding:"12px 14px",border:"1px solid #BBF7D0"}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#166534"}}>{e.desc}</div>
                  <div style={{fontSize:9,color:"#4ADE80",marginTop:2,marginBottom:6}}>{e.mes} · {e.cat}</div>
                  <div style={{fontSize:19,fontWeight:900,color:P.verde}}>+{R(e.valor)}/mês</div>
                </div>
              ))}
            </div>
          </div>

          {/* TIMELINE ATIVAS */}
          <div style={{background:"#fff",borderRadius:16,padding:"18px 22px",marginBottom:16,boxShadow:"0 1px 6px rgba(0,0,0,.06)"}}>
            <div style={{fontSize:13,fontWeight:800,color:"#374151",marginBottom:4}}>🗓️ Parcelas ativas — quando cada uma encerra</div>
            <div style={{fontSize:10,color:"#94a3b8",marginBottom:14}}>Vermelho = último mês · Cinza = já encerrou</div>
            <div style={{overflowX:"auto"}}>
              <div style={{display:"grid",gridTemplateColumns:"190px repeat(5,1fr)",minWidth:700,gap:0}}>
                <div style={{padding:"6px 8px",fontSize:10,fontWeight:700,color:"#94a3b8",borderBottom:"1px solid #f1f5f9"}}></div>
                {["Ago/26","Set/26","Out/26","Nov/26","Dez/26"].map(m=>(
                  <div key={m} style={{padding:"6px 4px",fontSize:10,fontWeight:700,color:"#64748b",textAlign:"center",borderBottom:"1px solid #f1f5f9"}}>{m}</div>
                ))}
                {ATIVAS.map((p,i)=>{
                  const termIdx = MAPA_IDX[p.termina]??4;
                  const cor = CAT_COR2[p.cat]||P.muted;
                  return [
                    <div key={`n${i}`} style={{padding:"6px 8px",fontSize:11,fontWeight:600,color:"#374151",display:"flex",alignItems:"center",gap:6,borderBottom:"1px solid #f8fafc"}}>
                      <span style={{width:7,height:7,borderRadius:2,background:cor,flexShrink:0}}/>{p.desc}
                    </div>,
                    ...[0,1,2,3,4].map(idx=>{
                      const ativo=idx<=termIdx;
                      const ultimo=idx===termIdx;
                      return(
                        <div key={`c${i}_${idx}`} style={{padding:"5px 4px",borderBottom:"1px solid #f8fafc",display:"flex",alignItems:"center",justifyContent:"center"}}>
                          {ativo?(
                            <div style={{background:ultimo?"#FEF2F2":`${cor}18`,border:`1px solid ${ultimo?P.verm:cor}`,borderRadius:6,padding:"3px 4px",fontSize:9,fontWeight:700,color:ultimo?P.verm:cor,textAlign:"center",width:"95%"}}>
                              {R(p.valor)}{ultimo?" ✕":""}
                            </div>
                          ):(
                            <div style={{width:"80%",height:2,background:"#f1f5f9",borderRadius:2}}/>
                          )}
                        </div>
                      );
                    })
                  ];
                })}
                {/* LINHA SOMA — valor total liberado por mês */}
                <div style={{padding:"8px 10px",fontSize:10,fontWeight:800,color:P.verde,background:"#F0FDF4",borderTop:"2px solid #BBF7D0"}}>+ Liberado/mês</div>
                {[0,1,2,3,4].map(idx=>{
                  const soma=ATIVAS.filter(p=>(MAPA_IDX[p.termina]??4)===idx).reduce((a,p)=>a+p.valor,0);
                  return(
                    <div key={`soma${idx}`} style={{padding:"6px 4px",background:"#F0FDF4",borderTop:"2px solid #BBF7D0",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      {soma>0
                        ?<div style={{background:P.verde,borderRadius:8,padding:"5px 6px",fontSize:11,fontWeight:900,color:"#fff",textAlign:"center",width:"95%"}}>+{R(soma)}</div>
                        :<div style={{width:"80%",height:2,background:"#d1fae5",borderRadius:2}}/>
                      }
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{marginTop:14,padding:"10px 14px",background:"#FFFBEB",borderRadius:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:12,fontWeight:700,color:"#92400E"}}>Total ainda a pagar (todas ativas)</span>
              <span style={{fontSize:16,fontWeight:900,color:P.amber}}>{R(totalAtivas)}</span>
            </div>
          </div>

          {/* LIBERAÇÃO ACUMULADA + PROJEÇÃO */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}>
            <div style={{background:"#fff",borderRadius:16,padding:"18px 20px",boxShadow:"0 1px 6px rgba(0,0,0,.06)"}}>
              <div style={{fontSize:13,fontWeight:700,color:"#374151",marginBottom:4}}>Liberação acumulada de caixa</div>
              <div style={{fontSize:10,color:"#94a3b8",marginBottom:14}}>Soma do que encerra mês a mês (sem novos parcelamentos)</div>
              <ResponsiveContainer width="100%" height={200}>
                <ComposedChart data={projAcum} margin={{top:4,right:8,bottom:20,left:0}}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                  <XAxis dataKey="mes" tick={{fontSize:9,fill:"#94a3b8"}} angle={-20} textAnchor="end" axisLine={false} tickLine={false}/>
                  <YAxis tickFormatter={Rk} tick={{fontSize:9,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<Tip/>}/>
                  <Bar dataKey="libera" name="Libera/mês" fill={P.verde} radius={[3,3,0,0]} barSize={22}/>
                  <Line type="monotone" dataKey="acum" name="Acumulado" stroke={P.azul} strokeWidth={2} dot={{r:4,fill:P.azul}}/>
                </ComposedChart>
              </ResponsiveContainer>
              <div style={{marginTop:10,padding:"8px 14px",background:"#EFF6FF",borderRadius:10,display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:11,fontWeight:700,color:"#1D4ED8"}}>Total liberado até dez/26</span>
                <span style={{fontSize:15,fontWeight:900,color:P.azul}}>{R(projAcum[projAcum.length-1]?.acum||0)}</span>
              </div>
            </div>

            <div style={{background:"#fff",borderRadius:16,padding:"18px 20px",boxShadow:"0 1px 6px rgba(0,0,0,.06)"}}>
              <div style={{fontSize:13,fontWeight:700,color:"#374151",marginBottom:14}}>Projeção — Total mensal projetado</div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={[
                  {mes:"Jan",v:32837,proj:false},{mes:"Fev",v:35056,proj:false},{mes:"Mar",v:43874,proj:false},
                  {mes:"Abr",v:40319,proj:false},{mes:"Mai",v:48026,proj:false},{mes:"Jun",v:43814,proj:false},
                  {mes:"Jul",v:32437,proj:false},{mes:"Ago",v:29800,proj:true},{mes:"Set",v:28500,proj:true},
                  {mes:"Out",v:27800,proj:true},{mes:"Nov",v:27200,proj:true},{mes:"Dez",v:29500,proj:true},
                ]} margin={{top:4,right:8,bottom:0,left:0}}>
                  <defs>
                    <linearGradient id="gline" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={P.azul2} stopOpacity={0.12}/>
                      <stop offset="95%" stopColor={P.azul2} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                  <XAxis dataKey="mes" tick={{fontSize:9,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
                  <YAxis tickFormatter={Rk} tick={{fontSize:9,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<Tip/>}/>
                  <ReferenceLine y={28000} stroke={P.amber} strokeDasharray="5 3" label={{value:"Meta",fontSize:9,fill:P.amber,position:"right"}}/>
                  <ReferenceLine x="Jul" stroke="#94A3B8" strokeDasharray="4 3" label={{value:"Hoje",fontSize:8,fill:"#94a3b8",position:"top"}}/>
                  <Area type="monotone" dataKey="v" name="Total" stroke={P.azul2} strokeWidth={2.5} fill="url(#gline)"
                    dot={({cx,cy,payload})=><circle cx={cx} cy={cy} r={4} fill={payload.proj?P.verde:P.azul} stroke="#fff" strokeWidth={1.5}/>}/>
                </AreaChart>
              </ResponsiveContainer>
              <div style={{display:"flex",gap:14,marginTop:6,fontSize:10,color:"#64748b"}}>
                <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,borderRadius:"50%",background:P.azul,display:"inline-block"}}/> Real</span>
                <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,borderRadius:"50%",background:P.verde,display:"inline-block"}}/> Projeção</span>
              </div>
            </div>
          </div>

          {/* SUGESTÕES PRÁTICAS */}
          <div style={{background:"#fff",borderRadius:16,padding:"18px 22px",marginBottom:14,boxShadow:"0 1px 6px rgba(0,0,0,.06)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:10}}>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:"#374151"}}>💡 Ações práticas para atingir os objetivos</div>
                <div style={{fontSize:11,color:"#64748b",marginTop:2}}>8 sugestões ordenadas por prioridade · Economia potencial total: <strong style={{color:P.verde}}>{R(totalEco)}/ano</strong></div>
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {[["🔴",P.verm,"Urgente",2],["🟡",P.amber,"Este mês",3],["🟢",P.verde,"Trimestre",3]].map(([ic,c,l,n])=>(
                  <span key={l} style={{background:`${c}18`,color:c,fontSize:10,fontWeight:700,padding:"4px 10px",borderRadius:20,border:`1px solid ${c}44`}}>{ic} {l}: {n}</span>
                ))}
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {SUGESTOES.map((s,i)=>(
                <div key={i} style={{borderRadius:14,padding:"14px 18px",background:s.bgCor,borderLeft:`4px solid ${s.cor}`,display:"grid",gridTemplateColumns:"1fr auto",gap:16,alignItems:"start"}}>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                      <span style={{background:`${s.cor}22`,color:s.tcCor,fontSize:9,fontWeight:800,padding:"2px 8px",borderRadius:20,border:`1px solid ${s.cor}44`,textTransform:"uppercase"}}>
                        {s.urgencia}
                      </span>
                      <span style={{fontSize:10,color:"#94a3b8"}}>#{s.prioridade}</span>
                    </div>
                    <div style={{fontSize:13,fontWeight:800,color:"#1e293b",marginBottom:3}}>{s.titulo}</div>
                    <div style={{fontSize:10.5,color:"#64748b",fontStyle:"italic",marginBottom:8}}>{s.impacto}</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                      <div style={{background:"rgba(255,255,255,.7)",borderRadius:10,padding:"8px 10px"}}>
                        <div style={{fontSize:9,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".04em",marginBottom:4}}>Como fazer</div>
                        <div style={{fontSize:10.5,color:"#374151",lineHeight:1.6}}>{s.como}</div>
                      </div>
                      <div style={{background:"rgba(255,255,255,.7)",borderRadius:10,padding:"8px 10px"}}>
                        <div style={{fontSize:9,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".04em",marginBottom:4}}>Resultado esperado</div>
                        <div style={{fontSize:10.5,color:"#374151",lineHeight:1.6}}>{s.resultado}</div>
                      </div>
                    </div>
                  </div>
                  {s.economia_anual>0&&(
                    <div style={{background:"rgba(255,255,255,.8)",borderRadius:12,padding:"10px 14px",textAlign:"center",flexShrink:0,minWidth:90}}>
                      <div style={{fontSize:8,color:"#64748b",fontWeight:700,textTransform:"uppercase"}}>Economia/ano</div>
                      <div style={{fontSize:18,fontWeight:900,color:s.cor,lineHeight:1.2,marginTop:3}}>{R(s.economia_anual)}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        );
      })()}

      </div>

      <div style={{marginTop:8,fontSize:10,color:"#cbd5e1",textAlign:"center",paddingBottom:20}}>
        Baze Segs · Análise Financeira Pessoal · Jan–Jul 2026 · Eduardo & Angélica Clementino da Silva
      </div>
    </div>
  );
}
