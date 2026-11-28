import type {ChineseQuestion, EnglishQuestion, MathQuestion, ScienceQuestion, SemesterId} from '../../types/game';

type EarlyGrade = 1 | 2;
const semesterAt = (i:number):SemesterId => i%2===0?'upper':'lower';
function choicesFor(answer:string, alternatives:string[], index:number) {
  const options=[answer,...alternatives.filter(x=>x!==answer)].slice(0,4);
  const shift=index%options.length;
  return {options:[...options.slice(shift),...options.slice(0,shift)],correctIndex:(options.length-shift)%options.length};
}

// Original short prompts: no copied textbook passages and no upper-grade fallback.
const WORDS:Record<EarlyGrade,[string,string][]>={
  1:[['山','ㄕㄢ'],['水','ㄕㄨㄟˇ'],['日','ㄖˋ'],['月','ㄩㄝˋ'],['人','ㄖㄣˊ'],['口','ㄎㄡˇ'],['手','ㄕㄡˇ'],['足','ㄗㄨˊ'],['木','ㄇㄨˋ'],['火','ㄏㄨㄛˇ'],['田','ㄊㄧㄢˊ'],['土','ㄊㄨˇ'],['大','ㄉㄚˋ'],['小','ㄒㄧㄠˇ'],['上','ㄕㄤˋ'],['下','ㄒㄧㄚˋ'],['左','ㄗㄨㄛˇ'],['右','ㄧㄡˋ'],['天','ㄊㄧㄢ'],['雨','ㄩˇ']],
  2:[['春','ㄔㄨㄣ'],['夏','ㄒㄧㄚˋ'],['秋','ㄑㄧㄡ'],['冬','ㄉㄨㄥ'],['風','ㄈㄥ'],['雲','ㄩㄣˊ'],['花','ㄏㄨㄚ'],['草','ㄘㄠˇ'],['鳥','ㄋㄧㄠˇ'],['魚','ㄩˊ'],['走','ㄗㄡˇ'],['跑','ㄆㄠˇ'],['笑','ㄒㄧㄠˋ'],['哭','ㄎㄨ'],['早','ㄗㄠˇ'],['晚','ㄨㄢˇ'],['友','ㄧㄡˇ'],['家','ㄐㄧㄚ'],['校','ㄒㄧㄠˋ'],['書','ㄕㄨ']],
};
const READINGS:Record<EarlyGrade,[string,string,string[]][]>={
  1:[['小美帶著雨傘出門。她帶了什麼？','雨傘',['書包','水壺','帽子']],['小狗在門口睡覺。誰在睡覺？','小狗',['小貓','小鳥','小魚']],['哥哥先洗手，再吃飯。先做什麼？','洗手',['吃飯','睡覺','畫畫']],['小安把紅球給妹妹。球是什麼顏色？','紅色',['藍色','黃色','白色']]],
  2:[['小文怕花兒缺水，每天澆一點水。小文為什麼澆水？','怕花兒缺水',['想把花洗乾淨','想讓泥土飛起來','因為不喜歡花']],['雨停了，小明收起雨傘。收傘前發生什麼事？','雨停了',['開始下雨','太陽下山','風變大了']],['媽媽說：「熱湯先放涼。」應該怎麼做？','等湯涼一點再喝',['立刻大口喝','把手伸進湯裡','邊跑邊喝']],['小青借書後準時歸還。哪個詞形容她？','守信用',['沒禮貌','愛說謊','不負責']]],
};
export const EARLY_CHINESE:ChineseQuestion[]=([1,2] as const).flatMap(grade=>{
  const result:ChineseQuestion[]=WORDS[grade].map(([word,sound],i)=>{
    const pack=choicesFor(sound,WORDS[grade].filter(x=>x[1]!==sound).map(x=>x[1]),i);
    return {id:`early-zh-${grade}-sound-${i}`,grade,semester:semesterAt(i),subject:'chinese',type:'slash',prompt:`「${word}」怎麼讀？`,answer:sound,explanation:`「${word}」讀作 ${sound}。請跟著念一次。`,hint:'先看聲母，再看韻母與聲調。',knowledgeTag:'注音與識字',difficulty:1,payload:{mode:'slash',...pack}};
  });
  READINGS[grade].forEach(([prompt,answer,others],i)=>result.push({id:`early-zh-${grade}-read-${i}`,grade,semester:semesterAt(i),subject:'chinese',type:'slash',prompt,answer,explanation:`讀一遍句子，就能找到「${answer}」。`,hint:'答案就在短文裡，慢慢讀。',knowledgeTag:'短句閱讀',difficulty:1,payload:{mode:'slash',...choicesFor(answer,others,i)}}));
  ([['日','月','明'],['人','木','休'],['女','子','好'],['田','力','男']] as const).forEach(([a,b,target],i)=>result.push({id:`early-zh-${grade}-parts-${i}`,grade,semester:semesterAt(i),subject:'chinese',type:'radical',prompt:`選出組成「${target}」的兩個部件。`,answer:`${a}＋${b}＝${target}`,explanation:`${a}和${b}可以組成「${target}」。`,hint:`先找「${a}」。`,knowledgeTag:'基本字形',difficulty:1,payload:{mode:'radical',partA:a,partB:b,targetChar:target,meaning:target,pool:[...new Set([a,b,'口','土','火','水'])]}}));
  ([['我用首拿杯子。','首','手'],['天上有太楊。','楊','陽'],['我喜歡看輸。','輸','書'],['小鳥在飛，魚在水中由。','由','游']] as const).forEach(([sentence,wrongChar,correctChar],i)=>result.push({id:`early-zh-${grade}-typo-${i}`,grade,semester:semesterAt(i),subject:'chinese',type:'typo',prompt:'找出句子裡用錯的字。',answer:`「${wrongChar}」應改為「${correctChar}」`,explanation:`這裡應該寫「${correctChar}」。`,hint:'讀讀句子的意思。',knowledgeTag:'形近字辨識',difficulty:1,payload:{mode:'typo',sentence,typoIndex:sentence.indexOf(wrongChar),wrongChar,correctChar}}));
  return result;
});

const ENGLISH_WORDS:Record<EarlyGrade,[string,string][]>={
  1:[['cat','貓'],['dog','狗'],['sun','太陽'],['red','紅色'],['blue','藍色'],['one','一'],['two','二'],['egg','蛋'],['bus','公車'],['pen','筆'],['cup','杯子'],['hat','帽子'],['bag','袋子'],['ant','螞蟻'],['pig','豬'],['ten','十']],
  2:[['bird','鳥'],['fish','魚'],['book','書'],['tree','樹'],['milk','牛奶'],['hand','手'],['foot','腳'],['apple','蘋果'],['happy','快樂的'],['green','綠色'],['three','三'],['four','四'],['five','五'],['hello','你好'],['thank','感謝'],['water','水']],
};
export const EARLY_ENGLISH:EnglishQuestion[]=([1,2] as const).flatMap(grade=>ENGLISH_WORDS[grade].flatMap(([word,zh],i):EnglishQuestion[]=>[
  {id:`early-en-${grade}-listen-${i}`,grade,semester:semesterAt(i),subject:'english',type:'listen',prompt:`英語啟蒙：聽聽「${zh}」的英文。`,answer:word,explanation:`${word} 是「${zh}」。`,hint:'可以再按喇叭聽一次。',knowledgeTag:'英語啟蒙・生活單字',difficulty:1,payload:{mode:'listen',speakText:word,zhMeaning:zh,choices:choicesFor(word,ENGLISH_WORDS[grade].map(x=>x[0]),i).options,correctIndex:choicesFor(word,ENGLISH_WORDS[grade].map(x=>x[0]),i).correctIndex}},
  {id:`early-en-${grade}-spell-${i}`,grade,semester:semesterAt(i),subject:'english',type:'spell',prompt:`英語啟蒙：排出「${zh}」的字母。`,answer:word,explanation:`${word.split('').join(' → ')} 組成 ${word}。`,hint:`第一個字母是 ${word[0]}。`,knowledgeTag:'英語啟蒙・字母排序',difficulty:1,payload:{mode:'spell',speakText:word,zhMeaning:zh,word,distractorLetters:['x','z']}},
]));

export function generateEarlyMath(grade:EarlyGrade,semester:SemesterId,stageNumber=1,count=18):MathQuestion[]{
  const result:MathQuestion[]=[];
  for(let i=0;i<count;i++){
    const max=grade===1?(semester==='upper'?10:20):100;
    const a=grade===1?1+(i*3+stageNumber)%Math.floor(max/2):10+(i*7+stageNumber)%40;
    const b=grade===1?1+(i+stageNumber)%Math.floor(max/2):1+(i*3+stageNumber)%40;
    const subtraction=i%3===1;
    const left=subtraction?Math.max(a,b):a;
    const right=subtraction?Math.min(a,b):b;
    const answer=String(subtraction?left-right:left+right);
    const formula=`${left} ${subtraction?'−':'＋'} ${right} = ?`;
    const tag=grade===1?`${max}以內加減`:'100以內加減';
    const pack=choicesFor(answer,[String(Number(answer)+1),String(Math.max(0,Number(answer)-1)),String(Number(answer)+2),String(Number(answer)+3)],i);
    result.push({id:`early-ma-${grade}-${semester}-${stageNumber}-${i}`,grade,semester,subject:'math',type:'calc',prompt:i%3===2?`有 ${left} 顆糖，再拿 ${right} 顆，共有幾顆？`:formula,answer,explanation:`${formula.replace('?',answer)}。${subtraction?'從較大的數往回數。':'從第一個數接著往上數。'}`,hint:subtraction?'拿走一些，數量會減少。':'合在一起，數量會增加。',knowledgeTag:tag,difficulty:1,payload:{formulaShield:formula,...pack}});
  }
  return result;
}
export const EARLY_MATH=([1,2] as const).flatMap(g=>(['upper','lower'] as const).flatMap(s=>generateEarlyMath(g,s,1,20)));

// Life observation tasks. Cooking's temperature/pH mini-games are skipped for grades 1–2.
type Observation=[string,string,string,string,string];
const OBSERVATIONS:Record<EarlyGrade,Observation[]>={
  1:[
    ['下雨出門帶什麼？','雨傘','沙灘球','枕頭','雨傘可以擋雨。'],['吃飯前先做什麼？','洗手','玩泥巴','睡覺','用肥皂把手洗乾淨。'],['看書時需要什麼？','足夠的光線','完全黑暗','閉上眼睛','光線足夠才容易看清楚。'],['小鳥身上有什麼？','羽毛','魚鱗','樹皮','鳥的身體有羽毛。'],['魚住在哪裡？','水中','火裡','書包裡','魚在水中生活。'],['植物長大需要什麼？','水','塑膠袋','糖果','植物需要適量的水。'],['用哪裡聽聲音？','耳朵','膝蓋','頭髮','耳朵可以聽聲音。'],['用哪裡看顏色？','眼睛','腳趾','手肘','眼睛可以看見顏色。'],['用哪裡聞花香？','鼻子','手指','牙齒','鼻子可以聞氣味。'],['用哪裡嚐味道？','舌頭','耳朵','頭髮','舌頭可以嚐味道。'],['天黑後常見什麼？','月亮','彩虹每天出現','太陽一直在頭頂','夜裡有時可以看見月亮。'],['太陽通常從哪邊升起？','東邊','西邊','地底','太陽通常從東邊升起。'],['落葉該放在哪裡？','落葉堆肥區','水溝堵住','別人口袋','落葉可以收集做堆肥。'],['哪個是活的？','小貓','石頭','桌子','小貓會長大，也需要食物。'],['冰摸起來如何？','冰冷','燙熱','像火一樣熱','冰的溫度很低。'],['風吹時什麼會動？','樹葉','黏在地上的石板','牆上的磚塊','風會吹動樹葉。'],['垃圾應該放哪裡？','合適的垃圾桶','地上','河裡','垃圾不亂丟，環境才乾淨。'],['口渴適合喝什麼？','乾淨的飲用水','油漆','洗碗水','乾淨的飲用水可以補充水分。'],['看到熱鍋應該怎樣？','請大人幫忙','伸手摸','把臉貼上去','熱鍋會燙傷，請大人協助。'],['紅燈時怎麼過馬路？','停下等待','立刻跑過去','閉眼走過去','行人紅燈時停下等待。'],['哪個適合擦汗？','乾淨毛巾','砂紙','泥土','用乾淨毛巾擦汗。'],['哪個會發光？','亮著的手電筒','關著的紙盒','石頭','開啟的手電筒會發光。'],['雨後地上可能有什麼？','水窪','火山熔岩','冰箱','雨水會在低處形成水窪。'],['哪個是葉子的常見顏色？','綠色','透明','銀色','許多植物的葉子是綠色。'],['哪個適合種子發芽？','濕潤的棉花','燃燒的炭火','密封乾燥鐵罐','種子發芽需要適量水分和空氣。'],['觀察小蟲應該怎樣？','輕輕看，不傷害','用腳踩','放進嘴裡','觀察時尊重生命。'],
  ],
  2:[
    ['哪個可以回收？','乾淨的寶特瓶','用過的衛生紙','剩菜','寶特瓶清空後可以分類回收。'],['影子出現需要什麼？','光和擋光的物體','只有聲音','只有氣味','物體擋住光會形成影子。'],['哪個會浮在水面？','空的密封塑膠瓶','實心鐵釘','小石頭','空的密封塑膠瓶通常會浮起來。'],['哪個會沉入水底？','實心鐵釘','乒乓球','乾燥軟木塞','實心鐵釘在水中會下沉。'],['冰放在溫暖處會怎樣？','融化成水','變成石頭','長出葉子','冰受熱會融化成水。'],['曬衣服通常需要什麼？','陽光和通風','密封濕袋','一直泡水','通風和陽光幫助衣服變乾。'],['哪個可以節省水？','刷牙時關水龍頭','一直開水','把水倒掉玩','不用水時關閉水龍頭。'],['哪個可以節省電？','離開房間關燈','白天開所有燈','冰箱門一直開','不需要照明時關燈。'],['哪個動物有六隻腳？','螞蟻','小狗','小鳥','螞蟻有六隻腳。'],['哪個動物有八隻腳？','蜘蛛','蝴蝶','青蛙','蜘蛛有八隻腳。'],['蝌蚪長大會變成什麼？','青蛙','麻雀','金魚','蝌蚪是青蛙的幼體。'],['毛毛蟲可能長大成什麼？','蝴蝶','小狗','小魚','蝴蝶的幼蟲是毛毛蟲。'],['植物哪個部位常在土裡？','根','花瓣','果實','根常在土裡吸收水分。'],['植物哪個部位常有種子？','果實','石頭','花盆','許多植物的種子在果實裡。'],['哪個季節通常比較冷？','冬天','夏天','一年四季都一樣熱','臺灣冬天通常比夏天冷。'],['哪個季節通常比較熱？','夏天','冬天','一年四季都下雪','臺灣夏天通常比較熱。'],['聽到雷聲時適合去哪裡？','安全的室內','大樹下','空曠水池','雷雨時進入安全室內。'],['觀察天氣可以用什麼？','天氣紀錄表','只有猜測','只看室內牆壁','記錄晴雨和冷熱能比較天氣。'],['哪個是透明物品？','乾淨玻璃','厚木板','磚塊','光可以穿過乾淨玻璃。'],['哪個比較會吸水？','棉布','塑膠片','鐵湯匙','棉布容易吸收水。'],['哪個可以被磁鐵吸住？','鐵製迴紋針','木筷','橡皮擦','鐵製迴紋針可以被磁鐵吸引。'],['推球時球可能怎樣？','向前滾動','變成植物','完全消失','推力可以讓球移動。'],['想比較植物長高多少，用什麼？','尺','耳機','碗','用尺測量並記錄高度。'],['摸陌生植物前應該怎樣？','先詢問大人','隨意採摘入口','用力拉扯','有些植物會刺激皮膚，先詢問大人。'],['哪個有利校園小動物？','保持棲地乾淨','亂噴藥','丟塑膠袋','保持環境乾淨能保護小動物。'],['水灑到地板時怎麼做？','告訴大人並擦乾','在上面奔跑','假裝沒看見','擦乾積水可以避免滑倒。'],
  ],
};
export const EARLY_SCIENCE:ScienceQuestion[]=([1,2] as const).flatMap(grade=>OBSERVATIONS[grade].map(([prompt,answer,b,c,explanation],i)=>{
  const pack=choicesFor(answer,[b,c],i);
  return {id:`early-life-${grade}-${i}`,grade,semester:semesterAt(i),subject:'science',type:'dish',prompt,answer,explanation,hint:'想一想生活中看過的事情；不確定時可以再讀一次。',knowledgeTag:'生活觀察',difficulty:1,payload:{dishName:`生活觀察 ${i+1}`,orderRequirement:prompt,neededCount:1,ingredients:pack.options.map((name,j)=>({id:`life-${j}`,name,categoryTag:'生活觀察',color:['#38bdf8','#a78bfa','#fbbf24'][j],accent:'#ffffff',isCorrect:j===pack.correctIndex,wrongReason:explanation})),targetTempZone:'simmer',targetTempLabel:'低年級免操作',targetPh:'neutral',targetPhLabel:'低年級免操作',effectStyle:'nature'}};
}));
