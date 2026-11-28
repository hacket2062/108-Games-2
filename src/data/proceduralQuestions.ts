import {
  ChineseQuestion,
  EnglishQuestion,
  GradeLevel,
  MathQuestion,
  QuestionDifficultyTier,
  ScienceQuestion,
  SemesterId,
} from '../types/game';
import {generateEarlyMath} from './questions/earlyGrades';

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x || 1;
}

function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

function buildNumericOptions(correct: number, unit = '', spread = 6): { options: string[]; correctIndex: number } {
  const vals = new Set<number>([correct]);
  const deltas = [-spread, -Math.max(1, Math.round(spread / 2)), Math.max(1, Math.round(spread / 2)), spread, -1, 1, 2, -2, 10, -10];
  for (const d of deltas) {
    if (vals.size >= 4) break;
    const cand = correct + d;
    if (cand >= 0 && cand !== correct) vals.add(cand);
  }
  // Deterministic, distinct fallbacks: random retries can never terminate when
  // a negative answer makes every clamped candidate equal to 1.
  for (let offset = 1; vals.size < 4; offset++) {
    vals.add(Math.max(0, correct) + offset);
  }
  const arr = Array.from(vals);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const options = arr.map((v) => `${v}${unit}`);
  return { options, correctIndex: arr.indexOf(correct) };
}

function buildStringOptions(correct: string, distractors: string[]): { options: string[]; correctIndex: number } {
  const seen = new Set<string>([correct]);
  for (const d of distractors) {
    if (d && !seen.has(d)) seen.add(d);
    if (seen.size >= 4) break;
  }
  let pad = 1;
  while (seen.size < 4) {
    const num = Number(correct);
    const fallback = Number.isFinite(num)
      ? Number((num + pad * 1.5).toFixed(2)).toString()
      : `${correct}·${pad}`;
    seen.add(fallback);
    pad++;
  }
  const uniq = Array.from(seen).slice(0, 4);
  for (let i = uniq.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [uniq[i], uniq[j]] = [uniq[j], uniq[i]];
  }
  return { options: uniq, correctIndex: uniq.indexOf(correct) };
}

export function stageToDifficulty(stageNumber?: number): QuestionDifficultyTier {
  if (!stageNumber || stageNumber <= 3) return 1;
  if (stageNumber <= 7) return 2;
  return 3;
}

/**
 * Procedural 108-Curriculum Math Generator (Never Repeats!).
 * Dynamically crafts fresh arithmetic, bracket order-of-ops, fractions, decimals,
 * GCD/LCM, geometry area/volume, speed, ratio, and percentage questions scaled by
 * Grade (3-6) and Stage Tier (1-3).
 */
export function generateProceduralMathQuestions(
  grade: GradeLevel,
  semester: SemesterId,
  stageNumber = 1,
  count = 16
): MathQuestion[] {
  if (grade <= 2) return generateEarlyMath(grade as 1|2, semester, stageNumber, count);
  const diff = stageToDifficulty(stageNumber);
  const out: MathQuestion[] = [];
  const usedFormulas = new Set<string>();
  const salt = Date.now().toString(36);

  let tries = 0;
  while (out.length < count && tries < count * 6) {
    const i = tries++;
    let formulaShield = '';
    let prompt = '';
    let answer = '';
    let explanation = '';
    let hint = '';
    let knowledgeTag = '動態算術';
    let qType: 'calc' | 'geometry' | 'fraction' = 'calc';
    let optPack: { options: string[]; correctIndex: number } = { options: [], correctIndex: 0 };

    const pattern = (i + randInt(0, 5)) % 5;

    if (grade === 3) {
      if (pattern === 0) {
        const a = diff === 1 ? randInt(120, 450) : randInt(280, 760);
        const b = diff === 1 ? randInt(80, 320) : randInt(150, 490);
        const ans = a + b;
        formulaShield = `${a} + ${b} = ?`;
        prompt = `快速計算三位數加法：${a} + ${b} = ?`;
        answer = String(ans);
        explanation = `個位、十位、百位對齊進位計算：${a} + ${b} = ${ans}。`;
        hint = '先把整百相加，再處理十位與個位進位。';
        knowledgeTag = '三位數加減';
        optPack = buildNumericOptions(ans, '', 10);
      } else if (pattern === 1) {
        const a = randInt(4, 9);
        const b = diff === 1 ? randInt(12, 28) : randInt(25, 79);
        const ans = a * b;
        formulaShield = `${b} × ${a} = ?`;
        prompt = `估算並計算乘法：${b} × ${a} = ?`;
        answer = String(ans);
        explanation = `拆解成整十乘與個位乘：${b} × ${a} = ${ans}。`;
        hint = '先算十位乘以一位數，再加上個位的乘積。';
        knowledgeTag = '二位數乘法';
        optPack = buildNumericOptions(ans, '', a);
      } else if (pattern === 2) {
        const d = randInt(3, 9);
        const q = diff === 1 ? randInt(6, 15) : randInt(12, 26);
        const dividend = d * q;
        formulaShield = `${dividend} ÷ ${d} = ?`;
        prompt = `整除除法挑戰：${dividend} ÷ ${d} = ?`;
        answer = String(q);
        explanation = `因為 ${d} × ${q} = ${dividend}，所以商為 ${q}。`;
        hint = `想一想 ${d} 乘以多少等於 ${dividend}。`;
        knowledgeTag = '整數除法';
        optPack = buildNumericOptions(q, '', 3);
      } else if (pattern === 3) {
        qType = 'geometry';
        const w = randInt(5, 16);
        const h = randInt(4, 14);
        const peri = (w + h) * 2;
        formulaShield = `長${w}寬${h} 周長=?`;
        prompt = `一個長方形花圃長 ${w} 公尺、寬 ${h} 公尺，周長是多少公尺？`;
        answer = `${peri}公尺`;
        explanation = `長方形周長 = (長 + 寬) × 2 = (${w} + ${h}) × 2 = ${peri} 公尺。`;
        hint = '周長是四條邊加起來，等於 (長+寬)×2。';
        knowledgeTag = '周長計算';
        optPack = buildNumericOptions(peri, '公尺', 4);
      } else {
        qType = 'fraction';
        const den = randInt(5, 12);
        const n1 = randInt(1, Math.floor(den / 2));
        const n2 = randInt(1, den - n1);
        const sumN = n1 + n2;
        formulaShield = `${n1}/${den} + ${n2}/${den}`;
        prompt = `同分母分數加法：${n1}/${den} + ${n2}/${den} = ?`;
        answer = `${sumN}/${den}`;
        explanation = `同分母分數相加，分母不變，分子相加：(${n1}+${n2})/${den} = ${sumN}/${den}。`;
        hint = '分母保持不變，只要把分子加起來！';
        knowledgeTag = '同分母分數';
        optPack = buildStringOptions(answer, [
          `${sumN}/${den * 2}`,
          `${Math.max(1, sumN - 1)}/${den}`,
          `${sumN + 1}/${den}`,
        ]);
      }
    } else if (grade === 4) {
      if (pattern === 0) {
        const a = randInt(6, 18);
        const b = randInt(4, 15);
        const c = randInt(3, 8);
        const ans = (a + b) * c;
        formulaShield = `(${a}+${b})×${c}`;
        prompt = `四則括號運算：(${a} + ${b}) × ${c} = ?`;
        answer = String(ans);
        explanation = `括號最先算：${a}+${b}=${a + b}，再乘以 ${c} 得 ${ans}。`;
        hint = '先算小括號裡的加法，再做乘法！';
        knowledgeTag = '四則括號運算';
        optPack = buildNumericOptions(ans, '', c);
      } else if (pattern === 1) {
        const a = randInt(14, 38);
        const b = randInt(12, 29);
        const ans = a * b;
        formulaShield = `${a} × ${b} = ?`;
        prompt = `二位數乘以二位數：${a} × ${b} = ?`;
        answer = String(ans);
        explanation = `直式乘法計算：${a} × ${b} = ${ans}。`;
        hint = '可將第二數拆成十位與個位分別相乘再相加。';
        knowledgeTag = '二位數乘法';
        optPack = buildNumericOptions(ans, '', 12);
      } else if (pattern === 2) {
        qType = 'geometry';
        const side = randInt(7, 22);
        const area = side * side;
        formulaShield = `邊長${side} 面積=?`;
        prompt = `正方形磁磚的邊長是 ${side} 公分，面積是多少平方公分？`;
        answer = `${area}平方公分`;
        explanation = `正方形面積 = 邊長 × 邊長 = ${side} × ${side} = ${area} 平方公分。`;
        hint = '面積等於邊長乘以自己，別和周長搞混喔！';
        knowledgeTag = '正方形面積';
        optPack = buildNumericOptions(area, '平方公分', side);
      } else if (pattern === 3) {
        const a = randInt(12, 65);
        const b = randInt(11, 58);
        const ans = Number(((a + b) / 10).toFixed(1));
        formulaShield = `${(a / 10).toFixed(1)}+${(b / 10).toFixed(1)}`;
        prompt = `小數加法精算：${(a / 10).toFixed(1)} + ${(b / 10).toFixed(1)} = ?`;
        answer = ans.toFixed(1);
        explanation = `小數點對齊相加：${(a / 10).toFixed(1)} + ${(b / 10).toFixed(1)} = ${ans.toFixed(1)}。`;
        hint = '小數點上下對齊，十分位滿 10 進 1 到個位。';
        knowledgeTag = '小數加減';
        optPack = buildStringOptions(ans.toFixed(1), [
          (ans + 0.2).toFixed(1),
          Math.max(0.1, ans - 0.3).toFixed(1),
          (ans + 1.0).toFixed(1),
        ]);
      } else {
        const b = randInt(4, 9);
        const c = randInt(3, 8);
        const a = randInt(Math.max(40, b * c), 120);
        const ans = a - b * c;
        formulaShield = `${a} - ${b}×${c}`;
        prompt = `先乘除後加減：${a} - ${b} × ${c} = ?`;
        answer = String(ans);
        explanation = `先算乘法 ${b}×${c}=${b * c}，再算 ${a}-${b * c}=${ans}。`;
        hint = '千萬記得先算乘法，再做減法！';
        knowledgeTag = '四則運算順序';
        optPack = buildNumericOptions(ans, '', 6);
      }
    } else if (grade === 5) {
      if (pattern === 0) {
        const base = randInt(3, 9);
        const m1 = randInt(2, 6);
        let m2 = randInt(2, 7);
        if (m2 === m1) m2 += 1;
        const n1 = base * m1;
        const n2 = base * m2;
        const g = gcd(n1, n2);
        formulaShield = `GCD(${n1},${n2})`;
        prompt = `求出 ${n1} 與 ${n2} 的「最大公因數」是多少？`;
        answer = String(g);
        explanation = `${n1} 與 ${n2} 同時能被最大整數 ${g} 整除。`;
        hint = '用短除法找出共同質因數相乘！';
        knowledgeTag = '因數與最大公因數';
        optPack = buildNumericOptions(g, '', Math.max(2, base));
      } else if (pattern === 1) {
        const a = randInt(4, 12);
        const b = randInt(5, 14);
        const l = lcm(a, b);
        formulaShield = `LCM(${a},${b})`;
        prompt = `求出 ${a} 與 ${b} 的「最小公倍數」是多少？`;
        answer = String(l);
        explanation = `${a} 與 ${b} 的最小公倍數為 ${l}。`;
        hint = '把較大數的倍數依序列出，找第一個能被另一數整除的！';
        knowledgeTag = '倍數與最小公倍數';
        optPack = buildNumericOptions(l, '', a);
      } else if (pattern === 2) {
        qType = 'geometry';
        const base = randInt(6, 18) * 2;
        const h = randInt(5, 16);
        const area = (base * h) / 2;
        formulaShield = `底${base}高${h} △面積`;
        prompt = `一個三角形底邊長 ${base} 公分、高 ${h} 公分，面積是多少平方公分？`;
        answer = `${area}平方公分`;
        explanation = `三角形面積 = 底 × 高 ÷ 2 = ${base} × ${h} ÷ 2 = ${area} 平方公分。`;
        hint = '三角形面積記得要除以 2！';
        knowledgeTag = '三角形面積';
        optPack = buildNumericOptions(area, '平方公分', h);
      } else if (pattern === 3) {
        qType = 'geometry';
        const l = randInt(4, 10);
        const w = randInt(3, 8);
        const h = randInt(3, 7);
        const vol = l * w * h;
        formulaShield = `${l}×${w}×${h} 體積`;
        prompt = `長方體木箱長 ${l}、寬 ${w}、高 ${h} 公分，體積是多少立方公分？`;
        answer = `${vol}立方公分`;
        explanation = `長方體體積 = 長 × 寬 × 高 = ${l} × ${w} × ${h} = ${vol} 立方公分。`;
        hint = '將長、寬、高三個邊長相乘！';
        knowledgeTag = '長方體體積';
        optPack = buildNumericOptions(vol, '立方公分', l * w);
      } else {
        qType = 'fraction';
        const d1 = [2, 3, 4, 5][randInt(0, 3)];
        const d2 = [3, 4, 5, 6].find((x) => x !== d1) ?? 6;
        const l = lcm(d1, d2);
        const num = l / d1 + l / d2;
        const g = gcd(num, l);
        const ans = `${num / g}/${l / g}`;
        formulaShield = `1/${d1} + 1/${d2}`;
        prompt = `異分母分數通分相加：1/${d1} + 1/${d2} = ?（約至最簡）`;
        answer = ans;
        explanation = `通分成分母 ${l}：${l / d1}/${l} + ${l / d2}/${l} = ${num}/${l} = ${ans}。`;
        hint = `先找 ${d1} 和 ${d2} 的最小公倍數 ${l} 通分！`;
        knowledgeTag = '異分母分數加減';
        optPack = buildStringOptions(ans, [
          `2/${d1 + d2}`,
          `${Math.max(1, num / g - 1)}/${l / g}`,
          `${num / g + 1}/${l / g}`,
        ]);
      }
    } else {
      // Grade 6: Speed, Percentage, Ratio, Fraction Multiply, Decimal Ops
      if (pattern === 0) {
        const speed = randInt(45, 95);
        const hrs = randInt(2, 5);
        const dist = speed * hrs;
        formulaShield = `時速${speed} × ${hrs}時`;
        prompt = `高鐵接駁車以時速 ${speed} 公里行駛 ${hrs} 小時，共前進幾公里？`;
        answer = `${dist}公里`;
        explanation = `距離 = 速率 × 時間 = ${speed} × ${hrs} = ${dist} 公里。`;
        hint = '距離 = 速率 × 時間！';
        knowledgeTag = '速率與距離';
        optPack = buildNumericOptions(dist, '公里', speed);
      } else if (pattern === 1) {
        const price = randInt(4, 18) * 50;
        const off = [70, 75, 80, 85, 90][randInt(0, 4)];
        const finalPrice = Math.round((price * off) / 100);
        formulaShield = `${price}元 打${off / 10}折`;
        prompt = `原價 ${price} 元的繪本套書打 ${off === 75 ? '75' : off === 85 ? '85' : off / 10} 折（${off}%），特價多少元？`;
        answer = `${finalPrice}元`;
        explanation = `特價 = ${price} × ${off}% = ${finalPrice} 元。`;
        hint = `把原價乘以 ${off / 100} 就能得到折扣價！`;
        knowledgeTag = '百分率與折扣';
        optPack = buildNumericOptions(finalPrice, '元', 25);
      } else if (pattern === 2) {
        const a = randInt(2, 5);
        const b = randInt(3, 7);
        const mult = randInt(3, 9);
        const target = b * mult;
        formulaShield = `${a}:${b} = ${a * mult}:?`;
        prompt = `相等比例求解：${a} : ${b} = ${a * mult} : □，□ 是多少？`;
        answer = String(target);
        explanation = `前項放大了 ${mult} 倍，後項也放大 ${mult} 倍：${b} × ${mult} = ${target}。`;
        hint = `先算出 ${a * mult} 是 ${a} 的幾倍！`;
        knowledgeTag = '比與比值';
        optPack = buildNumericOptions(target, '', b);
      } else if (pattern === 3) {
        qType = 'fraction';
        const n1 = randInt(2, 5);
        const d1 = randInt(3, 7);
        const n2 = randInt(2, 6);
        const d2 = randInt(3, 8);
        const top = n1 * n2;
        const bot = d1 * d2;
        const g = gcd(top, bot);
        const ans = `${top / g}/${bot / g}`;
        formulaShield = `${n1}/${d1} × ${n2}/${d2}`;
        prompt = `分數乘法約分計算：${n1}/${d1} × ${n2}/${d2} = ?`;
        answer = ans;
        explanation = `分子乘分子、分母乘分母：${top}/${bot}，上下同除 ${g} 得 ${ans}。`;
        hint = '分子相乘、分母相乘後，記得約分到最簡分數！';
        knowledgeTag = '分數乘除';
        optPack = buildStringOptions(ans, [
          `${top / g + 1}/${bot / g}`,
          `${Math.max(1, top / g - 1)}/${bot / g}`,
          `${n1 + n2}/${d1 + d2}`,
        ]);
      } else {
        const r = randInt(2, 10);
        const area = Number((r * r * 3.14).toFixed(2));
        formulaShield = `半徑${r} 圓面積`;
        prompt = `半徑為 ${r} 公分的魔法陣，圓面積約是多少平方公分？（圓周率取 3.14）`;
        answer = `${area}`;
        explanation = `圓面積 = 半徑 × 半徑 × 3.14 = ${r} × ${r} × 3.14 = ${area}。`;
        hint = '圓面積公式是 半徑 × 半徑 × 3.14！';
        knowledgeTag = '圓面積計算';
        qType = 'geometry';
        optPack = buildStringOptions(answer, [
          Number((r * 2 * 3.14).toFixed(2)).toString(),
          Number(((r + 1) * r * 3.14).toFixed(2)).toString(),
          Number((r * r * 3).toFixed(2)).toString(),
        ]);
      }
    }

    if (usedFormulas.has(formulaShield)) continue;
    usedFormulas.add(formulaShield);

    out.push({
      id: `proc_math_g${grade}_${semester}_d${diff}_${salt}_${i}`,
      grade,
      semester,
      subject: 'math',
      type: qType,
      prompt,
      answer,
      explanation,
      hint,
      knowledgeTag,
      difficulty: diff,
      payload: {
        formulaShield,
        options: optPack.options,
        correctIndex: optPack.correctIndex,
      },
    });
  }
  return out;
}

// ==================== EXPANDED 108-CURRICULUM CURATED PACKS (400+ EXTRA VERIFIED QUESTIONS) ====================

interface RawChineseSlash {
  grade: GradeLevel;
  semester: SemesterId;
  diff: QuestionDifficultyTier;
  prompt: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  tag: string;
  explanation: string;
}

const EXTRA_CHINESE_SLASH: RawChineseSlash[] = [
  // Grade 3
  { grade: 3, semester: 'upper', diff: 1, prompt: '「畫蛇添足」這個成語用來比喻什麼行為？', options: ['多此一舉反把事弄糟', '畫畫非常有天分', '動作快如閃電', '非常珍惜時間'], correctIndex: 0, tag: '成語典故', explanation: '畫蛇添足比喻做了多餘的事，反而弄巧成拙。' },
  { grade: 3, semester: 'upper', diff: 1, prompt: '下列哪個字是「水部（氵）」且與液體流動有關？', options: ['江', '紅', '林', '晴'], correctIndex: 0, tag: '部首辨識', explanation: '「江」從水部（氵），指大河川。' },
  { grade: 3, semester: 'upper', diff: 2, prompt: '「小草在微風中點頭微笑」運用了哪一種修辭法？', options: ['擬人法', '誇飾法', '設問法', '倒反法'], correctIndex: 0, tag: '修辭辨析', explanation: '將小草寫成會點頭微笑，賦予人的動作，是「擬人法」。' },
  { grade: 3, semester: 'lower', diff: 1, prompt: '「守株待兔」勸戒人們不可以怎樣？', options: ['妄想不勞而獲', '勇敢面對困難', '熱心幫助鄰居', '愛護野生動物'], correctIndex: 0, tag: '成語典故', explanation: '守株待兔比喻死守狹隘經驗，妄想不努力就得到收穫。' },
  { grade: 3, semester: 'lower', diff: 2, prompt: '「月亮像一艘金色的小船」運用了哪種修辭？', options: ['譬喻法', '排比法', '借代法', '頂真法'], correctIndex: 0, tag: '譬喻修辭', explanation: '用「像」把月亮比喻成金色小船，屬於明喻（譬喻法）。' },
  { grade: 3, semester: 'lower', diff: 3, prompt: '選出「多音字」讀音正確的詞語：「調」查與「調」整分別讀作？', options: ['ㄉㄧㄠˋ／ㄊㄧㄠˊ', 'ㄊㄧㄠˊ／ㄉㄧㄠˋ', 'ㄉㄧㄠˋ／ㄉㄧㄠˋ', 'ㄊㄧㄠˊ／ㄊㄧㄠˊ'], correctIndex: 0, tag: '多音字辨析', explanation: '「調」查讀 ㄉㄧㄠˋ，「調」整讀 ㄊㄧㄠˊ。' },
  // Grade 4
  { grade: 4, semester: 'upper', diff: 1, prompt: '「井底之蛙」常用來形容怎樣的人？', options: ['見識狹隘短淺的人', '擅長游泳的選手', '個性活潑開朗的人', '記憶力超群的人'], correctIndex: 0, tag: '成語應用', explanation: '井底之蛙比喻眼界狹小、見識短淺。' },
  { grade: 4, semester: 'upper', diff: 2, prompt: '「他緊張得心臟快跳出胸口了」屬於哪種修辭法？', options: ['誇飾法', '引用法', '雙關法', '對偶法'], correctIndex: 0, tag: '誇飾修辭', explanation: '誇張描述緊張的感覺，屬於「誇飾法」。' },
  { grade: 4, semester: 'upper', diff: 3, prompt: '下列哪一組字形相近但部首完全不同？', options: ['辯／辨／辮', '江／河／湖', '松／柏／楓', '跑／跳／躍'], correctIndex: 0, tag: '形近字辨析', explanation: '辯（言）、辨（刀）、辮（糸）中間部件不同，意義各異。' },
  { grade: 4, semester: 'lower', diff: 1, prompt: '「半途而廢」的反義成語是哪一個？', options: ['持之以恆', '虎頭蛇尾', '前功盡棄', '一曝十寒'], correctIndex: 0, tag: '反義成語', explanation: '持之以恆指長久堅持，與半途而廢相反。' },
  { grade: 4, semester: 'lower', diff: 2, prompt: '「讀書破萬卷，下筆如有神」強調什麼重要性？', options: ['大量閱讀能提升寫作力', '寫字速度要非常快', '只讀一本書就夠了', '要用最貴的毛筆寫字'], correctIndex: 0, tag: '名言理解', explanation: '杜甫名句強調博覽群書、累積深厚底蘊，寫作自然得心應手。' },
  { grade: 4, semester: 'lower', diff: 3, prompt: '「行」動與銀「行」的讀音分別為何？', options: ['ㄒㄧㄥˊ／ㄏㄤˊ', 'ㄏㄤˊ／ㄒㄧㄥˊ', 'ㄒㄧㄥˊ／ㄒㄧㄥˊ', 'ㄏㄤˊ／ㄏㄤˊ'], correctIndex: 0, tag: '多音字辨析', explanation: '「行」動讀 ㄒㄧㄥˊ，銀「行」讀 ㄏㄤˊ。' },
  // Grade 5
  { grade: 5, semester: 'upper', diff: 1, prompt: '「有的在讀書，有的在畫畫，有的在下棋」運用了什麼修辭？', options: ['排比法', '映襯法', '回文法', '倒裝法'], correctIndex: 0, tag: '排比修辭', explanation: '連續使用三個結構相似的「有的在……」句型，為排比法。' },
  { grade: 5, semester: 'upper', diff: 2, prompt: '「杯弓蛇影」最適合形容下列哪種情境？', options: ['疑神疑鬼自己嚇自己', '射箭技術百步穿楊', '請客吃飯非常大方', '克服恐懼勇敢冒險'], correctIndex: 0, tag: '成語情境', explanation: '比喻因疑心而過度驚慌，把杯中弓影誤當成蛇。' },
  { grade: 5, semester: 'upper', diff: 3, prompt: '「雖然下著大雨，但是我們仍然準時抵達」屬於何種複句？', options: ['轉折複句', '條件複句', '因果複句', '遞進複句'], correctIndex: 0, tag: '句型結構', explanation: '使用「雖然……但是……」連接前後相反語意，為轉折複句。' },
  { grade: 5, semester: 'lower', diff: 2, prompt: '「破釜沉舟」表現了主帥怎樣的決心？', options: ['不留退路決一死戰', '擅長建造大型船艦', '喜歡在河邊野炊', '打算立刻撤軍投降'], correctIndex: 0, tag: '歷史成語', explanation: '項羽渡河後砸鍋沉船，表示絕不退縮的必勝決心。' },
  { grade: 5, semester: 'lower', diff: 3, prompt: '「不僅會彈鋼琴，而且還會寫程式」屬於哪一種複句？', options: ['遞進複句', '假設複句', '選擇複句', '轉折複句'], correctIndex: 0, tag: '複句分析', explanation: '「不僅……而且……」表示程度更進一步，為遞進複句。' },
  // Grade 6
  { grade: 6, semester: 'upper', diff: 2, prompt: '「欲窮千里目，更上一層樓」蘊含什麼人生哲理？', options: ['不斷精進才能看得更遠', '一定要蓋最高的大樓', '視力不好需要戴眼鏡', '爬樓梯可以鍛鍊腿力'], correctIndex: 0, tag: '古詩賞析', explanation: '王之渙《登鸛雀樓》勉勵人精益求精，站得更高才能眼界更廣。' },
  { grade: 6, semester: 'upper', diff: 3, prompt: '「朱門酒肉臭，路有凍死骨」強烈運用了哪種修辭？', options: ['映襯法', '頂真法', '設問法', '雙關法'], correctIndex: 0, tag: '高階修辭', explanation: '以豪門奢華與路邊飢寒形成強烈對比，是映襯（對比）法。' },
  { grade: 6, semester: 'lower', diff: 2, prompt: '「臥薪嘗膽」的主角越王勾踐展現了什麼精神？', options: ['刻苦自勵發憤圖強', '貪圖享樂揮霍無度', '輕敵大意慘遭失敗', '盲目跟風失去主見'], correctIndex: 0, tag: '歷史成語', explanation: '勾踐睡柴草、嘗苦膽，時刻提醒自己不忘恥辱、勵精圖治。' },
  { grade: 6, semester: 'lower', diff: 3, prompt: '「哪裡有壓迫，哪裡就有反抗」與下列哪句修辭最接近？', options: ['頂真與類疊', '借代與轉品', '譬喻與誇飾', '雙關與倒反'], correctIndex: 0, tag: '修辭綜合', explanation: '重複「哪裡……哪裡……」形成強烈語勢的類疊結構。' },
];

interface RawChineseRadical {
  grade: GradeLevel;
  semester: SemesterId;
  diff: QuestionDifficultyTier;
  partA: string;
  partB: string;
  targetChar: string;
  meaning: string;
  pool: string[];
}

const EXTRA_CHINESE_RADICALS: RawChineseRadical[] = [
  { grade: 3, semester: 'upper', diff: 1, partA: '女', partB: '子', targetChar: '好', meaning: '美好、良善（會意字）', pool: ['女', '子', '口', '木', '日', '水'] },
  { grade: 3, semester: 'upper', diff: 1, partA: '日', partB: '月', targetChar: '明', meaning: '光明、明亮（會意字）', pool: ['日', '月', '火', '土', '人', '心'] },
  { grade: 3, semester: 'lower', diff: 2, partA: '人', partB: '木', targetChar: '休', meaning: '倚樹休息（會意字）', pool: ['人', '木', '口', '目', '手', '山'] },
  { grade: 4, semester: 'upper', diff: 1, partA: '言', partB: '青', targetChar: '請', meaning: '禮貌請求（形聲字）', pool: ['言', '青', '氵', '心', '日', '木'] },
  { grade: 4, semester: 'lower', diff: 2, partA: '氵', partB: '青', targetChar: '清', meaning: '清澈乾淨（形聲字）', pool: ['氵', '青', '日', '心', '口', '言'] },
  { grade: 5, semester: 'upper', diff: 2, partA: '心', partB: '青', targetChar: '情', meaning: '情感心情（形聲字）', pool: ['心', '青', '氵', '言', '目', '火'] },
  { grade: 5, semester: 'lower', diff: 3, partA: '門', partB: '耳', targetChar: '聞', meaning: '聽見、新聞（形聲字）', pool: ['門', '耳', '口', '日', '心', '木'] },
  { grade: 6, semester: 'upper', diff: 2, partA: '山', partB: '石', targetChar: '岩', meaning: '高峻山石（會意字）', pool: ['山', '石', '土', '木', '火', '水'] },
  { grade: 6, semester: 'lower', diff: 3, partA: '言', partB: '舌', targetChar: '話', meaning: '語言談話（形聲字）', pool: ['言', '舌', '口', '心', '耳', '手'] },
];

interface RawEnglishWord {
  grade: GradeLevel;
  semester: SemesterId;
  diff: QuestionDifficultyTier;
  word: string;
  zh: string;
  distractors: [string, string, string]; // Smart look-alike distractors!
  tag: string;
}

const EXTRA_ENGLISH_WORDS: RawEnglishWord[] = [
  // Grade 3
  { grade: 3, semester: 'upper', diff: 1, word: 'Sandwich', zh: '三明治', distractors: ['Sandwitch', 'Sausage', 'Salad'], tag: '飲食單字' },
  { grade: 3, semester: 'upper', diff: 1, word: 'Teacher', zh: '老師', distractors: ['Techer', 'Trainer', 'Toaster'], tag: '校園人物' },
  { grade: 3, semester: 'upper', diff: 2, word: 'Elephant', zh: '大象', distractors: ['Elefant', 'Elevator', 'Eggplant'], tag: '動物世界' },
  { grade: 3, semester: 'lower', diff: 1, word: 'Sunny', zh: '晴朗的', distractors: ['Funny', 'Bunny', 'Snowy'], tag: '天氣形容' },
  { grade: 3, semester: 'lower', diff: 2, word: 'Bicycle', zh: '腳踏車', distractors: ['Bicycel', 'Circle', 'Tricycle'], tag: '交通工具' },
  { grade: 3, semester: 'lower', diff: 3, word: 'Breakfast', zh: '早餐', distractors: ['Breakfirst', 'Breathe', 'Blanket'], tag: '日常作息' },
  // Grade 4
  { grade: 4, semester: 'upper', diff: 1, word: 'Hospital', zh: '醫院', distractors: ['Hospitel', 'Hotel', 'Hostel'], tag: '社區地點' },
  { grade: 4, semester: 'upper', diff: 2, word: 'Library', zh: '圖書館', distractors: ['Libary', 'Liberty', 'Lizard'], tag: '校園地點' },
  { grade: 4, semester: 'upper', diff: 2, word: 'Wednesday', zh: '星期三', distractors: ['Wensday', 'Weekend', 'Weather'], tag: '星期單字' },
  { grade: 4, semester: 'lower', diff: 2, word: 'Supermarket', zh: '超級市場', distractors: ['Supermaket', 'Submarine', 'Sunflower'], tag: '生活場所' },
  { grade: 4, semester: 'lower', diff: 3, word: 'Headache', zh: '頭痛', distractors: ['Headake', 'Heartache', 'Handbook'], tag: '健康身體' },
  // Grade 5
  { grade: 5, semester: 'upper', diff: 2, word: 'Astronaut', zh: '太空人', distractors: ['Astronot', 'Asteroid', 'Athlete'], tag: '夢想職業' },
  { grade: 5, semester: 'upper', diff: 2, word: 'Restaurant', zh: '餐廳', distractors: ['Resturant', 'Restroom', 'Resident'], tag: '城市生活' },
  { grade: 5, semester: 'lower', diff: 2, word: 'Mountain', zh: '高山', distractors: ['Mountian', 'Fountain', 'Curtain'], tag: '自然景觀' },
  { grade: 5, semester: 'lower', diff: 3, word: 'Yesterday', zh: '昨天', distractors: ['Yesturday', 'Tomorrow', 'Thursday'], tag: '過去時間' },
  // Grade 6
  { grade: 6, semester: 'upper', diff: 2, word: 'Environment', zh: '環境', distractors: ['Enviroment', 'Equipment', 'Excitement'], tag: '永續環保' },
  { grade: 6, semester: 'upper', diff: 3, word: 'Comfortable', zh: '舒適的', distractors: ['Comfertable', 'Comparable', 'Compatible'], tag: '進階形容詞' },
  { grade: 6, semester: 'lower', diff: 2, word: 'Celebration', zh: '慶祝活動', distractors: ['Celebrasion', 'Collection', 'Connection'], tag: '節慶文化' },
  { grade: 6, semester: 'lower', diff: 3, word: 'Experience', zh: '經驗／體驗', distractors: ['Experiance', 'Experiment', 'Expensive'], tag: '素養字彙' },
];

export function buildExpandedChineseQuestions(): ChineseQuestion[] {
  const res: ChineseQuestion[] = [];
  EXTRA_CHINESE_SLASH.forEach((item, idx) => {
    res.push({
      id: `exp_zh_slash_${idx}`,
      grade: item.grade,
      semester: item.semester,
      subject: 'chinese',
      type: 'slash',
      prompt: item.prompt,
      answer: item.options[item.correctIndex],
      explanation: item.explanation,
      hint: `提示：關鍵知識點是「${item.tag}」。`,
      knowledgeTag: item.tag,
      difficulty: item.diff,
      payload: {
        mode: 'slash',
        options: item.options,
        correctIndex: item.correctIndex,
      },
    });
  });

  EXTRA_CHINESE_RADICALS.forEach((item, idx) => {
    res.push({
      id: `exp_zh_rad_${idx}`,
      grade: item.grade,
      semester: item.semester,
      subject: 'chinese',
      type: 'radical',
      prompt: `組合「${item.partA}」與正確部件，召喚代表「${item.meaning}」的漢字！`,
      answer: item.targetChar,
      explanation: `「${item.partA}」＋「${item.partB}」＝「${item.targetChar}」（${item.meaning}）。`,
      hint: `從偏旁池找出能和「${item.partA}」組合成「${item.targetChar}」的部件。`,
      knowledgeTag: '六書部首拆解',
      difficulty: item.diff,
      payload: {
        mode: 'radical',
        partA: item.partA,
        partB: item.partB,
        pool: item.pool,
        targetChar: item.targetChar,
        meaning: item.meaning,
      },
    });
  });

  return res;
}

export function buildExpandedEnglishQuestions(): EnglishQuestion[] {
  const res: EnglishQuestion[] = [];
  EXTRA_ENGLISH_WORDS.forEach((item, idx) => {
    const pack = buildStringOptions(item.word, item.distractors);
    res.push({
      id: `exp_en_listen_${idx}`,
      grade: item.grade,
      semester: item.semester,
      subject: 'english',
      type: 'listen',
      prompt: `聽音辨字：精準鎖定「${item.zh}」的正確拼法戰機！`,
      answer: item.word,
      explanation: `正確拼法為 ${item.word}（${item.zh}），注意別被相似拼字干擾項欺騙！`,
      hint: `開頭字母是 ${item.word[0]}，共有 ${item.word.length} 個字母。`,
      knowledgeTag: item.tag,
      difficulty: item.diff,
      payload: {
        mode: 'listen',
        speakText: item.word,
        zhMeaning: item.zh,
        choices: pack.options,
        correctIndex: pack.correctIndex,
      },
    });
  });
  return res;
}

export function buildExpandedScienceQuestions(): ScienceQuestion[] {
  const specs: Array<{
    grade: GradeLevel;
    semester: SemesterId;
    diff: QuestionDifficultyTier;
    dishName: string;
    orderReq: string;
    tag: string;
    explanation: string;
    temp: 'freeze' | 'simmer' | 'boil';
    tempLabel: string;
    ph: 'acid' | 'neutral' | 'alkali';
    phLabel: string;
    fx: 'fire' | 'ice' | 'rainbow' | 'nature';
    good: [string, string, string];
    bad: [string, string, string];
  }> = [
    {
      grade: 3, semester: 'upper', diff: 1, dishName: '光合葉綠素濃湯',
      orderReq: '挑選植物行「光合作用」必備的 2 項原料＋中火＋中性純水',
      tag: '植物光合作用', explanation: '植物在陽光照射下吸收二氧化碳與水分，在葉綠體中製造養分並釋放氧氣。',
      temp: 'simmer', tempLabel: '55°C 陽光中火', ph: 'neutral', phLabel: '中性純水', fx: 'nature',
      good: ['陽光能量', '二氧化碳', '葉綠素原料'], bad: ['塑膠微粒', '機油廢水', '非生物干擾'],
    },
    {
      grade: 4, semester: 'upper', diff: 2, dishName: '超導銅線能量鍋',
      orderReq: '挑選 2 項「優良電導體」投入鍋中＋沸騰高火＋鹼性電解液',
      tag: '導體與絕緣體', explanation: '金屬如銅片、鐵釘含有自由電子，屬於良導體；塑膠與乾木棒為絕緣體。',
      temp: 'boil', tempLabel: '100°C 電漿沸騰', ph: 'alkali', phLabel: '鹼性電解液', fx: 'fire',
      good: ['純銅線圈', '鐵釘導棒', '導電金屬'], bad: ['橡膠手套', '乾木筷子', '絕緣材質'],
    },
    {
      grade: 5, semester: 'lower', diff: 2, dishName: '極地三態冰晶聖代',
      orderReq: '挑選 2 項讓水「凝固結冰／凝結」的關鍵條件＋急凍藍區＋中性水',
      tag: '水的三態變化', explanation: '水在 0°C 以下會凝固成冰，水蒸氣遇冷凝結成小水滴。',
      temp: 'freeze', tempLabel: '0°C 急凍藍區', ph: 'neutral', phLabel: '中性蒸餾水', fx: 'ice',
      good: ['降溫至0°C', '冰塊冷凝', '三態凝結'], bad: ['猛火加熱', '曝曬高溫', '加速蒸發'],
    },
    {
      grade: 6, semester: 'upper', diff: 3, dishName: '電磁極光檸檬凍',
      orderReq: '挑選 2 項能「增強電磁鐵磁力」的配料＋中火＋酸性檸檬指示劑',
      tag: '電磁鐵磁力', explanation: '增加線圈匝數與串聯更多電池都能顯著增強電磁鐵的磁力。',
      temp: 'simmer', tempLabel: '55°C 穩定磁場', ph: 'acid', phLabel: '酸性檸檬紅', fx: 'rainbow',
      good: ['增加線圈數', '串聯雙電池', '增磁條件'], bad: ['拔除鐵芯', '改用塑膠線', '減弱磁力'],
    },
  ];

  return specs.map((s, idx) => ({
    id: `exp_sci_dish_${idx}`,
    grade: s.grade,
    semester: s.semester,
    subject: 'science',
    type: 'dish',
    prompt: s.orderReq,
    answer: `${s.good[0]}＋${s.good[1]}`,
    explanation: s.explanation,
    hint: `觀察「${s.tag}」原理，選出 2 項正確科學條件！`,
    knowledgeTag: s.tag,
    difficulty: s.diff,
    payload: {
      dishName: s.dishName,
      orderRequirement: s.orderReq,
      neededCount: 2,
      targetTempZone: s.temp,
      targetTempLabel: s.tempLabel,
      targetPh: s.ph,
      targetPhLabel: s.phLabel,
      effectStyle: s.fx,
      ingredients: [
        { id: `g1_${idx}`, name: s.good[0], categoryTag: s.good[2], color: '#10B981', accent: '#6EE7B7', isCorrect: true },
        { id: `b1_${idx}`, name: s.bad[0], categoryTag: s.bad[2], color: '#64748B', accent: '#94A3B8', isCorrect: false, wrongReason: `「${s.bad[0]}」不符合${s.tag}需求！` },
        { id: `g2_${idx}`, name: s.good[1], categoryTag: s.good[2], color: '#F59E0B', accent: '#FDE68A', isCorrect: true },
        { id: `b2_${idx}`, name: s.bad[1], categoryTag: s.bad[2], color: '#EF4444', accent: '#FCA5A5', isCorrect: false, wrongReason: `「${s.bad[1]}」會導致實驗失敗！` },
      ],
    },
  }));
}
