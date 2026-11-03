/* ─────────────────────────────────────────────────────────
   深蓝档案 · interaction layer
   Public-source showcase. Formations are illustrative only.
   ───────────────────────────────────────────────────────── */

import { toggleMusic } from "./music.js";

(() => {
  "use strict";

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── data ─────────────────────────────────────────────── */
  const SHIPS = {
    liaoning: {
      code: "CV-16",
      name: "辽宁舰",
      en: "LIAONING",
      typeEn: "TYPE 001 · STOBAR",
      classLabel: "001 型航空母舰",
      roleShort: "编队核心",
      role: "编队核心 / 航空作战",
      art: "ship-carrier-ski",
      viewBox: "0 0 1200 360",
      specs: [
        ["满载排水量", "约 6.75 万吨"],
        ["舰长", "约 304 米"],
        ["起飞方式", "滑跃起飞"],
        ["入列时间", "2012.09"]
      ],
      airLabel: "典型舰载机构成 · 公开推测",
      airItems: ["歼-15", "歼-15D", "直-18", "直-9"],
      desc: "辽宁舰由中国从苏联未完工的“瓦良格”号船体续建改造而来，2012 年 9 月交付海军，实现中国航母从无到有。滑跃甲板、常规动力与歼-15 的组合，为中国海军培养了第一代航母舰员与舰载机飞行员。"
    },
    shandong: {
      code: "CV-17",
      name: "山东舰",
      en: "SHANDONG",
      typeEn: "TYPE 002 · STOBAR",
      classLabel: "002 型航空母舰",
      roleShort: "编队核心",
      role: "编队核心 / 航空作战",
      art: "ship-carrier-ski",
      viewBox: "0 0 1200 360",
      specs: [
        ["满载排水量", "约 7 万吨"],
        ["舰长", "约 315 米"],
        ["起飞方式", "滑跃起飞"],
        ["入列时间", "2019.12"]
      ],
      airLabel: "典型舰载机构成 · 公开推测",
      airItems: ["歼-15", "歼-15D", "直-18", "直-9"],
      desc: "山东舰是中国首艘完全自主设计建造的航空母舰，2019 年 12 月入列。它在辽宁舰经验基础上优化了舰体与航空保障设施，标志着中国具备自主建造中型航母的完整能力。"
    },
    fujian: {
      code: "CV-18",
      name: "福建舰",
      en: "FUJIAN",
      typeEn: "TYPE 003 · CATOBAR",
      classLabel: "003 型航空母舰",
      roleShort: "编队核心",
      role: "编队核心 / 电磁弹射",
      art: "ship-carrier-cat",
      viewBox: "0 0 1200 360",
      specs: [
        ["满载排水量", "8 万余吨"],
        ["舰长", "约 320 米"],
        ["起飞方式", "电磁弹射"],
        ["入列时间", "2025.11"]
      ],
      airLabel: "典型舰载机构成 · 公开推测",
      airItems: ["歼-35", "歼-15T", "空警-600", "直-20"],
      desc: "福建舰是中国首艘自主设计建造的电磁弹射型航空母舰，2022 年 6 月下水，2025 年 11 月入列。平直甲板与电磁弹射让固定翼预警机、隐身舰载机和更重的武器载荷成为可能，被视为中国航母技术的代际跨越。"
    },
    nanchang: {
      code: "DDG-101",
      name: "南昌舰",
      en: "NANCHANG",
      typeEn: "TYPE 055 · DDG",
      classLabel: "055 型驱逐舰",
      roleShort: "区域防空",
      role: "区域防空 / 编队指挥",
      art: "ship-055",
      viewBox: "0 0 360 100",
      specs: [
        ["满载排水量", "约 1.2 万吨"],
        ["舰长", "约 180 米"],
        ["垂直发射", "112 单元"],
        ["服役时间", "2020"]
      ],
      airLabel: "编队职责",
      airItems: ["区域防空", "编队指挥", "对陆打击", "反潜警戒"],
      desc: "055 型万吨大驱，是航母编队防空与指挥的重要节点。较大的垂发单元数量与双波段雷达配置，使其能够同时应对空中、水面与陆上目标，并为编队提供信息支撑。"
    },
    lasa: {
      code: "DDG-102",
      name: "拉萨舰",
      en: "LASA",
      typeEn: "TYPE 055 · DDG",
      classLabel: "055 型驱逐舰",
      roleShort: "区域防空",
      role: "区域防空 / 远程打击",
      art: "ship-055",
      viewBox: "0 0 360 100",
      specs: [
        ["满载排水量", "约 1.2 万吨"],
        ["舰长", "约 180 米"],
        ["垂直发射", "112 单元"],
        ["服役时间", "2021"]
      ],
      airLabel: "编队职责",
      airItems: ["区域防空", "远程反舰", "对陆打击", "编队护卫"],
      desc: "055 型驱逐舰的二号舰。与南昌舰共同构成编队的外层防空与远程打击核心，为航母撑开大范围的空中保护伞。"
    },
    wulumuqi: {
      code: "DDG-118",
      name: "乌鲁木齐舰",
      en: "URUMQI",
      typeEn: "TYPE 052D · DDG",
      classLabel: "052D 型驱逐舰",
      roleShort: "防空反潜",
      role: "防空 / 反潜 / 反舰",
      art: "ship-052d",
      viewBox: "0 0 340 94",
      specs: [
        ["满载排水量", "约 7500 吨"],
        ["舰长", "约 157 米"],
        ["垂直发射", "64 单元"],
        ["服役时间", "2018"]
      ],
      airLabel: "编队职责",
      airItems: ["区域防空", "反舰作战", "反潜警戒", "护航"],
      desc: "052D 型驱逐舰是航母编队中数量可观的多用途护航兵力。相控阵雷达与 64 单元通用垂发，使其能够承担防空、反舰与反潜等多种任务。"
    },
    chengdu: {
      code: "DDG-120",
      name: "成都舰",
      en: "CHENGDU",
      typeEn: "TYPE 052D · DDG",
      classLabel: "052D 型驱逐舰",
      roleShort: "防空反潜",
      role: "防空 / 反潜 / 反舰",
      art: "ship-052d",
      viewBox: "0 0 340 94",
      specs: [
        ["满载排水量", "约 7500 吨"],
        ["舰长", "约 157 米"],
        ["垂直发射", "64 单元"],
        ["服役时间", "2019"]
      ],
      airLabel: "编队职责",
      airItems: ["区域防空", "反舰作战", "反潜警戒", "护航"],
      desc: "052D 型驱逐舰，与乌鲁木齐舰共同补强编队中层防空与多任务能力，是航母外围警戒网的重要组成部分。"
    },
    linyi: {
      code: "FFG-547",
      name: "临沂舰",
      en: "LINYI",
      typeEn: "TYPE 054A · FFG",
      classLabel: "054A 型护卫舰",
      roleShort: "反潜护航",
      role: "反潜 / 护航 / 警戒",
      art: "ship-054a",
      viewBox: "0 0 300 82",
      specs: [
        ["满载排水量", "约 4000 吨"],
        ["舰长", "约 134 米"],
        ["垂直发射", "32 单元"],
        ["服役时间", "2012"]
      ],
      airLabel: "编队职责",
      airItems: ["近程防空", "反潜作战", "护航警戒", "海上搜救"],
      desc: "054A 型护卫舰，承担编队内层反潜与护航任务。较低的使用成本与成熟的多任务能力，使其成为远海编队中可靠的“勤务多面手”。"
    },
    weifang: {
      code: "FFG-550",
      name: "潍坊舰",
      en: "WEIFANG",
      typeEn: "TYPE 054A · FFG",
      classLabel: "054A 型护卫舰",
      roleShort: "反潜护航",
      role: "反潜 / 护航 / 警戒",
      art: "ship-054a",
      viewBox: "0 0 300 82",
      specs: [
        ["满载排水量", "约 4000 吨"],
        ["舰长", "约 134 米"],
        ["垂直发射", "32 单元"],
        ["服役时间", "2013"]
      ],
      airLabel: "编队职责",
      airItems: ["近程防空", "反潜作战", "护航警戒", "海上搜救"],
      desc: "054A 型护卫舰，与临沂舰一道编织编队近层反潜网，负责护航、警戒与应召支援。"
    },
    hulunhu: {
      code: "AOE-965",
      name: "呼伦湖舰",
      en: "HULUN LAKE",
      typeEn: "TYPE 901 · AOE",
      classLabel: "901 型综合补给舰",
      roleShort: "综合补给",
      role: "综合补给 / 伴随保障",
      art: "ship-901",
      viewBox: "0 0 440 110",
      specs: [
        ["满载排水量", "约 4.5 万吨"],
        ["舰长", "约 241 米"],
        ["补给方式", "横向 / 纵向"],
        ["服役时间", "2017"]
      ],
      airLabel: "编队职责",
      airItems: ["燃油补给", "弹药补给", "食品淡水", "装备保障"],
      desc: "901 型综合补给舰，被称为航母编队的“奶妈”。它让编队能够在远海持续行动，把航母的作战半径从单舰续航延伸到体系续航。"
    }
    ,
    nanning: {
      code: "DDG-162",
      name: "南宁舰",
      en: "NANNING",
      typeEn: "TYPE 052D · DDG",
      classLabel: "052D 型驱逐舰",
      roleShort: "防空反潜",
      role: "防空 / 反潜 / 反舰",
      art: "ship-052d",
      viewBox: "0 0 340 94",
      specs: [
        ["满载排水量", "约 7500 吨"],
        ["舰长", "约 157 米"],
        ["垂直发射", "64 单元"],
        ["服役时间", "2021"]
      ],
      airLabel: "编队职责",
      airItems: ["区域防空", "反舰作战", "反潜警戒", "护航"],
      desc: "052D 型驱逐舰，作为编队中层防空与多任务节点，承担区域防空、反舰与反潜警戒任务。"
    },
    dalian: {
      code: "DDG-105",
      name: "大连舰",
      en: "DALIAN",
      typeEn: "TYPE 055 · DDG",
      classLabel: "055 型驱逐舰",
      roleShort: "区域防空",
      role: "区域防空 / 远程打击",
      art: "ship-055",
      viewBox: "0 0 360 100",
      specs: [
        ["满载排水量", "约 1.2 万吨"],
        ["舰长", "约 180 米"],
        ["垂直发射", "112 单元"],
        ["服役时间", "2021"]
      ],
      airLabel: "编队职责",
      airItems: ["区域防空", "远程反舰", "对陆打击", "编队护卫"],
      desc: "055 型万吨大驱，与编队内其他防空舰共同构建外层防空网，并为远海行动提供远程打击能力。"
    },
    yanan: {
      code: "DDG-106",
      name: "延安舰",
      en: "YAN'AN",
      typeEn: "TYPE 055 · DDG",
      classLabel: "055 型驱逐舰",
      roleShort: "区域防空",
      role: "区域防空 / 编队护卫",
      art: "ship-055",
      viewBox: "0 0 360 100",
      specs: [
        ["满载排水量", "约 1.2 万吨"],
        ["舰长", "约 180 米"],
        ["垂直发射", "112 单元"],
        ["服役时间", "2022"]
      ],
      airLabel: "编队职责",
      airItems: ["区域防空", "远程反舰", "对陆打击", "编队护卫"],
      desc: "055 型万吨大驱，承担编队远程防空与多任务打击，是双航母编队中重要的水面护卫节点。"
    },
    luohe: {
      code: "FFG-545",
      name: "漯河舰",
      en: "LUOHE",
      typeEn: "TYPE 054B · FFG",
      classLabel: "054B 型护卫舰",
      roleShort: "反潜护航",
      role: "反潜 / 护航 / 警戒",
      art: "ship-054b",
      viewBox: "0 0 310 84",
      specs: [
        ["满载排水量", "约 5000 吨"],
        ["舰长", "约 147 米"],
        ["垂直发射", "32 单元"],
        ["服役时间", "2025"]
      ],
      airLabel: "编队职责",
      airItems: ["反潜作战", "近程防空", "护航警戒", "海上搜救"],
      desc: "054B 型护卫舰，采用更简洁的隐身外形与综合桅杆，承担编队内层反潜与护航任务。"
    },
    hainan: {
      code: "LHD-31",
      name: "海南舰",
      en: "HAINAN",
      typeEn: "TYPE 075 · LHD",
      classLabel: "075 型两栖攻击舰",
      roleShort: "两栖核心",
      role: "两栖投送 / 直升机作战",
      art: "ship-075",
      viewBox: "0 0 460 118",
      specs: [
        ["满载排水量", "约 4 万吨"],
        ["舰长", "约 237 米"],
        ["飞行甲板", "直通甲板"],
        ["服役时间", "2021"]
      ],
      airLabel: "编队职责",
      airItems: ["垂直登陆", "直升机突击", "两栖指挥", "医疗后送"],
      desc: "075 型两栖攻击舰，拥有直通飞行甲板与大型坞舱，为联合编队提供立体登陆、直升机作战与人道救援能力。"
    },
    changbaishan: {
      code: "LPD-989",
      name: "长白山舰",
      en: "CHANGBAISHAN",
      typeEn: "TYPE 071 · LPD",
      classLabel: "071 型综合登陆舰",
      roleShort: "船坞登陆",
      role: "两栖投送 / 船坞登陆",
      art: "ship-071",
      viewBox: "0 0 420 104",
      specs: [
        ["满载排水量", "约 2.5 万吨"],
        ["舰长", "约 210 米"],
        ["坞舱", "气垫艇 / 装甲车"],
        ["服役时间", "2012"]
      ],
      airLabel: "编队职责",
      airItems: ["船坞投送", "直升机运输", "装备输送", "两栖保障"],
      desc: "071 型综合登陆舰，可通过坞舱与飞行甲板投送登陆兵力、气垫艇和重型装备，是远海两栖编组的骨干。"
    },
    sub093: {
      code: "SSN-093",
      name: "093型核潜艇",
      en: "TYPE 093 · SSN",
      typeEn: "NUCLEAR ATTACK SUBMARINE",
      classLabel: "093 型攻击核潜艇",
      roleShort: "水下警戒",
      role: "反潜 / 水下护航 / 警戒",
      art: "sub-093",
      viewBox: "0 0 300 70",
      specs: [
        ["水下排水量", "约 7000 吨"],
        ["艇长", "约 110 米"],
        ["动力", "核动力"],
        ["服役时间", "2006+"]
      ],
      airLabel: "编队职责",
      airItems: ["水下警戒", "反潜作战", "编队护航", "情报侦察"],
      desc: "093 型攻击核潜艇，可在编队前方或侧翼执行水下警戒、反潜与情报侦察任务。公开资料有限，参数为估算值。"
    },
    sub094: {
      code: "SSBN-094",
      name: "094型核潜艇",
      en: "TYPE 094 · SSBN",
      typeEn: "NUCLEAR BALLISTIC SUBMARINE",
      classLabel: "094 型战略核潜艇",
      roleShort: "战略威慑",
      role: "战略威慑 / 远海存在",
      art: "sub-094",
      viewBox: "0 0 310 74",
      specs: [
        ["水下排水量", "约 1.1 万吨"],
        ["艇长", "约 135 米"],
        ["动力", "核动力"],
        ["服役时间", "2007+"]
      ],
      airLabel: "编队职责",
      airItems: ["战略威慑", "远海存在", "水下巡航", "二次核反击"],
      desc: "094 型战略核潜艇，是海基战略威慑力量的重要组成部分。将其放入编队沙盘仅用于展示多域编成，不代表真实任务编组。"
    }
  };

  const FORMATIONS = {
    liaoning: {
      no: "01",
      name: "辽宁舰编队",
      en: "LIAONING CSG",
      mode: "滑跃起飞",
      note: "北海方向 · 典型编成",
      primary: "liaoning",
      summary: "1 航母 · 2 055 · 2 052D · 2 054A · 1 901",
      ships: [
        { id: "liaoning", x: 500, y: 305, rot: -5 },
        { id: "nanchang", x: 320, y: 178, rot: -14 },
        { id: "lasa", x: 680, y: 178, rot: 14 },
        { id: "wulumuqi", x: 225, y: 345, rot: 4 },
        { id: "chengdu", x: 775, y: 345, rot: -4 },
        { id: "linyi", x: 375, y: 462, rot: 2 },
        { id: "weifang", x: 625, y: 462, rot: -2 },
        { id: "hulunhu", x: 500, y: 516, rot: 0 }
      ]
    },
    shandong: {
      no: "02",
      name: "山东舰编队",
      en: "SHANDONG CSG",
      mode: "远海部署",
      note: "南海方向 · 加强护航",
      primary: "shandong",
      summary: "1 航母 · 2 055 · 3 052D · 2 054A · 1 901",
      ships: [
        { id: "shandong", x: 500, y: 300, rot: -4 },
        { id: "nanchang", x: 300, y: 175, rot: -14 },
        { id: "lasa", x: 700, y: 175, rot: 14 },
        { id: "nanning", x: 500, y: 125, rot: 0 },
        { id: "wulumuqi", x: 215, y: 330, rot: 4 },
        { id: "chengdu", x: 785, y: 330, rot: -4 },
        { id: "linyi", x: 360, y: 470, rot: 2 },
        { id: "weifang", x: 640, y: 470, rot: -2 },
        { id: "hulunhu", x: 500, y: 520, rot: 0 }
      ]
    },
    fujian: {
      no: "03",
      name: "福建舰编队",
      en: "FUJIAN CSG",
      mode: "电磁弹射",
      note: "远海防卫 · 新型舰载机",
      primary: "fujian",
      summary: "1 航母 · 2 055 · 3 052D · 2 054A · 1 901",
      ships: [
        { id: "fujian", x: 500, y: 300, rot: -4 },
        { id: "nanchang", x: 295, y: 172, rot: -14 },
        { id: "lasa", x: 705, y: 172, rot: 14 },
        { id: "nanning", x: 500, y: 120, rot: 0 },
        { id: "wulumuqi", x: 210, y: 330, rot: 4 },
        { id: "chengdu", x: 790, y: 330, rot: -4 },
        { id: "linyi", x: 365, y: 472, rot: 2 },
        { id: "weifang", x: 635, y: 472, rot: -2 },
        { id: "hulunhu", x: 500, y: 522, rot: 0 }
      ]
    },
    dual: {
      no: "04",
      name: "双航母联合编队",
      en: "DUAL CARRIER GROUP",
      mode: "多域联合",
      note: "参考模型布局 · 非真实部署",
      primary: "fujian",
      summary: "2 航母 · 4 055 · 2 052D · 1 054A · 1 054B · 1 075 · 1 071 · 2 潜艇 · 1 901",
      ships: [
        { id: "fujian", x: 500, y: 210, rot: -3 },
        { id: "shandong", x: 500, y: 405, rot: 3 },
        { id: "nanchang", x: 295, y: 145, rot: -12 },
        { id: "lasa", x: 705, y: 145, rot: 12 },
        { id: "dalian", x: 230, y: 300, rot: -2 },
        { id: "yanan", x: 770, y: 300, rot: 2 },
        { id: "wulumuqi", x: 385, y: 112, rot: 0 },
        { id: "chengdu", x: 615, y: 500, rot: 0 },
        { id: "linyi", x: 340, y: 482, rot: 2 },
        { id: "luohe", x: 800, y: 482, rot: -2 },
        { id: "hainan", x: 785, y: 205, rot: 0 },
        { id: "changbaishan", x: 790, y: 365, rot: 0 },
        { id: "hulunhu", x: 500, y: 546, rot: 0 },
        { id: "sub093", x: 165, y: 215, rot: 1, labelAbove: true },
        { id: "sub094", x: 860, y: 248, rot: -1, labelAbove: true }
      ]
    }
  };

  const FORMATION_ORDER = ["liaoning", "shandong", "fujian", "dual"];

  const MAP_STYLE = {
    "ship-carrier-ski": { w: 216, h: 65, ring: 84, hit: 118, labelY: 53, typeY: 15, size: "lead" },
    "ship-carrier-cat": { w: 216, h: 65, ring: 84, hit: 118, labelY: 53, typeY: 15, size: "lead" },
    "ship-055": { w: 126, h: 35, ring: 42, hit: 56, labelY: 40, typeY: 12 },
    "ship-052d": { w: 108, h: 30, ring: 36, hit: 48, labelY: 36, typeY: 12 },
    "ship-054a": { w: 96, h: 26, ring: 33, hit: 46, labelY: 32, typeY: 12 },
    "ship-054b": { w: 100, h: 28, ring: 34, hit: 46, labelY: 33, typeY: 12 },
    "ship-901": { w: 148, h: 38, ring: 48, hit: 62, labelY: 47, typeY: 12 },
    "ship-075": { w: 132, h: 34, ring: 42, hit: 58, labelY: 40, typeY: 12 },
    "ship-071": { w: 120, h: 32, ring: 40, hit: 56, labelY: 38, typeY: 12 },
    "sub-093": { w: 96, h: 22, ring: 28, hit: 40, labelY: -22, typeY: 12 },
    "sub-094": { w: 100, h: 24, ring: 30, hit: 42, labelY: -23, typeY: 12 }
  };

  let currentFormationKey = "liaoning";
  let currentOrder = FORMATIONS.liaoning.ships.map(ship => ship.id);

  const LAYOUT_KEY = "dsh.formation.layouts.v1";
  const MAP_BOUNDS = { minX: 45, maxX: 955, minY: 50, maxY: 572 };
  const DEFAULT_LAYOUTS = {};
  FORMATION_ORDER.forEach(key => {
    DEFAULT_LAYOUTS[key] = {};
    FORMATIONS[key].ships.forEach(entry => {
      DEFAULT_LAYOUTS[key][entry.id] = {
        x: entry.x, y: entry.y, rot: entry.rot, labelAbove: !!entry.labelAbove
      };
    });
  });

  function clampMapX(value) {
    return Math.min(MAP_BOUNDS.maxX, Math.max(MAP_BOUNDS.minX, value));
  }
  function clampMapY(value) {
    return Math.min(MAP_BOUNDS.maxY, Math.max(MAP_BOUNDS.minY, value));
  }
  function normalizeHeading(value) {
    return ((value % 360) + 360) % 360;
  }
  function headingDistance(a, b) {
    const d = Math.abs(normalizeHeading(a) - normalizeHeading(b)) % 360;
    return Math.min(d, 360 - d);
  }

  function restoreSavedLayouts() {
    try {
      const saved = JSON.parse(window.localStorage.getItem(LAYOUT_KEY) || "{}");
      FORMATION_ORDER.forEach(key => {
        const savedFormation = saved[key];
        if (!savedFormation) return;
        FORMATIONS[key].ships.forEach(entry => {
          const point = savedFormation[entry.id];
          if (!point) return;
          if (Number.isFinite(point.x)) entry.x = clampMapX(point.x);
          if (Number.isFinite(point.y)) entry.y = clampMapY(point.y);
          if (Number.isFinite(point.rot)) entry.rot = normalizeHeading(point.rot);
        });
      });
    } catch {
      /* localStorage unavailable or corrupt */
    }
  }

  function saveLayouts() {
    try {
      const saved = {};
      FORMATION_ORDER.forEach(key => {
        saved[key] = {};
        FORMATIONS[key].ships.forEach(entry => {
          saved[key][entry.id] = {
            x: Math.round(entry.x * 10) / 10,
            y: Math.round(entry.y * 10) / 10,
            rot: Math.round(normalizeHeading(entry.rot || 0))
          };
        });
      });
      window.localStorage.setItem(LAYOUT_KEY, JSON.stringify(saved));
    } catch {
      /* ignore */
    }
  }

  function layoutIsCustom(key) {
    const defaults = DEFAULT_LAYOUTS[key];
    const formation = FORMATIONS[key];
    if (!defaults || !formation) return false;
    return formation.ships.some(entry => {
      const base = defaults[entry.id];
      return base && (
        Math.abs(entry.x - base.x) > .5 ||
        Math.abs(entry.y - base.y) > .5 ||
        headingDistance(entry.rot || 0, base.rot || 0) > .5
      );
    });
  }

  function updateLayoutState() {
    const custom = layoutIsCustom(currentFormationKey);
    if (layoutState) layoutState.hidden = !custom;
    if (resetFormation) resetFormation.hidden = !custom;
    if (formationNote && custom) {
      formationNote.textContent = `${FORMATIONS[currentFormationKey].note} · 自定义阵位`;
    } else if (formationNote) {
      formationNote.textContent = FORMATIONS[currentFormationKey].note;
    }
  }

  function resetCurrentLayout() {
    const defaults = DEFAULT_LAYOUTS[currentFormationKey];
    const formation = FORMATIONS[currentFormationKey];
    if (!defaults || !formation) return;
    formation.ships.forEach(entry => {
      const base = defaults[entry.id];
      if (!base) return;
      entry.x = base.x;
      entry.y = base.y;
      entry.rot = base.rot;
      entry.labelAbove = base.labelAbove;
    });
    saveLayouts();
    renderMapFormation(currentFormationKey);
    updateLayoutState();
    const keep = currentOrder.includes(selectedShip) ? selectedShip : formation.primary;
    updateSandboxFormation(currentFormationKey);
    selectShip(keep);
  }

  restoreSavedLayouts();

  /* ── clock & year ─────────────────────────────────────── */
  const clock = $("#clock");
  const timeFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  function updateClock() {
    const now = new Date();
    if (clock) {
      clock.innerHTML = `${timeFormatter.format(now)} <small>CST</small>`;
      clock.dateTime = now.toISOString();
    }
  }
  updateClock();
  window.setInterval(updateClock, 1000);

  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  const musicToggle = $("#musicToggle");
  if (musicToggle) {
    musicToggle.addEventListener("click", async () => {
      const on = musicToggle.getAttribute("aria-pressed") !== "true";
      const ok = await toggleMusic(on);
      if (!ok) return;
      musicToggle.setAttribute("aria-pressed", String(on));
      musicToggle.classList.toggle("is-playing", on);
      musicToggle.setAttribute("aria-label", on ? "暂停原创配乐《向海》" : "播放原创配乐《向海》");
    });
  }

  /* ── scroll chrome ────────────────────────────────────── */
  const header = $("#siteHeader");
  const progressBar = $("#progressBar");
  const navLinks = $$("[data-nav]");
  const sections = navLinks
    .map(link => document.getElementById(link.dataset.nav))
    .filter(Boolean);

  function updateScrollChrome() {
    const scrollTop = window.scrollY;
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const progress = height > 0 ? (scrollTop / height) * 100 : 0;
    if (progressBar) progressBar.style.width = `${Math.min(progress, 100)}%`;
    if (header) header.classList.toggle("is-scrolled", scrollTop > 28);

    let active = "";
    sections.forEach(section => {
      const top = section.offsetTop - 220;
      if (scrollTop >= top) active = section.id;
    });
    navLinks.forEach(link => {
      const isActive = link.dataset.nav === active;
      link.classList.toggle("is-active", isActive);
      if (isActive) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  let scrollTicking = false;
  window.addEventListener("scroll", () => {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(() => {
      updateScrollChrome();
      scrollTicking = false;
    });
  }, { passive: true });
  updateScrollChrome();

  /* ── mobile navigation ────────────────────────────────── */
  const menuToggle = $("#menuToggle");
  const siteNav = $("#siteNav");

  function setMenu(open) {
    document.body.classList.toggle("menu-open", open);
    if (menuToggle) {
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.setAttribute("aria-label", open ? "关闭导航" : "打开导航");
    }
  }

  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      setMenu(!document.body.classList.contains("menu-open"));
    });
  }
  if (siteNav) {
    $$("a", siteNav).forEach(link => link.addEventListener("click", () => setMenu(false)));
  }
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && document.body.classList.contains("menu-open")) setMenu(false);
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 900 && document.body.classList.contains("menu-open")) setMenu(false);
  });

  /* ── reveal on scroll ─────────────────────────────────── */
  const revealItems = $$(".reveal");
  if ("IntersectionObserver" in window && !reducedMotion) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealItems.forEach(item => revealObserver.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add("is-visible"));
  }

  /* ── hero counters ────────────────────────────────────── */
  function animateCount(element) {
    const target = Number(element.dataset.count || 0);
    if (reducedMotion || target === 0) {
      element.textContent = String(target);
      return;
    }
    const duration = 1500;
    const start = performance.now();
    function frame(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      element.textContent = String(Math.round(target * eased));
      if (t < 1) window.requestAnimationFrame(frame);
    }
    window.requestAnimationFrame(frame);
  }

  const counters = $$("[data-count]");
  if ("IntersectionObserver" in window) {
    const countObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        countObserver.unobserve(entry.target);
      });
    }, { threshold: 0.5 });
    counters.forEach(counter => countObserver.observe(counter));
  } else {
    counters.forEach(animateCount);
  }

  /* ── hero parallax ────────────────────────────────────── */
  const heroVisual = $("#heroVisual");
  const heroRadar = heroVisual ? $(".radar", heroVisual) : null;
  if (heroVisual && heroRadar && !reducedMotion && window.matchMedia("(pointer: fine)").matches) {
    heroVisual.addEventListener("pointermove", event => {
      const rect = heroVisual.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const offsetX = (x / rect.width - 0.5) * 12;
      const offsetY = (y / rect.height - 0.5) * 12;
      heroRadar.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    });
    heroVisual.addEventListener("pointerleave", () => {
      heroRadar.style.transform = "";
    });
  }

  /* ── formation panel ──────────────────────────────────── */
  const panel = $("#shipPanel");
  const panelCode = $("#panelCode");
  const panelRole = $("#panelRole");
  const panelArt = $("#panelArt");
  const panelName = $("#panelName");
  const panelEn = $("#panelEn");
  const panelDesc = $("#panelDesc");
  const panelSpecs = $("#panelSpecs");
  const panelTags = $("#panelTags");
  const panelIndex = $("#panelIndex");
  const panelOpen = $("#panelOpen");
  const mapHeading = $("#mapHeading");
  const mapHeadingLine = mapHeading?.querySelector(".map-heading-line");
  const mapHeadingKnob = mapHeading?.querySelector(".map-heading-knob");
  const mapHeadingHit = mapHeading?.querySelector(".map-heading-hit");
  const mapHeadingValue = mapHeading?.querySelector(".map-heading-value");
  const headingRange = $("#headingRange");
  const headingValue = $("#headingValue");
  const headingMinus = $("#headingMinus");
  const headingPlus = $("#headingPlus");
  const formationMap = $("#formationMap");
  const mapShipsLayer = $("#mapShipsLayer");
  const mapScroll = $("#mapScroll");
  const formationNote = $("#formationNote");
  const layoutState = $("#layoutState");
  const resetFormation = $("#resetFormation");
  const formationPresets = $$(".preset");
  const viewToggle = $("#viewToggle");
  const viewLabel = $("#viewLabel");
  let mapShips = [];
  let selectedShip = "liaoning";
  let currentView = "2d";
  let userSetView = false;
  let sandboxApi = null;
  let sandboxPromise = null;

  function updateSandboxFormation(key) {
    if (sandboxApi) sandboxApi.setFormation(key);
  }

  function updateSandboxSelection(id) {
    if (sandboxApi) sandboxApi.setSelected(id);
  }

  function updateSandboxShipPosition(id, x, y) {
    if (sandboxApi && sandboxApi.setShipPosition) sandboxApi.setShipPosition(id, x, y);
  }

  function handleSandboxMove(id, mapX, mapY) {
    const formation = FORMATIONS[currentFormationKey];
    if (!formation) return;
    const entry = formation.ships.find(ship => ship.id === id);
    if (!entry) return;
    entry.x = clampMapX(mapX);
    entry.y = clampMapY(mapY);
    const group = mapShips.find(ship => ship.dataset.ship === id);
    if (group) group.setAttribute("transform", `translate(${entry.x} ${entry.y})`);
    saveLayouts();
    updateLayoutState();
  }

  const sandboxEl = $("#sandbox");
  const sandboxCanvas = $("#sandboxCanvas");
  const sandboxLabels = $("#sandboxLabels");
  const sandboxLoader = $("#sandboxLoader");
  const sandboxFallback = $("#sandboxFallback");
  const orbitToggle = $("#orbitToggle");
  const orbitLabel = $("#orbitLabel");
  const autoRotateButton = $("#autoRotate");
  const resetView = $("#resetView");
  const mapHint = $("#mapHint");
  const mapLegend = $("#mapLegend");
  const sandboxStatus = $("#sandboxStatus");
  const mapWrap = $(".map-wrap");
  const formationShell = $(".formation-shell");

  function updateLegend() {
    if (!mapLegend) return;
    const f = FORMATIONS[currentFormationKey];
    const ships = f ? f.ships.map(entry => SHIPS[entry.id]).filter(Boolean) : [];
    const hasSub = ships.some(ship => ship.art.startsWith("sub-"));
    const hasAmphib = ships.some(ship => ship.art === "ship-075" || ship.art === "ship-071");
    let html = `<span><i class="lg-carrier"></i>航母</span><span><i class="lg-surface"></i>水面护航</span>`;
    if (hasAmphib) html += `<span><i class="lg-amphib"></i>两栖</span>`;
    if (hasSub) html += `<span><i class="lg-sub"></i>潜艇</span>`;
    if (!hasSub && !hasAmphib) html += `<span><i class="lg-supply"></i>综合补给</span>`;
    mapLegend.innerHTML = html;
  }

  function setOrbitState(on) {
    orbitToggle.dataset.rotating = String(on);
    orbitToggle.setAttribute("aria-label", on ? "暂停自动巡航" : "开启自动巡航");
    if (orbitLabel) orbitLabel.textContent = on ? "自动巡航" : "手动视角";
    if (autoRotateButton) {
      autoRotateButton.dataset.on = String(on);
      autoRotateButton.textContent = on ? "自动巡航" : "手动视角";
    }
    if (sandboxApi) sandboxApi.setAutoRotate(on);
  }

  async function ensureSandbox() {
    if (sandboxApi) {
      sandboxApi.setActive(true);
      return true;
    }
    if (sandboxPromise) return sandboxPromise;
    sandboxLoader.hidden = false;
    sandboxFallback.hidden = true;
    sandboxPromise = (async () => {
      let importTimer = 0;
      const importTimeout = new Promise((_, reject) => {
        importTimer = window.setTimeout(() => reject(new Error("三维模块加载超时")), 12000);
      });
      const mod = await Promise.race([import("./scene3d.js"), importTimeout]);
      window.clearTimeout(importTimer);
      const ok = mod.initSandbox({
        canvas: sandboxCanvas,
        container: sandboxEl,
        labels: sandboxLabels,
        ships: SHIPS,
        formations: FORMATIONS,
        onSelect: id => selectShip(id, "sandbox"),
        onMove: (id, x, y) => handleSandboxMove(id, x, y)
      });
      if (!ok) throw new Error("WebGL unavailable");
      sandboxApi = mod;
      mod.setFormation(currentFormationKey);
      mod.setSelected(selectedShip);
      mod.setActive(currentView === "3d");
      setOrbitState(!reducedMotion && window.innerWidth > 700);
      sandboxLoader.hidden = true;
      return true;
    })();
    try {
      return await sandboxPromise;
    } catch (error) {
      console.error("3D sandbox failed", error);
      sandboxLoader.hidden = true;
      if (sandboxFallback) sandboxFallback.hidden = false;
      sandboxPromise = null;
      return false;
    }
  }

  window.__sandboxDebug = () => ({
    currentView,
    hasPromise: !!sandboxPromise,
    hasApi: !!sandboxApi,
    loaderHidden: sandboxLoader?.hidden,
    fallbackHidden: sandboxFallback?.hidden,
    readyState: document.readyState
  });
  window.__ensureSandbox = ensureSandbox;

  function setView(view) {
    if (view !== "3d" && view !== "2d") return;
    currentView = view;
    const is3d = view === "3d";
    viewToggle.querySelectorAll("button").forEach(button => {
      const active = button.dataset.view === view;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    if (viewLabel) viewLabel.textContent = is3d ? "三维沙盘" : "二维阵位";
    mapScroll.hidden = is3d;
    sandboxEl.hidden = !is3d;
    mapWrap.classList.toggle("is-3d", is3d);
    formationShell?.classList.toggle("is-3d", is3d);
    if (is3d) mapHeading?.classList.add("is-hidden");
    else updateHeadingHandle();
    scanToggle.hidden = is3d;
    orbitToggle.hidden = !is3d;
    if (mapHint) {
      mapHint.innerHTML = is3d
        ? "ORBIT VIEW <span>/ 空白处拖拽旋转</span>"
        : "UNDERWAY <span>/ 航行中 · 拖拽舰艇调整阵位</span>";
    }
    updateLegend();
    if (is3d) {
      ensureSandbox();
    } else if (sandboxApi) {
      sandboxApi.setActive(false);
    }
  }

  if (viewToggle) {
    viewToggle.addEventListener("click", event => {
      const button = event.target.closest("button[data-view]");
      if (!button) return;
      userSetView = true;
      setView(button.dataset.view);
    });
  }
  if (orbitToggle) {
    orbitToggle.addEventListener("click", () => {
      setOrbitState(orbitToggle.dataset.rotating === "false");
    });
  }
  if (autoRotateButton) {
    autoRotateButton.addEventListener("click", () => {
      setOrbitState(autoRotateButton.dataset.on !== "true");
    });
  }
  if (resetView) {
    resetView.addEventListener("click", () => sandboxApi?.resetCamera());
  }
  if (sandboxFallback) {
    sandboxFallback.querySelector("#fallback2d")?.addEventListener("click", () => setView("2d"));
  }

  const default3dEligible = window.innerWidth >= 1024
    && !reducedMotion
    && !window.matchMedia("(pointer: coarse)").matches;
  if (default3dEligible && "IntersectionObserver" in window) {
    const formationObserver = new IntersectionObserver(entries => {
      if (userSetView) {
        formationObserver.disconnect();
        return;
      }
      if (entries.some(entry => entry.isIntersecting) && currentView === "2d") {
        formationObserver.disconnect();
        // 通过真实按钮事件切换，避免在观察器回调中直接初始化 WebGL 的竞态。
        window.setTimeout(() => {
          if (!userSetView && currentView === "2d") {
            document.querySelector('#viewToggle button[data-view="3d"]')?.click();
          }
        }, 220);
      }
    }, { threshold: .12 });
    const section = document.getElementById("formation");
    if (section) formationObserver.observe(section);
  }

  function mapStyleFor(ship) {
    return MAP_STYLE[ship.art] || MAP_STYLE["ship-055"];
  }

  function clientToMap(event) {
    if (!formationMap) return null;
    const point = formationMap.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const matrix = formationMap.getScreenCTM();
    if (!matrix) return null;
    return point.matrixTransform(matrix.inverse());
  }

  function startMapDrag(event, group) {
    if (mapDrag) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const id = group.dataset.ship;
    if (!id) return;
    const point = clientToMap(event);
    if (!point) return;
    mapDrag = {
      id,
      group,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      x: clampMapX(point.x),
      y: clampMapY(point.y)
    };
    selectShip(id);
    suppressMapClickUntil = Date.now() + 400;
    group.classList.add("is-dragging");
    try { group.setPointerCapture?.(event.pointerId); } catch { /* ignore */ }
    window.addEventListener("pointermove", moveMapDrag, { passive: false });
    window.addEventListener("pointerup", endMapDrag);
    window.addEventListener("pointercancel", endMapDrag);
    event.preventDefault();
  }

  function moveMapDrag(event) {
    if (!mapDrag || event.pointerId !== mapDrag.pointerId) return;
    if (!mapDrag.moved && Math.hypot(event.clientX - mapDrag.startX, event.clientY - mapDrag.startY) < 3) return;
    mapDrag.moved = true;
    const point = clientToMap(event);
    if (!point) return;
    const x = clampMapX(point.x);
    const y = clampMapY(point.y);
    mapDrag.x = x;
    mapDrag.y = y;
    mapDrag.group.setAttribute("transform", `translate(${x} ${y})`);
    const entry = FORMATIONS[currentFormationKey].ships.find(ship => ship.id === mapDrag.id);
    if (entry) {
      entry.x = x;
      entry.y = y;
    }
    if (mapDrag.id === selectedShip) updateHeadingHandle();
    event.preventDefault();
  }

  function endMapDrag(event) {
    if (!mapDrag) return;
    if (event.pointerId !== undefined && event.pointerId !== mapDrag.pointerId) return;
    const drag = mapDrag;
    mapDrag = null;
    window.removeEventListener("pointermove", moveMapDrag);
    window.removeEventListener("pointerup", endMapDrag);
    window.removeEventListener("pointercancel", endMapDrag);
    drag.group.classList.remove("is-dragging");
    try { drag.group.releasePointerCapture?.(drag.pointerId); } catch { /* ignore */ }
    suppressMapClickUntil = Date.now() + 300;
    if (drag.moved) {
      const entry = FORMATIONS[currentFormationKey].ships.find(ship => ship.id === drag.id);
      if (entry) {
        updateSandboxShipPosition(drag.id, entry.x, entry.y);
        updateHeadingHandle();
        saveLayouts();
        updateLayoutState();
      }
    }
  }

  function bindMapShips() {
    mapShips.forEach(group => {
      group.addEventListener("pointerdown", event => startMapDrag(event, group));
      group.addEventListener("click", () => {
        if (Date.now() < suppressMapClickUntil) return;
        selectShip(group.dataset.ship);
      });
      group.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectShip(group.dataset.ship);
        }
      });
    });
  }

  function renderMapFormation(key) {
    if (!formationMap || !mapShipsLayer) return;
    const formation = FORMATIONS[key];
    if (!formation) return;
    const ns = "http://www.w3.org/2000/svg";
    formationMap.classList.toggle("is-dense", formation.ships.length > 10);
    mapShipsLayer.innerHTML = "";
    formation.ships.forEach(entry => {
      const ship = SHIPS[entry.id];
      if (!ship) return;
      const style = mapStyleFor(ship);
      const dense = formation.ships.length > 10;
      const labelY = entry.labelAbove ? -(style.h / 2 + 34) : style.labelY;
      const group = document.createElementNS(ns, "g");
      group.setAttribute("class", "map-ship");
      group.dataset.ship = entry.id;
      group.setAttribute("transform", `translate(${entry.x} ${entry.y})`);
      group.setAttribute("tabindex", "0");
      group.setAttribute("role", "button");
      group.setAttribute("aria-label", `查看${ship.name}档案`);
      group.innerHTML = `
        <title>${ship.name} · ${ship.classLabel}</title>
        <circle class="ship-target" r="${style.hit}"></circle>
        <circle class="selection-ring" r="${style.ring}"></circle>
        <g class="ship-wake" transform="rotate(${entry.rot || 0})">
          <line x1="${-style.w / 2 - 7}" y1="0" x2="${-style.w / 2 - 42}" y2="0"></line>
        </g>
        <use href="#${ship.art}" x="${-style.w / 2}" y="${-style.h / 2}" width="${style.w}" height="${style.h}" transform="rotate(${entry.rot || 0})"></use>
        <g class="ship-label" transform="translate(0 ${labelY})">
          <text class="ship-name${style.size === "lead" ? " ship-name--lead" : ""}" y="0" text-anchor="middle">${ship.name}</text>
          <text class="ship-type" y="${style.typeY}" text-anchor="middle">${ship.code} · ${ship.roleShort}</text>
        </g>
      `;
      group.style.opacity = "0";
      mapShipsLayer.appendChild(group);
    });
    mapShips = $$(".map-ship", formationMap);
    bindMapShips();
    mapShips.forEach(group => { group.style.opacity = "1"; });
    if (!reducedMotion && mapShipsLayer.animate) {
      mapShipsLayer.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: "ease-out" });
      window.requestAnimationFrame(() => {
        mapShips.forEach((group, index) => {
          group.animate([{ opacity: 0 }, { opacity: 1 }], {
            duration: 380,
            delay: index * 22,
            easing: "ease-out",
            fill: "both"
          });
        });
      });
    }
  }

  function applyFormation(key, initial = false) {
    const formation = FORMATIONS[key];
    if (!formation) return;
    currentFormationKey = key;
    currentOrder = formation.ships.map(entry => entry.id);
    formationPresets.forEach(button => {
      const active = button.dataset.formation === key;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });
    renderMapFormation(key);
    updateLegend();
    if (formationNote) formationNote.textContent = formation.note;
    updateLayoutState();
    if (sandboxStatus) {
      const carriers = formation.ships.filter(entry => {
        const art = SHIPS[entry.id]?.art || "";
        return art.startsWith("ship-carrier");
      }).length;
      sandboxStatus.textContent = `${String(formation.ships.length).padStart(2, "0")} CONTACTS · ${carriers} CARRIER${carriers > 1 ? "S" : ""} · UNDERWAY`;
    }
    selectShip(formation.primary, "formation");
    window.requestAnimationFrame(() => {
      if (mapScroll && mapScroll.scrollWidth > mapScroll.clientWidth + 8) {
        const overflow = mapScroll.scrollWidth - mapScroll.clientWidth;
        mapScroll.scrollLeft = overflow / 2;
      }
      updateSandboxFormation(key);
    });
    if (!initial && currentView === "3d") {
      document.getElementById("sandbox")?.classList.add("is-loading");
    }
  }

  let mapDrag = null;
  let suppressMapClickUntil = 0;

  function ensureShipVisible(id) {
    if (mapDrag) return;
    if (!mapScroll || !formationMap) return;
    if (mapScroll.scrollWidth <= mapScroll.clientWidth + 8) return;
    const group = $(`.map-ship[data-ship="${id}"]`, formationMap);
    if (!group) return;
    const viewport = mapScroll.getBoundingClientRect();
    const ship = group.getBoundingClientRect();
    if (ship.left < viewport.left + 16 || ship.right > viewport.right - 16) {
      const target = mapScroll.scrollLeft + (ship.left - viewport.left) - (viewport.width - ship.width) / 2;
      mapScroll.scrollTo({ left: target, behavior: reducedMotion ? "auto" : "smooth" });
    }
  }

  function centerMap() {
    if (!mapScroll) return;
    const overflow = mapScroll.scrollWidth - mapScroll.clientWidth;
    if (overflow > 8) mapScroll.scrollLeft = overflow / 2;
  }

  function selectedEntry() {
    return FORMATIONS[currentFormationKey]?.ships.find(ship => ship.id === selectedShip) || null;
  }

  function syncHeadingUI(degrees) {
    const value = Math.round(normalizeHeading(degrees));
    if (headingRange) headingRange.value = String(value);
    if (headingValue) headingValue.textContent = `${String(value).padStart(3, "0")}°`;
  }

  function updateHeadingHandle() {
    if (!mapHeading) return;
    const entry = selectedEntry();
    if (!entry || currentView === "3d") {
      mapHeading.classList.add("is-hidden");
      return;
    }
    const ship = SHIPS[selectedShip];
    if (!ship) {
      mapHeading.classList.add("is-hidden");
      return;
    }
    const style = mapStyleFor(ship);
    const radius = Math.min(74, Math.max(42, style.ring + 12));
    const angle = normalizeHeading(entry.rot || 0);
    const rad = angle * Math.PI / 180;
    const x = Math.cos(rad) * radius;
    const y = Math.sin(rad) * radius;
    const labelX = Math.cos(rad) * (radius + 18);
    const labelY = Math.sin(rad) * (radius + 18);
    mapHeading.setAttribute("transform", `translate(${entry.x} ${entry.y})`);
    if (mapHeadingLine) {
      mapHeadingLine.setAttribute("x2", x.toFixed(2));
      mapHeadingLine.setAttribute("y2", y.toFixed(2));
    }
    if (mapHeadingKnob) {
      mapHeadingKnob.setAttribute("cx", x.toFixed(2));
      mapHeadingKnob.setAttribute("cy", y.toFixed(2));
    }
    if (mapHeadingHit) {
      mapHeadingHit.setAttribute("cx", x.toFixed(2));
      mapHeadingHit.setAttribute("cy", y.toFixed(2));
    }
    if (mapHeadingValue) {
      mapHeadingValue.setAttribute("x", labelX.toFixed(2));
      mapHeadingValue.setAttribute("y", labelY.toFixed(2));
      mapHeadingValue.textContent = `${String(Math.round(angle)).padStart(3, "0")}°`;
    }
    mapHeading.classList.remove("is-hidden");
  }

  function setShipRotation(id, degrees, commit = true) {
    const formation = FORMATIONS[currentFormationKey];
    const entry = formation?.ships.find(ship => ship.id === id);
    if (!entry) return;
    const angle = normalizeHeading(Number(degrees) || 0);
    entry.rot = angle;
    const group = mapShips.find(ship => ship.dataset.ship === id);
    const use = group?.querySelector("use");
    if (use) use.setAttribute("transform", `rotate(${angle})`);
    const wake = group?.querySelector(".ship-wake");
    if (wake) wake.setAttribute("transform", `rotate(${angle})`);
    if (id === selectedShip) {
      syncHeadingUI(angle);
      updateHeadingHandle();
    }
    if (sandboxApi && sandboxApi.setShipRotation) sandboxApi.setShipRotation(id, angle);
    if (commit) {
      saveLayouts();
      updateLayoutState();
    }
  }

  let headingDrag = null;

  function moveHeadingDrag(event) {
    if (!headingDrag || event.pointerId !== headingDrag.pointerId) return;
    const point = clientToMap(event);
    if (!point) return;
    const entry = selectedEntry();
    if (!entry) return;
    const angle = Math.atan2(point.y - entry.y, point.x - entry.x) * 180 / Math.PI;
    setShipRotation(selectedShip, angle, false);
    event.preventDefault();
  }

  function endHeadingDrag(event) {
    if (!headingDrag) return;
    if (event.pointerId !== undefined && event.pointerId !== headingDrag.pointerId) return;
    window.removeEventListener("pointermove", moveHeadingDrag);
    window.removeEventListener("pointerup", endHeadingDrag);
    window.removeEventListener("pointercancel", endHeadingDrag);
    headingDrag = null;
    mapHeading?.classList.remove("is-rotating");
    saveLayouts();
    updateLayoutState();
  }

  function startHeadingDrag(event) {
    if (!selectedEntry()) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    headingDrag = { pointerId: event.pointerId };
    mapHeading?.classList.add("is-rotating");
    window.addEventListener("pointermove", moveHeadingDrag, { passive: false });
    window.addEventListener("pointerup", endHeadingDrag);
    window.addEventListener("pointercancel", endHeadingDrag);
    try { mapHeading?.setPointerCapture?.(event.pointerId); } catch { /* ignore */ }
  }

  function renderPanel(id) {
    const ship = SHIPS[id];
    if (!ship) return;
    selectedShip = id;

    panelCode.textContent = ship.code;
    panelRole.textContent = ship.roleShort;
    panelArt.innerHTML = `<svg viewBox="${ship.viewBox}" aria-hidden="true"><use href="#${ship.art}"></use></svg>`;
    panelName.textContent = ship.name;
    panelEn.textContent = `${ship.en} · ${ship.typeEn}`;
    panelDesc.textContent = ship.desc;
    panelSpecs.innerHTML = ship.specs
      .map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`)
      .join("");
    panelTags.innerHTML = `<em>${ship.art.startsWith("ship-carrier") ? "舰载机" : "编队职责"}</em>` +
      ship.airItems.slice(0, 4).map(item => `<span>${item}</span>`).join("");
    panelIndex.textContent = `${String(currentOrder.indexOf(id) + 1).padStart(2, "0")} / ${String(currentOrder.length).padStart(2, "0")}`;
    panelOpen.dataset.ship = id;

    mapShips.forEach(group => {
      group.classList.toggle("is-active", group.dataset.ship === id);
    });

    const headingEntry = selectedEntry();
    syncHeadingUI(headingEntry?.rot || 0);
    updateHeadingHandle();
    window.requestAnimationFrame(() => ensureShipVisible(id));

    if (!reducedMotion && panel) {
      panel.animate(
        [
          { opacity: 0.55, transform: "translateY(5px)" },
          { opacity: 1, transform: "translateY(0)" }
        ],
        { duration: 360, easing: "cubic-bezier(.22,.75,.2,1)" }
      );
    }
  }

  function selectShip(id) {
    if (!SHIPS[id] || !currentOrder.includes(id)) return;
    renderPanel(id);
    updateSandboxSelection(id);
  }

  formationPresets.forEach(button => {
    button.addEventListener("click", () => applyFormation(button.dataset.formation));
  });

  if (resetFormation) {
    resetFormation.addEventListener("click", resetCurrentLayout);
  }

  if (mapHeadingHit) {
    mapHeadingHit.addEventListener("pointerdown", startHeadingDrag);
  }
  if (headingRange) {
    headingRange.addEventListener("input", () => {
      setShipRotation(selectedShip, Number(headingRange.value), false);
    });
    headingRange.addEventListener("change", () => {
      saveLayouts();
      updateLayoutState();
    });
  }
  if (headingMinus) {
    headingMinus.addEventListener("click", () => {
      const entry = selectedEntry();
      if (!entry) return;
      setShipRotation(selectedShip, (entry.rot || 0) - 5, true);
    });
  }
  if (headingPlus) {
    headingPlus.addEventListener("click", () => {
      const entry = selectedEntry();
      if (!entry) return;
      setShipRotation(selectedShip, (entry.rot || 0) + 5, true);
    });
  }

  document.addEventListener("keydown", event => {
    if (event.target instanceof Element && event.target.closest("input, textarea, select")) return;
    const key = event.key.toLowerCase();
    if (key !== "q" && key !== "e") return;
    const entry = selectedEntry();
    if (!entry) return;
    setShipRotation(selectedShip, (entry.rot || 0) + (key === "q" ? -5 : 5), true);
    event.preventDefault();
  });

  const prevShip = $("#prevShip");
  const nextShip = $("#nextShip");
  if (prevShip) {
    prevShip.addEventListener("click", () => {
      const index = currentOrder.indexOf(selectedShip);
      selectShip(currentOrder[(index - 1 + currentOrder.length) % currentOrder.length]);
    });
  }
  if (nextShip) {
    nextShip.addEventListener("click", () => {
      const index = currentOrder.indexOf(selectedShip);
      selectShip(currentOrder[(index + 1) % currentOrder.length]);
    });
  }

  applyFormation("liaoning", true);
  if (panel) panel.querySelector(".panel-open")?.setAttribute("aria-label", "打开完整档案");
  window.addEventListener("load", centerMap);
  window.requestAnimationFrame(() => window.requestAnimationFrame(centerMap));

  /* ── scan toggle ──────────────────────────────────────── */
  const scanToggle = $("#scanToggle");
  const scanLabel = $("#scanLabel");
  let scanning = true;

  if (scanToggle && formationMap) {
    scanToggle.addEventListener("click", () => {
      scanning = !scanning;
      scanToggle.dataset.scanning = String(scanning);
      scanToggle.setAttribute("aria-label", scanning ? "暂停雷达扫描" : "继续雷达扫描");
      if (scanLabel) scanLabel.textContent = scanning ? "暂停扫描" : "继续扫描";
      formationMap.classList.toggle("is-paused", !scanning);
    });
  }

  /* ── dossier dialog ───────────────────────────────────── */
  const dialog = $("#dossier");
  const dossierClose = $("#dossierClose");
  const dossierReturn = $("#dossierReturn");
  const dossierTitle = $("#dossierTitle");
  const dossierEn = $("#dossierEn");
  const dossierRole = $("#dossierRole");
  const dossierDesc = $("#dossierDesc");
  const dossierClass = $("#dossierClass");
  const dossierCode = $("#dossierCode");
  const dossierArt = $("#dossierArt");
  const dossierUse = $("#dossierUse");
  const dossierSpecs = $("#dossierSpecs");
  const dossierAirwing = $("#dossierAirwing");
  let lastFocused = null;

  function fillDossier(id) {
    const ship = SHIPS[id];
    if (!ship) return;
    dossierTitle.textContent = ship.name;
    dossierEn.textContent = `${ship.en} · ${ship.typeEn}`;
    dossierRole.textContent = ship.role;
    dossierDesc.textContent = ship.desc;
    dossierClass.textContent = ship.classLabel;
    dossierCode.textContent = ship.code;
    dossierArt.setAttribute("viewBox", ship.viewBox);
    dossierUse.setAttribute("href", `#${ship.art}`);
    dossierSpecs.innerHTML = ship.specs
      .map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`)
      .join("");
    dossierAirwing.innerHTML = `
      <span>${ship.airLabel}</span>
      <ul>${ship.airItems.map(item => `<li>${item}</li>`).join("")}</ul>
    `;
  }

  function openDossier(id) {
    if (!dialog || !SHIPS[id]) return;
    fillDossier(id);
    lastFocused = document.activeElement;
    dialog.showModal();
    document.body.classList.add("modal-open");
    window.setTimeout(() => dossierClose?.focus(), 30);
  }

  function closeDossier() {
    if (!dialog?.open) return;
    document.body.classList.remove("modal-open");
    dialog.close();
  }

  $$("[data-open-ship]").forEach(element => {
    element.addEventListener("click", () => openDossier(element.dataset.openShip));
    element.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openDossier(element.dataset.openShip);
      }
    });
  });

  if (panelOpen) {
    panelOpen.addEventListener("click", () => openDossier(panelOpen.dataset.ship || selectedShip));
  }
  if (dossierClose) dossierClose.addEventListener("click", closeDossier);
  if (dossierReturn) dossierReturn.addEventListener("click", closeDossier);

  if (dialog) {
    dialog.addEventListener("click", event => {
      if (event.target === dialog) {
        const rect = dialog.getBoundingClientRect();
        const inside =
          event.clientX >= rect.left && event.clientX <= rect.right &&
          event.clientY >= rect.top && event.clientY <= rect.bottom;
        if (!inside) closeDossier();
      }
    });
    dialog.addEventListener("close", () => {
      document.body.classList.remove("modal-open");
      if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
    });
  }

  /* ── smooth internal navigation with menu close ───────── */
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener("click", () => {
      if (document.body.classList.contains("menu-open")) setMenu(false);
    });
  });
})();
